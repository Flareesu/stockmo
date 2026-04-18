#!/usr/bin/env bash
# Syncs StockMo-V2.html (source of truth you edit) → public/index.html (what Vercel serves).
# Run before committing anything you want deployed.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/StockMo-V2.html"
DST="$ROOT/public/index.html"

if [[ ! -f "$SRC" ]]; then
  echo "ERROR: $SRC not found" >&2
  exit 1
fi

cp "$SRC" "$DST"
echo "synced $(basename "$SRC") → public/$(basename "$DST") ($(wc -c < "$DST") bytes)"
