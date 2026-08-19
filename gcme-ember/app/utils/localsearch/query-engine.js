import { simpleAnalyzer, whitespaceIgnoreCaseAnalyzer } from './analyzers';

/**
 * Map from query DSL field names to their corresponding index key and analyzer.
 */
const FIELD_CONFIG = {
  text: { indexKey: 'textIndex', analyzer: simpleAnalyzer },
  lemma_text: { indexKey: 'lemmaTextIndex', analyzer: whitespaceIgnoreCaseAnalyzer },
  lemma_tag_text: { indexKey: 'lemmaTagTextIndex', analyzer: whitespaceIgnoreCaseAnalyzer },
};

/**
 * Map from highlight field names (as used in the query DSL) to the
 * corresponding source field name, index key, and analyzer.
 *
 * The search controller requests highlighting on `text` and `tag_lemma_text`.
 * The `tag_lemma_text` highlight key corresponds to the `lemma_tag_text` source field.
 */
const HIGHLIGHT_FIELD_MAP = {
  text: { sourceField: 'text', indexKey: 'textIndex', analyzer: simpleAnalyzer },
  tag_lemma_text: { sourceField: 'lemma_tag_text', indexKey: 'lemmaTagTextIndex', analyzer: whitespaceIgnoreCaseAnalyzer },
};

/**
 * Execute a query against the in-memory inverted indexes.
 *
 * @param {Object} query OpenSearch query DSL subset produced by the search controller.
 * @param {{ textIndex: Map<string, number[]>, lemmaTextIndex: Map<string, number[]>, lemmaTagTextIndex: Map<string, number[]> }} indexes
 * @param {Array<Object>} lines Array of line documents from line.json.
 * @returns {{ hits: { total: { value: number, relation: string }, hits: Array<Object> } }}
 */
export function execute(query, indexes, lines) {
  // --- Validate pagination ---
  const from = query.from ?? 0;
  const size = query.size ?? 25;

  if (from < 0) {
    throw new Error('Invalid pagination: from must be >= 0');
  }
  if (size < 1 || size > 100) {
    throw new Error('Invalid pagination: size must be between 1 and 100');
  }

  // --- Resolve matching line indices from term clauses ---
  const boolQuery = query.query?.bool;
  const innerBool = boolQuery?.must?.bool;

  let matchedIndices;

  if (innerBool?.must) {
    // AND: intersection of all clause results
    matchedIndices = evaluateMust(innerBool.must, indexes);
  } else if (innerBool?.should) {
    // OR: union of all clause results
    matchedIndices = evaluateShould(innerBool.should, indexes);
  } else {
    // No clauses — match nothing
    matchedIndices = new Set();
  }

  // --- Apply group filter ---
  const filterGroups = boolQuery?.filter?.terms?.group;
  if (filterGroups && filterGroups.length > 0) {
    const groupSet = new Set(filterGroups);
    const filtered = new Set();
    for (const idx of matchedIndices) {
      const lineGroups = lines[idx].group;
      if (lineGroups && lineGroups.some((g) => groupSet.has(g))) {
        filtered.add(idx);
      }
    }
    matchedIndices = filtered;
  }

  // --- Convert to sorted array of indices ---
  let resultIndices = Array.from(matchedIndices);

  // --- Apply sort ---
  if (query.sort && query.sort.length > 0) {
    resultIndices.sort((a, b) => {
      const lineA = lines[a];
      const lineB = lines[b];

      // Primary: id lexicographic ascending
      if (lineA.id < lineB.id) return -1;
      if (lineA.id > lineB.id) return 1;

      // Secondary: number numeric ascending
      if (lineA.number < lineB.number) return -1;
      if (lineA.number > lineB.number) return 1;

      // Tertiary: raw_number lexicographic ascending
      if (lineA.raw_number < lineB.raw_number) return -1;
      if (lineA.raw_number > lineB.raw_number) return 1;

      // Stability: preserve original array order
      return a - b;
    });
  }

  // --- Total count (before pagination) ---
  const totalValue = resultIndices.length;

  // --- Apply pagination ---
  const paginatedIndices = resultIndices.slice(from, from + size);

  // --- Collect query tokens per field for highlighting ---
  const queryTokensByField = collectQueryTokens(innerBool, indexes);

  // --- Build result hits ---
  const hits = paginatedIndices.map((idx) => {
    const line = lines[idx];
    const hit = { _source: line };

    // Add highlights if requested
    if (query.highlight?.fields) {
      const highlight = buildHighlight(line, query.highlight.fields, queryTokensByField);
      if (highlight) {
        hit.highlight = highlight;
      }
    }

    return hit;
  });

  return {
    hits: {
      total: { value: totalValue, relation: 'eq' },
      hits,
    },
  };
}

