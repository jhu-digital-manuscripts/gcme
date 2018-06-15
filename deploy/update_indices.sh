#! /bin/sh

echo "** Delete existing indicies"

curl -X DELETE http://localhost:9200/line/
curl -X DELETE http://localhost:9200/dict/

echo -e "\n\n** Create indicies"

curl -X PUT -H 'Content-Type: application/json; charset=UTF-8' http://localhost:9200/line/ --data-binary @line_index.json
curl -X PUT -H 'Content-Type: application/json; charset=UTF-8' http://localhost:9200/dict/ --data-binary @dict_index.json

echo -e "\n\n** Generating data"

cd ../gcme-tool && mvn clean package && java -jar target/*-shaded.jar ../data gen-index-data && mv dict.ndjson line.ndjson ../deploy

echo -e "\n\n** Index data"

sleep 2
curl -s -H "Content-Type: application/x-ndjson" -XPOST localhost:9200/line/_doc/_bulk --data-binary "@line.ndjson"

sleep 2
curl -s -H "Content-Type: application/x-ndjson" -XPOST localhost:9200/dict/_doc/_bulk --data-binary "@dict.ndjson"

