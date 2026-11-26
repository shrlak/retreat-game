#!/usr/bin/env bash
# Copy the working folder into the repo clone; if anything changed, write STATUS.md, commit and push.
set -euo pipefail
SRC=/mnt/project-files/avalon-game
REPO=/home/claude/retreat-game
MSG=${1:-"Sync progress"}
find "$REPO" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
tar -C "$SRC" --exclude=node_modules --exclude=.task-notes -cf - . | tar -C "$REPO" -xf -
cd "$REPO"
# push only when something in any folder actually changed
git add -A
if git diff --cached --quiet -- . ':(exclude)STATUS.md'; then git reset -q; git checkout -q -- STATUS.md 2>/dev/null || true; echo "$(date -u +%H:%M) nothing changed"; exit 0; fi
{
  echo "# Status snapshot"
  echo
  echo "Auto-generated on every push by sync.sh ($(date -u '+%Y-%m-%d %H:%M UTC')). The written handoff is HANDOFF.md."
  echo
  echo "### Engine tests"
  echo '```'
  (cd "$SRC" && timeout 40 node --test tests/engine.rules.test.mjs tests/expansions.test.mjs 2>&1 | grep -E "^# (pass|fail)|^not ok" | head -20) || echo "tests did not run"
  echo '```'
  echo "### Helper folders (files, newest change)"
  for d in ui assets guide tests web server; do
    n=$(find "$SRC/$d" -type f 2>/dev/null | grep -v __pycache__ | wc -l)
    t=$(find "$SRC/$d" -type f -printf '%TY-%Tm-%Td %TH:%TM\n' 2>/dev/null | sort | tail -1)
    echo "- \`$d/\`: $n files, newest $t UTC"
  done
  echo "### Recent commits"
  echo '```'
  git log --oneline -8 2>/dev/null || true
  echo '```'
  echo "### Files"
  echo '```'
  find . -path ./.git -prune -o -type f -print | grep -v __pycache__ | sort | sed 's|^\./||' | head -250
  echo '```'
} > STATUS.md
git add -A
git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -q -m "$MSG

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin HEAD:main 2>&1 | tail -1
git push -f origin HEAD:gh-pages 2>&1 | tail -1