/**
 * Evaluate a single term clause, returning the set of matching line indices.
 *
 * @param {{ term: { [field: string]: string } }} clause
 * @param {Object} indexes
 * @returns {Set<number>}
 */
function evaluateTermClause(clause, indexes) {
  const termObj = clause.term;
  const field = Object.keys(termObj)[0];
  const value = termObj[field];

  const config = FIELD_CONFIG[field];
  if (!config) {
    // Unknown field — matches no lines
    return new Set();
  }

  const tokens = config.analyzer(value);
  if (tokens.length === 0) {
    // Empty/whitespace value — matches no lines
    return new Set();
  }

  const index = indexes[config.indexKey];

  // For a multi-token analyzed value, we intersect the posting lists
  // (all tokens must be present in the same line).
  let result = null;
  for (const token of tokens) {
    const postings = index.get(token);
    if (!postings || postings.length === 0) {
      return new Set();
    }
    const postingSet = new Set(postings);
    if (result === null) {
      result = postingSet;
    } else {
      result = intersectSets(result, postingSet);
      if (result.size === 0) return result;
    }
  }

  return result || new Set();
}

/**
 * Evaluate `bool.must` (AND) — intersection of all clause results.
 *
 * @param {Array<Object>} clauses Array of term clauses.
 * @param {Object} indexes
 * @returns {Set<number>}
 */
function evaluateMust(clauses, indexes) {
  if (clauses.length === 0) return new Set();

  let result = null;
  for (const clause of clauses) {
    const clauseResult = evaluateTermClause(clause, indexes);
    if (result === null) {
      result = clauseResult;
    } else {
      result = intersectSets(result, clauseResult);
    }
    if (result.size === 0) return result;
  }

  return result || new Set();
}

/**
 * Evaluate `bool.should` (OR) — union of all clause results.
 *
 * @param {Array<Object>} clauses Array of term clauses.
 * @param {Object} indexes
 * @returns {Set<number>}
 */
function evaluateShould(clauses, indexes) {
  const result = new Set();
  for (const clause of clauses) {
    const clauseResult = evaluateTermClause(clause, indexes);
    for (const idx of clauseResult) {
      result.add(idx);
    }
  }
  return result;
}

/**
 * Intersect two sets, returning a new set containing only elements present in both.
 *
 * @param {Set<number>} setA
 * @param {Set<number>} setB
 * @returns {Set<number>}
 */
function intersectSets(setA, setB) {
  const result = new Set();
  // Iterate over the smaller set for efficiency
  const [smaller, larger] = setA.size <= setB.size ? [setA, setB] : [setB, setA];
  for (const item of smaller) {
    if (larger.has(item)) {
      result.add(item);
    }
  }
  return result;
}

/**
 * Collect all query tokens organized by source field, for use in highlighting.
 *
 * @param {Object|undefined} innerBool The inner bool object from the query.
 * @param {Object} indexes
 * @returns {Map<string, Set<string>>} Map from source field name to set of analyzed tokens.
 */
