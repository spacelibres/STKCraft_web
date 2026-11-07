#!/usr/bin/env bash
# One-shot installer for the STKCraft site on a Debian/Ubuntu VPS with Caddy.
#
#   bash install.sh
#
# Idempotent: safe to re-run. It does not touch the existing Caddy site.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/spacelibres/STKCraft_web.git}"
APP_DIR="${APP_DIR:-/opt/stkscraft}"
WEB_ROOT="${WEB_ROOT:-/var/www/stkscraft}"
SECRET_DIR="${SECRET_DIR:-/etc/stkscraft}"
SECRET_FILE="$SECRET_DIR/webhook.secret"
WEBHOOK_PORT="${WEBHOOK_PORT:-8788}"
DOMAIN="${DOMAIN:-www.stkcraft.com}"
CADDYFILE="${CADDYFILE:-/etc/caddy/Caddyfile}"
CADDY_CONF_DIR="${CADDY_CONF_DIR:-/etc/caddy/conf.d}"
CADDY_SITE="$CADDY_CONF_DIR/stkscraft.caddy"
SERVICE_FILE="/etc/systemd/system/stkscraft-webhook.service"

log() { printf '\n==> %s\n' "$*"; }
die() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "run as root"
command -v git >/dev/null || die "git is required"
command -v node >/dev/null || die "Node.js is required (Node 22 tested)"
command -v pnpm >/dev/null || die "pnpm is required"
command -v rsync >/dev/null || die "rsync is required"
command -v caddy >/dev/null || die "caddy is required"

log "Fetching STKCraft source into $APP_DIR"
if [[ -d "$APP_DIR/.git" ]]; then
  git -C "$APP_DIR" fetch --prune origin main
  git -C "$APP_DIR" reset --hard origin/main
else
  mkdir -p "$(dirname "$APP_DIR")"
  git clone --branch main --single-branch "$REPO_URL" "$APP_DIR"
fi
chmod +x "$APP_DIR/deploy/deploy.sh" "$APP_DIR/deploy/install.sh"

log "Creating the web root and webhook secret"
install -d -m 755 "$WEB_ROOT"
install -d -m 700 "$SECRET_DIR"
if [[ ! -s "$SECRET_FILE" ]]; then
  command -v openssl >/dev/null || die "openssl is required to create the webhook secret"
  openssl rand -hex 32 > "$SECRET_FILE"
fi
chmod 600 "$SECRET_FILE"
if [[ ! -s "$SECRET_DIR/visitors.token" ]]; then
  openssl rand -hex 32 > "$SECRET_DIR/visitors.token"
fi
chmod 600 "$SECRET_DIR/visitors.token"

log "Installing Node dependencies"
cd "$APP_DIR"
pnpm install --frozen-lockfile

log "Installing the webhook service"
install -m 644 "$APP_DIR/deploy/stkscraft-webhook.service" "$SERVICE_FILE"
install -d -m 755 /etc/systemd/system/caddy.service.d
install -m 644 "$APP_DIR/deploy/caddy-restart.conf" /etc/systemd/system/caddy.service.d/stkscraft-restart.conf
systemctl daemon-reload
systemctl enable --now caddy stkscraft-webhook.service
systemctl restart stkscraft-webhook.service


log "Installing private visitor statistics"
install -d -m 700 "$SECRET_DIR" /var/lib/stkscraft /var/lib/stkscraft/geoip
chmod 750 /var/log/caddy 2>/dev/null || true
if [[ ! -s /var/lib/stkscraft/geoip/dbip-city.mmdb ]]; then
  (cd "$APP_DIR" && pnpm exec tsx deploy/update-geoip.ts)
fi
install -m 644 "$APP_DIR/deploy/stkscraft-visitors.service" /etc/systemd/system/stkscraft-visitors.service
install -m 644 "$APP_DIR/deploy/stkscraft-visitors.timer" /etc/systemd/system/stkscraft-visitors.timer
install -m 644 "$APP_DIR/deploy/stkscraft-geoip.service" /etc/systemd/system/stkscraft-geoip.service
install -m 644 "$APP_DIR/deploy/stkscraft-geoip.timer" /etc/systemd/system/stkscraft-geoip.timer
systemctl daemon-reload
systemctl enable --now stkscraft-visitors.timer stkscraft-geoip.timer

log "Installing the HTTPS Caddy site block for $DOMAIN"
install -d -m 755 "$CADDY_CONF_DIR"
install -m 644 "$APP_DIR/deploy/Caddyfile.stkscraft" "$CADDY_SITE"
BACKUP="${CADDYFILE}.stkscraft-backup.$(date +%Y%m%d%H%M%S)"
cp -a "$CADDYFILE" "$BACKUP"
if ! grep -q 'import /etc/caddy/conf.d/\*.caddy' "$CADDYFILE"; then
  printf '\n# STKCraft isolated sites\nimport /etc/caddy/conf.d/*.caddy\n' >> "$CADDYFILE"
fi
if ! caddy validate --config "$CADDYFILE" >/tmp/stkscraft-caddy-validate.log 2>&1; then
  echo "Caddy validation failed; restoring $CADDYFILE" >&2
  cat /tmp/stkscraft-caddy-validate.log >&2
  cp -a "$BACKUP" "$CADDYFILE"
  rm -f "$CADDY_SITE"
  exit 1
fi
systemctl reload caddy || systemctl restart caddy

log "Building and publishing the site"
"$APP_DIR/deploy/deploy.sh"

log "Collecting the first visitor snapshot"
(cd "$APP_DIR" && pnpm exec tsx deploy/visitor-log.ts) || true

log "Install complete"
printf '\nSite:    https://%s/\n' "$DOMAIN"
printf 'Health:  https://%s/health\n' "$DOMAIN"
printf 'Webhook: https://%s/webhook\n' "$DOMAIN"
printf 'Secret:  %s\n' "$SECRET_FILE"
printf '\nThe webhook accepts only push events for refs/heads/main.\n'
