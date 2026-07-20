# Requirements Document

## Introduction

The gcme-ember application currently depends on a running OpenSearch instance for all text search and dictionary completion operations. This feature introduces a `localsearch` Ember service that implements the same interface as the existing `opensearch` service but executes all queries entirely in the browser. The service loads JSON data files from the public directory at first use, builds in-memory inverted indexes, and answers `executeQuery` and `complete` calls without any network requests to a search backend.

## Glossary

- **Localsearch_Service**: An Ember service that performs text search and completion queries entirely in the browser using in-memory indexes built from static JSON data files.
- **Opensearch_Service**: The existing Ember service that delegates search queries to an external OpenSearch HTTP endpoint.
- **Inverted_Index**: A data structure mapping analyzed tokens to the set of documents containing those tokens, enabling efficient lookup without linear scanning.
- **Simple_Analyzer**: A text analysis strategy that splits input on non-letter characters and lowercases all tokens. Replicates the OpenSearch "simple" analyzer behavior.
- **Whitespace_Ignore_Case_Analyzer**: A text analysis strategy that splits input on whitespace, lowercases all tokens, and applies ASCII folding. Replicates the custom OpenSearch "whitespace_ignore_case" analyzer.
- **Keyword_Analyzer**: A text analysis strategy that treats the entire field value as a single token with no splitting. Used for exact-match completion on lemma and lemma_tag suggest fields.
- **Completion_Query**: A prefix-based autocomplete query that returns dictionary entries whose suggest field begins with the given prefix.
- **Line_Data**: The contents of `line.json` — an array of line objects with fields: id, number, raw_number, group, text, lemma_text, lemma_tag_text.
- **Word_Dict_Data**: The contents of `word_dict.json` — an array of word dictionary entries with fields: word, lemma_tag (array), definition (array).
- **Lemma_Dict_Data**: The contents of `lemma_dict.json` — an array of lemma dictionary entries with fields: lemma, word (array), lemma_tag (array), definition (array).
- **Lemma_Tag_Dict_Data**: The contents of `lemma_tag_dict.json` — an array of lemma-tag dictionary entries with fields: lemma_tag, definition, word (array).

## Requirements

### Requirement 1: Service Interface Compatibility

**User Story:** As a developer, I want the localsearch service to expose the same interface as the opensearch service, so that the search controller can use either service without modification.

#### Acceptance Criteria

1. THE Localsearch_Service SHALL expose an `executeQuery(query)` method that accepts a single query object argument containing OpenSearch query DSL properties (including `query`, `from`, `size`, `suggest`, `sort`, and `highlight`).
2. THE Localsearch_Service SHALL expose a `complete(term, prefix)` method that accepts a string `term` (the field name, e.g. `"word"`, `"lemma"`, or `"lemma_tag"`) and a string `prefix` (the user-typed input).
3. WHEN `executeQuery` is called with a valid query, THE Localsearch_Service SHALL return a result object in the shape `{ hits: { total: { value: N, relation: "eq" }, hits: [...] } }` where each entry in `hits` contains at minimum `_source` (with the indexed document fields) and optionally `highlight` (with field-name-to-array-of-strings mapping).
4. WHEN `complete` is called and matching suggestions exist, THE Localsearch_Service SHALL return an array of objects each containing the source document fields and a `_match` string property set to the matched suggestion text.
5. WHEN `complete` is called and no matching suggestions exist, THE Localsearch_Service SHALL return an empty array (`[]`).
6. IF `executeQuery` encounters an error condition (invalid query structure or unavailable data), THEN THE Localsearch_Service SHALL reject with an `Error` object whose `message` property contains a human-readable description of the failure, matching the rejection contract of the Opensearch_Service.

### Requirement 2: Data Loading

**User Story:** As a user, I want the localsearch service to load data once on first use, so that the application starts quickly and subsequent queries are fast.

#### Acceptance Criteria

1. WHEN `executeQuery` or `complete` is called for the first time, THE Localsearch_Service SHALL fetch `line.json`, `word_dict.json`, `lemma_dict.json`, and `lemma_tag_dict.json` from the application public directory.
2. THE Localsearch_Service SHALL fetch each data file at most once during the lifetime of the application.
3. WHILE data files are being loaded, THE Localsearch_Service SHALL queue incoming `executeQuery` and `complete` calls and resolve them only after loading completes, within a maximum wait time of 30 seconds.
4. IF a data file fails to load or the 30-second timeout elapses, THEN THE Localsearch_Service SHALL reject the current query and all queued queries with an Error indicating which file could not be loaded.
5. IF a previous load attempt has failed, THEN THE Localsearch_Service SHALL re-attempt loading on the next `executeQuery` or `complete` call rather than permanently caching the failure.

