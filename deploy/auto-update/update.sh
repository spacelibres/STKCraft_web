#!/usr/bin/env bash
# Poll public GitHub main branches; never build inside the running app.
set -euo pipefail
exec 9>/var/lock/stkcraft-auto-update.lock
flock -n 9 || exit 0
STATE=/var/lib/stkcraft-auto-update
mkdir -p "$STATE" /opt/stkcraft-releases
revision() { git ls-remote "https://github.com/spacelibres/$1.git" refs/heads/main | awk '{print $1}'; }
web=$(revision STKCraft_web)
geo=$(revision STKCraft-Geocalc)
time=$(revision STKCraft-time)
[[ "$web" =~ ^[0-9a-f]{40}$ && "$geo" =~ ^[0-9a-f]{40}$ && "$time" =~ ^[0-9a-f]{40}$ ]]
if [[ ! -f "$STATE/web" || $(cat "$STATE/web") != "$web" ]]; then
  bash /opt/stkscraft/deploy/deploy.sh
  [[ $(git -C /opt/stkscraft rev-parse HEAD) == "$web" ]]
  published=0
  for attempt in {1..60}; do
    if [[ -f /var/lib/stkscraft/deployed-web.commit && $(cat /var/lib/stkscraft/deployed-web.commit) == "$web" ]]; then published=1; break; fi
    sleep 1
  done
  [[ "$published" == 1 ]]
  curl -fsS https://www.stkcraft.com/ >/dev/null
  printf '%s\n' "$web" > "$STATE/web"
fi
desired="$geo:$time"
[[ ! -f "$STATE/geocalc" || $(cat "$STATE/geocalc") != "$desired" ]] || exit 0
candidate=$(mktemp -d /opt/stkcraft-releases/candidate-XXXXXXXX)
chmod 755 "$candidate"
previous=
live_stopped=0
committed=0
cleanup() {
  status=$?
  trap - EXIT INT TERM
  set +e
  if [[ -n "${probe:-}" ]]; then kill "$probe" 2>/dev/null || true; fi
  if [[ "$live_stopped" == 1 && "$committed" == 0 ]]; then
    systemctl stop stkcraft-geocalc
    if [[ -n "$previous" && -d "$previous" ]]; then
      if [[ -d /opt/stkcraft-geocalc ]]; then mv /opt/stkcraft-geocalc "$candidate"; fi
      mv "$previous" /opt/stkcraft-geocalc
    fi
    systemctl start stkcraft-geocalc
  fi
  if [[ -d "$candidate" && "$candidate" == /opt/stkcraft-releases/candidate-* ]]; then
    rm -rf -- "$candidate"
  fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
git clone --quiet https://github.com/spacelibres/STKCraft-Geocalc.git "$candidate"
git -C "$candidate" checkout --quiet --detach "$geo"
git clone --quiet https://github.com/spacelibres/STKCraft-time.git "$candidate/time-source"
git -C "$candidate/time-source" checkout --quiet --detach "$time"
# Only compatible time versions can resolve. Cargo rejects incompatible updates.
cat >> "$candidate/.cargo/config.toml" <<EOF

[patch.crates-io]
stkcraft-time = { path = "$candidate/time-source" }
EOF
export CARGO_BUILD_JOBS=1
(cd "$candidate" && cargo update -p stkcraft-time)
(cd "$candidate" && cargo update --manifest-path web/native/Cargo.toml -p stkcraft-time)
for manifest in Cargo.toml web/native/Cargo.toml; do
  (cd "$candidate" && cargo metadata --locked --format-version 1 --manifest-path "$manifest") |
    python3 -c 'import json,pathlib,sys; packages=[p for p in json.load(sys.stdin)["packages"] if p["name"]=="stkcraft-time"]; assert len(packages)==1 and pathlib.Path(packages[0]["manifest_path"]).resolve()==pathlib.Path(sys.argv[1]).resolve(), "Current GitHub time source did not resolve; refusing deployment"' "$candidate/time-source/Cargo.toml"
done
mkdir -p "$candidate/target"
cp -al /opt/stkcraft-geocalc/target/kernels "$candidate/target/kernels"
# Record deployment inputs without creating or publishing synthetic releases.
printf '%s\n' "$desired" > "$candidate/target/upstream-revisions.txt"
RESOLVED_TIME_SOURCE=1 APP_DIR="$candidate" bash /etc/stkcraft-geocalc/build.sh
install -d -o stkcraft-geocalc -g stkcraft-geocalc "$candidate/web/.next/cache"
runuser -u stkcraft-geocalc -- test -r "$candidate/web/.next/BUILD_ID"
(cd "$candidate/web" && exec runuser -u stkcraft-geocalc -- env NODE_ENV=production GEOCALC_ROOT="$candidate" STKCRAFT_WEB_GEOMETRY=/etc/stkcraft-geocalc/bin/geometry STKCRAFT_WEB_MCP=/etc/stkcraft-geocalc/bin/mcp STKCRAFT_WEB_TIME=/etc/stkcraft-geocalc/bin/time STKCRAFT_WEB_TIME_MCP=/etc/stkcraft-geocalc/bin/time-mcp node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3102) &
probe=$!
ready=0
for attempt in {1..30}; do
  if curl -fsS http://127.0.0.1:3102/api/catalog >/dev/null; then ready=1; break; fi
  sleep 1
done
[[ "$ready" == 1 ]]
(cd "$candidate/web" && APP_DIR="$candidate" STKCRAFT_WEB_TEST_URL=http://127.0.0.1:3102 bash /etc/stkcraft-geocalc/verify.sh)
kill "$probe"; wait "$probe" 2>/dev/null || true
probe=
previous="/opt/stkcraft-releases/previous-$(date +%s)"
live_stopped=1
systemctl stop stkcraft-geocalc
mv /opt/stkcraft-geocalc "$previous"
# The shared kernel link must survive the old checkout's relocation.
: # Candidate kernels have independent directory entries.
mv "$candidate" /opt/stkcraft-geocalc
# Absolute Cargo patch paths are build-time metadata only.
install -d -o stkcraft-geocalc -g stkcraft-geocalc /opt/stkcraft-geocalc/web/.next/cache
systemctl start stkcraft-geocalc
healthy=0
for attempt in {1..30}; do
  if curl -fsS http://127.0.0.1:3100/api/catalog >/dev/null; then healthy=1; break; fi
  sleep 1
done
if [[ "$healthy" != 1 ]]; then
  exit 1
fi
committed=1
printf '%s\n' "$desired" > "$STATE/geocalc"
python3 - <<'PY'
from pathlib import Path
import re, shutil
root = Path('/opt/stkcraft-releases').resolve()
releases = sorted((p for p in root.iterdir() if re.fullmatch(r'previous-\d+', p.name) and p.is_dir() and not p.is_symlink()), key=lambda p: int(p.name.split('-')[1]), reverse=True)
for release in releases[2:]:
    assert release.resolve().parent == root
    shutil.rmtree(release)
PY
