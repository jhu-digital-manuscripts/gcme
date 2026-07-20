# Implementation Plan: Local Search Service

## Overview

Implement a browser-side `localsearch` Ember service that mirrors the `opensearch` service interface (`executeQuery` and `complete`) but executes all queries in-memory against inverted indexes built from static JSON data files. The implementation follows the module architecture defined in the design: Analyzers → DataLoader → IndexAssembler → QueryEngine → CompletionEngine → LocalsearchService, wired together and switchable via configuration.

## Tasks

- [x] 1. Implement analyzer pure functions
  - [x] 1.1 Create `app/utils/localsearch/analyzers.js` with `simpleAnalyzer`, `whitespaceIgnoreCaseAnalyzer`, and `keywordAnalyzer`
    - `simpleAnalyzer`: split on `/[^a-zA-Z]+/`, lowercase, discard empties
    - `whitespaceIgnoreCaseAnalyzer`: split on `/\s+/`, lowercase, ASCII-fold diacritics, discard empties
    - `keywordAnalyzer`: return `[input.toLowerCase()]` (single-element, no split)
    - All analyzers return `[]` for empty/whitespace-only input
    - Export as named functions
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 1.2 Write property tests for analyzers (Property 1: Simple Analyzer Token Invariants)
    - **Property 1: Simple Analyzer Token Invariants**
    - **Validates: Requirements 4.1, 4.5**
    - Create `tests/unit/services/localsearch/analyzers-test.js`
    - Use fast-check to generate arbitrary strings
    - Assert: all tokens lowercase, match `/^[a-z]+$/`, no letters lost from input, no non-letters retained

  - [ ]* 1.3 Write property tests for analyzers (Property 2: Whitespace Ignore Case Analyzer Token Invariants)
    - **Property 2: Whitespace Ignore Case Analyzer Token Invariants**
    - **Validates: Requirements 4.2, 4.5**
    - Assert: all tokens lowercase, token count equals whitespace-split segment count, diacritics folded to ASCII

- [x] 2. Implement the DataLoader module
  - [x] 2.1 Create `app/utils/localsearch/data-loader.js` with the `DataLoader` class
    - Implement lifecycle states: idle → loading → ready | failed
    - `ensureLoaded()` returns a Promise resolving to `{ lines, wordDict, lemmaDict, lemmaTagDict }`
    - Fetch all four JSON files (`line.json`, `word_dict.json`, `lemma_dict.json`, `lemma_tag_dict.json`) from public directory via same-origin `fetch()`
    - Queue concurrent callers behind a single in-flight promise
    - Implement 30-second timeout using `AbortController`
    - On failure: reject all queued promises, reset state to `idle` for retry on next call
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 12.1_

  - [ ]* 2.2 Write unit tests for data loading lifecycle
    - Create `tests/unit/services/localsearch/data-loader-test.js`
    - Test: single fetch per file, queued callers resolve together, timeout rejects all, retry after failure resets state
    - Use stub-fetch helper pattern from existing tests
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [x] 3. Implement the IndexAssembler module
  - [x] 3.1 Create `app/utils/localsearch/index-assembler.js`
    - `buildLineIndexes(lines)` → returns `{ textIndex, lemmaTextIndex, lemmaTagTextIndex }` (Map<string, number[]> each)
    - Index `text` field with `simpleAnalyzer`
    - Index `lemma_text` field with `whitespaceIgnoreCaseAnalyzer`
    - Index `lemma_tag_text` field with `whitespaceIgnoreCaseAnalyzer`
    - Store integer indices into the lines array (not object copies)
    - `buildCompletionIndexes(wordDict, lemmaDict, lemmaTagDict)` → returns `{ wordSuggest, lemmaSuggest, lemmaTagSuggest }` (sorted CompletionEntry[] arrays)
    - Each entry: `{ token: lowercasedFieldValue, docIndex: number }`
    - Sort each array lexicographically by `token`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 11.1_

- [x] 4. Checkpoint - Ensure analyzer and index modules work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement the QueryEngine module
  - [x] 5.1 Create `app/utils/localsearch/query-engine.js` with `execute(query, indexes, lines)` function
    - Parse the OpenSearch query DSL subset: `query.bool.must.bool.must` (AND) and `query.bool.must.bool.should` (OR)
    - For each term clause, analyze the value with the appropriate analyzer based on field name
    - Look up tokens in the corresponding inverted index to get matching line indices
    - Implement `bool.must` as intersection of posting lists
    - Implement `bool.should` as union of posting lists
    - Apply `filter.terms.group` — keep only lines whose `group` array overlaps the filter values
    - Apply `sort` — stable multi-key sort by `[id asc, number asc, raw_number asc]` when specified
    - Apply pagination — `from`/`size` with defaults `0`/`25`, validate ranges
    - Implement highlighting — wrap matched tokens in `<em>` tags using original token positions
    - Return result in OpenSearch response shape: `{ hits: { total: { value, relation: "eq" }, hits: [...] } }`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4_

  - [ ]* 5.2 Write property tests for query engine (Property 3: Term Query Correctness)
    - **Property 3: Term Query Correctness**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.6**
    - Create `tests/unit/services/localsearch/query-engine-test.js`
    - Generate random line datasets and term clauses with fast-check
    - Assert: result set is exactly the lines whose analyzed field contains the analyzed query term

  - [ ]* 5.3 Write property tests for query engine (Property 4: Bool Must is Intersection)
    - **Property 4: Bool Must is Intersection**
    - **Validates: Requirements 5.4, 5.8**
    - Assert: combined `must` result equals intersection of individual clause results

  - [ ]* 5.4 Write property tests for query engine (Property 5: Bool Should is Union)
    - **Property 5: Bool Should is Union**
    - **Validates: Requirements 5.5**
    - Assert: combined `should` result equals union of individual clause results

  - [ ]* 5.5 Write property tests for query engine (Property 6: Group Filter Narrows Results)
    - **Property 6: Group Filter Narrows Results**
    - **Validates: Requirements 6.1, 6.3, 6.4**
    - Assert: every result has group overlap with filter, total equals filtered count

  - [ ]* 5.6 Write property tests for query engine (Property 7: Sort Ordering Correctness)
    - **Property 7: Sort Ordering Correctness**
    - **Validates: Requirements 7.1, 7.2, 7.3**
    - Assert: consecutive results satisfy lexicographic id → numeric number → lexicographic raw_number ordering, stability preserved

  - [ ]* 5.7 Write property tests for query engine (Property 8: Pagination Slice Correctness)
    - **Property 8: Pagination Slice Correctness**
    - **Validates: Requirements 8.1, 8.2, 8.3**
    - Assert: returned hits equal full-result slice at `[from, from+size)`, total unchanged by pagination

  - [ ]* 5.8 Write property tests for query engine (Property 9: Highlighting Wraps Matched Tokens)
    - **Property 9: Highlighting Wraps Matched Tokens**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
    - Assert: highlight text contains `<em>` around all and only matched tokens, non-highlighted text unchanged