### Requirement 3: Inverted Index Construction

**User Story:** As a developer, I want the service to build inverted indexes from the loaded data, so that queries execute efficiently without linear scanning of all records.

#### Acceptance Criteria

1. WHEN Line_Data is loaded, THE Localsearch_Service SHALL build an Inverted_Index for the `text` field using the Simple_Analyzer.
2. WHEN Line_Data is loaded, THE Localsearch_Service SHALL build an Inverted_Index for the `lemma_text` field using the Whitespace_Ignore_Case_Analyzer.
3. WHEN Line_Data is loaded, THE Localsearch_Service SHALL build an Inverted_Index for the `lemma_tag_text` field using the Whitespace_Ignore_Case_Analyzer.
4. WHEN Word_Dict_Data, Lemma_Dict_Data, and Lemma_Tag_Dict_Data are loaded, THE Localsearch_Service SHALL build a sorted token list for each suggest field: `word.suggest` populated from the lowercased `word` field of Word_Dict_Data entries, `lemma.suggest` populated from the lowercased `lemma` field of Lemma_Dict_Data entries, and `lemma_tag.suggest` populated from the lowercased `lemma_tag` field of Lemma_Tag_Dict_Data entries, each sorted in ascending lexicographic order.
5. THE Localsearch_Service SHALL share document references across indexes rather than duplicating full document data per index.

### Requirement 4: Text Analysis

**User Story:** As a user, I want queries to be analyzed the same way as OpenSearch analyzes them, so that search results are consistent regardless of which service backend is used.

#### Acceptance Criteria

1. WHEN analyzing text for the `text` field, THE Simple_Analyzer SHALL split input on non-letter characters, discard all non-letter characters (including digits and punctuation) from the output, and lowercase all resulting tokens, producing an empty token list when the input contains no letter characters.
2. WHEN analyzing text for the `lemma_text` or `lemma_tag_text` fields, THE Whitespace_Ignore_Case_Analyzer SHALL split input on whitespace characters, lowercase all resulting tokens, and fold Unicode diacritics to their ASCII equivalents (asciifolding), preserving non-letter characters such as `@`, `%`, and `_` within tokens.
3. WHEN performing completion on `word.suggest`, THE Localsearch_Service SHALL analyze the prefix using the Simple_Analyzer (splitting on non-letter characters and lowercasing), then match the resulting tokens as prefixes against the indexed word values, returning candidates whose analyzed form starts with the analyzed prefix.
4. WHEN performing completion on `lemma.suggest` or `lemma_tag.suggest`, THE Keyword_Analyzer SHALL treat the entire field value as a single token without modification, and match prefixes case-insensitively from the beginning of the full token value.
5. IF the input to any analyzer is empty or contains only whitespace, THEN THE analyzer SHALL return an empty token list without error.

### Requirement 5: Term Query Execution

**User Story:** As a user, I want to search for lines containing specific words, lemmas, or tagged lemmas, so that I can find relevant Middle English text passages.

#### Acceptance Criteria

1. WHEN a query contains a `term` clause on the `text` field, THE Localsearch_Service SHALL analyze the term value using the Simple_Analyzer and return lines whose `text` Inverted_Index entry contains the resulting token.
2. WHEN a query contains a `term` clause on the `lemma_text` field, THE Localsearch_Service SHALL analyze the term value using the Whitespace_Ignore_Case_Analyzer and return lines whose `lemma_text` Inverted_Index entry contains the resulting token.
3. WHEN a query contains a `term` clause on the `lemma_tag_text` field, THE Localsearch_Service SHALL analyze the term value using the Whitespace_Ignore_Case_Analyzer and return lines whose `lemma_tag_text` Inverted_Index entry contains the resulting token.
4. WHEN multiple term clauses are combined with `bool.must`, THE Localsearch_Service SHALL return only lines that appear in the Inverted_Index result set of every clause (intersection).
5. WHEN multiple term clauses are combined with `bool.should`, THE Localsearch_Service SHALL return lines that appear in the Inverted_Index result set of at least one clause (union).
6. IF a `term` clause value is an empty string or produces no tokens after analysis, THEN THE Localsearch_Service SHALL treat that clause as matching no lines.
7. WHEN a query contains a `term` clause on a field that has no corresponding Inverted_Index, THE Localsearch_Service SHALL treat that clause as matching no lines.
8. WHEN the inner `bool` contains a `must` array with a single term clause, THE Localsearch_Service SHALL return the same results as if that clause were evaluated alone without boolean combination.

### Requirement 6: Filter Queries

**User Story:** As a user, I want to restrict search results to specific text groups (works or sections), so that I can narrow my search to a particular part of the corpus.

#### Acceptance Criteria

