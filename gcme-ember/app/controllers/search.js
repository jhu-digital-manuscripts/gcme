import Controller from '@ember/controller';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import ResultLocationCell from '../components/result-location-cell';
import ResultTextLineCell from '../components/result-text-line-cell';
import ResultLemmaLineCell from '../components/result-lemma-line-cell';

const DEFAULT_PAGE_SIZE = 25;
const MIN_PAGE_SIZE = 1;
const MAX_PAGE_SIZE = 100;

export default class SearchController extends Controller {
  @service opensearch;
  @service('emt-themes/ember-bootstrap-v5') themeInstance;

  // Selected power-select options (PowerSelectOption[] | null).
  @tracked words = null;
  @tracked lemmas = null;
  @tracked tagged_lemmas = null;

  // Restrict-to-location selection (RestrictOption[] | null).
  @tracked restrict = null;

  // User-toggleable query options.
  @tracked requireAllWords = false;
  @tracked sortLogical = false;

  // Pagination state.
  @tracked _pageSize = DEFAULT_PAGE_SIZE;
  @tracked pageNumber = 1;
  @tracked pageCount = 0;

  // Latest result payload from OpenSearch (or null when never fetched
  // or after clear).
  @tracked result = null;

  // User-readable error string surfaced in the template; null when there
  // is no current error.
  @tracked searchError = null;

  // Page size with clamp + fallback. Values outside [1, 100] are clamped
  // to the nearest endpoint; null, undefined, and NaN reset to the
  // default of 25 (Req 7.6).
  get pageSize() {
    return this._pageSize;
  }

  set pageSize(value) {
    if (value === null || value === undefined) {
      this._pageSize = DEFAULT_PAGE_SIZE;
      return;
    }
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      this._pageSize = DEFAULT_PAGE_SIZE;
      return;
    }
    this._pageSize = Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, numeric));
  }

  // Native getters replace classic computed properties (Req 6.7).
  get hasResults() {
    return (this.result?.hits?.total ?? 0) > 0;
  }

  get hasNoMatches() {
    return this.result != null && (this.result.hits?.total ?? 0) === 0;
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
    const total = this.result?.hits?.total ?? 0;
    return Math.min(lastInPage, total);
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

  // True iff at least one word, lemma, or tagged lemma is selected.
  hasAnyTerms() {
    const total =
      (this.words?.length ?? 0) +
      (this.lemmas?.length ?? 0) +
      (this.tagged_lemmas?.length ?? 0);
    return total > 0;
  }

  // Pure query builder. Mirrors the OpenSearch query shape documented
  // in design.md (Data Models / OpenSearch query shape).
  buildQuery() {
    const clauses = [];

    for (const o of this.words ?? []) {
      clauses.push({ term: { text: o._match } });
    }
    for (const o of this.lemmas ?? []) {
      clauses.push({ term: { lemma_text: o._match } });
    }
    for (const o of this.tagged_lemmas ?? []) {
      clauses.push({ term: { lemma_tag_text: o._match } });
    }

    const inner = this.requireAllWords
      ? { must: clauses }
      : { should: clauses };

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

    if (this.restrict?.length) {
      query.query.bool.filter = {
        terms: { group: this.restrict.map((o) => o.id) },
      };
    }

    if (this.sortLogical) {
      query.sort = [
        { id: 'asc' },
        { number: 'asc' },
        { raw_number: 'asc' },
      ];
    }

    return query;
  }

  // Issue the current query against OpenSearch and update result
  // state. On rejection, set `searchError` and intentionally preserve
  // `result`, `pageNumber`, and the selection state (Req 7.18).
  async runQuery() {
    if (!this.hasAnyTerms()) {
      // Req 7.17: no fetch, leave previous result and selections intact.
      this.searchError =
        'Enter at least one word, headword, or tagged headword.';
      return;
    }

    this.searchError = null;
    const query = this.buildQuery();

    try {
      const result = await this.opensearch.executeQuery(query);
      this.result = result;
      const total = result?.hits?.total ?? 0;
      this.pageCount = Math.max(1, Math.ceil(total / this.pageSize));
    } catch (err) {
      // Req 7.18: surface the error and preserve prior state.
      this.searchError = `Search service unavailable: ${err.message}`;
    }
  }

  @action
  async submitSearch() {
    this.pageNumber = 1;
    await this.runQuery();
  }

  @action
  async nextPage() {
    // Req 7.11: boundary no-op; do not call the service.
    if (this.isLastPage) {
      return;
    }
    this.pageNumber += 1;
    await this.runQuery();
  }

  @action
  async prevPage() {
    // Req 7.12: boundary no-op; do not call the service.
    if (this.isFirstPage) {
      return;
    }
    this.pageNumber -= 1;
    await this.runQuery();
  }

  @action
  clearQuery() {
    // Req 7.13: reset selection, result, and page; preserve user
    // preferences (pageSize, requireAllWords, sortLogical).
    this.words = null;
    this.lemmas = null;
    this.tagged_lemmas = null;
    this.restrict = null;
    this.result = null;
    this.pageNumber = 1;
    this.searchError = null;
  }

  @action
  completeWord(prefix) {
    return this.opensearch.complete('word', prefix);
  }

  @action
  completeLemma(prefix) {
    return this.opensearch.complete('lemma', prefix);
  }

  @action
  completeTaggedLemma(prefix) {
    return this.opensearch.complete('lemma_tag', prefix);
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
