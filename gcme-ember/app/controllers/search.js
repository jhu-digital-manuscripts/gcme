import Controller from '@ember/controller';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import ENV from 'gcme-ember/config/environment';
import ResultLocationCell from '../components/result-location-cell';
import ResultTextLineCell from '../components/result-text-line-cell';
import ResultLemmaLineCell from '../components/result-lemma-line-cell';
import { encodeList, decodeList, decodeInteger } from '../utils/query-params';
import { flattenOptions } from '../utils/powersel';

const DEFAULT_PAGE_SIZE = 25;
const MIN_PAGE_SIZE = 1;
const MAX_PAGE_SIZE = 100;

export default class SearchController extends Controller {
  @service opensearch;
  @service localsearch;
  @service router;
  @service('gcme-table-theme') themeInstance;

  // The committed search lives in the URL, so a search can be bookmarked and
  // the browser's history walks through searches. Editing the form only
  // changes the draft state below; pressing Search transitions to a new URL.
  queryParams = [
    'words',
    'lemmas',
    'tags',
    'restrict',
    'all',
    'sort',
    'page',
    'size',
  ];

  // Committed search state, mirrored in the URL. The list parameters hold
  // comma-separated values (see utils/query-params).
  @tracked words = '';
  @tracked lemmas = '';
  @tracked tags = '';
  @tracked restrict = '';
  @tracked all = false;
  @tracked sort = false;
  @tracked page = 1;
  @tracked size = DEFAULT_PAGE_SIZE;

  // Draft state: what the form shows. Power-select options, not plain strings.
  @tracked draftWords = null;
  @tracked draftLemmas = null;
  @tracked draftTaggedLemmas = null;
  @tracked draftRestrict = null;
  @tracked draftAll = false;
  @tracked draftSort = false;

  // Latest result payload from the search service (or null when never fetched
  // or after clear).
  @tracked result = null;

  // User-readable error string surfaced in the template; null when there
  // is no current error.
  @tracked searchError = null;

  get searchService() {
    const backend = ENV.gcme.searchBackend || 'localsearch';
    if (backend !== 'opensearch' && backend !== 'localsearch') {
      throw new Error(`Invalid search backend: '${backend}'. Must be 'opensearch' or 'localsearch'.`);
    }
    return this[backend];
  }

  // Committed selections as plain strings.
  get wordList() {
    return decodeList(this.words);
  }

  get lemmaList() {
    return decodeList(this.lemmas);
  }

  get taggedLemmaList() {
    return decodeList(this.tags);
  }

  get restrictList() {
    return decodeList(this.restrict);
  }

  // Page number with fallback; values below 1 reset to the first page.
  get pageNumber() {
    return decodeInteger(this.page, 1);
  }

