# Implementation Plan: Ember 6.12 LTS Upgrade for `gcme-ember`

## Overview

Convert the feature design into a series of prompts for a code-generation LLM that will implement each step with incremental progress. Each prompt builds on the previous prompts, and ends with wiring things together. There should be no hanging or orphaned code that isn't integrated into a previous step. Focus ONLY on tasks that involve writing, modifying, or testing code.

This plan follows the 13-phase migration order documented at the bottom of `design.md` ("Migration order"). Each phase keeps the app buildable at the boundary between phases. Phases 4, 6, 7, and 11 add property-based test sub-tasks (marked `*`) that map directly to the 12 properties in the "Correctness Properties" section of `design.md`. Each property is its own sub-task in its own test file so the property-based test runner can drive them individually.

The implementation language is JavaScript (Ember 6.12 LTS Octane idioms: native ES classes, `@tracked`, `@action`, Glimmer components, angle-bracket invocation). Property-based tests use `fast-check` ^3.x wrapped in QUnit `test()` blocks.

## Tasks

- [x] 1. Update `gcme-ember/package.json` and regenerate the lockfile
  - [x] 1.1 Update dependencies, devDependencies, engines, and npm scripts
    - Bump `ember-source` and `ember-cli` to `~6.12.0`
    - Bump `ember-cli-babel` to `^8.x`, `ember-cli-htmlbars` to `^6.x`, `ember-resolver` to `^13.x`, `ember-load-initializers` to `^3.x`, `ember-cli-app-version`, `ember-cli-dependency-checker`, `ember-cli-inject-live-reload`, `ember-cli-sri`, `ember-export-application-global` to current
    - Replace `ember-cli-uglify` with `ember-cli-terser`
    - Bump `ember-models-table` to `^4.x`, `ember-power-select` to `^8.x`
    - Add `ember-qunit@^9.x`, `qunit-dom@^3.x`, `@ember/test-helpers@^4.x`, `eslint@^9.x`, `eslint-plugin-ember@^12.x`, `fast-check@^3.x` under `devDependencies`
    - Remove `ember-ajax`, `ember-cli-eslint`, `ember-cli-qunit`, `ember-cli-shims`, `ember-welcome-page`, `ember-font-awesome`, `ember-data`, `ember-maybe-import-regenerator`, `ember-cli-htmlbars-inline-precompile`, `broccoli-asset-rev`, `loader.js`, `popper.js`, `jquery`, and the top-level `hoek`
    - Set `engines.node` to `">= 20.0.0 < 21.0.0"`
    - Add scripts: `"lint": "eslint . --max-warnings=0"`, `"build": "ember build --environment=production"`, `"test": "ember test"`, plus update `start` if needed
    - Run `npm install` on Node 20 to regenerate `package-lock.json` with no peer-dependency errors
    - _Requirements: 1.1, 1.2, 1.7, 2.1, 2.2, 2.3, 2.4, 3.3, 4.10, 5.1, 5.2, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.12, 9.6, 10.1, 10.3, 10.4_
    - _Design: "Addon-replacement decisions"; "Migration order" step 1_

- [x] 2. Update `gcme-ember/config/environment.js` for Octane and Bootstrap 5
  - [x] 2.1 Refresh environment configuration
    - Drop unused `EXTEND_PROTOTYPES` carryovers, keep `Date: false`
    - Use `locationType: 'history'` outside the `test` environment; keep `'none'` in `test`
    - Keep `ENV.gcme.elasticsearch = 'http://localhost:9200/_search'` default and `'/es'` override under `production`
    - Do not set or reference any alternate config key for the search endpoint
    - _Requirements: 3.6, 8.1, 8.2, 8.3_
    - _Design: "`config/environment.js`"; "Migration order" step 2_

