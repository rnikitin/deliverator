#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PORTS_FILE="${ROOT_DIR}/.deliverator/ports.env"

PORTS_ONLY=false
FORCE=false

for arg in "$@"; do
  case "${arg}" in
    --ports-only) PORTS_ONLY=true ;;
    --force) FORCE=true ;;
    --help|-h)
      echo "Usage: $0 [--ports-only] [--force]"
      exit 0
      ;;
  esac
done

mkdir -p \
  "${ROOT_DIR}/.deliverator/data" \
  "${ROOT_DIR}/.deliverator/worktrees" \
  "${ROOT_DIR}/.deliverator/logs" \
  "${ROOT_DIR}/.deliverator/observability/grafana-data" \
  "${ROOT_DIR}/.deliverator/observability/loki-data" \
  "${ROOT_DIR}/.deliverator/observability/prometheus-data" \
  "${ROOT_DIR}/.deliverator/observability/tempo-data"

sanitize_id() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9-' | sed 's/--*/-/g; s/^-//; s/-$//'
}

port_is_free() {
  node -e '
    const net = require("node:net");
    const port = Number(process.argv[1]);
    const server = net.createServer();
    server.once("error", () => process.exit(1));
    server.once("listening", () => server.close(() => process.exit(0)));
    server.listen(port, "127.0.0.1");
  ' "$1"
}

ports_file_complete() {
  [[ -f "${PORTS_FILE}" ]] || return 1
  grep -q '^WORKTREE_ID=' "${PORTS_FILE}" || return 1
  grep -q '^PROJECT_NAME=' "${PORTS_FILE}" || return 1
  grep -q '^APP_PORT=' "${PORTS_FILE}" || return 1
  grep -q '^GRAFANA_PORT=' "${PORTS_FILE}" || return 1
  grep -q '^PROMETHEUS_PORT=' "${PORTS_FILE}" || return 1
  grep -q '^LOKI_PORT=' "${PORTS_FILE}" || return 1
  grep -q '^TEMPO_PORT=' "${PORTS_FILE}" || return 1
  grep -q '^OTLP_HTTP_PORT=' "${PORTS_FILE}" || return 1
}

ensure_ports_file() {
  if [[ "${FORCE}" == "false" ]] && ports_file_complete; then
    return
  fi

  local root_realpath
  root_realpath="$(cd "${ROOT_DIR}" && pwd -P)"
  local raw_slug
  raw_slug="$(basename "${root_realpath}")"
  local slug
  slug="$(sanitize_id "${raw_slug}")"
  slug="${slug:-deliverator}"

  local hash_value
  hash_value="$(printf '%s' "${root_realpath}" | cksum | awk '{print $1}')"
  local hash_hex
  hash_hex="$(printf '%08x' "${hash_value}")"
  local short_id
  short_id="$(printf '%s' "${hash_hex}" | cut -c1-6)"

  local worktree_id
  worktree_id="${slug}-${hash_hex}"
  local project_name
  project_name="deliverator-${short_id}"

  local base_offset
  base_offset=$((hash_value % 200))
  local offset=""

  for attempt in $(seq 0 199); do
    local candidate_offset
    candidate_offset=$(((base_offset + attempt) % 200))

    local app_port=$((3000 + candidate_offset))
    local grafana_port=$((3400 + candidate_offset))
    local prometheus_port=$((9090 + candidate_offset))
    local loki_port=$((3100 + candidate_offset))
    local tempo_port=$((3200 + candidate_offset))
    local otlp_http_port=$((4318 + candidate_offset))

    local all_free=true
    for port in "${app_port}" "${grafana_port}" "${prometheus_port}" "${loki_port}" "${tempo_port}" "${otlp_http_port}"; do
      if ! port_is_free "${port}"; then
        all_free=false
        break
      fi
    done

    if [[ "${all_free}" == "true" ]]; then
      offset="${candidate_offset}"
      cat > "${PORTS_FILE}" <<EOF
WORKTREE_ID=${worktree_id}
PROJECT_NAME=${project_name}
OFFSET=${offset}
APP_PORT=${app_port}
GRAFANA_PORT=${grafana_port}
PROMETHEUS_PORT=${prometheus_port}
LOKI_PORT=${loki_port}
TEMPO_PORT=${tempo_port}
OTLP_HTTP_PORT=${otlp_http_port}
OTEL_EXPORTER_OTLP_ENDPOINT=http://host.docker.internal:${otlp_http_port}
VITE_DELIVERATOR_OTLP_ENDPOINT=http://127.0.0.1:${otlp_http_port}
EOF
      return
    fi
  done

  echo "ERROR: Unable to find a free port set for the DELIVERATOR stack." >&2
  exit 1
}

ensure_ports_file

if [[ "${PORTS_ONLY}" == "true" ]]; then
  echo "Generated ${PORTS_FILE}"
  exit 0
fi

ENV_ARGS=()
if [[ -f "${ROOT_DIR}/.env" ]]; then
  ENV_ARGS+=(--env-file "${ROOT_DIR}/.env")
fi
ENV_ARGS+=(--env-file "${PORTS_FILE}")

# shellcheck disable=SC1090
source "${PORTS_FILE}"

docker compose \
  --project-name "${PROJECT_NAME}" \
  "${ENV_ARGS[@]}" \
  -f "${ROOT_DIR}/docker-compose.obs.yml" \
  up -d --remove-orphans --force-recreate

cat <<EOF
Observability stack started for ${PROJECT_NAME}
Grafana:    http://127.0.0.1:${GRAFANA_PORT}
Prometheus: http://127.0.0.1:${PROMETHEUS_PORT}
Loki:       http://127.0.0.1:${LOKI_PORT}
Tempo:      http://127.0.0.1:${TEMPO_PORT}
OTLP HTTP:  http://127.0.0.1:${OTLP_HTTP_PORT}
EOF
