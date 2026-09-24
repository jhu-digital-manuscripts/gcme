import Service from '@ember/service';
import DataLoader from '../utils/localsearch/data-loader';
import {
  buildLineIndexes,
  buildCompletionIndexes,
} from '../utils/localsearch/index-assembler';
import { simpleAnalyzer } from '../utils/localsearch/analyzers';
import { buildWordInfo } from '../utils/corpus/word-info';

/**
 * How many group line lists are kept. Each entry holds one integer per line of
 * the group, so a handful of the largest groups is a few hundred kilobytes.
 */
const GROUP_CACHE_LIMIT = 4;

/**
 * Corpus service — owns the static corpus data and the indexes built from it.
 *
 * Both the localsearch backend and the text view read the corpus through this
 * service, so the data files are fetched once and the indexes are built once
 * per page load no matter which feature asks first.
 *
 * Public API:
 *   - ensureReady() → Promise<void>
 *   - lines, lineIndexes, completionIndexes, dicts
 *   - lineIndicesForGroup(groupId) → number[]
 *   - wordLineCounts(word, groupId) → { text, corpus }
 *   - wordInfo({ lineIndex, tokenIndex, groupId }) → Object|null
 */
export default class CorpusService extends Service {
  /** @type {DataLoader} */
  _dataLoader = new DataLoader();

  /** @type {Array|null} */
  _lines = null;

  /** @type {{ textIndex: Map, lemmaTextIndex: Map, lemmaTagTextIndex: Map }|null} */
  _lineIndexes = null;

  /** @type {{ wordSuggest: Array, lemmaSuggest: Array, lemmaTagSuggest: Array }|null} */
  _completionIndexes = null;

  /** @type {{ wordDict: Array, lemmaDict: Array, lemmaTagDict: Array }|null} */
  _dicts = null;

  /** @type {Map<string, Object>|null} */
  _wordDictMap = null;

  /** @type {Map<string, Object>|null} */
  _lemmaTagDictMap = null;

  /** @type {Map<string, { indices: number[], set: Set<number> }>} */
  _groupCache = new Map();

  get lines() {
    return this._lines;
  }

  get lineIndexes() {
    return this._lineIndexes;
  }

  get completionIndexes() {
    return this._completionIndexes;
  }

  get dicts() {
    return this._dicts;
  }

  get isReady() {
    return this._lineIndexes != null;
  }

