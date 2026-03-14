#!/usr/bin/env bash
set -euo pipefail

cd /workspace

corepack enable >/dev/null 2>&1 || true
corepack prepare pnpm@10.10.0 --activate >/dev/null 2>&1 || true
pnpm config set store-dir /pnpm/store >/dev/null
pnpm install --no-frozen-lockfile

exec pnpm --filter @deliverator/server dev:container
