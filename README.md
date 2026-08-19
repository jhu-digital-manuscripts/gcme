# Introduction

This project refashions a website which allowed tagged Middle English text to be searched. See https://middleenglish.library.jhu.edu/about for more information.

# Terminology

Consider `may{*mouen@v3%pr_1*}`

* Word: `may`
* Lemma or headword: `mouen` 
* Tagged lemma: `mouen@v3%pr_1`
* Tag: `v3%pr_1`

# Data

The underlying data is lines of text oragnized in a heirarchy of groups.
The toplevel groups correspond to works by Chaucer and Gower. The bottom groups
are something like a chapter in a book. Each group has a short identifier and a title.
The file abbr2title.lut in a strange fashion specifies this structure together with the ids and titles.

Ordered lines of text are stores in the texts directory as .cat files.
A line has each of the original words associated with a tagged lemma.
Each .cat file is part of 2-4 groups. The mapping from groups to .cat files is specified in abbr2file.txt.

# Java tool

The command line tool in gcme-tool transforms the raw data into static files for the Ember UI
and bulk ingest documents for OpenSearch. It requires Java 25 and is built with Maven.

Build the executable jar with `mvn clean package` from gcme-tool. The result is `target/gcme-tool.jar`.

```
Usage: gcme-tool [-hV] COMMAND
Commands:
  info      Print the hierarchy of texts with their identifiers and titles.
  gen-data  Generate the OpenSearch bulk ingest requests and the static Ember UI data.
```

Both commands take the data directory as their argument, defaulting to `$GCME_DATA` if it is set.
To see the structure of the texts printed out, try

```
java -jar target/gcme-tool.jar info ../data
```

To write the generated files to a directory of your choosing, run

```
java -jar target/gcme-tool.jar gen-data ../data --output /tmp/gcme-data
```

For each search index `gen-data` writes two files with the same documents: `<index>.ndjson` is a
bulk ingest request for OpenSearch and `<index>.json` is an array which the Ember UI loads when it
searches locally instead of using OpenSearch. It also writes the static `text-powersel.json`,
`tag-table.json`, and `group-title.json` used by the UI. The output is deterministic, so
regenerating unchanged data produces identical files.

# Opensearch indices

## line

The line index allows lines of text to be searched for by word or by tagged lemma.
The text field contains the raw words of the line and uses the simple analyzer
which ignores case and handles punctuation. The lemma_text and lemma_tag_text field contain
the lemmas and tagged lemmas respectively for the words of the line. They both use a custom
anaylyzer which ignores case and tokenizes based on whitespace. The id is the identifier
assigned to the line. The raw_number is the number assigned to the line.
It is either an integer or an integer followed by some letters. The number field
is the integer extracted from raw_number. The group is an array of 2-4 identifiers
for all of the groups containing the line in order from toplevel to parent.
For example a line in the Knight's tale would have group `["Ch", "CT", "Frag1", "KnT"]`.


| Field          | Type    | Cardinality |
| -------------- | ------- | ----------- |
| id             | keyword | 1   | 
| number         | integer | 1   |
| raw_number     | keyword | 1   |
| group          | keyword | 2-4 |
| text           | text    | 1   |
| lemma_text     | whitespace_ignore_case | 1   |
| lemma_tag_text | whitespace_ignore_case | 1   |

## word_dict

The word_dict index allows the definitions for a word to be looked up. A word may have
multiple tagged lemmas, each with a definition. Completion can be done on the
word by using the .suggest subfield. The words have been normalized to lower case.

| Field             | Type       | Cardinality |
| ----------------- | ---------- | ----------- |
| word              | keyword    | 1           |
| word.suggest      | completion | 1           |
| lemma_tag         | keyword    | 1*          |
| definition        | text       | 1*          |


## lemma_dict

The lemma_dict index allows the definitions for a lemma to be looked up.
A lemma is associated with its word forms, tagged lemmas, and dictionary definitions.
Completion can be done on the lemma by using the .suggest subfield.

| Field             | Type       | Cardinality |
| ----------------- | ---------- | ----------- |
| word              | keyword    | 1*          |
| lemma             | keyword    | 1           |
| lemma.suggest     | completion | 1           |
| lemma_tag         | keyword    | 1*          |
| definition        | text       | 1*          |

## lemma_tag_dict

The lemma_dict index allows a definition for a tagged lemma to be looked up.
The tagged lemma is associated with its word forms as well as a dictionary definition.
Completion can be done on the tagged lemma by using the suggest subfield.

| Field             | Type       | Cardinality |
| ----------------- | ---------- | ----------- |
| word              | keyword    | 1*          |
| lemma_tag         | keyword    | 1           |
| lemma_tag.suggest | completion | 1           |
| definition        | text       | 1           |


# Ember UI

The ember UI uses static files generated by the Java tool. It can answer searches in two ways,
chosen at build time with `GCME_SEARCH_BACKEND`:

* `localsearch`, the default, loads the generated `line.json` and dictionary files into the browser
  and searches them there. No OpenSearch instance is needed.
* `opensearch` sends queries to the OpenSearch endpoint given by `GCME_OPENSEARCH`.

See [gcme-ember](gcme-ember) for details on both backends.

# Running locally

With the default localsearch backend, only the UI is needed:

* Build and run `gcme-ember`.
* Visit http://localhost:4200.

To run against OpenSearch instead:

* Start Opensearch with `docker-compose up -d`.
* From the deploy directory, run `./update_indices.sh` to index the required data.
* Build and run `gcme-ember` with `GCME_SEARCH_BACKEND=opensearch`.
* Visit http://localhost:4200.

# Build

## gcme-tool

Install Java 25 or later and Maven 3.9 or later.

Build the command line tool and run its tests with

```
mvn clean package
```

The tests read the corpus from `$GCME_DATA`, falling back on the `data` directory of the repository,
so run Maven from gcme-tool or set the variable. The build produces the executable
`target/gcme-tool.jar`.

## gcme-ember

See [gcme-ember](gcme-ember) for instructions on how to build the user inteface.

# Deployment

## Generating the data

Both deployment options use the same generated data. From the deploy directory run
`./gen_data.sh`. It builds gcme-tool, writes the `*.ndjson` bulk ingest requests to the deploy
directory, and writes the `*.json` files the UI loads to `gcme-ember/public`.

## Deploying with localsearch

This is the default and needs no server side search. The browser downloads the generated data files
and searches them locally.

* Build gcme-ember with `npm run build`.
* Copy `gcme-ember/dist/*` to a static web server.

The data files are fetched by absolute path, so the application must be served from the root of the
host rather than a subdirectory.

## Deploying with opensearch

This keeps the corpus on the server and requires OpenSearch 2.

* Load the indices by running `./update_indices.sh` from the deploy directory. It deletes, creates,
  and then populates the line and dict indices.
* Build gcme-ember with `GCME_SEARCH_BACKEND=opensearch` and `GCME_OPENSEARCH` set to the OpenSearch
  `_search` endpoint the browser should use, conventionally the proxied path `/es`.
* Copy `gcme-ember/dist/*` to a web server which proxies that path to OpenSearch.

Both variables are read at build time and baked into `dist/`, so switching backends means
rebuilding.
