# GeoCalc deployment and module links

Date: 2026-11-13
Status: Code and server inspection complete; architecture review pending.

## Requested outcome

Deploy STKCraft GeoCalc as an independently running web application and link it
from the English and Chinese STKCraft home pages. Link the GeoCalc and
STKCraft-time source repositories as modules. The user selected public access
with rate limiting and resource limits on 2026-11-13.

## Verified source behavior

- The main site is a static Next.js export served by Caddy. Its existing signed
  webhook deploys only this repository. Live HTTPS returned 200 on inspection.
- GeoCalc's `web/` is a Next.js server application using Three.js and Node route
  handlers. It invokes Rust executables through stdin/stdout, not a separate
  network MCP service. Static hosting alone cannot run its API.
- Build the repository's geometry executables with the `mcp` feature, then the
  companion `web/native` package. The latter supplies both a time bridge and a
  time MCP executable using the published `stkcraft-time` dependency.
- GeoCalc already exposes time conversion. STKCraft-time is a Rust module;
  a second time website is not required for the requested module source link.
- Source versions inspected: geometry 0.2.1, time 0.2.1, web 0.1.1. Deploy an
  explicitly recorded commit and honor both Rust lockfiles and package-lock.
- The web service has a 64 KiB JSON body limit, per-process execution timeout
  and output cap, but no authentication or request rate limiter.
- Each scene request starts several native calculations concurrently. Limiting
  only request body size does not limit computation costs.
- Default kernels include `de442.bsp`, `pck00011.tpc`,
  `mars_iau2000_v1.tpc`, `gm_de431.tpc`, `moon_pa_de440_200625.bpc`,
  `moon_de440_250416.tf`, `moon_assoc_me.tf` and `naif0012.tls`.
  `fetch_kernels.py` alone does not provide the complete default inventory.
- Linux build success must not be presented as equality to the upstream
  Windows reference profile or complete NASA WebGeocalc parity.

## Hosting options

1. Recommended: `https://geocalc.stkcraft.com/` for the independent app, linked
   from `https://www.stkcraft.com/` and `/zh/`. This preserves the application
   root paths and separates service releases from the static site.
2. Alternative: `https://www.stkcraft.com/geocalc/`. This avoids a DNS change,
   but requires auditing and changing Next base paths, navigation, asset paths
   and browser API requests, followed by upstream web verification.
3. Alternative: another hosting provider with Node and native-process support.
   This adds infrastructure while the current site already uses a VPS.

Do not iframe the app or copy its source into the landing-page build.

## Recommended production topology

Browser -> Caddy HTTPS -> loopback request limiter -> loopback Next server
-> native geometry and time executables -> server-owned SPICE kernels.

- Keep the main site's existing Caddy block and deployment pipeline intact.
- Add a separate Caddy host for GeoCalc, only after its DNS record exists.
- Stock Caddy does not include a request-rate-limit directive. Use a dedicated
  loopback Nginx server as the limiter unless a suitable module is verified on
  the actual server. Do not replace the installed Caddy binary blindly.
- Next listens on `127.0.0.1:3100`; the limiter listens on
  `127.0.0.1:3101`, subject to checking existing listeners first.
- Forward the client address from Caddy using an explicitly overwritten
  header. Nginx trusts that header only from loopback; do not trust arbitrary
  client-supplied forwarding headers.
- Apply a separate small burst budget to computational POST endpoints,
  including calculate, scene, trajectories, time and time/convert. Start with
  30 requests/minute per IP and burst 5, then adjust using playback tests.
- Bound simultaneous computational requests per IP and globally. Initial
  proposal: 1 per IP, 2 globally; return 429 when the budget is exhausted.
  Allow static assets separately so loading the workspace remains usable.
- The upstream scene and playback behavior must be tested against these
  budgets; avoid deploying a limiter that makes the default UI unusable.
- Apply 64 KiB body limits, bounded connection/request timeouts and finite
  upstream response timeouts. Native processes already have a 120s timeout;
  the proxy must allow a coherent bounded response for supported operations.
- Run Next and all child processes in one dedicated unprivileged systemd
  service/cgroup. Start with MemoryMax=768M, CPUQuota=75%, TasksMax=96 and
  Restart=on-failure, then size them against actual available VPS resources.
  Keep builds outside the runtime budget. Treat repeated OOM as a failed gate.
- Keep source, binaries and kernels read-only to the service account. Grant
  writes only to explicit runtime/cache paths. Keep credentials out of git.
- Set `STKCRAFT_WEB_PYTHON` to the installed Python 3 executable for optional
  live NASA comparisons. A remote NASA outage must not prevent local results.

