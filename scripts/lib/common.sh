#!/usr/bin/env bash
set -euo pipefail

deliverator_root() {
  cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd
}

ports_file_path() {
  printf '%s/.deliverator/ports.env\n' "$(deliverator_root)"
}

load_ports_env() {
  local ports_file
  ports_file="$(ports_file_path)"

  if [[ ! -f "${ports_file}" ]]; then
    echo "ERROR: Missing ${ports_file}. Run ./scripts/obs/up.sh --ports-only first." >&2
    exit 1
  fi

  # shellcheck disable=SC1090
  source "${ports_file}"
}

compose_env_args() {
  local root
  root="$(deliverator_root)"
  if [[ -f "${root}/.env" ]]; then
    printf -- '--env-file %s/.env ' "${root}"
  fi
  printf -- '--env-file %s/.deliverator/ports.env ' "${root}"
}

wait_for_http() {
  local url="$1"
  local attempts="${2:-60}"
  local delay="${3:-2}"

  for _ in $(seq 1 "${attempts}"); do
    if curl -fsS "${url}" >/dev/null 2>&1; then
      return 0
    fi
    sleep "${delay}"
  done

  echo "ERROR: Timed out waiting for ${url}" >&2
  return 1
}
