#!/usr/bin/env bash
# Funzioni comuni agli script. Si usa con: source "$(dirname "$0")/lib.sh"
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Un file di configurazione per ambiente: di serie config.env, oppure
#   CONFIG=config.dev.env ./01-aurora.sh
CONFIG_FILE="$HERE/${CONFIG:-config.env}"
if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "Manca $CONFIG_FILE: copia config.env.example e compilalo." >&2
  exit 1
fi
# shellcheck disable=SC1090
source "$CONFIG_FILE"

# I valori prodotti stanno in una cartella per ambiente (dal nome APP_NAME),
# cosi' dev e produzione non si sovrascrivono.
OUT="$HERE/.out/$APP_NAME"
mkdir -p "$OUT"

export AWS_REGION AWS_DEFAULT_REGION="$AWS_REGION"
export AWS_PAGER=""

command -v aws >/dev/null || { echo "AWS CLI non trovata." >&2; exit 1; }
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"

say() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }

# Salva/legge i valori prodotti dagli script (ARN, id) in .out/values.env
save() { # save NOME VALORE
  touch "$OUT/values.env"
  grep -v "^$1=" "$OUT/values.env" > "$OUT/values.env.tmp" || true
  echo "$1=$2" >> "$OUT/values.env.tmp"
  mv "$OUT/values.env.tmp" "$OUT/values.env"
}
load() { [[ -f "$OUT/values.env" ]] && source "$OUT/values.env" || true; }
