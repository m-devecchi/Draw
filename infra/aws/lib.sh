#!/usr/bin/env bash
# Funzioni comuni agli script. Si usa con: source "$(dirname "$0")/lib.sh"
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="$HERE/.out"
mkdir -p "$OUT"

if [[ ! -f "$HERE/config.env" ]]; then
  echo "Manca infra/aws/config.env: copia config.env.example e compilalo." >&2
  exit 1
fi
# shellcheck disable=SC1091
source "$HERE/config.env"

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
