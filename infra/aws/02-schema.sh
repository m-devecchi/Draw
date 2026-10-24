#!/usr/bin/env bash
# Crea le tabelle (db/schema.sql) tramite la Data API. Si puo' rieseguire.
# La prima chiamata sveglia il database dalla pausa: puo' volerci mezzo minuto.
source "$(dirname "$0")/lib.sh"
load
: "${DB_CLUSTER_ARN:?esegui prima 01-aurora.sh}"

say "Applico db/schema.sql"
cd "$HERE/../.."
DB_CLUSTER_ARN="$DB_CLUSTER_ARN" DB_SECRET_ARN="$DB_SECRET_ARN" DB_NAME="$DB_NAME" \
DB_REGION="$DB_REGION" node --experimental-strip-types --no-warnings infra/aws/apply-schema.mjs
