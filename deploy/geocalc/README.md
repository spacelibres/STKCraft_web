# Independent GeoCalc deployment

Public workspace: https://geocalc.stkcraft.com/

GeoCalc is a Node server with native Rust subprocesses, separate from the main
site's static export. STKCraft-time is already built into its companion bridge.
This directory contains deployment configuration only; it does not change the
upstream numerical code or claim complete NASA WebGeocalc parity.

The tracked deployment overlay changes two public-host UI details at build
time: the STKCraft brand link returns to the main website, and playback advances
the epoch once every five seconds, allowing this VPS to finish each scene.
The source file is restored after building; the overlay rejects unexpected
upstream source changes. Native calculations, sampled epochs and results are
not modified. Manual timeline changes remain immediate.

## Initial install

Requires a Debian/Ubuntu VPS with Node 22+, npm, Python 3, Rust/Cargo, a C/C++
toolchain, Nginx, util-linux/flock and the existing Caddy HTTPS service.
Check listeners and available memory first. Do not start the distribution's
default Nginx site on port 80 when Caddy owns ports 80/443. This installation
uses only the dedicated `stkcraft-geocalc-limiter` unit and custom config.

1. Point the GeoCalc DNS record at the VPS; retain the existing main-site DNS.
2. Clone `https://github.com/spacelibres/STKCraft-Geocalc.git` into
   `/opt/stkcraft-geocalc` and detach at the source commit being deployed.
3. Copy the contents of this directory into `/etc/stkcraft-geocalc`.
4. Run `bash /etc/stkcraft-geocalc/build.sh`. It builds one Rust job at a time,
   downloads and verifies only the eight default kernels against the upstream
   pinned SHA256 inventory, and runs the web build and Python tests.
5. Run `bash /etc/stkcraft-geocalc/activate.sh`. This creates an unprivileged
   account, starts Next on loopback port 3100 and Nginx on loopback port 3101.
6. Run `bash /etc/stkcraft-geocalc/verify.sh` against 3100. It runs scene tests,
   integration tests and Python comparison tests. The VPS Node build omits
   TypeScript stripping, so the test runner uses the existing main site's tsx
   loader at `/opt/stkscraft/node_modules/tsx/dist/loader.mjs` for TS imports.
   Record any platform-specific numerical differences explicitly.
7. Check normal browser loading and controlled 429 responses through 3101.
8. Run `bash /etc/stkcraft-geocalc/activate.sh --public`. It validates Caddy's
   complete configuration before reload and restores the previous config on
   activation error. Caddy obtains the HTTPS certificate automatically.

The main site's deploy script does not rebuild GeoCalc. Updating GeoCalc is an
explicit separate operation: preserve the old checkout/build, build and check a
candidate at a recorded commit, then switch it into `/opt/stkcraft-geocalc` and
restart its two services. Keep the complete source layout for relative paths,
the Python comparison helper, native executables and both Rust lockfiles.

## Limits and client identity

- Caddy overwrites `X-Geocalc-Client-IP` with its actual remote peer. Nginx trusts
  it only from loopback and uses that address for request/concurrency limits.
- API: 4 requests/second per IP, burst 8; global 8/second, burst 12;
  6 simultaneous requests per IP, 8 globally. Excess requests receive JSON 429
  responses with Retry-After, so the workspace can display the error directly.
  These budgets allow the UI's concurrent scene/trajectory loading. Static
  assets use a separate unthrottled location.
- Requests are capped at 64 KiB; body/header timeouts are 10 seconds; upstream
  reads have a 130-second bound. Upstream native calls have a 120-second bound.
- Geometry wrappers share a two-slot flock pool to bound aggregate SPK memory
  while preserving calculation code and kernel load order. Lock acquisition
  times out after approximately 115 seconds. Time tools do not load the SPK
  and run directly, so timeline UTC conversion does not queue behind geometry.
- The application and its children share MemoryHigh=640M, MemoryMax=768M,
  CPUQuota=150%, TasksMax=96. Nginx has a separate 64 MiB budget. These are
  starting limits for the current 2 GiB VPS; verify load before increasing.
- Source, binaries and kernels remain root-owned; only Next's explicit cache
  and the systemd runtime directories are writable by the service.

## Operations

```sh
systemctl status stkcraft-geocalc stkcraft-geocalc-limiter
journalctl -u stkcraft-geocalc -u stkcraft-geocalc-limiter -n 80
cat /opt/stkcraft-geocalc/target/deployed-source.txt
cat /opt/stkcraft-geocalc/target/web-kernels.json
curl -fsS https://geocalc.stkcraft.com/api/catalog
python3 /etc/stkcraft-geocalc/verify-live.py
systemctl show stkcraft-geocalc -p MemoryCurrent -p MemoryMax -p CPUQuotaPerSecUSec -p TasksMax
```

For rollback restore the preceding complete app checkout/build and restart
`stkcraft-geocalc`. Restore `/etc/stkcraft-geocalc/previous-caddy.conf` if the
proxy changed; validate the complete Caddyfile and reload Caddy. Check both
main-site languages and the workspace after rollback. Do not restore mutable
kernel aliases or modify numerical tolerances to hide a verification failure.
