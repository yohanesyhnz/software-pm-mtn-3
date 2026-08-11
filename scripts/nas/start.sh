#!/bin/sh
set -eu

APP_ROOT="${PREDICTACORE_ROOT:-/volume1/homes/YAO/predictacore}"
CURRENT="$APP_ROOT/current"
RUN_DIR="$APP_ROOT/run"
LOG_DIR="$APP_ROOT/logs"
NODE_BIN="${NODE_BIN:-/var/packages/Node.js_v20/target/usr/local/bin/node}"
SMART_ASSISTANT_ENV="$APP_ROOT/shared/config/smart-assistant.env"
POSTGRES_ENV="$APP_ROOT/shared/config/postgres.env"
PREDICTACORE_PBKDF2_ITERATIONS="${PREDICTACORE_PBKDF2_ITERATIONS:-30000}"
DEFAULT_NAS_YAO_PASSWORD_HASH='pbkdf2-sha256$30000$NZZGhio+8Jv3S6ONeq3TUQ==$7CK3DylQxJFcLsxfyO9zLadpVRXgMql4jI6xQDqaccA='
PREDICTACORE_YAO_PASSWORD_HASH="${PREDICTACORE_YAO_PASSWORD_HASH:-$DEFAULT_NAS_YAO_PASSWORD_HASH}"

mkdir -p "$RUN_DIR" "$LOG_DIR"

if [ -f "$SMART_ASSISTANT_ENV" ]; then
  set -a
  # This administrator-owned file provides ConnectionStrings__PostgreSQL without committing credentials.
  . "$SMART_ASSISTANT_ENV"
  set +a
fi

if [ -f "$POSTGRES_ENV" ]; then
  set -a
  # Administrator-owned POSTGRES_* values; never packaged or committed.
  . "$POSTGRES_ENV"
  set +a
fi

if [ ! -x "$CURRENT/backend/PredictaCore.Api" ]; then
  echo "Backend executable is missing: $CURRENT/backend/PredictaCore.Api" >&2
  exit 1
fi

if [ ! -f "$CURRENT/frontend/server.js" ]; then
  echo "Frontend server is missing: $CURRENT/frontend/server.js" >&2
  exit 1
fi

if [ ! -x "$NODE_BIN" ]; then
  echo "Node.js 20 is missing: $NODE_BIN" >&2
  exit 1
fi

"$APP_ROOT/scripts/stop.sh" >/dev/null 2>&1 || true

(
  cd "$CURRENT/backend"
  ASPNETCORE_URLS="http://127.0.0.1:5080" \
    LocalAuthentication__PasswordHashIterations="$PREDICTACORE_PBKDF2_ITERATIONS" \
    LocalAuthentication__Users__YAO__PasswordHash="$PREDICTACORE_YAO_PASSWORD_HASH" \
    nohup ./PredictaCore.Api >>"$LOG_DIR/backend.log" 2>&1 &
  echo $! >"$RUN_DIR/backend.pid"
)

(
  cd "$CURRENT/frontend"
  HOSTNAME="0.0.0.0" \
    PORT="3100" \
    NODE_ENV="production" \
    BACKEND_ORIGIN="http://127.0.0.1:5080" \
    nohup "$NODE_BIN" server.js >>"$LOG_DIR/frontend.log" 2>&1 &
  echo $! >"$RUN_DIR/frontend.pid"
)

echo "PredictaCore startup requested."
