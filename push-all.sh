#!/bin/bash
# Push changes to both frontend and backend GitHub repos

set -e

if [ -z "$GITHUB_ACCESS_TOKEN" ]; then
  echo "Error: GITHUB_ACCESS_TOKEN is not set"
  exit 1
fi

FRONTEND_REMOTE="https://aloksingh9667:${GITHUB_ACCESS_TOKEN}@github.com/aloksingh9667/pearlis-frontend.git"
BACKEND_REMOTE="https://aloksingh9667:${GITHUB_ACCESS_TOKEN}@github.com/aloksingh9667/pearlis-backend.git"

# ── Frontend ──────────────────────────────────────────────────────────────
echo ""
echo "Pushing frontend (pearlis-frontend)..."
git push "$FRONTEND_REMOTE" main
echo "Frontend pushed successfully."

# ── Backend ───────────────────────────────────────────────────────────────
echo ""
echo "Pushing backend (pearlis-backend)..."
cd /home/runner/workspace/backend
git push "$BACKEND_REMOTE" main
echo "Backend pushed successfully."

echo ""
echo "Both repos updated on GitHub."
