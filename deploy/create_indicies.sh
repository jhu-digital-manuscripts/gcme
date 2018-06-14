#! /bin/sh

curl -X PUT -H 'Content-Type: application/json; charset=UTF-8' http://localhost:9200/line/ --data-binary @line_index.json
curl -X PUT -H 'Content-Type: application/json; charset=UTF-8' http://localhost:9200/dict/ --data-binary @dict_index.json