  // Page size with clamp + fallback. Values outside [1, 100] are clamped
  // to the nearest endpoint; null, undefined, and NaN reset to the
  // default of 25
  get pageSize() {
    const numeric = Number(this.size);
    if (this.size === null || this.size === undefined || Number.isNaN(numeric)) {
      return DEFAULT_PAGE_SIZE;
    }
    return Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, numeric));
  }

  get pageCount() {
    return Math.max(1, Math.ceil(this.totalHits / this.pageSize));
  }

  // Native getters replace classic computed properties
  get hasResults() {
    return this.totalHits > 0;
  }

  get hasNoMatches() {
    return this.result != null && this.totalHits === 0;
  }

  get isFirstPage() {
    return this.pageNumber <= 1;
  }

  get isLastPage() {
    return this.pageNumber >= this.pageCount;
  }

  // Match numbers are 1-indexed. Returns the number of the first match on
  // the current page.
  get pageFirstMatchNumber() {
    return (this.pageNumber - 1) * this.pageSize + 1;
  }

  // Returns the number of the last match on the current page, capped at
  // the total number of hits.
  get pageLastMatchNumber() {
    const lastInPage = this.pageNumber * this.pageSize;
    const total = this.totalHits;
    return Math.min(lastInPage, total);
  }

  // Normalize hits.total which may be a plain number (ES 6) or an object
  // like { value: N, relation: "eq" } (ES 7+ / OpenSearch).
  get totalHits() {
    const raw = this.result?.hits?.total;
    if (raw == null) return 0;
    if (typeof raw === 'number') return raw;
    return raw.value ?? 0;
  }

  // Column configuration for the results models-table. Reads
  // `model.groupTitleMap` so the result-location-cell can resolve group
  // ids to titles.
  get resultColumns() {
    return [
      {
        title: 'Location',
        propertyName: '_source.id',
        disableSorting: true,
        component: ResultLocationCell,
        groupTitleMap: this.model?.groupTitleMap,
      },
      {
        title: 'Line number',
        propertyName: '_source.raw_number',
        disableSorting: true,
      },
      {
        title: 'Text',
        disableSorting: true,
        component: ResultTextLineCell,
      },
      {
        title: 'Tagged text',
        disableSorting: true,
        component: ResultLemmaLineCell,
        isHidden: true,
      },
    ];
  }

  // True iff the committed search selects at least one word, lemma, or
  // tagged lemma.
  hasAnyTerms() {
    const total =
      this.wordList.length +
      this.lemmaList.length +
      this.taggedLemmaList.length;
    return total > 0;
  }

  // True iff the form has at least one word, lemma, or tagged lemma.
  hasAnyDraftTerms() {
    const total =
      (this.draftWords?.length ?? 0) +
      (this.draftLemmas?.length ?? 0) +
      (this.draftTaggedLemmas?.length ?? 0);
    return total > 0;
  }

  // Rebuild the form from the committed search. Called by the route whenever
  // the URL changes, which covers bookmarks, reloads, and history navigation.
  syncDraftsFromQueryParams() {
    this.draftWords = this.wordList.map((word) => ({ word, _match: word }));
    this.draftLemmas = this.lemmaList.map((lemma) => ({ lemma, _match: lemma }));
    this.draftTaggedLemmas = this.taggedLemmaList.map((lemma_tag) => ({
      lemma_tag,
      _match: lemma_tag,
    }));
    const byId = this.restrictOptionsById;
    this.draftRestrict = this.restrictList.map((id) =>
      this.restrictOption(id, byId),
    );
    this.draftAll = this.all;
    this.draftSort = this.sort;
  }

  // The restrict dropdown option for a group id. Falls back on a synthetic
  // option labelled from the group titles, then on the bare id.
  restrictOption(id, byId = this.restrictOptionsById) {
    return (
      byId.get(id) ?? { id, label: this.model?.groupTitleMap?.[id] ?? id }
    );
  }

  get restrictOptionsById() {
    return flattenOptions(this.model?.restrictData);
  }

  // Pure query builder. Mirrors the OpenSearch query shape documented
  // in design.md (Data Models / OpenSearch query shape).
  buildQuery() {
    const clauses = [];

    for (const word of this.wordList) {
      clauses.push({ term: { text: word } });
    }
    for (const lemma of this.lemmaList) {
      clauses.push({ term: { lemma_text: lemma } });
    }
    for (const lemmaTag of this.taggedLemmaList) {
      clauses.push({ term: { lemma_tag_text: lemmaTag } });
    }

    const inner = this.all ? { must: clauses } : { should: clauses };

    const query = {
      from: (this.pageNumber - 1) * this.pageSize,
      size: this.pageSize,
      query: {
        bool: {
          must: { bool: inner },
        },
      },
      highlight: {
        fields: {
          text: {},
          tag_lemma_text: {},
        },
      },
    };

    const restrict = this.restrictList;
    if (restrict.length) {
      query.query.bool.filter = { terms: { group: restrict } };
    }

    if (this.sort) {
      query.sort = [
        { id: 'asc' },
        { number: 'asc' },
        { raw_number: 'asc' },
      ];
    }

    return query;
  }

  // Issue the committed query against the search service and update result
  // state. On rejection, set `searchError` and intentionally preserve
  // `result` and the selection state.
  async runQuery() {
    if (!this.hasAnyTerms()) {
      // Nothing is being searched for: no fetch, no error, no stale result.
      this.result = null;
      this.searchError = null;
      return;
    }

    this.searchError = null;

    try {
      this.result = await this.searchService.executeQuery(this.buildQuery());
    } catch (err) {
      // surface the error and preserve prior state.
      this.searchError = `Search service unavailable: ${err.message}`;
    }
  }

  // The query params for a search built from the current form state.
  draftQueryParams() {
    return {
      words: encodeList((this.draftWords ?? []).map(matchValue)),
      lemmas: encodeList((this.draftLemmas ?? []).map(matchValue)),
      tags: encodeList((this.draftTaggedLemmas ?? []).map(matchValue)),
      restrict: encodeList((this.draftRestrict ?? []).map((o) => o.id)),
      all: this.draftAll,
      sort: this.draftSort,
      page: 1,
      size: this.pageSize,
    };
  }

  @action
  submitSearch() {
    if (!this.hasAnyDraftTerms()) {
      this.searchError =
        'Enter at least one word, headword, or tagged headword.';
      return;
    }
    this.searchError = null;
    this.router.transitionTo('search', {
      queryParams: this.draftQueryParams(),
    });
  }

  @action
  nextPage() {
    // boundary no-op; do not touch the URL.
    if (this.isLastPage) {
      return;
    }
    this.goToPage(this.pageNumber + 1);
  }

  @action
  prevPage() {
    // boundary no-op; do not touch the URL.
    if (this.isFirstPage) {
      return;
    }
    this.goToPage(this.pageNumber - 1);
  }

  // Paging replaces the current history entry, so Back leaves the search
  // instead of walking back through its pages.
  goToPage(page) {
    this.router.replaceWith('search', { queryParams: { page } });
  }

  @action
  clearQuery() {
    // Reset the form and the result, and drop the search from the URL. The
    // "all words" and sort preferences are kept.
    this.draftWords = null;
    this.draftLemmas = null;
    this.draftTaggedLemmas = null;
    this.draftRestrict = null;
    this.result = null;
    this.searchError = null;
    this.router.transitionTo('search', {
      queryParams: {
        words: '',
        lemmas: '',
        tags: '',
        restrict: '',
        all: this.draftAll,
        sort: this.draftSort,
        page: 1,
        size: this.pageSize,
      },
    });
  }

  @action
  completeWord(prefix) {
    return this.searchService.complete('word', prefix);
  }

  @action
  completeLemma(prefix) {
    return this.searchService.complete('lemma', prefix);
  }

  @action
  completeTaggedLemma(prefix) {
    return this.searchService.complete('lemma_tag', prefix);
  }

  // Power-select keydown handler: pressing space while the dropdown is
  // open chooses the currently highlighted option.
  @action
  selectOnSpace(select, e) {
    if (e.keyCode === 32 && select.isOpen && select.highlighted) {
      select.actions.choose(select.highlighted);
    }
  }
}

/**
 * The string a power-select option contributes to the URL and the query.
 *
 * @param {Object} option
 * @returns {string}
 */
function matchValue(option) {
  return option._match ?? option.word ?? option.lemma ?? option.lemma_tag ?? '';
}
