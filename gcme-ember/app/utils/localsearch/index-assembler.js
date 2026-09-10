import { simpleAnalyzer, whitespaceIgnoreCaseAnalyzer } from './analyzers';

/**
 * Build inverted indexes for line documents.
 *
 * Each index maps analyzed tokens to arrays of integer indices into the
 * source `lines` array. This avoids duplicating line objects and keeps
 * memory usage low.
 *
 * @param {Array<Object>} lines Array of line documents from line.json.
 * @returns {{ textIndex: Map<string, number[]>, lemmaTextIndex: Map<string, number[]>, lemmaTagTextIndex: Map<string, number[]> }}
 */
export function buildLineIndexes(lines) {
  const textIndex = new Map();
  const lemmaTextIndex = new Map();
  const lemmaTagTextIndex = new Map();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Index the `text` field with simpleAnalyzer
    const textTokens = simpleAnalyzer(line.text || '');
    for (const token of textTokens) {
      let postings = textIndex.get(token);
      if (!postings) {
        postings = [];
        textIndex.set(token, postings);
      }
      if (postings.length === 0 || postings[postings.length - 1] !== i) {
        postings.push(i);
      }
    }

    // Index the `lemma_text` field with whitespaceIgnoreCaseAnalyzer
    const lemmaTokens = whitespaceIgnoreCaseAnalyzer(line.lemma_text || '');
    for (const token of lemmaTokens) {
      let postings = lemmaTextIndex.get(token);
      if (!postings) {
        postings = [];
        lemmaTextIndex.set(token, postings);
      }
      if (postings.length === 0 || postings[postings.length - 1] !== i) {
        postings.push(i);
      }
    }

    // Index the `lemma_tag_text` field with whitespaceIgnoreCaseAnalyzer
    const lemmaTagTokens = whitespaceIgnoreCaseAnalyzer(line.lemma_tag_text || '');
    for (const token of lemmaTagTokens) {
      let postings = lemmaTagTextIndex.get(token);
      if (!postings) {
        postings = [];
        lemmaTagTextIndex.set(token, postings);
      }
      if (postings.length === 0 || postings[postings.length - 1] !== i) {
        postings.push(i);
      }
    }
  }

  return { textIndex, lemmaTextIndex, lemmaTagTextIndex };
}

/**
 * Build sorted completion indexes for dictionary suggest fields.
 *
 * Each completion index is a sorted array of { token, docIndex } entries,
 * where `token` is the lowercased field value used for prefix matching, and
 * `docIndex` is the integer index into the corresponding dictionary array.
 *
 * @param {Array<Object>} wordDict Array of word dictionary entries (with `word` field).
 * @param {Array<Object>} lemmaDict Array of lemma dictionary entries (with `lemma` field).
 * @param {Array<Object>} lemmaTagDict Array of lemma-tag dictionary entries (with `lemma_tag` field).
 * @returns {{ wordSuggest: Array<{token: string, docIndex: number}>, lemmaSuggest: Array<{token: string, docIndex: number}>, lemmaTagSuggest: Array<{token: string, docIndex: number}> }}
 */
export function buildCompletionIndexes(wordDict, lemmaDict, lemmaTagDict) {
  const wordSuggest = buildSortedCompletionArray(wordDict, 'word');
  const lemmaSuggest = buildSortedCompletionArray(lemmaDict, 'lemma');
  const lemmaTagSuggest = buildSortedCompletionArray(lemmaTagDict, 'lemma_tag');

  return { wordSuggest, lemmaSuggest, lemmaTagSuggest };
}

/**
 * Build a sorted completion array from a dictionary and field name.
 *
 * @param {Array<Object>} dict Dictionary array.
 * @param {string} field Field name to extract the token from.
 * @returns {Array<{token: string, docIndex: number}>} Sorted by token lexicographically.
 */
function buildSortedCompletionArray(dict, field) {
  const entries = [];

  for (let i = 0; i < dict.length; i++) {
    const value = dict[i][field];
    if (value != null && value !== '') {
      entries.push({
        token: value.toLowerCase(),
        docIndex: i,
      });
    }
  }

  entries.sort((a, b) => {
    if (a.token < b.token) return -1;
    if (a.token > b.token) return 1;
    return 0;
  });

  return entries;
}
