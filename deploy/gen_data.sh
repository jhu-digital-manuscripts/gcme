#! /bin/sh

echo -e "\n\n** Generating data"

export GCME_DATA=`pwd`/../data
cd ../gcme-tool && mvn clean package && java -jar target/gcme-tool-*.jar ../data gen-data && cd -

mv ../gcme-tool/*.ndjson .
mv ../gcme-tool/*.json ../gcme-ember/public/

