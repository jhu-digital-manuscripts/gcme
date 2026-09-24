/**
 * Helpers for describing a single word of a line of text.
 *
 * Every line document carries three whitespace-aligned fields — `text`,
 * `lemma_text`, and `lemma_tag_text` — with exactly one token each per word of
 * the line. The text view relies on that alignment: the word at position `i`
 * of `text` has the lemma at position `i` of `lemma_text` and the tagged lemma
 * at position `i` of `lemma_tag_text`.
 */

/** Tagged lemma used by the corpus for a word that was never concorded. */
export const NOT_CONCORDED = 'not-concorded';

/**
 * Punctuation stripped from the edges of a displayed word before it is looked
 * up in the word dictionary or used as a search term. The dictionary keys are
 * lowercase and mostly unpunctuated, while the text keeps the punctuation of
 * the printed edition (`God,` / `"I`).
 */
const EDGE_PUNCTUATION = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

/**
 * Split a line's field value into its whitespace-separated tokens.
 *
 * @param {string} value Field value, or null/undefined.
 * @returns {string[]} Tokens, empty for a blank value.
 */
export function tokenize(value) {
  if (!value) {
    return [];
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? [] : trimmed.split(/\s+/);
}

/**
 * Strip edge punctuation from a displayed word.
 *
 * @param {string} display Word as printed in the text.
 * @returns {string} The word without leading or trailing punctuation.
 */
export function stripPunctuation(display) {
  return (display ?? '').replace(EDGE_PUNCTUATION, '');
}

/**
 * Resolve the word-dictionary key for a displayed word: the lowercased word
 * itself when the dictionary knows that spelling, otherwise the lowercased
 * word without its edge punctuation.
 *
 * @param {string} display Word as printed in the text.
 * @param {Map<string, Object>} [wordDictMap] Map from dictionary word to entry.
 * @returns {string} The dictionary key to use, possibly absent from the map.
 */
export function dictWord(display, wordDictMap) {
  const lower = (display ?? '').toLowerCase();
  if (wordDictMap?.has(lower)) {
    return lower;
  }
  const stripped = stripPunctuation(lower);
  if (wordDictMap?.has(stripped)) {
    return stripped;
  }
  return stripped.length > 0 ? stripped : lower;
}

/**
 * Reduce a tagged lemma to the base form used as a key in the word
 * dictionary, dropping the inflection (`%…`) and variant (`#…`) parts.
 * For example `shour@n%pl` and `engelond@n#propn` become `shour@n` and
 * `engelond@n`.
 *
 * @param {string} lemmaTag A tagged lemma.
 * @returns {string} The base tagged lemma.
 */
export function baseLemmaTag(lemmaTag) {
  if (!lemmaTag) {
    return '';
  }
  return lemmaTag.split('%')[0].split('#')[0];
}

/**
 * Split a dictionary definition into its headword part and its gloss. The
 * generated definitions put the two either side of a tab, as in
 * `shour n.\t"shower, rain storm; …," s.v. shower sb.\1 OED.`
 *
 * @param {string|null|undefined} definition Raw definition text.
 * @returns {{ head: string, gloss: string }|null} Split definition, or null.
 */
export function splitDefinition(definition) {
  if (definition == null || definition === '') {
    return null;
  }
  const normalized = String(definition).replace(/\s+/g, ' ').trim();
  const tab = String(definition).indexOf('\t');
  if (tab === -1) {
    return { head: '', gloss: normalized };
  }
  return {
    head: String(definition).slice(0, tab).replace(/\s+/g, ' ').trim(),
    gloss: String(definition)
      .slice(tab + 1)
      .replace(/\s+/g, ' ')
      .trim(),
  };
}

/**
 * Describe one word of a line: its lemma, its tagged lemma, the definition of
 * that tagged lemma, and the other senses recorded for the same spelling.
 *
 * @param {Object} options
 * @param {Object} options.line A line document.
 * @param {number} options.tokenIndex Zero-based position of the word in the line.
 * @param {Map<string, Object>} options.wordDictMap Map from word to word_dict entry.
 * @param {Map<string, Object>} options.lemmaTagDictMap Map from tagged lemma to
 *   lemma_tag_dict entry.
 * @returns {Object|null} Word description, or null when the position does not
 *   exist in the line.
 */
export function buildWordInfo({ line, tokenIndex, wordDictMap, lemmaTagDictMap }) {
  if (!line) {
    return null;
  }

  const words = tokenize(line.text);
  if (tokenIndex < 0 || tokenIndex >= words.length) {
    return null;
  }

  const lemmas = tokenize(line.lemma_text);
  const lemmaTags = tokenize(line.lemma_tag_text);

  const display = words[tokenIndex];
  const word = dictWord(display, wordDictMap);
  const rawLemma = lemmas[tokenIndex] ?? '';
  const rawLemmaTag = lemmaTags[tokenIndex] ?? '';
  const concorded =
    rawLemmaTag !== '' && rawLemmaTag !== NOT_CONCORDED && rawLemma !== NOT_CONCORDED;

  const lemmaTag = concorded ? rawLemmaTag : '';
  const lemma = concorded ? rawLemma : '';
  const tag = lemmaTag.includes('@') ? lemmaTag.slice(lemmaTag.indexOf('@') + 1) : '';

  // The tagged lemma from the line carries its inflection, so the exact
  // definition comes from lemma_tag_dict. The word dictionary holds the base
  // tagged lemmas for the spelling, which is where the other senses come from.
  const lemmaTagEntry = lemmaTag ? lemmaTagDictMap?.get(lemmaTag.toLowerCase()) : null;
  const wordEntry = wordDictMap?.get(word) ?? null;

  let definition = splitDefinition(lemmaTagEntry?.definition);
  const base = baseLemmaTag(lemmaTag);
  const otherSenses = [];
  const seen = new Set();

  for (let i = 0; i < (wordEntry?.lemma_tag?.length ?? 0); i++) {
    const candidate = wordEntry.lemma_tag[i];
    const candidateDefinition = splitDefinition(wordEntry.definition?.[i]);

    if (candidate === base) {
      // Fall back on the word dictionary when the tagged lemma has no entry.
      definition = definition ?? candidateDefinition;
      continue;
    }
    const key = `${candidate}\u0000${candidateDefinition?.gloss ?? ''}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    otherSenses.push({ lemmaTag: candidate, definition: candidateDefinition });
  }

  return {
    display,
    word,
    lemma,
    lemmaTag,
    tag,
    concorded,
    definition,
    otherSenses,
  };
}
