/**
 * Helpers for the nested option list in `text-powersel.json`.
 *
 * The file mixes plain options (`{ id, label }`) with groups
 * (`{ groupName, options: [...] }`) to any depth, which is the shape
 * ember-power-select expects for grouped options.
 */

/**
 * Collect every option of a nested power-select option list, keyed by id.
 * The option objects are the ones from the list itself, so a selection made
 * from the map is identical to the matching entry in the dropdown.
 *
 * @param {Array<Object>|null|undefined} data Nested power-select options.
 * @returns {Map<string, Object>} Map from option id to option object.
 */
export function flattenOptions(data) {
  const map = new Map();
  collect(data, map);
  return map;
}

/**
 * @param {Array<Object>|null|undefined} data
 * @param {Map<string, Object>} map
 */
function collect(data, map) {
  for (const entry of data ?? []) {
    if (entry == null) {
      continue;
    }
    if (Array.isArray(entry.options)) {
      collect(entry.options, map);
    } else if (typeof entry.id === 'string' && !map.has(entry.id)) {
      map.set(entry.id, entry);
    }
  }
}
