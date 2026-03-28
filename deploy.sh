#!/bin/sh
# deploy.sh — build, commit, push to main, and wait for GitHub Pages to go live
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Build the single-file distribution
sh build.sh

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

# Wait for GitHub Pages deployment
echo "Waiting for GitHub Pages to deploy..."
for i in $(seq 1 30); do
  STATUS=$(gh api repos/Seemone/amazeng/pages 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  if [ "$STATUS" = "built" ]; then
    echo "Live at https://seemone.github.io/amazeng/"
    # Switch back to original branch
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
