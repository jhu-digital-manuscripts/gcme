# Introduction

# Terminology

Consider `may{*mouen@v3%pr_1*}`

* Word: `may`
* Lemma: `mouen` 
* Tagged lemma: `mouen@v3%pr_1`
* Pos lemma: 'mouen@v3'

# Data

# Elasticsearch indices


## line

The line index allows lines of text to be searched for by word or by tagged lemma.
The tagged lemma field has a custom normalizer wh

| Field          | Type    | Cardinality |
| -------------- | ------- | ----------- |
| id             | keyword | 1           | 
| number         | integer | 1           |
| raw_number     | integer | 1           |
| group          | keyword | 0*          |
| text           | text    | 1           |
| tag_lemma_text | text    | 1           |


## dict

The dict index allows a definition for a tagged lemma to be looked up.
In addition completion can be done on the tagged lemma as well as its
word forms.

| Field             | Type       | Cardinality |
| ----------------- | ---------- | ----------- |
| word              | keyword    | 1*          |
| word.suggest      | completion | 1*          | 
| tag_lemma         | keyword    | 1           |
| tag_lemma.suggest | keyword    | 1           |
| definition        | text       | 1           |


# Ember UI

User inputs set of lemmas or words.

For each entry, lookup tagged lemmas.

User edits sets of tagged lemmas.

User sets restrictions.

User sets sort options.

User performs search.





