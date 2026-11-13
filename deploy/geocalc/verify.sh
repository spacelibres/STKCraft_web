#!/usr/bin/env bash
set -euo pipefail
cd /opt/stkcraft-geocalc/web
# The VPS Node build omits TypeScript stripping; use the main site's installed
# tsx loader without changing the upstream workspace or dependency lockfile.
NODE_OPTIONS="--import /opt/stkscraft/node_modules/tsx/dist/loader.mjs" npm run test:scene
npm run test:integration
python3 -m unittest discover -s tests -p test_nasa_compare.py
git -C /opt/stkcraft-geocalc rev-parse HEAD > /opt/stkcraft-geocalc/target/deployed-source.txt