- [x] 3. Update `gcme-ember/ember-cli-build.js` for Ember 6.12
  - [x] 3.1 Drop jQuery vendor imports and enable terser/auto-import
    - Remove any `app.import` referencing jQuery, Popper, or Bootstrap 4 JS
    - Enable `ember-cli-terser` in production
    - Configure `autoImport` so test-only `fast-check` resolves at build time
    - _Requirements: 3.5, 3.7, 5.15_
    - _Design: "`ember-cli-build.js`"; "Migration order" step 3_

- [x] 4. Replace `services/elasticsearch.js` with a fetch-based Octane service
  - [x] 4.1 Implement `ElasticsearchService` with fetch + AbortController
    - Native ES class extending `@ember/service` with `search_uri` getter reading `ENV.gcme.elasticsearch`
    - `executeQuery(query)` issues `POST` with `Content-Type: application/json; charset=utf-8`, JSON-stringified body, and a 30-second `AbortController` timeout
    - Reject with an `Error` whose message contains the HTTP status and statusText for non-2xx; reject on network error, abort, or `.json()` parse failure with the underlying cause
    - Reject synchronously without issuing a `fetch` when `search_uri` is missing, empty, or non-string
    - `complete(term, prefix)` builds the suggest query, returns `[]` when `suggest.term_suggest[0].options` is missing or empty, and otherwise maps each option to `{ ...option._source, _match: option.text }`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.7, 4.9, 4.10, 6.1, 8.4_
    - _Design: "`services/elasticsearch.js`"; "Migration order" step 4_

  - [x] 4.2 Add `tests/helpers/stub-fetch.js`
    - Export `stubFetchOnce({ status, statusText, body, parseFails, networkError })` that swaps `window.fetch` and returns a teardown that restores the original
    - Record the most recent call's `url`, `method`, `headers`, and `body` for assertion
    - Re-export a thin `setupStubbedFetch(hooks)` integration with QUnit `module` hooks
    - _Requirements: 9.4, 9.5_
    - _Design: "Unit tests for `Elasticsearch_Service`"; "Test layout"_

  - [x] 4.5 Write unit tests for `Elasticsearch_Service`
    - Cover happy path (POST URL, headers, body, resolved value), 5xx rejection, network rejection, JSON parse rejection, missing `search_uri` synchronous rejection, and the `field` value for each `complete` term (`word.suggest`, `lemma.suggest`, `lemma_tag.suggest`)
    - File: `tests/unit/services/elasticsearch-test.js`
    - _Requirements: 9.4, 9.5_

- [x] 5. Refactor routes to fetch + native classes
  - [x] 5.1 Refactor `app/routes/search.js`
    - Native class with `async model()` that uses `Promise.all` over a shared `fetchJson(url)` helper to load `/text-powersel.json` and `/group-title.json`
    - `fetchJson` aborts after 30 seconds and rejects with an `Error` whose message includes the URL and the failure cause
    - Drop the module-load `$.ajax` calls and the captured-promise pattern
    - _Requirements: 4.5, 4.8, 4.10, 6.1_
    - _Design: "`routes/search.js`"; "Migration order" step 5_

  - [x] 5.2 Refactor `app/routes/tags.js`
    - Native class with `async model()` returning `{ rows }` from `/tag-table.json` via the same `fetchJson` helper
    - `@action error(err)` sets `controller.loadError = err.message` and returns `false` so the route does not bubble to the application error substate
    - _Requirements: 4.6, 4.8, 4.10, 6.1, 7.19_
    - _Design: "`routes/tags.js`"_

  - [x] 5.3 Refactor `app/routes/index.js`
    - Native class whose `beforeModel` calls `this.replaceWith('search')`
    - _Requirements: 6.1, 7.2_
    - _Design: "`routes/index.js`"_

  - [x] 5.4 Convert `about`, `contact`, and `help` routes to native-class stubs
    - Replace classic `Route.extend({})` with `class extends Route {}` so the lint rule `ember/no-classic-classes` passes
    - _Requirements: 6.1_
    - _Design: "Other routes"_

