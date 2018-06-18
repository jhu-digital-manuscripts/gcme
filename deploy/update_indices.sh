#! /bin/sh

echo "** Delete existing indicies"

curl -X DELETE http://localhost:9200/line/
curl -X DELETE http://localhost:9200/dict/

sleep 5

echo -e "\n\n** Create indicies"

curl -X PUT -H 'Content-Type: application/json; charset=UTF-8' http://localhost:9200/line/ --data-binary @line_index.json
curl -X PUT -H 'Content-Type: application/json; charset=UTF-8' http://localhost:9200/dict/ --data-binary @dict_index.json

sleep 5
echo -e "\n\n** Indexing data"

curl -s -H "Content-Type: application/x-ndjson" -XPOST localhost:9200/line/_doc/_bulk --data-binary "@line.ndjson"

sleep 5

curl -s -H "Content-Type: application/x-ndjson" -XPOST localhost:9200/dict/_doc/_bulk --data-binary "@dict.ndjson"

