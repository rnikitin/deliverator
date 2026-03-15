#!/usr/bin/env bash
set -euo pipefail

cd /workspace

corepack enable >/dev/null 2>&1 || true
corepack prepare pnpm@10.10.0 --activate >/dev/null 2>&1 || true
pnpm config set store-dir /pnpm/store >/dev/null

# Remove stale tsx binary so the host-side readiness check in setup.sh
# waits for this fresh pnpm install to complete. Without this, a persistent
# Docker volume from a prior install would satisfy the check immediately,
# causing migrations to run before new dependencies are available.
rm -f /workspace/node_modules/.bin/tsx

pnpm install --no-frozen-lockfile

exec pnpm --filter @deliverator/server dev:container
