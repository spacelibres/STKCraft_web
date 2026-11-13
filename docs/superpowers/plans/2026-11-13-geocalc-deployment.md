# GeoCalc Deployment Implementation Plan

> Execute inline using executing-plans; no delegated work is required.

**Goal:** Publish the independent GeoCalc workspace and link both modules from the bilingual main site.

**Architecture:** Caddy terminates HTTPS for geocalc.stkcraft.com and forwards to a loopback Nginx limiter, then a systemd-managed Next server. Native geometry and time processes share that service's resource budget.

**Tech Stack:** Next.js, Rust, Python 3, Caddy, Nginx, systemd.

## Constraints

- Preserve existing services and main-site deployment; use ports 3100/3101.
- Public access with bounded requests, concurrency, CPU, memory and tasks.
- Preserve upstream numerical behavior, pinned kernels and named STKCraft brand.
- No credentials in repository files. Version/changelog bump and verified commit.

## Tasks

Checkboxes record the pre-publication checkpoint. The final live main-site check
is performed after committing and publishing this release.

- [x] Inspect live source, server services and DNS; record deployed source SHA.
- [x] Add reproducible service, limiter, Caddy and deployment documentation under deploy/geocalc/.
- [x] Build the locked geometry/time backends and Next workspace; bootstrap pinned kernels. Run web scene and integration checks before opening traffic.
- [x] Activate dedicated service and proxy; check HTTPS, calculation, time, invalid inputs, throttling, restart and existing-site health.
- [x] Add ModulesSection.tsx, bilingual copy in lib/content.ts, header/footer/index links, and responsive rules in styles/sections.css.
- [x] Run pnpm typecheck, pnpm build, version gate and rendered desktop/mobile checks; verify all three module targets in each static export.
- [ ] Commit the patch release, publish main and verify the live home pages and independent workspace. Record evidence and remove temporary deployment access.

## Verification commands

```sh
cargo build --release --locked --features mcp --bins
cargo build --release --manifest-path web/native/Cargo.toml --locked
python3 tools/bootstrap_reference.py --kernels-only
cd web && npm ci && npm run typecheck && npm run build && npm run test:scene
npm run test:integration
```

```sh
pnpm typecheck
pnpm build
git diff --check
curl -I https://geocalc.stkcraft.com/
curl https://geocalc.stkcraft.com/api/catalog
```

For proxy acceptance, send controlled excess requests and expect HTTP 429;
then verify static assets and both main-site languages still return 200.
Test UTC-to-ET at J2000 and a Moon/Earth state vector with the configured
kernel context. Check systemctl resource limits and restart the service.
If any required live calculation fails, retain the existing main page until resolved.
