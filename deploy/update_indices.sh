#! /bin/sh

echo "** Delete existing indicies"

curl -X DELETE http://localhost:9200/line/
curl -X DELETE http://localhost:9200/word_dict/
curl -X DELETE http://localhost:9200/lemma_dict/
curl -X DELETE http://localhost:9200/lemma_tag_dict/

sleep 5

echo -e "\n\n** Create indicies"

curl -X PUT -H 'Content-Type: application/json; charset=UTF-8' http://localhost:9200/line/ --data-binary @line_index.json
curl -X PUT -H 'Content-Type: application/json; charset=UTF-8' http://localhost:9200/word_dict/ --data-binary @word_dict_index.json
curl -X PUT -H 'Content-Type: application/json; charset=UTF-8' http://localhost:9200/lemma_dict/ --data-binary @lemma_dict_index.json
curl -X PUT -H 'Content-Type: application/json; charset=UTF-8' http://localhost:9200/lemma_tag_dict/ --data-binary @lemma_tag_dict_index.json

sleep 5
echo -e "\n\n** Indexing data"

curl -s -H "Content-Type: application/x-ndjson" -XPOST localhost:9200/line/_doc/_bulk --data-binary "@line.ndjson"

sleep 5

curl -s -H "Content-Type: application/x-ndjson" -XPOST localhost:9200/word_dict/_doc/_bulk --data-binary "@word_dict.ndjson"

sleep 5

curl -s -H "Content-Type: application/x-ndjson" -XPOST localhost:9200/lemma_dict/_doc/_bulk --data-binary "@lemma_dict.ndjson"

sleep 5

curl -s -H "Content-Type: application/x-ndjson" -XPOST localhost:9200/lemma_tag_dict/_doc/_bulk --data-binary "@lemma_tag_dict.ndjson"



