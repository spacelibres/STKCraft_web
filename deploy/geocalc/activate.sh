#!/usr/bin/env bash
set -euo pipefail
CONFIG=/etc/stkcraft-geocalc
APP=/opt/stkcraft-geocalc
# scp from Windows may create the destination directory with mode 0700.
chmod 755 "$CONFIG"
if [[ "${1:-}" == --public ]]; then
  # Keep the old config outside Caddy's *.caddy import glob.
  TARGET=/etc/caddy/conf.d/geocalc.caddy
  BACKUP="$CONFIG/previous-caddy.conf"
  HAD_PREVIOUS=0
  if [[ -f "$TARGET" ]]; then cp "$TARGET" "$BACKUP"; HAD_PREVIOUS=1; fi
  restore() {
    if [[ "$HAD_PREVIOUS" == 1 ]]; then cp "$BACKUP" "$TARGET"; else rm -f "$TARGET"; fi
    caddy validate --config /etc/caddy/Caddyfile && systemctl reload caddy
  }
  trap restore ERR
  curl --fail --silent http://127.0.0.1:3101/api/catalog > /dev/null
  install -m 644 "$CONFIG/geocalc.caddy" "$TARGET"
  caddy validate --config /etc/caddy/Caddyfile
  systemctl reload caddy
  trap - ERR
  exit 0
fi
id stkcraft-geocalc >/dev/null 2>&1 || useradd --system --home-dir /nonexistent --shell /usr/sbin/nologin stkcraft-geocalc
install -d -m 755 "$CONFIG/bin"
install -m 755 "$CONFIG/native-run" "$CONFIG/bin/native-run"
for name in geometry mcp time time-mcp; do ln -sfn native-run "$CONFIG/bin/$name"; done
install -d -o stkcraft-geocalc -g stkcraft-geocalc "$APP/web/.next/cache"
install -m 644 "$CONFIG/stkcraft-geocalc.service" /etc/systemd/system/
install -m 644 "$CONFIG/stkcraft-geocalc-limiter.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now stkcraft-geocalc
systemctl enable --now stkcraft-geocalc-limiter
