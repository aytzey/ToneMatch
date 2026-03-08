#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_DIR="$ROOT_DIR/.runtime"

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

stop_pid_if_running "$RUNTIME_DIR/expo-native.pid" "Expo native dev server"
stop_pid_if_running "$RUNTIME_DIR/expo-web.pid" "Expo web server"
