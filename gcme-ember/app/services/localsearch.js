import Service from '@ember/service';
import DataLoader from '../utils/localsearch/data-loader';
import { buildLineIndexes, buildCompletionIndexes } from '../utils/localsearch/index-assembler';
import { execute } from '../utils/localsearch/query-engine';
import { complete } from '../utils/localsearch/completion-engine';

/**
 * Localsearch service — a browser-side, drop-in replacement for the
 * opensearch service. Executes all queries against in-memory inverted
 * indexes built from static JSON data files.
 *
 * Public API mirrors OpensearchService:
 *   - executeQuery(query) → Promise<SearchResult>
 *   - complete(term, prefix) → Promise<CompletionResult[]>
 */
export default class LocalsearchService extends Service {
  /** @type {DataLoader} */
  _dataLoader = new DataLoader();

  /** @type {{ textIndex: Map, lemmaTextIndex: Map, lemmaTagTextIndex: Map } | null} */
  _lineIndexes = null;

  /** @type {{ wordSuggest: Array, lemmaSuggest: Array, lemmaTagSuggest: Array } | null} */
  _completionIndexes = null;

  /** @type {Array | null} */
  _lines = null;

  /** @type {{ wordDict: Array, lemmaDict: Array, lemmaTagDict: Array } | null} */
  _dicts = null;

  /**
   * Execute a query against the in-memory inverted indexes.
   *
   * On first call, triggers data loading and index construction. Subsequent
   * calls reuse cached indexes.
   *
   * @param {Object} query OpenSearch query DSL subset.
   * @returns {Promise<{ hits: { total: { value: number, relation: string }, hits: Array } }>}
   */
  async executeQuery(query) {
    await this._ensureReady();
    return execute(query, this._lineIndexes, this._lines);
  }

  /**
   * Perform prefix-based completion against sorted completion indexes.
   *
   * @param {string} term The field name: "word", "lemma", or "lemma_tag".
   * @param {string} prefix The user-typed prefix to match against.
   * @returns {Promise<Array<Object>>} Array of up to 10 matching results.
   */
  async complete(term, prefix) {
    await this._ensureReady();
    return complete(term, prefix, this._completionIndexes, this._dicts);
  }

  /**
   * Ensure data is loaded and indexes are built. If indexes are already
   * cached, resolves immediately. Otherwise loads data via DataLoader
   * and constructs indexes on first successful load.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _ensureReady() {
    if (this._lineIndexes) {
      return;
    }

    const data = await this._dataLoader.ensureLoaded();

    // Build indexes only once — guard against concurrent calls that both
    // awaited ensureLoaded() resolving at the same time.
    if (this._lineIndexes) {
      return;
    }

    this._lines = data.lines;
    this._dicts = {
      wordDict: data.wordDict,
      lemmaDict: data.lemmaDict,
      lemmaTagDict: data.lemmaTagDict,
    };

    this._lineIndexes = buildLineIndexes(data.lines);
    this._completionIndexes = buildCompletionIndexes(
      data.wordDict,
      data.lemmaDict,
      data.lemmaTagDict,
    );
  }
}
