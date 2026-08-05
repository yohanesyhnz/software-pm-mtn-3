#!/bin/sh
set -eu

FRONTEND_URL="${FRONTEND_URL:-http://127.0.0.1:3100}"

response="$(curl --fail --silent --show-error "$FRONTEND_URL/api/health")"
echo "$response" | grep -q '"status":"online"'
printf '%s\n' "$response"
