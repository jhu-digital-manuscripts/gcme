#! /bin/sh


curl -s -H "Content-Type: application/x-ndjson" -XPOST localhost:9200/line/_doc/_bulk --data-binary "@line.ndjson"
