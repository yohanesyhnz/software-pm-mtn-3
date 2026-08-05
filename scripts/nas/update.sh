#!/bin/sh
set -eu

APP_ROOT="${PREDICTACORE_ROOT:-/volume1/homes/YAO/predictacore}"
REPOSITORY="${PREDICTACORE_REPOSITORY:-yohanesyhnz/software-pm-mtn-3}"
API_URL="https://api.github.com/repos/$REPOSITORY/releases/latest"
ASSET_NAME="predictacore-ds124-arm64.tar.gz"
CHECKSUM_NAME="$ASSET_NAME.sha256"
STAGING="$APP_ROOT/staging"
RELEASES="$APP_ROOT/releases"
BACKUPS="$APP_ROOT/backups"
SHARED_DATA="$APP_ROOT/shared/data"

mkdir -p "$STAGING" "$RELEASES" "$BACKUPS" "$SHARED_DATA"

release_json="$(curl --fail --silent --show-error \
  -H 'Accept: application/vnd.github+json' \
  "$API_URL")"
latest="$(printf '%s' "$release_json" | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1)"

if [ -z "$latest" ]; then
  echo "Unable to resolve the latest GitHub release." >&2
  exit 1
fi

case "$latest" in
  v[0-9]*.[0-9]*.[0-9]*) ;;
  *)
    echo "Refusing unexpected release tag: $latest" >&2
    exit 1
    ;;
esac

current="$(cat "$APP_ROOT/current-version" 2>/dev/null || true)"
if [ "$current" = "$latest" ]; then
  echo "PredictaCore is already current: $latest"
  exit 0
fi

archive="$STAGING/$ASSET_NAME"
checksum="$STAGING/$CHECKSUM_NAME"
base_url="https://github.com/$REPOSITORY/releases/download/$latest"

rm -f "$archive" "$checksum"
curl --fail --location --silent --show-error "$base_url/$ASSET_NAME" -o "$archive"
curl --fail --location --silent --show-error "$base_url/$CHECKSUM_NAME" -o "$checksum"
(
  cd "$STAGING"
  sha256sum -c "$CHECKSUM_NAME"
)

target="$RELEASES/$latest"
rm -rf "$target"
mkdir -p "$target"
tar -xzf "$archive" -C "$target"

if [ -d "$SHARED_DATA" ] && [ "$(find "$SHARED_DATA" -mindepth 1 -maxdepth 1 2>/dev/null | head -n 1)" ]; then
  backup="$BACKUPS/data-$(date +%Y%m%d-%H%M%S).tar.gz"
  tar -czf "$backup" -C "$SHARED_DATA" .
fi

rm -rf "$target/backend/data"
ln -s "$SHARED_DATA" "$target/backend/data"

previous="$(readlink "$APP_ROOT/current" 2>/dev/null || true)"
"$APP_ROOT/scripts/stop.sh" >/dev/null 2>&1 || true
ln -sfn "$target" "$APP_ROOT/current"

if "$APP_ROOT/scripts/start.sh" && sleep 3 && "$APP_ROOT/scripts/health.sh" >/dev/null; then
  printf '%s\n' "$latest" >"$APP_ROOT/current-version"
  echo "PredictaCore updated successfully to $latest"
  exit 0
fi

echo "Health check failed. Rolling back." >&2
"$APP_ROOT/scripts/stop.sh" >/dev/null 2>&1 || true
if [ -n "$previous" ]; then
  ln -sfn "$previous" "$APP_ROOT/current"
  "$APP_ROOT/scripts/start.sh" || true
fi
exit 1
