#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "${ROOT_DIR}/scripts/lib/common.sh"

load_ports_env

echo "Checking app health..."
curl -fsS "http://127.0.0.1:${APP_PORT}/healthz" >/dev/null
curl -fsS "http://127.0.0.1:${APP_PORT}/readyz" >/dev/null
curl -fsS "http://127.0.0.1:${APP_PORT}/api/config/compiled" >/dev/null
curl -fsS "http://127.0.0.1:${APP_PORT}/api/metrics" >/dev/null

echo "Checking observability services..."
curl -fsS "http://127.0.0.1:${GRAFANA_PORT}/api/health" >/dev/null
curl -fsS "http://127.0.0.1:${PROMETHEUS_PORT}/-/healthy" >/dev/null
curl -fsS "http://127.0.0.1:${LOKI_PORT}/ready" >/dev/null
curl -fsS "http://127.0.0.1:${TEMPO_PORT}/ready" >/dev/null

echo "DELIVERATOR smoke checks passed."
