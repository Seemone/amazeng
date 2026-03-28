#!/bin/sh
# deploy.sh — build, commit, push to main, and wait for GitHub Pages to go live
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Ensure clean source references before anything
sed -i.bak 's|href="style.css?v=[0-9]*"|href="style.css"|' index.html
sed -i.bak 's|src="game.js?v=[0-9]*"|src="game.js"|' index.html
rm -f index.html.bak

# Build the single-file distribution (from clean sources)
sh build.sh

# Add cache-busting query strings to CSS and JS references for deployed version
STAMP=$(date +%s)
sed -i.bak "s|href=\"style.css\"|href=\"style.css?v=$STAMP\"|" index.html
sed -i.bak "s|src=\"game.js\"|src=\"game.js?v=$STAMP\"|" index.html
rm -f index.html.bak

# Ensure we're on a branch that can push to main
BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$BRANCH" != "main" ]; then
  echo "Committing on $BRANCH, then merging to main..."
  git add -A
  git diff --cached --quiet && { echo "No changes to deploy."; exit 0; }
  git commit -m "Update game"
  git push origin "$BRANCH"
  git checkout main
  git merge "$BRANCH" --no-edit
else
  git add -A
  git diff --cached --quiet && { echo "No changes to deploy."; exit 0; }
  git commit -m "Update game"
fi

git push origin main

# Restore clean references in working copy
sed -i.bak "s|href=\"style.css?v=$STAMP\"|href=\"style.css\"|" index.html
sed -i.bak "s|src=\"game.js?v=$STAMP\"|src=\"game.js\"|" index.html
rm -f index.html.bak

# Wait for GitHub Pages deployment
echo "Waiting for GitHub Pages to deploy..."
for i in $(seq 1 30); do
  STATUS=$(gh api repos/Seemone/amazeng/pages 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  if [ "$STATUS" = "built" ]; then
    echo "Live at https://seemone.github.io/amazeng/"
    if [ "$BRANCH" != "main" ]; then
      git checkout "$BRANCH"
    fi
    exit 0
  fi
  printf "."
  sleep 5
done

echo ""
echo "Timed out waiting for deploy. Check https://github.com/Seemone/amazeng/actions"
if [ "$BRANCH" != "main" ]; then
  git checkout "$BRANCH"
fi
exit 1
