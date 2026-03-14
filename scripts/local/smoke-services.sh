#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "${ROOT_DIR}/scripts/lib/common.sh"

load_ports_env

echo "Checking app routes..."
curl -fsS "http://127.0.0.1:${APP_PORT}/healthz" >/dev/null
curl -fsS "http://127.0.0.1:${APP_PORT}/readyz" >/dev/null
curl -fsS "http://127.0.0.1:${APP_PORT}/api/config/compiled" >/dev/null
curl -fsS "http://127.0.0.1:${APP_PORT}/api/metrics" >/dev/null
curl -fsS "http://127.0.0.1:${APP_PORT}/" >/dev/null
curl -fsS "http://127.0.0.1:${APP_PORT}/tasks/task-foundation" >/dev/null

echo "Checking SSE..."
SSE_OUTPUT="$(mktemp)"
trap 'rm -f "${SSE_OUTPUT}"' EXIT
curl -NfsS --max-time 5 "http://127.0.0.1:${APP_PORT}/api/events/stream" >"${SSE_OUTPUT}" 2>/dev/null || true
grep -Eq '^(event|data):' "${SSE_OUTPUT}"

echo "Checking observability services..."
wait_for_http "http://127.0.0.1:${GRAFANA_PORT}/api/health" 60 1
wait_for_http "http://127.0.0.1:${PROMETHEUS_PORT}/-/healthy" 60 1
wait_for_http "http://127.0.0.1:${LOKI_PORT}/ready" 60 1
wait_for_http "http://127.0.0.1:${TEMPO_PORT}/ready" 60 1

echo "DELIVERATOR smoke checks passed."
