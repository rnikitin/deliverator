#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "${ROOT_DIR}/scripts/lib/common.sh"

load_ports_env

ENV_ARGS=()
if [[ -f "${ROOT_DIR}/.env" ]]; then
  ENV_ARGS+=(--env-file "${ROOT_DIR}/.env")
fi
ENV_ARGS+=(--env-file "${ROOT_DIR}/.deliverator/ports.env")

if [[ $# -gt 0 ]]; then
  exec docker compose \
    --project-name "${PROJECT_NAME}" \
    "${ENV_ARGS[@]}" \
    -f "${ROOT_DIR}/docker-compose.dev.yml" \
    -f "${ROOT_DIR}/docker-compose.obs.yml" \
    logs -f "$1"
fi

exec docker compose \
  --project-name "${PROJECT_NAME}" \
  "${ENV_ARGS[@]}" \
  -f "${ROOT_DIR}/docker-compose.dev.yml" \
  -f "${ROOT_DIR}/docker-compose.obs.yml" \
  logs -f
