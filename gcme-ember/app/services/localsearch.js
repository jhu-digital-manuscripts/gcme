import Service, { service } from '@ember/service';
import { execute } from '../utils/localsearch/query-engine';
import { complete } from '../utils/localsearch/completion-engine';

/**
 * Localsearch service — a browser-side, drop-in replacement for the
 * opensearch service. Executes all queries against in-memory inverted
 * indexes built from static JSON data files.
 *
 * The data and the indexes belong to the corpus service, which the text view
 * reads as well, so they are fetched and built once per page load.
 *
 * Public API mirrors OpensearchService:
 *   - executeQuery(query) → Promise<SearchResult>
 *   - complete(term, prefix) → Promise<CompletionResult[]>
 */
export default class LocalsearchService extends Service {
  @service corpus;

  /**
   * Execute a query against the in-memory inverted indexes.
   *
   * On first call, triggers data loading and index construction. Subsequent
   * calls reuse the cached indexes.
   *
   * @param {Object} query OpenSearch query DSL subset.
   * @returns {Promise<{ hits: { total: { value: number, relation: string }, hits: Array } }>}
   */
  async executeQuery(query) {
    await this.corpus.ensureReady();
    return execute(query, this.corpus.lineIndexes, this.corpus.lines);
  }

  /**
   * Perform prefix-based completion against sorted completion indexes.
   *
   * @param {string} term The field name: "word", "lemma", or "lemma_tag".
   * @param {string} prefix The user-typed prefix to match against.
   * @returns {Promise<Array<Object>>} Array of up to 15 matching results.
   */
  async complete(term, prefix) {
    await this.corpus.ensureReady();
    return complete(
      term,
      prefix,
      this.corpus.completionIndexes,
      this.corpus.dicts,
    );
  }
}
