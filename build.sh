#!/bin/sh
# build.sh — produces amazeng.html with inlined CSS and JS
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

{
  while IFS= read -r line; do
    case "$line" in
      *'<link rel="stylesheet"'*)
        echo "<style>"
        cat style.css
        echo "</style>"
        ;;
      *'<script src="game.js"'*)
        echo "<script>"
        cat game.js
        echo "</script>"
        ;;
      *)
        printf '%s\n' "$line"
        ;;
    esac
  done < index.html
} > amazeng.html

SIZE=$(wc -c < amazeng.html | tr -d ' ')
echo "Built amazeng.html (${SIZE} bytes)"
