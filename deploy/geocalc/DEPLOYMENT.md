# Deployment evidence: 2026-11-13

- Workspace: https://geocalc.stkcraft.com/
- Home-page links: https://www.stkcraft.com/#modules and https://www.stkcraft.com/zh/#modules
- GeoCalc source: `2754fd77d45d35f175e2fc67dbcd4a5bb2c826ef`
- Geometry 0.2.1; web 0.1.1; compiled time dependency 0.2.0 from the upstream
  lockfiles. The independent time repository link points to its current source.
- Eight default SPICE kernels verified against upstream pinned SHA256 values;
  server manifest: `/opt/stkcraft-geocalc/target/web-kernels.json`.
- Native locked release builds, web typecheck and production build passed.
- Upstream scene checks: 13 passed, 0 failed. Integration checks: 10 passed,
  0 failed. Python NASA comparison unit checks: 8 passed. These are deployment
  checks, not a certification of complete NASA or Windows native parity.
- Public HTTPS checks: workspace and API reference 200; catalog contains
  24 geometry/finder tools and 20 time tools; UTC-to-ET and Moon/Earth state
  vector requests succeed. Invalid UTC and client kernel paths are rejected.
- Controlled 24-request public burst with varying spoofed client-IP headers:
  12 successful responses and 12 JSON 429 responses. Static workspace and both
  main-site languages remain available. Visitor API remains protected (401).
- Desktop and mobile workspace rendering inspected. Playback sample: 24
  consecutive completed API requests returned 200, with no throttled responses
  after applying the five-second playback overlay. Main-site module section
  checked at desktop, tablet and mobile widths, in light and dark themes.
- Runtime listeners restricted to 127.0.0.1:3100 and 127.0.0.1:3101. Application
  memory cap 768 MiB, CPU cap 150%, task cap 96; two concurrent geometry
  processes maximum. Observed service memory peak during checks: about 423 MiB.
- Both dedicated services enabled at boot. Application restart verified;
  no automatic application restarts occurred during the final checks.
- Existing Caddy binary and main-site block preserved. Automatic HTTPS
  certificate issuance succeeded on retry; no TLS verification bypass used.

Runtime configuration and scripts are in `/etc/stkcraft-geocalc`. Build and test
logs are `/var/log/geocalc-build.log` and `/var/log/geocalc-verify.log`.
Future upstream updates require reapplying and verifying the tracked UI overlay
against a clean candidate checkout before switching the running service.
