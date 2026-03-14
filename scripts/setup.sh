#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "${ROOT_DIR}/scripts/lib/common.sh"

NO_START=false
WATCH=false

for arg in "$@"; do
  case "$arg" in
    --no-start) NO_START=true ;;
    --watch) WATCH=true ;;
    --help|-h)
      echo "Usage: $0 [--no-start] [--watch]"
      exit 0
      ;;
  esac
done

echo "=== DELIVERATOR local setup ==="

if [[ ! -f "${ROOT_DIR}/.env" ]]; then
  cp "${ROOT_DIR}/.env.example" "${ROOT_DIR}/.env"
  echo "Created ${ROOT_DIR}/.env from .env.example"
else
  echo "Using existing ${ROOT_DIR}/.env"
fi

"${ROOT_DIR}/scripts/obs/up.sh" --ports-only >/dev/null
load_ports_env

mkdir -p \
  "${ROOT_DIR}/.deliverator/data" \
  "${ROOT_DIR}/.deliverator/worktrees" \
  "${ROOT_DIR}/.deliverator/logs"

echo "Using worktree id: ${WORKTREE_ID}"
echo "App port: ${APP_PORT}"

if [[ "${NO_START}" == "true" ]]; then
  echo "Setup complete. Start with:"
  echo "  make dev"
  echo "  make dev-start"
  exit 0
fi

"${ROOT_DIR}/scripts/obs/up.sh"

"${ROOT_DIR}/scripts/local/up.sh" --detach

ENV_ARGS=()
if [[ -f "${ROOT_DIR}/.env" ]]; then
  ENV_ARGS+=(--env-file "${ROOT_DIR}/.env")
fi
ENV_ARGS+=(--env-file "${ROOT_DIR}/.deliverator/ports.env")

for _ in $(seq 1 30); do
  if docker compose --project-name "${PROJECT_NAME}" "${ENV_ARGS[@]}" -f "${ROOT_DIR}/docker-compose.dev.yml" exec -T server true >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

docker compose \
  --project-name "${PROJECT_NAME}" \
  "${ENV_ARGS[@]}" \
  -f "${ROOT_DIR}/docker-compose.dev.yml" \
  exec -T server pnpm --filter @deliverator/server db:migrate

docker compose \
  --project-name "${PROJECT_NAME}" \
  "${ENV_ARGS[@]}" \
  -f "${ROOT_DIR}/docker-compose.dev.yml" \
  exec -T server pnpm --filter @deliverator/server db:seed

wait_for_http "http://127.0.0.1:${APP_PORT}/healthz" 90 2

echo "DELIVERATOR dev stack is healthy at http://127.0.0.1:${APP_PORT}/healthz"

if [[ "${WATCH}" == "true" ]]; then
  exec "${ROOT_DIR}/scripts/local/up.sh" --watch-only
fi

echo "Run 'make logs' to tail the stack."
