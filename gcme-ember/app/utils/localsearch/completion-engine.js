/**
 * Completion engine for prefix-based autocomplete queries.
 *
 * Uses binary search on sorted completion arrays to find the first entry
 * whose token starts with the given prefix, then scans forward collecting
 * up to 10 matches.
 */

const MAX_RESULTS = 10;

/**
 * Map term names to the corresponding completion index key and dictionary key/field.
 */
const TERM_CONFIG = {
  word: { indexKey: 'wordSuggest', dictKey: 'wordDict', field: 'word' },
  lemma: { indexKey: 'lemmaSuggest', dictKey: 'lemmaDict', field: 'lemma' },
  lemma_tag: { indexKey: 'lemmaTagSuggest', dictKey: 'lemmaTagDict', field: 'lemma_tag' },
};

/**
 * Perform prefix-based completion against sorted completion indexes.
 *
 * @param {string} term The term type: "word", "lemma", or "lemma_tag".
 * @param {string} prefix The user-typed prefix to match against.
 * @param {{ wordSuggest: Array, lemmaSuggest: Array, lemmaTagSuggest: Array }} completionIndexes
 *   Sorted arrays of { token: string, docIndex: number } entries.
 * @param {{ wordDict: Array, lemmaDict: Array, lemmaTagDict: Array }} dicts
 *   The raw dictionary arrays.
 * @returns {Array<Object>} Array of up to 10 matching results, each with source doc fields and `_match`.
 */
export function complete(term, prefix, completionIndexes, dicts) {
  // Return [] for invalid term names
  const config = TERM_CONFIG[term];
  if (!config) {
    return [];
  }

  // Return [] for empty prefix
  if (!prefix || prefix.length === 0) {
    return [];
  }

  const lowerPrefix = prefix.toLowerCase();
  const index = completionIndexes[config.indexKey];
  const dict = dicts[config.dictKey];

  if (!index || !dict || index.length === 0) {
    return [];
  }

  // Binary search: find the leftmost position where token >= lowerPrefix
  let lo = 0;
  let hi = index.length;

  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (index[mid].token < lowerPrefix) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  // Scan forward collecting up to MAX_RESULTS matches
  const results = [];

  for (let i = lo; i < index.length && results.length < MAX_RESULTS; i++) {
    const entry = index[i];

    if (!entry.token.startsWith(lowerPrefix)) {
      // Once tokens no longer start with the prefix, stop scanning
      break;
    }

    const sourceDoc = dict[entry.docIndex];
    const matchValue = sourceDoc[config.field];

    results.push({
      ...sourceDoc,
      _match: matchValue,
    });
  }

  return results;
}
