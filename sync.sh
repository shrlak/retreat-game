#!/usr/bin/env bash
# Copy the working folder into the repo clone, refresh HANDOFF snapshot, commit and push.
set -euo pipefail
SRC=/mnt/project-files/avalon-game
REPO=/home/claude/retreat-game
MSG=${1:-"Sync progress"}
find "$REPO" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
tar -C "$SRC" --exclude=node_modules --exclude=.task-notes -cf - . | tar -C "$REPO" -xf -
cd "$REPO"
{
  echo
  echo "## Snapshot ($(date -u '+%Y-%m-%d %H:%M UTC'))"
  echo '```'
  find . -path ./.git -prune -o -type f -print | sort | sed 's|^\./||' | head -200
  echo '```'
} >> HANDOFF.md
git add -A
if git diff --cached --quiet; then echo "nothing to commit"; exit 0; fi
git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -q -m "$MSG

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin HEAD:main 2>&1 | tail -2
