#!/usr/bin/env bash
# Refresh the local DB-IP Lite city database. Run manually or from the timer.
set -euo pipefail

DEST_DIR="${DEST_DIR:-/var/lib/stkscraft/geoip}"
DEST="$DEST_DIR/dbip-city.mmdb"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

install -d -m 700 "$DEST_DIR"
current="$(date -u +%Y-%m)"
previous="$(date -u -d '1 month ago' +%Y-%m)"

for month in "$current" "$previous"; do
  url="https://download.db-ip.com/free/dbip-city-lite-${month}.mmdb.gz"
  echo "trying $url"
  if curl -fL --retry 2 --max-time 240 "$url" -o "$TMP_DIR/dbip.mmdb.gz"; then
    gunzip -c "$TMP_DIR/dbip.mmdb.gz" > "$TMP_DIR/dbip.mmdb"
    python3 - "$TMP_DIR/dbip.mmdb" <<'PY'
import maxminddb, sys
reader = maxminddb.open_database(sys.argv[1])
reader.get("8.8.8.8")
reader.close()
PY
    install -m 600 "$TMP_DIR/dbip.mmdb" "$DEST"
    echo "updated $DEST"
    exit 0
  fi
done

echo "could not download a DB-IP Lite city database" >&2
exit 1