## Build and kernel preparation

Use an isolated release checkout outside the static site's checkout. Preserve
the complete repository layout because `web/lib/server.ts` resolves paths
relative to the web working directory and invokes `web/nasa/compare.py`.

From the GeoCalc repository root:

```sh
python3 tools/bootstrap_reference.py --kernels-only
cargo build --release --locked --features mcp --bins
cargo build --release --manifest-path web/native/Cargo.toml --locked
cd web
npm ci
npm run typecheck
npm run build
npm run test:scene
```

The bootstrap verifies pinned kernel hashes; it may obtain more data than the
web defaults need. Check available disk space and its pinned inventory first.
Do not substitute `de442s.bsp` for the configured `de442.bsp` silently.
Use absolute binary/kernel environment paths for production and the same LSK
for geometry and time. Unsupported mission examples must continue to report
missing data rather than receive guessed results.

Start the candidate release on a temporary loopback port before switching
traffic. Run the upstream integration checks against their documented port
3100 before activation. Switch a release symlink and restart only GeoCalc
after successful checks. Keep the preceding release for rollback. Native
numerical publication and upstream package releases are outside this task.

## Home-page changes

- Add an English/Chinese modules entry in the main navigation.
- Add a compact modules section with a direct online GeoCalc link, GeoCalc
  source link and STKCraft-time source link.
- GeoCalc online target: `https://geocalc.stkcraft.com/`.
- Source targets: `https://github.com/spacelibres/STKCraft-Geocalc` and
  `https://github.com/spacelibres/STKCraft-time`.
- Add matching footer links. Describe time as a module, not another deployed
  web application. Do not mark GeoCalc online until its acceptance checks pass.
- Preserve the named STKCraft albatross identity and existing approved page
  style. Apply the spacelibre VI rules to any newly introduced spacelibre
  branding, using the original SVG if such branding is introduced.
- Verify both languages, light/dark themes, mobile navigation and keyboard
  links. Increment the main site's patch version and changelog together.

## Acceptance and rollback

1. Main site typecheck, version gate and static production build pass.
2. Upstream web typecheck, production build, scene tests and live integration
   checks pass using the actual binaries and pinned kernel context.
3. Public workspace, assets, API catalog, API reference, scene and trajectories
   work over HTTPS. A known UTC-to-ET conversion and geometry calculation work.
4. Invalid UTC and client kernel-path injection requests are rejected.
5. Controlled excess requests return 429 while static resources remain usable.
   Confirm real client-IP accounting and cgroup CPU/memory/task limits.
6. A normal browser session, playback, both home-page languages and themes
   work without sustained throttling or overflow.
7. Restart the service and verify availability again. Verify the existing main
   site, visitor API authorization and webhook routing are preserved.
8. Record deployed commit, kernel manifest, active configuration and test
   evidence. On failure, restore the previous GeoCalc release/configuration
   and verify its health before declaring recovery.

## Current deployment prerequisites

- `www.stkcraft.com` resolves to `176.122.160.172` and serves HTTPS successfully.
- `geocalc.stkcraft.com` returned NXDOMAIN during inspection. Add its DNS record
  to the verified deployment host before requesting its HTTPS certificate.
- After the user supplied the connection credentials, SSH succeeded using
  first-use host-key acceptance. No password was saved to repository files.
- Server inspection found 2026 MiB physical memory, 1023 MiB swap, 27 GiB
  available disk, and an existing Next service on loopback port 3000.
  Ports 3100/3101 are free. Node, npm and Python 3 are installed; Rust and
  Nginx were not found on the default command path. Check systemd service
  ownership and existing Caddy imports before installing anything.
- The service budget above reserves memory for existing applications. Native
  release builds must use one build job and run sequentially with the web
  build; inspect memory pressure and swap before starting them.
- Architecture review is pending. The public-access policy has been confirmed;
  the recommended subdomain and production topology remain proposals.

## Source references

- https://github.com/spacelibres/STKCraft-Geocalc/blob/main/web/README.md
- https://github.com/spacelibres/STKCraft-Geocalc/blob/main/web/lib/server.ts
- https://github.com/spacelibres/STKCraft-Geocalc/blob/main/web/native/Cargo.toml
- https://github.com/spacelibres/STKCraft-Geocalc/blob/main/tools/bootstrap_reference.py
- https://github.com/spacelibres/STKCraft-Geocalc/blob/main/docs/NUMERICS.md
- https://github.com/spacelibres/STKCraft-time/blob/main/Cargo.toml
- https://github.com/spacelibres/STKCraft_web/blob/main/deploy/README.md
