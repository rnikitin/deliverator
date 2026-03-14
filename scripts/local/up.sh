#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "${ROOT_DIR}/scripts/lib/common.sh"

WATCH_ONLY=false
DETACH=false

for arg in "$@"; do
  case "${arg}" in
    --watch-only) WATCH_ONLY=true ;;
    --detach) DETACH=true ;;
    --help|-h)
      echo "Usage: $0 [--detach] [--watch-only]"
      exit 0
      ;;
  esac
done

load_ports_env

ENV_ARGS=()
if [[ -f "${ROOT_DIR}/.env" ]]; then
  ENV_ARGS+=(--env-file "${ROOT_DIR}/.env")
fi
ENV_ARGS+=(--env-file "${ROOT_DIR}/.deliverator/ports.env")

if [[ "${WATCH_ONLY}" == "true" ]]; then
  exec docker compose \
    --project-name "${PROJECT_NAME}" \
    "${ENV_ARGS[@]}" \
    -f "${ROOT_DIR}/docker-compose.dev.yml" \
    up --watch server
fi

if [[ "${DETACH}" == "true" ]]; then
  docker compose \
    --project-name "${PROJECT_NAME}" \
    "${ENV_ARGS[@]}" \
    -f "${ROOT_DIR}/docker-compose.dev.yml" \
    up -d --build server
  exit 0
fi

exec docker compose \
  --project-name "${PROJECT_NAME}" \
  "${ENV_ARGS[@]}" \
  -f "${ROOT_DIR}/docker-compose.dev.yml" \
  up --build server