- [x] 6. Checkpoint - service and route layer
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Refactor controllers to Ember Octane
  - [x] 7.1 Convert `app/controllers/search.js` to Octane
    - Native class with `@service elasticsearch`, `@tracked` fields for `words`, `lemmas`, `tagged_lemmas`, `restrict`, `requireAllWords`, `sortLogical`, `pageNumber`, `pageCount`, `result`, `searchError`, and a `_pageSize` backing field with a setter that clamps to `[1, 100]` and falls back to `25` for `null`/`undefined`/`NaN`
    - Native getters for `hasResults`, `hasNoMatches`, `isFirstPage`, `isLastPage`, `pageFirstMatchNumber`, `pageLastMatchNumber`, `resultColumns` (replace every `computed(...)`)
    - Pure `buildQuery()` method matching the schema in `design.md` "Data Models / Elasticsearch query shape"
    - `@action submitSearch`, `nextPage`, `prevPage`, `clearQuery`, `completeWord`, `completeLemma`, `completeTaggedLemma`, `selectOnSpace`
    - `runQuery()` sets `searchError` on no-terms and on rejection, preserves `result`, `pageNumber`, and selection state on rejection
    - Boundary actions early-return without calling the service
    - Drop `Bootstrap4Theme.create()` (handled in template via the default Bootstrap 5 theme)
    - _Requirements: 4.10, 6.1, 6.2, 6.5, 6.7, 6.8, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 7.12, 7.13, 7.14, 7.17, 7.18_
    - _Design: "`controllers/search.js`"; "Migration order" step 6_

  - [x] 7.2 Convert `app/controllers/tags.js` to Octane
    - Native class with `@tracked loadError = null`, native getters for `columns` and `groupProperties`
    - Drop `Bootstrap4Theme.create()`; rely on `ember-models-table` 4.x default Bootstrap 5 theme
    - _Requirements: 5.13, 6.1, 6.2, 6.7, 7.15, 7.19_
    - _Design: "`controllers/tags.js`"_