1. WHEN a query contains `filter.terms.group` with a non-empty array of group identifiers, THE Localsearch_Service SHALL return only lines that both match the term query clauses AND whose `group` array contains at least one of the specified filter identifiers.
2. WHEN no filter is present in the query or the `filter.terms.group` array is empty, THE Localsearch_Service SHALL return matching lines from all groups without applying any group restriction.
3. WHEN a query contains `filter.terms.group` with identifiers that do not match any line's `group` values, THE Localsearch_Service SHALL return an empty `hits.hits` array with `hits.total.value` set to 0.
4. WHEN filtering is applied, THE Localsearch_Service SHALL set `hits.total.value` to the count of lines matching both the term clauses and the group filter.

### Requirement 7: Sorting

**User Story:** As a user, I want to sort results in logical text order, so that I can read matches in their natural sequence within the corpus.

#### Acceptance Criteria

1. WHEN a query contains a `sort` array specifying `[{ id: "asc" }, { number: "asc" }, { raw_number: "asc" }]`, THE Localsearch_Service SHALL sort results by `id` in lexicographic ascending order, then by `number` in numeric ascending order, then by `raw_number` in lexicographic ascending order.
2. WHEN no `sort` is present in the query, THE Localsearch_Service SHALL return results in the order they appear in the Line_Data array (array-index order).
3. WHEN two results have identical values for all three sort keys (`id`, `number`, and `raw_number`), THE Localsearch_Service SHALL preserve their relative order from the Line_Data array (stable sort).

### Requirement 8: Pagination

**User Story:** As a user, I want paginated results, so that large result sets load quickly and are navigable page by page.

#### Acceptance Criteria

1. WHEN a query contains `from` and `size` fields where `from` is a non-negative integer and `size` is an integer between 1 and 100 inclusive, THE Localsearch_Service SHALL skip the first `from` results and return at most `size` results from the matched set.
2. THE Localsearch_Service SHALL include `hits.total.value` set to the total number of matching documents regardless of pagination.
3. WHEN `from` is greater than or equal to the total number of matching documents, THE Localsearch_Service SHALL return an empty `hits.hits` array with the correct `hits.total.value`.
4. IF a query omits the `from` field or the `size` field, THEN THE Localsearch_Service SHALL apply default values of `from: 0` and `size: 25`.
5. IF `from` is negative or `size` is less than 1 or greater than 100, THEN THE Localsearch_Service SHALL reject the query with an error response indicating the invalid pagination parameter.

### Requirement 9: Highlighting

**User Story:** As a user, I want matched terms highlighted in the results, so that I can quickly see which words in a line matched my query.

#### Acceptance Criteria

1. WHEN a query specifies `highlight.fields` including `text`, THE Localsearch_Service SHALL include a `highlight.text` array containing exactly one element: the full line text with all occurrences of matched tokens wrapped in `<em>` tags, where token boundaries are determined by the Simple_Analyzer tokenization of the `text` field.
2. WHEN a query specifies `highlight.fields` including `tag_lemma_text`, THE Localsearch_Service SHALL include a `highlight.tag_lemma_text` array containing exactly one element: the full lemma_tag_text with all occurrences of matched tokens wrapped in `<em>` tags, where token boundaries are determined by the Whitespace_Ignore_Case_Analyzer tokenization of the `lemma_tag_text` field.
3. WHEN no highlight configuration is present in the query, THE Localsearch_Service SHALL omit the `highlight` property from result hits.
4. IF a hit matches on a field other than the one being highlighted (e.g., the hit matched on `text` but highlight is requested for `tag_lemma_text`), THEN THE Localsearch_Service SHALL omit the highlight array for the non-matching field from that hit rather than including an empty array.

### Requirement 10: Completion Queries

**User Story:** As a user, I want autocomplete suggestions as I type, so that I can discover valid search terms without knowing the exact spelling.

#### Acceptance Criteria

1. WHEN `complete("word", prefix)` is called, THE Localsearch_Service SHALL return Word_Dict_Data entries whose `word` field starts with the lowercased prefix, compared character-by-character from the beginning of the field value.
2. WHEN `complete("lemma", prefix)` is called, THE Localsearch_Service SHALL return Lemma_Dict_Data entries whose `lemma` field, treated as a single token by the Keyword_Analyzer, starts with the lowercased prefix.
3. WHEN `complete("lemma_tag", prefix)` is called, THE Localsearch_Service SHALL return Lemma_Tag_Dict_Data entries whose `lemma_tag` field, treated as a single token by the Keyword_Analyzer, starts with the lowercased prefix.
4. THE Localsearch_Service SHALL return at most 10 completion suggestions per call, selected from the first 10 matching entries in index order.
5. WHEN `complete` is called, THE Localsearch_Service SHALL return each result as an object containing all source document fields and a `_match` property set to the full value of the matched suggest field.
6. IF `complete` is called with a `term` value other than `"word"`, `"lemma"`, or `"lemma_tag"`, THEN THE Localsearch_Service SHALL return an empty array.
7. IF `complete` is called with an empty string prefix, THEN THE Localsearch_Service SHALL return an empty array.

