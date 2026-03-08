#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_DIR="$ROOT_DIR/.runtime"
MOBILE_DIR="$ROOT_DIR/apps/mobile"
MODE="${1:-go}"

NATIVE_PID_FILE="$RUNTIME_DIR/expo-native.pid"
NATIVE_LOG_FILE="$RUNTIME_DIR/expo-native.log"
WEB_PID_FILE="$RUNTIME_DIR/expo-web.pid"
WEB_LOG_FILE="$RUNTIME_DIR/expo-web.log"

mkdir -p "$RUNTIME_DIR"

load_root_env() {
  if [[ -f "$ROOT_DIR/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$ROOT_DIR/.env"
    set +a
  fi
}

stop_pid_if_running() {
  local pid_file="$1"

  if [[ -f "$pid_file" ]]; then
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
  fi
}

ensure_node_modules() {
  if [[ ! -x "$ROOT_DIR/node_modules/.bin/expo" ]]; then
    (cd "$ROOT_DIR" && npm install)
  fi
}

resolve_free_port() {
  local start_port="$1"
  local end_port="$2"

  START_PORT="$start_port" END_PORT="$end_port" python3 - <<'PY'
import os
import socket

start = int(os.environ["START_PORT"])
end = int(os.environ["END_PORT"])

for port in range(start, end + 1):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        if sock.connect_ex(("127.0.0.1", port)) != 0:
            print(port)
            break
PY
}

resolve_lan_ip() {
  python3 - <<'PY'
import socket

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
try:
    sock.connect(("8.8.8.8", 80))
    print(sock.getsockname()[0])
except OSError:
    print("127.0.0.1")
finally:
    sock.close()
PY
}

rewrite_local_url_to_lan() {
  local raw_url="$1"
  local lan_ip="$2"

  RAW_URL="$raw_url" LAN_IP="$lan_ip" python3 - <<'PY'
import os
from urllib.parse import urlparse, urlunparse

raw_url = os.environ["RAW_URL"]
lan_ip = os.environ["LAN_IP"]

if not raw_url:
    print("")
    raise SystemExit

parsed = urlparse(raw_url)
host = (parsed.hostname or "").lower()

if host not in {"127.0.0.1", "localhost"}:
    print(raw_url)
    raise SystemExit

netloc = lan_ip
if parsed.port:
    netloc = f"{lan_ip}:{parsed.port}"

print(urlunparse((parsed.scheme, netloc, parsed.path, parsed.params, parsed.query, parsed.fragment)))
PY
}

read_expo_scheme() {
  python3 - <<'PY'
import json
from pathlib import Path

app_json = Path("apps/mobile/app.json")
payload = json.loads(app_json.read_text())
print(payload.get("expo", {}).get("scheme", "tonematch"))
PY
}

wait_for_http() {
  local port="$1"
  local pid_file="$2"
  local log_file="$3"
  local label="$4"

  for _ in {1..120}; do
    if curl -fsS "http://127.0.0.1:${port}" >/dev/null 2>&1; then
      return 0
    fi

    if [[ -f "$pid_file" ]]; then
      local pid
      pid="$(cat "$pid_file")"
      if [[ -n "$pid" ]] && ! kill -0 "$pid" 2>/dev/null; then
        break
      fi
    fi

    sleep 1
  done

  echo "${label} failed to become reachable. Recent log output:" >&2
  tail -n 80 "$log_file" >&2 || true
  exit 1
}

print_qr_if_possible() {
  local url="$1"

  if command -v npx >/dev/null 2>&1; then
    echo
    npx --yes qrcode-terminal "$url" || true
    echo
  fi
}

start_native() {
  local port
  local lan_ip
  local scheme
  local dev_client_url
  local native_supabase_url

  port="${EXPO_NATIVE_PORT:-$(resolve_free_port 8081 8090)}"
  lan_ip="$(resolve_lan_ip)"
  scheme="$(read_expo_scheme)"
  dev_client_url="${EXPO_DEV_CLIENT_URL:-exp+${scheme}://expo-development-client/?url=http%3A%2F%2F${lan_ip}%3A${port}}"
  native_supabase_url="$(rewrite_local_url_to_lan "${EXPO_PUBLIC_SUPABASE_URL:-}" "$lan_ip")"

  stop_pid_if_running "$NATIVE_PID_FILE"
  stop_pid_if_running "$WEB_PID_FILE"

  cd "$MOBILE_DIR"
  if command -v setsid >/dev/null 2>&1; then
    EXPO_NO_TELEMETRY=1 BROWSER=none EXPO_PUBLIC_SUPABASE_URL="$native_supabase_url" setsid "$ROOT_DIR/node_modules/.bin/expo" start --dev-client --host lan --port "$port" \
      >"$NATIVE_LOG_FILE" 2>&1 < /dev/null &
  else
    EXPO_NO_TELEMETRY=1 BROWSER=none EXPO_PUBLIC_SUPABASE_URL="$native_supabase_url" nohup "$ROOT_DIR/node_modules/.bin/expo" start --dev-client --host lan --port "$port" \
      >"$NATIVE_LOG_FILE" 2>&1 < /dev/null &
  fi
  echo $! >"$NATIVE_PID_FILE"
  cd "$ROOT_DIR"

  wait_for_http "$port" "$NATIVE_PID_FILE" "$NATIVE_LOG_FILE" "Expo native dev server"

  echo "Expo native dev server running on http://127.0.0.1:${port}"
  echo "LAN URL: http://${lan_ip}:${port}"
  echo "Native Supabase URL: ${native_supabase_url}"
  echo "Dev Client QR URL: ${dev_client_url}"
  echo "Log file: $NATIVE_LOG_FILE"
  if [[ -f "$ROOT_DIR/.env" ]]; then
    echo "Loaded environment from $ROOT_DIR/.env"
  else
    echo "No root .env found. App will open with preview-mode-friendly config."
  fi
  echo "Use a development build on the device. Expo Go is not reliable here because the app includes native modules."
  echo "If the phone camera says 'kullanilabilir veri bulunamadi', scan this QR from inside the installed development build / Expo dev client launcher."
  print_qr_if_possible "$dev_client_url"
}

start_go() {
  local port
  local lan_ip
  local expo_go_url
  local native_supabase_url

  port="${EXPO_NATIVE_PORT:-$(resolve_free_port 8081 8090)}"
  lan_ip="$(resolve_lan_ip)"
  expo_go_url="${EXPO_GO_URL:-exp://${lan_ip}:${port}}"
  native_supabase_url="$(rewrite_local_url_to_lan "${EXPO_PUBLIC_SUPABASE_URL:-}" "$lan_ip")"

  stop_pid_if_running "$NATIVE_PID_FILE"
  stop_pid_if_running "$WEB_PID_FILE"

  cd "$MOBILE_DIR"
  if command -v setsid >/dev/null 2>&1; then
    EXPO_NO_TELEMETRY=1 BROWSER=none EXPO_PUBLIC_SUPABASE_URL="$native_supabase_url" setsid "$ROOT_DIR/node_modules/.bin/expo" start --host lan --port "$port" \
      >"$NATIVE_LOG_FILE" 2>&1 < /dev/null &
  else
    EXPO_NO_TELEMETRY=1 BROWSER=none EXPO_PUBLIC_SUPABASE_URL="$native_supabase_url" nohup "$ROOT_DIR/node_modules/.bin/expo" start --host lan --port "$port" \
      >"$NATIVE_LOG_FILE" 2>&1 < /dev/null &
  fi
  echo $! >"$NATIVE_PID_FILE"
  cd "$ROOT_DIR"

  wait_for_http "$port" "$NATIVE_PID_FILE" "$NATIVE_LOG_FILE" "Expo Go dev server"

  echo "Expo Go dev server running on http://127.0.0.1:${port}"
  echo "LAN URL: http://${lan_ip}:${port}"
  echo "Native Supabase URL: ${native_supabase_url}"
  echo "Expo Go QR URL: ${expo_go_url}"
  echo "Log file: $NATIVE_LOG_FILE"
  if [[ -f "$ROOT_DIR/.env" ]]; then
    echo "Loaded environment from $ROOT_DIR/.env"
  else
    echo "No root .env found. App will open with preview-mode-friendly config."
  fi
  echo "Billing is disabled for Expo Go compatibility in this build."
  echo "Open Expo Go on the iPhone and scan this QR from inside Expo Go if the camera app does not recognize it."
  print_qr_if_possible "$expo_go_url"
}

start_web() {
  local port

  port="${EXPO_WEB_PORT:-$(resolve_free_port 19006 19016)}"

  stop_pid_if_running "$WEB_PID_FILE"

  cd "$MOBILE_DIR"
  if command -v setsid >/dev/null 2>&1; then
    EXPO_NO_TELEMETRY=1 BROWSER=none setsid "$ROOT_DIR/node_modules/.bin/expo" start --web --host localhost --port "$port" \
      >"$WEB_LOG_FILE" 2>&1 < /dev/null &
  else
    EXPO_NO_TELEMETRY=1 BROWSER=none nohup "$ROOT_DIR/node_modules/.bin/expo" start --web --host localhost --port "$port" \
      >"$WEB_LOG_FILE" 2>&1 < /dev/null &
  fi
  echo $! >"$WEB_PID_FILE"
  cd "$ROOT_DIR"

  wait_for_http "$port" "$WEB_PID_FILE" "$WEB_LOG_FILE" "Expo web server"

  echo "Expo web running on http://127.0.0.1:${port}"
  echo "Log file: $WEB_LOG_FILE"
  if [[ -f "$ROOT_DIR/.env" ]]; then
    echo "Loaded environment from $ROOT_DIR/.env"
  else
    echo "No root .env found. App will open with preview-mode-friendly config."
  fi
}

load_root_env
ensure_node_modules

case "$MODE" in
  go)
    start_go
    ;;
  native)
    start_native
    ;;
  web)
    start_web
    ;;
  *)
    echo "Unknown mode: $MODE" >&2
    echo "Usage: ./start_expo.sh [go|native|web]" >&2
    exit 1
    ;;
esac
