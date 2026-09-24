/**
 * Encoding of list-valued query parameters.
 *
 * A search is recorded in the URL so it can be bookmarked, and the values are
 * corpus strings which may contain any punctuation — `word_dict` holds entries
 * such as `he,` and `(+),`. Lists are therefore joined with commas after
 * escaping `%` and `,` inside each item, which keeps the common case readable
 * (`words=god,man`) while round-tripping awkward values exactly.
 */

/**
 * Escape one item of a list.
 *
 * @param {string} item
 * @returns {string}
 */
function escapeItem(item) {
  return String(item).replace(/%/g, '%25').replace(/,/g, '%2C');
}

/**
 * Reverse `escapeItem`.
 *
 * @param {string} item
 * @returns {string}
 */
function unescapeItem(item) {
  return item.replace(/%2C/gi, ',').replace(/%25/gi, '%');
}

/**
 * Encode a list of strings as a single query parameter value.
 *
 * @param {Array<string>|null|undefined} items
 * @returns {string} Encoded value; empty for an empty or missing list.
 */
export function encodeList(items) {
  if (!items || items.length === 0) {
    return '';
  }
  return items
    .filter((item) => item != null && String(item) !== '')
    .map(escapeItem)
    .join(',');
}

/**
 * Decode a query parameter value produced by `encodeList`.
 *
 * @param {string|null|undefined} value
 * @returns {string[]} The list, empty for an empty or missing value.
 */
export function decodeList(value) {
  if (value == null || value === '') {
    return [];
  }
  return String(value)
    .split(',')
    .map(unescapeItem)
    .filter((item) => item !== '');
}

/**
 * Coerce a query parameter to a positive integer.
 *
 * @param {*} value
 * @param {number} fallback Value used when `value` is missing or unparsable.
 * @returns {number}
 */
export function decodeInteger(value, fallback) {
  const numeric = Number.parseInt(value, 10);
  if (Number.isNaN(numeric) || numeric < 1) {
    return fallback;
  }
  return numeric;
}
