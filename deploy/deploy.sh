#!/usr/bin/env bash
# Build the Next.js site and atomically publish the static export.
# Safe to run repeatedly: the live root is only replaced after a successful build.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/stkscraft}"
WEB_ROOT="${WEB_ROOT:-/var/www/stkscraft}"
LOG="${LOG:-/var/log/stkscraft-deploy.log}"

mkdir -p "$(dirname "$LOG")"
exec >>"$LOG" 2>&1
echo "=== $(date -Is) STKCraft deploy start ==="

exec 9>/var/lock/stkscraft-deploy.lock
if ! flock -n 9; then
  echo "another deploy is already running; skipping"
  exit 0
fi

cd "$APP_DIR"
git fetch --prune origin main
git reset --hard origin/main
chmod +x "$APP_DIR/deploy/deploy.sh" "$APP_DIR/deploy/install.sh" "$APP_DIR/deploy/update-geoip.sh" "$APP_DIR/deploy/show-visitors.sh"
echo "HEAD $(git rev-parse --short HEAD) $(git log -1 --pretty=%s)"

command -v pnpm >/dev/null || { echo "pnpm is required"; exit 1; }
command -v rsync >/dev/null || { echo "rsync is required"; exit 1; }

pnpm install --frozen-lockfile
NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=1536}" pnpm build

test -f out/index.html || { echo "build did not produce out/index.html"; exit 1; }
mkdir -p "$WEB_ROOT"
rsync -a --delete "$APP_DIR/out/" "$WEB_ROOT/"
if id caddy >/dev/null 2>&1; then
  chown -R caddy:caddy "$WEB_ROOT"
fi
echo "=== $(date -Is) STKCraft deploy complete ==="