- [x] 6. Implement the CompletionEngine module
  - [x] 6.1 Create `app/utils/localsearch/completion-engine.js` with `complete(term, prefix, completionIndexes, dicts)` function
    - Use binary search on the sorted completion array to find the first entry whose `token` starts with `prefix.toLowerCase()`
    - Scan forward collecting up to 10 matches
    - Return array of objects: `{ ...sourceDoc, _match: fullFieldValue }`
    - Return `[]` for invalid term names, empty prefix
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [ ]* 6.2 Write property tests for completion (Property 10: Completion Returns Prefix-Matching Entries)
    - **Property 10: Completion Returns Prefix-Matching Entries**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.5, 10.6, 10.7**
    - Create `tests/unit/services/localsearch/completion-test.js`
    - Generate random dictionary data and prefixes with fast-check
    - Assert: every returned entry's suggest field starts with the lowercased prefix, no valid match is omitted from first 10

  - [ ]* 6.3 Write property tests for completion (Property 11: Completion Result Count Bound)
    - **Property 11: Completion Result Count Bound**
    - **Validates: Requirements 10.4**
    - Assert: result array length ≤ 10 for any input

- [x] 7. Checkpoint - Ensure all engine modules work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Create the localsearch Ember service
  - [x] 8.1 Create `app/services/localsearch.js` as an Ember Service
    - Import and compose DataLoader, IndexAssembler, QueryEngine, CompletionEngine
    - Implement `executeQuery(query)`: call `ensureLoaded()`, build indexes on first load, delegate to QueryEngine
    - Implement `complete(term, prefix)`: call `ensureLoaded()`, delegate to CompletionEngine
    - Cache built indexes after first construction (don't rebuild on each query)
    - Handle error propagation from DataLoader and QueryEngine
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.3, 11.1, 12.2_

  - [ ]* 8.2 Write unit tests for localsearch service lifecycle
    - Create `tests/unit/services/localsearch-test.js`
    - Test: service registered, executeQuery resolves after load, complete resolves, errors propagated, indexes cached
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 9. Add configuration support and controller switching
  - [x] 9.1 Update `config/environment.js` to add `ENV.gcme.searchBackend` property
    - Default to `'opensearch'` when not set (existing behavior preserved)
    - Accept `GCME_SEARCH_BACKEND` environment variable
    - _Requirements: 13.2, 13.3_

  - [x] 9.2 Update `app/controllers/search.js` to support backend switching
    - Add `@service localsearch` injection alongside existing `@service opensearch`
    - Add computed `searchService` getter that reads `ENV.gcme.searchBackend` and returns the appropriate service
    - Replace direct `this.opensearch` references in `runQuery`, `completeWord`, `completeLemma`, `completeTaggedLemma` with `this.searchService`
    - Add boot-time validation: throw if `searchBackend` is not `'opensearch'`, `'localsearch'`, or undefined
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [ ]* 9.3 Write integration tests for service switching
    - Create `tests/integration/services/configuration-test.js`
    - Test: default uses opensearch, `'localsearch'` delegates to localsearch service, invalid value throws at boot
    - _Requirements: 13.2, 13.3, 13.4, 13.5_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 11. Write round-trip equivalence tests (Property 12)
  - [ ]* 11.1 Write integration tests for round-trip equivalence
    - **Property 12: Round-Trip Equivalence with OpenSearch**
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5**
    - Create `tests/integration/services/search-backend-test.js`
    - Use a small captured fixture dataset (10–20 lines, 5–10 dict entries)
    - Run identical queries against both services (stubbed opensearch with known responses)
    - Assert: same document IDs, same order when sorted, same highlight tokens, same completion `_match` values
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All code is JavaScript (Ember 6.12 LTS, Octane idioms: native classes, @tracked, Glimmer components)
- Existing test infrastructure uses QUnit via ember-qunit; fast-check ^3.23.2 is already in devDependencies
- The stub-fetch helper pattern from `tests/helpers/stub-fetch.js` should be reused for DataLoader tests

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.1"] },
    { "id": 2, "tasks": ["2.2", "3.1"] },
    { "id": 3, "tasks": ["5.1", "6.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "5.8", "6.2", "6.3"] },
    { "id": 5, "tasks": ["8.1"] },
    { "id": 6, "tasks": ["8.2", "9.1"] },
    { "id": 7, "tasks": ["9.2"] },
    { "id": 8, "tasks": ["9.3", "11.1"] }
  ]
}
```
