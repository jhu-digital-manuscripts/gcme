/**
 * ASCII folding map for common Unicode diacritics.
 * Maps composed characters to their ASCII base equivalents.
 */
const DIACRITICS_MAP = {
  '\u00C0': 'A', '\u00C1': 'A', '\u00C2': 'A', '\u00C3': 'A', '\u00C4': 'A', '\u00C5': 'A',
  '\u00C6': 'AE',
  '\u00C7': 'C',
  '\u00C8': 'E', '\u00C9': 'E', '\u00CA': 'E', '\u00CB': 'E',
  '\u00CC': 'I', '\u00CD': 'I', '\u00CE': 'I', '\u00CF': 'I',
  '\u00D0': 'D',
  '\u00D1': 'N',
  '\u00D2': 'O', '\u00D3': 'O', '\u00D4': 'O', '\u00D5': 'O', '\u00D6': 'O', '\u00D8': 'O',
  '\u00D9': 'U', '\u00DA': 'U', '\u00DB': 'U', '\u00DC': 'U',
  '\u00DD': 'Y',
  '\u00DE': 'TH',
  '\u00DF': 'ss',
  '\u00E0': 'a', '\u00E1': 'a', '\u00E2': 'a', '\u00E3': 'a', '\u00E4': 'a', '\u00E5': 'a',
  '\u00E6': 'ae',
  '\u00E7': 'c',
  '\u00E8': 'e', '\u00E9': 'e', '\u00EA': 'e', '\u00EB': 'e',
  '\u00EC': 'i', '\u00ED': 'i', '\u00EE': 'i', '\u00EF': 'i',
  '\u00F0': 'd',
  '\u00F1': 'n',
  '\u00F2': 'o', '\u00F3': 'o', '\u00F4': 'o', '\u00F5': 'o', '\u00F6': 'o', '\u00F8': 'o',
  '\u00F9': 'u', '\u00FA': 'u', '\u00FB': 'u', '\u00FC': 'u',
  '\u00FD': 'y', '\u00FF': 'y',
  '\u00FE': 'th',
  '\u0100': 'A', '\u0101': 'a', '\u0102': 'A', '\u0103': 'a', '\u0104': 'A', '\u0105': 'a',
  '\u0106': 'C', '\u0107': 'c', '\u0108': 'C', '\u0109': 'c', '\u010A': 'C', '\u010B': 'c', '\u010C': 'C', '\u010D': 'c',
  '\u010E': 'D', '\u010F': 'd', '\u0110': 'D', '\u0111': 'd',
  '\u0112': 'E', '\u0113': 'e', '\u0114': 'E', '\u0115': 'e', '\u0116': 'E', '\u0117': 'e', '\u0118': 'E', '\u0119': 'e', '\u011A': 'E', '\u011B': 'e',
  '\u011C': 'G', '\u011D': 'g', '\u011E': 'G', '\u011F': 'g', '\u0120': 'G', '\u0121': 'g', '\u0122': 'G', '\u0123': 'g',
  '\u0124': 'H', '\u0125': 'h', '\u0126': 'H', '\u0127': 'h',
  '\u0128': 'I', '\u0129': 'i', '\u012A': 'I', '\u012B': 'i', '\u012C': 'I', '\u012D': 'i', '\u012E': 'I', '\u012F': 'i', '\u0130': 'I', '\u0131': 'i',
  '\u0134': 'J', '\u0135': 'j',
  '\u0136': 'K', '\u0137': 'k',
  '\u0139': 'L', '\u013A': 'l', '\u013B': 'L', '\u013C': 'l', '\u013D': 'L', '\u013E': 'l', '\u0141': 'L', '\u0142': 'l',
  '\u0143': 'N', '\u0144': 'n', '\u0145': 'N', '\u0146': 'n', '\u0147': 'N', '\u0148': 'n',
  '\u014C': 'O', '\u014D': 'o', '\u014E': 'O', '\u014F': 'o', '\u0150': 'O', '\u0151': 'o', '\u0152': 'OE', '\u0153': 'oe',
  '\u0154': 'R', '\u0155': 'r', '\u0156': 'R', '\u0157': 'r', '\u0158': 'R', '\u0159': 'r',
  '\u015A': 'S', '\u015B': 's', '\u015C': 'S', '\u015D': 's', '\u015E': 'S', '\u015F': 's', '\u0160': 'S', '\u0161': 's',
  '\u0162': 'T', '\u0163': 't', '\u0164': 'T', '\u0165': 't', '\u0166': 'T', '\u0167': 't',
  '\u0168': 'U', '\u0169': 'u', '\u016A': 'U', '\u016B': 'u', '\u016C': 'U', '\u016D': 'u', '\u016E': 'U', '\u016F': 'u', '\u0170': 'U', '\u0171': 'u', '\u0172': 'U', '\u0173': 'u',
  '\u0174': 'W', '\u0175': 'w',
  '\u0176': 'Y', '\u0177': 'y', '\u0178': 'Y',
  '\u0179': 'Z', '\u017A': 'z', '\u017B': 'Z', '\u017C': 'z', '\u017D': 'Z', '\u017E': 'z',
};

/**
 * Fold Unicode diacritics to their ASCII equivalents.
 *
 * Uses NFD decomposition to strip combining marks, then falls back to
 * the DIACRITICS_MAP for precomposed characters that don't decompose cleanly.
 *
 * @param {string} str Input string potentially containing diacritics.
 * @returns {string} ASCII-folded string.
 */
function asciiFold(str) {
  // First pass: replace known precomposed characters from the map
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const replacement = DIACRITICS_MAP[ch];
    if (replacement !== undefined) {
      result += replacement;
    } else {
      result += ch;
    }
  }
  // Second pass: use NFD decomposition to strip any remaining combining marks
  return result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Simple analyzer: splits input on non-letter characters, lowercases all
 * tokens, and discards empty strings. Produces an empty token list when the
 * input contains no letter characters.
 *
 * Replicates the OpenSearch "simple" analyzer behavior.
 *
 * @param {string} input Text to analyze.
 * @returns {string[]} Array of lowercase letter-only tokens.
 */
export function simpleAnalyzer(input) {
  if (!input || !input.trim()) {
    return [];
  }
  return input
    .split(/[^a-zA-Z]+/)
    .map((token) => token.toLowerCase())
    .filter((token) => token.length > 0);
}

/**
 * Whitespace ignore-case analyzer: splits input on whitespace, lowercases all
 * tokens, and folds Unicode diacritics to ASCII equivalents. Preserves
 * non-letter characters (such as @, %, _) within tokens.
 *
 * Replicates the custom OpenSearch "whitespace_ignore_case" analyzer behavior.
 *
 * @param {string} input Text to analyze.
 * @returns {string[]} Array of lowercased, ASCII-folded tokens.
 */
export function whitespaceIgnoreCaseAnalyzer(input) {
  if (!input || !input.trim()) {
    return [];
  }
  return input
    .split(/\s+/)
    .map((token) => asciiFold(token.toLowerCase()))
    .filter((token) => token.length > 0);
}

/**
 * Keyword analyzer: returns the entire input as a single-element array,
 * lowercased, with no splitting. Used for exact-match completion on suggest
 * fields.
 *
 * @param {string} input Text to analyze.
 * @returns {string[]} Single-element array with the lowercased input, or
 *   empty array for empty/whitespace-only input.
 */
export function keywordAnalyzer(input) {
  if (!input || !input.trim()) {
    return [];
  }
  return [input.toLowerCase()];
}