### Requirement 11: Memory Efficiency

**User Story:** As a developer, I want the service to use memory efficiently, so that the browser remains responsive even with large datasets loaded.

#### Acceptance Criteria

1. THE Localsearch_Service SHALL store each line document object exactly once in the primary line array and SHALL store only integer indices into that array (not object copies) in the text, lemma_text, and lemma_tag_text inverted indexes.
2. THE Localsearch_Service SHALL NOT duplicate dictionary definition strings across the word_dict, lemma_dict, and lemma_tag_dict indexes; WHEN the same definition appears in multiple entries, THE Localsearch_Service SHALL store the string once and reference it from each entry.
3. WHEN the line dataset contains 30,000 or more entries, THE Localsearch_Service SHALL consume no more than 1.5 times the memory of the raw JSON payload size for all index structures combined (primary array plus all inverted indexes and dictionary indexes).
4. IF the browser's available memory is insufficient to load the full dataset, THEN THE Localsearch_Service SHALL report an error indicating the dataset could not be loaded rather than silently failing or causing the browser tab to become unresponsive.

### Requirement 12: Offline Operation

**User Story:** As a user, I want the application to work without a running OpenSearch instance when using the localsearch service, so that I can use the application in environments where OpenSearch is unavailable.

#### Acceptance Criteria

1. WHILE the Localsearch_Service is configured as the active search service, THE application SHALL perform all search and completion operations without issuing any HTTP requests to an OpenSearch endpoint, with the sole permitted network activity being same-origin fetches of the static JSON data files (line.json, word_dict.json, lemma_dict.json, lemma_tag_dict.json) from the application's public directory.
2. WHEN the Localsearch_Service has finished loading data files, THE application SHALL execute all `executeQuery` and `complete` calls entirely in-memory without issuing any network requests.
3. WHILE the Localsearch_Service is configured as the active search service, THE application SHALL support term search, boolean combination (must/should), group filtering, sorting, pagination, highlighting, and prefix completion without any external service dependency.

### Requirement 13: Service Registration and Configuration

**User Story:** As a developer, I want to switch between the opensearch and localsearch services via configuration, so that I can choose the appropriate backend for each deployment environment.

#### Acceptance Criteria

1. THE Localsearch_Service SHALL be registered as an Ember service named `localsearch`.
2. THE application SHALL expose a configuration property `ENV.gcme.searchBackend` that accepts the string values `'opensearch'` or `'localsearch'` to determine which search service the search controller uses.
3. IF `ENV.gcme.searchBackend` is not set or is omitted, THEN THE application SHALL default to using the Opensearch_Service so that existing deployments remain unaffected.
4. IF `ENV.gcme.searchBackend` is set to `'localsearch'`, THEN THE search controller SHALL inject and delegate all `executeQuery` and `complete` calls to the Localsearch_Service instead of the Opensearch_Service.
5. IF `ENV.gcme.searchBackend` is set to a value other than `'opensearch'` or `'localsearch'`, THEN THE application SHALL throw an error at boot time indicating the invalid search backend value.

### Requirement 14: Round-Trip Equivalence

**User Story:** As a developer, I want to verify that the localsearch service produces the same results as OpenSearch for the same queries, so that I can be confident the local implementation is correct.

#### Acceptance Criteria

1. WHEN the same `executeQuery` query object is issued against both services with identical Line_Data, THE Localsearch_Service SHALL return the same set of document IDs in `hits.hits[]._source.id` as the Opensearch_Service, with the same `hits.total.value` count.
2. WHEN a query includes a `sort` array, THE Localsearch_Service SHALL return matching documents in the same order as the Opensearch_Service for the same data.
3. WHEN a query includes `highlight.fields`, THE Localsearch_Service SHALL produce `highlight` arrays on each hit with the same `<em>`-wrapped tokens in the same positions as the Opensearch_Service for the same data.
4. WHEN the same `complete(term, prefix)` call is issued against both services with identical dictionary data, THE Localsearch_Service SHALL return the same set of `_match` values as the Opensearch_Service, limited to 10 results.
5. THE equivalence criteria (1–4) SHALL hold for each query category produced by the search controller: single-term queries on each field (text, lemma_text, lemma_tag_text), boolean `must` (AND) combinations, boolean `should` (OR) combinations, group filtering via `filter.terms.group`, sorted and unsorted queries, and all pagination offsets within the result set.
