#! /bin/sh
#
# Generate the data the application is deployed with.
#
# The OpenSearch bulk ingest requests (*.ndjson) are written to this directory and the static data
# of the Ember UI (*.json) to gcme-ember/public.

set -e

DEPLOY_DIR=$(pwd)
DATA_DIR="$DEPLOY_DIR/../data"
TOOL_DIR="$DEPLOY_DIR/../gcme-tool"
PUBLIC_DIR="$DEPLOY_DIR/../gcme-ember/public"
OUT_DIR=$(mktemp -d)

trap 'rm -rf "$OUT_DIR"' EXIT

printf '\n\n** Building gcme-tool\n'

(cd "$TOOL_DIR" && mvn -B clean package -DskipTests)

printf '\n\n** Generating data\n'

java -jar "$TOOL_DIR/target/gcme-tool.jar" gen-data "$DATA_DIR" --output "$OUT_DIR"

mv "$OUT_DIR"/*.ndjson "$DEPLOY_DIR/"
mv "$OUT_DIR"/*.json "$PUBLIC_DIR/"

printf '\n\n** Wrote ndjson files to %s and json files to %s\n' "$DEPLOY_DIR" "$PUBLIC_DIR"