function collectQueryTokens(innerBool) {
  const tokensByField = new Map();

  if (!innerBool) return tokensByField;

  const clauses = innerBool.must || innerBool.should || [];
  for (const clause of clauses) {
    const termObj = clause.term;
    const field = Object.keys(termObj)[0];
    const value = termObj[field];

    const config = FIELD_CONFIG[field];
    if (!config) continue;

    const tokens = config.analyzer(value);
    if (!tokensByField.has(field)) {
      tokensByField.set(field, new Set());
    }
    const fieldTokens = tokensByField.get(field);
    for (const token of tokens) {
      fieldTokens.add(token);
    }
  }

  return tokensByField;
}

/**
 * Build the highlight object for a single hit.
 *
 * @param {Object} line The line document.
 * @param {Object} highlightFields The `highlight.fields` object from the query.
 * @param {Map<string, Set<string>>} queryTokensByField Tokens grouped by source field.
 * @returns {Object|null} Highlight object or null if no highlights apply.
 */
function buildHighlight(line, highlightFields, queryTokensByField) {
  const highlight = {};
  let hasHighlight = false;

  for (const highlightKey of Object.keys(highlightFields)) {
    const mapping = HIGHLIGHT_FIELD_MAP[highlightKey];
    if (!mapping) continue;

    // Determine which query tokens apply to this highlighted field.
    // The highlight key maps to a source field; we need query tokens that
    // were searched on that same source field.
    const sourceField = mapping.sourceField;
    const queryTokens = queryTokensByField.get(sourceField);

    // If no query tokens targeted this field, omit the highlight (Req 9.4)
    if (!queryTokens || queryTokens.size === 0) continue;

    const fieldValue = line[sourceField];
    if (!fieldValue) continue;

    const highlighted = highlightText(fieldValue, queryTokens, mapping.analyzer);
    if (highlighted !== null) {
      highlight[highlightKey] = [highlighted];
      hasHighlight = true;
    }
  }

  return hasHighlight ? highlight : null;
}

/**
 * Highlight matched tokens in a text string by wrapping them in <em> tags.
 *
 * For simpleAnalyzer fields: tokens are sequences of letters separated by non-letters.
 * For whitespaceIgnoreCaseAnalyzer fields: tokens are separated by whitespace.
 *
 * @param {string} text The original field text.
 * @param {Set<string>} matchedTokens Set of analyzed tokens to highlight.
 * @param {Function} analyzer The analyzer function used for this field.
 * @returns {string|null} The highlighted text, or null if no tokens match.
 */
function highlightText(text, matchedTokens, analyzer) {
  let result = '';
  let hasMatch = false;

  if (analyzer === simpleAnalyzer) {
    // Simple analyzer: tokens are letter sequences, separators are non-letters
    // We need to walk through the text, identifying token boundaries
    const tokenPattern = /[a-zA-Z]+/g;
    let lastIndex = 0;
    let match;

    while ((match = tokenPattern.exec(text)) !== null) {
      // Append any non-token characters before this token
      result += text.slice(lastIndex, match.index);

      const originalToken = match[0];
      const analyzedToken = originalToken.toLowerCase();

      if (matchedTokens.has(analyzedToken)) {
        result += `<em>${originalToken}</em>`;
        hasMatch = true;
      } else {
        result += originalToken;
      }

      lastIndex = match.index + match[0].length;
    }

    // Append any trailing non-token characters
    result += text.slice(lastIndex);
  } else {
    // Whitespace analyzer: tokens are separated by whitespace
    const parts = text.split(/(\s+)/);

    for (const part of parts) {
      if (/^\s+$/.test(part)) {
        // Whitespace separator — preserve as-is
        result += part;
      } else if (part.length > 0) {
        // This is a token — analyze it and check for match
        const analyzed = analyzer(part);
        const analyzedToken = analyzed.length > 0 ? analyzed[0] : '';

        if (matchedTokens.has(analyzedToken)) {
          result += `<em>${part}</em>`;
          hasMatch = true;
        } else {
          result += part;
        }
      }
    }
  }

  return hasMatch ? result : null;
}