  /**
   * Load the corpus data files and build the indexes. Resolves immediately
   * once that has been done; concurrent callers share one load.
   *
   * @returns {Promise<void>}
   */
  async ensureReady() {
    if (this._lineIndexes) {
      return;
    }

    const data = await this._dataLoader.ensureLoaded();

    // Guard against concurrent callers that both awaited the same load.
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

  /**
   * Replace the loaded data. Used by tests to install a small synthetic corpus
   * without going through the network.
   *
   * @param {{ lines: Array, wordDict: Array, lemmaDict: Array, lemmaTagDict: Array }} data
   */
  loadForTesting(data) {
    this._lines = data.lines ?? [];
    this._dicts = {
      wordDict: data.wordDict ?? [],
      lemmaDict: data.lemmaDict ?? [],
      lemmaTagDict: data.lemmaTagDict ?? [],
    };
    this._lineIndexes = buildLineIndexes(this._lines);
    this._completionIndexes = buildCompletionIndexes(
      this._dicts.wordDict,
      this._dicts.lemmaDict,
      this._dicts.lemmaTagDict,
    );
    this._wordDictMap = null;
    this._lemmaTagDictMap = null;
    this._groupCache = new Map();
  }

  /** Map from dictionary word to its word_dict entry. */
  get wordDictMap() {
    return this._wordDictMap;
  }

  /** Map from tagged lemma to its lemma_tag_dict entry. */
  get lemmaTagDictMap() {
    return this._lemmaTagDictMap;
  }

  /**
   * Build the dictionary lookup maps. They are only needed by the reading
   * view, so they are built the first time a word is described rather than
   * with the search indexes.
   *
   * @private
   */
  _ensureDictMaps() {
    if (!this._wordDictMap) {
      this._wordDictMap = indexBy(this._dicts?.wordDict, 'word');
    }
    if (!this._lemmaTagDictMap) {
      this._lemmaTagDictMap = indexBy(this._dicts?.lemmaTagDict, 'lemma_tag');
    }
  }

  /**
   * The indices of every line belonging to a group, in corpus order. A line
   * belongs to a group when the group id appears anywhere in its group path,
   * which is the same rule the search backends use to restrict by location.
   *
   * @param {string} groupId A group identifier such as `KnT` or `CT`.
   * @returns {number[]} Line indices into `lines`, in corpus order.
   */
  lineIndicesForGroup(groupId) {
    return this._group(groupId).indices;
  }

  /**
   * Count the lines containing a word, in one group and in the whole corpus.
   * Counts are of lines, not of occurrences: a word twice in a line counts
   * once, which is what both search backends can report.
   *
   * @param {string} word The word to count, matched as the search backends do.
   * @param {string} [groupId] Group to count within; omitted for corpus only.
   * @returns {{ text: number|null, corpus: number }}
   */
  wordLineCounts(word, groupId) {
    const postings = this._postingsForWord(word);
    const corpus = postings.length;

    if (!groupId) {
      return { text: null, corpus };
    }

    const { set } = this._group(groupId);
    let text = 0;
    for (const index of postings) {
      if (set.has(index)) {
        text += 1;
      }
    }
    return { text, corpus };
  }

  /**
   * Describe the word at a position in a line, together with its line counts.
   *
   * @param {Object} options
   * @param {number} options.lineIndex Index of the line in `lines`.
   * @param {number} options.tokenIndex Position of the word within the line.
   * @param {string} [options.groupId] Group the reader has selected.
   * @returns {Object|null} Word description plus a `counts` property.
   */
  wordInfo({ lineIndex, tokenIndex, groupId }) {
    this._ensureDictMaps();
    const line = this._lines?.[lineIndex];
    const info = buildWordInfo({
      line,
      tokenIndex,
      wordDictMap: this.wordDictMap,
      lemmaTagDictMap: this.lemmaTagDictMap,
    });

    if (!info) {
      return null;
    }

    return {
      ...info,
      line,
      lineIndex,
      tokenIndex,
      counts: this.wordLineCounts(info.word, groupId),
    };
  }

  /**
   * Posting list of the lines whose text contains every token of a word.
   *
   * @param {string} word
   * @returns {number[]} Line indices in ascending order.
   * @private
   */
  _postingsForWord(word) {
    const tokens = simpleAnalyzer(word ?? '');
    const index = this._lineIndexes?.textIndex;

    if (tokens.length === 0 || !index) {
      return [];
    }

    let result = index.get(tokens[0]) ?? [];
    for (let i = 1; i < tokens.length && result.length > 0; i++) {
      const next = new Set(index.get(tokens[i]) ?? []);
      result = result.filter((lineIndex) => next.has(lineIndex));
    }
    return result;
  }

  /**
   * Cached line list and membership set for a group.
   *
   * @param {string} groupId
   * @returns {{ indices: number[], set: Set<number> }}
   * @private
   */
  _group(groupId) {
    const cached = this._groupCache.get(groupId);
    if (cached) {
      return cached;
    }

    const indices = [];
    const lines = this._lines ?? [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].group?.includes(groupId)) {
        indices.push(i);
      }
    }

    const entry = { indices, set: new Set(indices) };
    if (this._groupCache.size >= GROUP_CACHE_LIMIT) {
      const oldest = this._groupCache.keys().next().value;
      this._groupCache.delete(oldest);
    }
    this._groupCache.set(groupId, entry);
    return entry;
  }
}

/**
 * Index dictionary entries by a keyword field, lowercased.
 *
 * @param {Array<Object>|null|undefined} entries
 * @param {string} field
 * @returns {Map<string, Object>}
 */
function indexBy(entries, field) {
  const map = new Map();
  for (const entry of entries ?? []) {
    const key = entry?.[field];
    if (typeof key === 'string' && key !== '') {
      const lower = key.toLowerCase();
      if (!map.has(lower)) {
        map.set(lower, entry);
      }
    }
  }
  return map;
}
