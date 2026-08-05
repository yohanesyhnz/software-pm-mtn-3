#!/bin/sh
set -eu

APP_ROOT="${PREDICTACORE_ROOT:-/volume1/homes/YAO/predictacore}"
RUN_DIR="$APP_ROOT/run"

stop_process() {
  name="$1"
  pid_file="$RUN_DIR/$name.pid"

  if [ ! -f "$pid_file" ]; then
    return 0
  fi

  pid="$(cat "$pid_file" 2>/dev/null || true)"
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    count=0
    while kill -0 "$pid" 2>/dev/null && [ "$count" -lt 10 ]; do
      sleep 1
      count=$((count + 1))
    done
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null || true
    fi
  fi

  rm -f "$pid_file"
}

stop_process frontend
stop_process backend
echo "PredictaCore stopped."
