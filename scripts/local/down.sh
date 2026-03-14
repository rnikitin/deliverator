#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "${ROOT_DIR}/scripts/lib/common.sh"

REMOVE_VOLUMES=false
for arg in "$@"; do
  case "${arg}" in
    --volumes) REMOVE_VOLUMES=true ;;
    --help|-h)
      echo "Usage: $0 [--volumes]"
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

DOWN_ARGS=(down --remove-orphans)
if [[ "${REMOVE_VOLUMES}" == "true" ]]; then
  DOWN_ARGS+=(--volumes)
fi

docker compose \
  --project-name "${PROJECT_NAME}" \
  "${ENV_ARGS[@]}" \
  -f "${ROOT_DIR}/docker-compose.dev.yml" \
  "${DOWN_ARGS[@]}" >/dev/null 2>&1 || true

docker compose \
  --project-name "${PROJECT_NAME}" \
  "${ENV_ARGS[@]}" \
  -f "${ROOT_DIR}/docker-compose.obs.yml" \
  "${DOWN_ARGS[@]}" >/dev/null 2>&1 || true

echo "Stopped DELIVERATOR stack for ${PROJECT_NAME}."
