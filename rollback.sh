#!/bin/bash
set -euo pipefail

TAG="${1:-}"

if [ -z "${TAG}" ]; then
  echo "Usage: $0 <tag>"
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree must be clean before rollback."
  exit 1
fi

echo "Fetching tags"
git fetch origin --tags
git rev-parse "refs/tags/${TAG}" >/dev/null

CURRENT_REF="$(git rev-parse --abbrev-ref HEAD)"
CURRENT_COMMIT="$(git rev-parse --short HEAD)"

echo "Switching to ${TAG} in detached HEAD mode"
git switch --detach "${TAG}"

echo "Rebuilding services from ${TAG}"
docker compose up -d --build

echo "Rollback complete"
echo "To return to ${CURRENT_REF} at ${CURRENT_COMMIT}:"
echo "  git switch ${CURRENT_REF}"
