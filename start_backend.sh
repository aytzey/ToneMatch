#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_DIR="$ROOT_DIR/.runtime"
WORKER_DIR="$ROOT_DIR/services/ai-worker"
WORKER_PID_FILE="$RUNTIME_DIR/ai-worker.pid"
WORKER_LOG_FILE="$RUNTIME_DIR/ai-worker.log"
FUNCTIONS_ENV_FILE="$ROOT_DIR/supabase/functions/.env"
SUPABASE_START_LOG_FILE="$RUNTIME_DIR/supabase-start.log"

resolve_worker_port() {
  if [[ -n "${AI_WORKER_PORT:-}" ]]; then
    echo "$AI_WORKER_PORT"
    return 0
  fi

  if [[ -n "${AI_WORKER_URL:-}" ]] && command -v python3 >/dev/null 2>&1; then
    local parsed
    parsed="$(
      AI_WORKER_URL_VALUE="$AI_WORKER_URL" python3 - <<'PY'
import os
from urllib.parse import urlparse

raw_url = os.environ.get("AI_WORKER_URL_VALUE", "")
parsed = urlparse(raw_url)
host = (parsed.hostname or "").lower()

if host in {"127.0.0.1", "localhost"}:
    print(parsed.port or (443 if parsed.scheme == "https" else 80))
PY
    )"

    if [[ -n "$parsed" ]]; then
      echo "$parsed"
      return 0
    fi
  fi

  echo "8090"
}

WORKER_PORT="$(resolve_worker_port)"

mkdir -p "$RUNTIME_DIR"

load_root_env() {
  if [[ -f "$ROOT_DIR/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$ROOT_DIR/.env"
    set +a
  fi
}

resolve_supabase_cli() {
  if command -v supabase >/dev/null 2>&1; then
    echo "supabase"
    return 0
  fi

  if command -v npx >/dev/null 2>&1; then
    echo "npx --yes supabase@2.77.0"
    return 0
  fi

  echo ""
}

write_functions_env() {
  cat >"$FUNCTIONS_ENV_FILE" <<EOF
AI_WORKER_URL=${AI_WORKER_URL:-http://127.0.0.1:${WORKER_PORT}}
AI_WORKER_SHARED_SECRET=${AI_WORKER_SHARED_SECRET:-replace-me}
CATALOG_INGEST_SECRET=${CATALOG_INGEST_SECRET:-local-catalog-ingest-secret}
DEV_SINGLE_USER_EMAIL=${DEV_SINGLE_USER_EMAIL:-${EXPO_PUBLIC_DEV_SINGLE_USER_EMAIL:-tone-match-dev@example.com}}
EOF
}

start_supabase_stack() {
  local cli
  cli="$(resolve_supabase_cli)"

  if [[ -z "$cli" ]]; then
    echo "Supabase CLI or npx is required to start the local Supabase stack." >&2
    exit 1
  fi

  write_functions_env
  (
    cd "$ROOT_DIR"
    eval "$cli start -x studio,imgproxy,mailpit,logflare,vector,supavisor" >"$SUPABASE_START_LOG_FILE" 2>&1
  )
}

read_supabase_env() {
  local cli
  cli="$(resolve_supabase_cli)"
  if [[ -z "$cli" ]]; then
    return 1
  fi

  (
    cd "$ROOT_DIR"
    eval "$cli status -o env"
  )
}

stop_pid_if_running() {
  local pid_file="$1"

  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file")"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      for _ in {1..20}; do
        if ! kill -0 "$pid" 2>/dev/null; then
          break
        fi
        sleep 0.25
      done
    fi
    rm -f "$pid_file"
  fi
}

ensure_worker_venv() {
  if ! command -v python3 >/dev/null 2>&1; then
    echo "python3 is required to start the AI worker." >&2
    exit 1
  fi

  if [[ ! -d "$WORKER_DIR/.venv" ]]; then
    python3 -m venv "$WORKER_DIR/.venv"
  fi

  if [[ ! -x "$WORKER_DIR/.venv/bin/uvicorn" ]]; then
    "$WORKER_DIR/.venv/bin/pip" install -r "$WORKER_DIR/requirements.txt"
  fi
}

wait_for_worker() {
  for _ in {1..60}; do
    local response
    response="$(curl -fsS "http://127.0.0.1:${WORKER_PORT}/healthz" 2>/dev/null || true)"
    if [[ "$response" == *'"service":"tone-match-ai-worker"'* ]]; then
      return 0
    fi

    if [[ -f "$WORKER_PID_FILE" ]]; then
      local pid
      pid="$(cat "$WORKER_PID_FILE")"
      if [[ -n "$pid" ]] && ! kill -0 "$pid" 2>/dev/null; then
        break
      fi
    fi

    sleep 0.5
  done

  echo "AI worker failed to become healthy. Recent log output:" >&2
  tail -n 40 "$WORKER_LOG_FILE" >&2 || true
  exit 1
}

start_worker_process() {
  cd "$WORKER_DIR"
  if command -v setsid >/dev/null 2>&1; then
    PYTHONUNBUFFERED=1 setsid "$WORKER_DIR/.venv/bin/uvicorn" app.main:app --host 127.0.0.1 --port "$WORKER_PORT" \
      >"$WORKER_LOG_FILE" 2>&1 < /dev/null &
  else
    PYTHONUNBUFFERED=1 nohup "$WORKER_DIR/.venv/bin/uvicorn" app.main:app --host 127.0.0.1 --port "$WORKER_PORT" \
      >"$WORKER_LOG_FILE" 2>&1 < /dev/null &
  fi
  echo $! >"$WORKER_PID_FILE"
  cd "$ROOT_DIR"
}

load_root_env
start_supabase_stack
stop_pid_if_running "$WORKER_PID_FILE"
ensure_worker_venv
start_worker_process

wait_for_worker

SUPABASE_ENV_OUTPUT="$(read_supabase_env || true)"
SUPABASE_API_URL="$(
  printf '%s\n' "$SUPABASE_ENV_OUTPUT" | awk -F= '/^API_URL=/{gsub(/"/, "", $2); print $2}'
)"
SUPABASE_DB_URL="$(
  printf '%s\n' "$SUPABASE_ENV_OUTPUT" | awk -F= '/^DB_URL=/{gsub(/"/, "", $2); print $2}'
)"

if [[ -n "$SUPABASE_API_URL" ]]; then
  echo "Supabase running on $SUPABASE_API_URL"
fi
if [[ -n "$SUPABASE_DB_URL" ]]; then
  echo "Supabase DB: $SUPABASE_DB_URL"
fi
echo "AI worker running on http://127.0.0.1:${WORKER_PORT}"
echo "Log file: $WORKER_LOG_FILE"
echo "Supabase start log: $SUPABASE_START_LOG_FILE"
