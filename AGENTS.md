# AGENTS.md

Guidance for AI agents working on the Glossarial Concordance to Middle English (GCME).
Read `README.md` for the domain model and `gcme-ember/README.md` for UI details.

## What this is

A static-first search UI over a tagged corpus of Middle English (Chaucer, Gower). Two parts:

| Directory    | What it is                                                                     |
| ------------ | ------------------------------------------------------------------------------ |
| `data/`      | Raw corpus: `.cat` text files, `.lem` dictionaries, `abbr2*` structure files.   |
| `gcme-tool/` | Java 25 / Maven CLI that transforms `data/` into JSON + NDJSON. Picocli + Jackson. |
| `gcme-ember/`| Ember 6.12 LTS (Octane) SPA that consumes the generated JSON.                   |
| `deploy/`    | `gen_data.sh` (regenerate data), `update_indices.sh` (load OpenSearch), index mappings. |

Data flows one way: `data/` → `gcme-tool gen-data` → `gcme-ember/public/*.json` (UI) and
`deploy/*.ndjson` (OpenSearch bulk ingest). Both come from the same run and describe the same
documents.

## Toolchain — exact versions required

- **Node 20.x only.** `engines.node` is `>= 20.0.0 < 21.0.0`; `npm install` fails with
  `EBADENGINE` on anything else.
- **Java 25** and **Maven 3.9+**.

## Commands

```sh
# Java tool: build + test (tests read the corpus, so run from gcme-tool or set GCME_DATA)
cd gcme-tool && mvn clean package     # -> target/gcme-tool.jar
cd gcme-tool && mvn -B verify

# Regenerate the generated data (needed before the UI can search anything)
cd deploy && ./gen_data.sh

# Ember UI
cd gcme-ember && npm ci
cd gcme-ember && npm run lint         # eslint --max-warnings=0; warnings fail
cd gcme-ember && npm test             # ember test (QUnit)
cd gcme-ember && npm run build        # production dist/ + dist/404.html
cd gcme-ember && npx ember serve      # http://localhost:4200
```

CI (`.github/workflows/ci.yml`) runs exactly: `mvn -B verify` with `GCME_DATA=../data`, and
`npm ci && npm run lint && npm test && npm run build`. Match that before claiming a change is done.

## Gotchas

- **The generated data files are not in git.** `gcme-ember/public/*.json` and `deploy/*.ndjson`
  are gitignored. A fresh clone has no data; the default `localsearch` backend cannot answer a
  single search until `deploy/gen_data.sh` has been run. Never commit them.
- **`gen-data` output must stay deterministic.** Regenerating unchanged data must produce
  byte-identical files. Don't introduce timestamps, hash-order iteration, or parallel writes into
  the generator.
- **Search backends are chosen at build time**, not runtime. `GCME_SEARCH_BACKEND`
  (`localsearch` default, or `opensearch`), `GCME_OPENSEARCH`, and `GCME_ROOT_URL` are read by
  `config/environment.js` and baked into `dist/`. Switching means rebuilding.
- **Both backends must stay interchangeable.** `app/services/localsearch.js` and
  `app/services/opensearch.js` implement the same two-method API (`executeQuery`, `complete`) and
  the search controller picks one. A change to query semantics in one needs the matching change in
  the other, or the two deployments diverge.
- **OpenSearch mappings live in `deploy/*_index.json`** and must agree with the documents
  `gcme-tool` emits (`gcme/gen/*Document.java`). Changing a field means changing both.
- **Version lives in two places** — `gcme-tool/pom.xml` and `gcme-ember/package.json` — and is
  bumped by the release workflow, not by hand.
- `deploy/update_indices.sh` **deletes and recreates** the indices.

## Conventions

- Ember Octane only: native classes, `@tracked`, Glimmer components, angle-bracket invocation,
  native `fetch` (via `app/utils/fetch-json.js`). No jQuery, no ember-data, no classic
  `.extend()`.
- Local search internals are split into focused modules under `app/utils/localsearch/`
  (`analyzers`, `data-loader`, `index-assembler`, `query-engine`, `completion-engine`); keep new
  logic in the right one rather than growing the service.
- Java code is plain Java 25 with records for the document/model types; no framework beyond
  Picocli and Jackson.
- Tests: QUnit under `gcme-ember/tests/{unit,integration}` (fetch stubbed via
  `tests/helpers/stub-fetch.js`, property-based tests use `fast-check`); JUnit 5 under
  `gcme-tool/src/test/java` with a synthetic corpus in `src/test/resources/corpus`.
- Commit messages are a single imperative sentence, no prefix or scope.

## Terminology

For `may{*mouen@v3%pr_1*}`: **word** `may`, **lemma**/headword `mouen`, **tagged lemma**
`mouen@v3%pr_1`, **tag** `v3%pr_1`. Use these names consistently in code and UI text.
