#!/usr/bin/env bash
# Run after the DNS names resolve to this server.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
install -m 644 "$HERE/Caddyfile.domain" /etc/caddy/conf.d/stkscraft-domain.caddy
if ! caddy validate --config /etc/caddy/Caddyfile; then
  rm -f /etc/caddy/conf.d/stkscraft-domain.caddy
  exit 1
fi
systemctl reload caddy
echo "Domain enabled: https://www.stkscraft.com/ and https://stkscraft.com/"
