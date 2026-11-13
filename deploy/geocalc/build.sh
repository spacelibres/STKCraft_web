#!/usr/bin/env bash
set -euo pipefail
exec 8>/var/lock/stkcraft-build.lock
flock 8
APP_DIR="${APP_DIR:-/opt/stkcraft-geocalc}"
cd "$APP_DIR"
if [[ ${RESOLVED_TIME_SOURCE:-0} == 1 ]]; then
  git diff --quiet -- . ':(exclude).cargo/config.toml' ':(exclude)Cargo.lock' ':(exclude)web/native/Cargo.lock'
else
  git diff --quiet
fi
git diff --cached --quiet
git rev-parse HEAD
export CARGO_BUILD_JOBS=1
cargo build --release --locked --features mcp --bins
cargo build --release --manifest-path web/native/Cargo.toml --locked
python3 /etc/stkcraft-geocalc/fetch-web-kernels.py "$APP_DIR"
cd web
npm ci --no-audit --no-fund
python3 /etc/stkcraft-geocalc/apply-overlay.py "$APP_DIR"
# Only the dedicated checkout's previously verified clean UI file is restored.
trap 'git -C "$APP_DIR" show HEAD:web/components/Workspace.tsx > "$APP_DIR/web/components/Workspace.tsx"' EXIT
npm run typecheck
NODE_OPTIONS=--max-old-space-size=768 npm run build
python3 -m unittest discover -s tests -p test_nasa_compare.py
git -C "$APP_DIR" rev-parse HEAD > "$APP_DIR/target/deployed-source.txt"