- [x] 8. Convert components to Glimmer
  - [x] 8.1 Convert `selected-item-{word,lemma,tagged-lemma}` to template-only Glimmer
    - Delete the three classic component `.js` files
    - Each `.hbs` template emits `<span>{{@option.<field>}}</span>` (`word`, `lemma`, `lemma_tag` respectively, where the controller's `complete` payload uses `_match`)
    - _Requirements: 6.3, 6.4_
    - _Design: "`components/selected-item-word.{hbs,js}`"_

  - [x] 8.2 Convert `result-{location,text-line,lemma-line}-cell` to template-only Glimmer
    - Delete the three classic component `.js` files
    - Templates use `@record` and `@column` (the args `ember-models-table` 4.x passes); `result-location-cell.hbs` renders `groupTitleMap[group[0]]` and the most-specific group title separated by `-`; `result-text-line-cell.hbs` and `result-lemma-line-cell.hbs` use the `highlight` helper when `@record.highlight.*` is present, falling back to `@record._source.*`
    - _Requirements: 5.13, 6.3, 6.4, 7.16_
    - _Design: "`components/result-location-cell.{hbs,js}` ..."_

  - [ ]* 8.3 Write integration property test for `ResultLocationCell`
    - **Property 12: location cell renders top and most-specific group titles**
    - **Validates: Requirements 7.16**
    - File: `tests/integration/components/result-location-cell-property-12-test.js`
    - `setupRenderingTest`; `fast-check` arbitraries for `_source.group` length 2..4 and a synthesized `groupTitleMap`; assert rendered text contains `groupTitleMap[group[0]]` and `groupTitleMap[group.at(-1)]` separated by `-`
    - Bound at 50 iterations because rendering is slower than pure-JS assertions

- [x] 9. Migrate templates to Octane idiom
  - [x] 9.1 Migrate `app/templates/application.hbs`
    - Replace `{{#link-to ...}}` block forms with `<LinkTo @route="..." class="...">...</LinkTo>`
    - Update Bootstrap 4 → 5 attributes: `mr-auto` → `me-auto`, `data-toggle` → `data-bs-toggle`, `data-target` → `data-bs-target`
    - Add `alt=""` to the logo `<img>`
    - _Requirements: 6.4, 6.6, 7.1_
    - _Design: "Application template"_

  - [x] 9.2 Migrate `app/templates/search.hbs`
    - Replace `{{#power-select-multiple ...}}` blocks with `<PowerSelectMultiple ...>` per `ember-power-select` 8.x, including `@selectedItemComponent={{component "selected-item-..."}}`
    - Replace every `{{action ...}}` modifier with `{{on "<event>" this.<handler>}}` and bind to `@action` methods
    - Replace `{{input ...}}` with `<Input @type="checkbox" ...>` for the two toggles
    - Replace `{{models-table ...}}` with `<ModelsTable @data=... @columns=... @pageSize=... ... />`
    - Add `{{#if this.searchError}}<div class="alert alert-warning">{{this.searchError}}</div>{{/if}}` above the form
    - Add the `{{else}}<h3 class="text-center">No matches</h3>{{/if}}` branch under `{{#if this.result.hits.total}}`
    - Pagination: `<button type="button" disabled={{this.isFirstPage}} {{on "click" this.prevPage}}>` and the symmetric Next button; `Clear` becomes `type="button"`
    - Replace deprecated `.form-group` wrappers with `mb-3` spacing utilities
    - _Requirements: 5.13, 6.4, 6.5, 6.6, 7.3, 7.4, 7.5, 7.6, 7.10, 7.11, 7.12, 7.13, 7.14, 7.16, 7.17, 7.18_
    - _Design: "Search template"_

  - [x] 9.3 Migrate `app/templates/tags.hbs`
    - Replace `{{models-table ...}}` with `<ModelsTable ...>` using the configured columns and grouping
    - Render `{{#if this.loadError}}<div class="alert alert-warning">{{this.loadError}}</div>{{else}}...{{/if}}`
    - _Requirements: 5.13, 6.4, 7.15, 7.19_
    - _Design: "Tags template"_

  - [ ]* 9.4 Write rendering test for top-navigation links
    - File: `tests/rendering/application-nav-test.js`
    - `setupApplicationTest`; `await visit('/search')`; assert each label of `["About", "Search", "Tags", "How To Guide", "Contact"]` exists as a `<LinkTo>` rendering with non-empty `href`
    - _Requirements: 7.1, 9.3_

- [x] 10. Replace `app/index.html` with Bootstrap 5 / no-jQuery markup
  - [x] 10.1 Update `app/index.html`
    - Drop the `<script>` tags loading `jquery.slim.min.js` and `popper.min.js`
    - Replace Bootstrap 4 CDN links with Bootstrap 5.3.x CSS link and `bootstrap.bundle.min.js` (which bundles Popper)
    - Pin SRI integrity hashes from the official jsDelivr CDN
    - _Requirements: 3.4, 3.7_
    - _Design: "`index.html`"; "Migration order" step 9_

- [x] 11. Checkpoint - Octane refactor and Bootstrap 5 swap
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Configure ESLint flat config for Ember Octane
  - [x] 12.1 Add `gcme-ember/eslint.config.js`
    - ESLint 9.x flat config using `eslint-plugin-ember` 12.x recommended ruleset
    - Enable at error level: `ember/no-classic-classes`, `ember/no-classic-components`, `ember/no-jquery`, `ember/no-action-modifier`, `ember/no-link-to`, `ember/no-computed-properties-in-native-classes`
    - Cover `app/`, `tests/`, `config/`, root `.js` files
    - Confirm `npm run lint` (already wired in 1.1 with `--max-warnings=0`) exits non-zero on warnings and zero on a clean codebase
    - _Requirements: 5.2, 5.3, 6.9, 10.1, 10.2_
    - _Design: "ESLint configuration decision"; "Migration order" step 10_

- [x] 13. Add CI workflow and update Travis fallback
  - [x] 13.1 Add `.github/workflows/ci.yml`
    - `actions/setup-node@v4` with `node-version: '20.x'`, npm cache keyed on `gcme-ember/package-lock.json`
    - Steps in order: `npm ci`, `npm run lint`, `npm test`, `npm run build` from `gcme-ember/`
    - Add a post-build grep step that fails if `dist/` contains `jQuery v` or `jQuery.fn.jquery`
    - Preserve the Java/Maven `gcme-tool` job
    - Mark CI failed and skip subsequent steps on any non-zero exit
    - _Requirements: 2.5, 3.7, 10.5, 10.6_
    - _Design: "CI configuration"_

  - [x] 13.2 Update `.travis.yml`
    - Set `NODE_VERSION=20` (or matrix entry pinned to a Node 20.x LTS patch release)
    - Replace `npm install && ember test` with `npm ci`, `npm run lint`, `npm test`, `npm run build` from `gcme-ember/`
    - _Requirements: 2.5, 10.5, 10.6_
    - _Design: "CI configuration"_

- [x] 14. Update project documentation
  - [x] 14.1 Create `gcme-ember/README.md`
    - Document the Node 20 requirement (`>= 20.0.0 < 21.0.0`)
    - Document `npm install`, `npm run lint`, `npm test`, `npm run build`, and `ember serve` commands
    - _Requirements: 2.6, 10.7_
    - _Design: "Documentation"_

  - [x] 14.2 Update root `README.md`
    - Replace the Node 10 / `ember build` deployment instructions with Node 20 and the new npm scripts from 14.1
    - _Requirements: 2.6, 10.8_
    - _Design: "Documentation"_

- [x] 15. Final checkpoint - full migration green
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Sub-tasks marked `*` are optional test tasks: property tests (one per correctness property in `design.md`), unit tests, integration tests, rendering tests, and acceptance tests. Each can be skipped for a faster MVP, but they are how Requirements 4, 7, and 9 stay verifiable.
- Each property test sub-task names its `Property N` and `Validates: Requirements ...` so the property-based test runner can drive `fast-check` against the right correctness property.
- Property tests for `ElasticsearchService` (Properties 1, 2) sit under task 4 next to the service implementation; properties for `SearchController` (Properties 3..11) sit under task 7 next to the controller; property 12 (`ResultLocationCell`) sits under task 8 next to the cell component. This keeps property tests close to the implementation that breaks them when something regresses.
- Each property test lives in its own file (e.g. `tests/unit/properties/search-property-N-test.js`) so the dependency graph can run them in parallel within one wave.
- The non-property tests (service unit tests, rendering test for the navigation, root-redirect and tags-load-error acceptance tests) sit under the implementation tasks they validate.
- Checkpoints (tasks 6, 11, 15) gate the migration at points where the build is intended to be green again. They are not part of the dependency graph.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4.2"] },
    { "id": 2, "tasks": ["4.1", "5.1", "5.2", "5.3", "5.4"] },
    { "id": 3, "tasks": ["4.3", "4.4", "4.5"] },
    { "id": 4, "tasks": ["7.1", "7.2"] },
    { "id": 5, "tasks": ["8.1", "8.2"] },
    { "id": 6, "tasks": ["7.3", "7.4", "7.5", "7.6", "7.7", "7.8", "7.9", "7.10", "7.11", "8.3"] },
    { "id": 7, "tasks": ["9.1", "9.2", "9.3"] },
    { "id": 8, "tasks": ["10.1", "9.4", "5.5", "5.6", "12.1"] },
    { "id": 9, "tasks": ["13.1", "13.2", "14.1", "14.2"] }
  ]
}
```
