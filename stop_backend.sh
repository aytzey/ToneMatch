#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_DIR="$ROOT_DIR/.runtime"
WORKER_PID_FILE="$RUNTIME_DIR/ai-worker.pid"

stop_pid_if_running() {
  local pid_file="$1"
  local label="$2"

  if [[ ! -f "$pid_file" ]]; then
    echo "$label not running."
    return 0
  fi

  local pid
  pid="$(cat "$pid_file")"

  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    for _ in {1..40}; do
      if ! kill -0 "$pid" 2>/dev/null; then
        break
      fi
      sleep 0.25
    done
  fi

  rm -f "$pid_file"
  echo "$label stopped."
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

stop_pid_if_running "$WORKER_PID_FILE" "AI worker"

SUPABASE_CLI="$(resolve_supabase_cli)"
if [[ -n "$SUPABASE_CLI" ]]; then
  (
    cd "$ROOT_DIR"
    eval "$SUPABASE_CLI stop" >/dev/null 2>&1 || true
  )
  echo "Supabase local stack stopped."
else
  echo "Supabase CLI not found. Local Supabase stop skipped."
fi
