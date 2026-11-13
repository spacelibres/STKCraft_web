# Changelog

All notable changes to the STKCraft launch site are recorded here.

The site follows a simple release rule: **every commit that changes the product is a release-shaped
step**. The smallest version component goes up by one, and the matching section is added in the
same commit. `pnpm build` enforces the match between `package.json` and the newest heading.

## [0.1.14] — 2026-11-13 — Automatic GitHub updates on the VPS

### Added

- Boot-persistent five-minute GitHub polling for the main site, GeoCalc and time.
- Isolated GeoCalc candidate builds with the current compatible time source,
  recorded dependency resolution, integration gates and startup rollback.
- Serialized update jobs, build resource limits and failed-candidate cleanup.

### Changed

- Native wrappers and integration verifier accept an explicit candidate root.
- Main-site and module builds share a lock to protect the VPS memory budget.

## [0.1.13] — 2026-11-13 — Independent GeoCalc workspace and module links

### Added

- Bilingual modules section, navigation and footer links to the independent
  GeoCalc workspace and the GeoCalc and STKCraft-time repositories.
- Dedicated GeoCalc service, trusted-client-IP request limiter, CPU/memory/task
  budgets and bounded native execution for the 2 GiB VPS.
- Locked build, pinned web-kernel preparation, staged activation and operations
  documentation separate from the static main-site deployment.
- Public-host UI overlay for the return-to-main-site link and five-second
  playback cadence, verified against the VPS capacity.

## [0.1.12] — 2026-11-13 — GeoCalc deployment design

### Added

- Source-verified deployment design for an independent GeoCalc service and
  bilingual home-page module links, including the existing STKCraft-time bridge.
- Public-access request budgets, process resource limits, pinned-kernel setup,
  acceptance checks and rollback requirements for architecture review.
- Recorded outstanding DNS and SSH prerequisites; no live deployment is claimed.

## [0.1.11] — 2026-11-07 — Footer-aware section menu

At the end of the page the fixed section index now gets out of the footer's way
instead of sitting on top of it.

### Changed

- `SectionIndex` tracks the footer position and translates upward as the footer
  enters the viewport, keeping a 24px gap above it.
- The menu remains bottom-fixed through the normal reading flow; it only moves
  when the footer would collide with it.
- The moved menu still shows the active section and the blue active rule.

## [0.1.10] — 2026-11-07 — Ruler density matched to ArtCraft

The 0–100 scale was structurally right but stretched by our longer page, so
5% occupied more vertical space than the official rail and the 1% ticks looked
sparse.

### Fixed

- The ruler scale now uses the rail height (7.5× the usable rail) instead of
  the document height. At a 1000px viewport, 5% is ~348px, matching ArtCraft.
- At 50% scroll, the 45/50/55 labels land at roughly 176/524/872px; the
  official rail measures roughly 177/523/870px.
- Increased minor tick contrast and restored the official geometry: 20px major
  ticks, 10px minor ticks, labels 24px from the right edge.
- The 0–100 endpoints now stay at the top and bottom of the rail regardless of
  document length, so 100% remains visible.

## [0.1.9] — 2026-11-07 — ArtCraft-style page ruler

The right side is now a real 0–100 page-position instrument instead of a
section list mixed with a progress line.

### Changed

- Replaced the old section-index/ruler overlap with a fixed 60px ruler:
  labels every 5%, minor ticks every 1%, a moving document scale, a live
  three-digit percent readout, and a blue cursor line.
- Added the same soft blur and left-edge fade as the ArtCraft rail, with a
  restrained light/dark treatment.
- Moved the fixed section index to the left of the ruler so it no longer covers
  the tick labels. It now has a bolder active state and accent rule.
- Added a reserved rail gutter at wide viewports; the ruler hides below 1180px
  and the section index below 1200px.
- Added visual density without changing the content: blue section markers,
  oversized ghost indexes in the craft cards, hover rules on feature and
  principle cards, coloured category dots on family cards, a subtle hero tint
  and a 00–100 scroll cue.
- Slightly tightened the hero wordmark and subhead so the first screen breathes
  more like the official site.

### Fixed

- The ruler no longer collides with the section navigation.
- The current major label is hidden under the live percentage cursor, so 50 and
  050% do not stack on top of each other.

## [0.1.8] — 2026-11-07 — TypeScript-only runtime

The visitor collector and HTTP service are now TypeScript, matching the rest of
the site. No Python remains in the application or deployment.

### Changed

- `webhook.py` and `visitor_log.py` are replaced by `deploy/webhook.ts` and
  `deploy/visitor-log.ts`, run with `tsx` on Node 22.
- GeoIP lookup uses the `maxmind` package; CSV parsing uses `csv-parse` and
  `csv-stringify`; IP classification uses `ipaddr.js`.
- The GeoIP refresher is `deploy/update-geoip.ts`; the readable table is
  `pnpm visitors`.
- The installer now runs `pnpm install` before starting the TypeScript webhook
  service. Shell remains only for bootstrap, systemd and deploy glue.

### Removed

- Python webhook/collector scripts, the Python GeoIP updater, the Python-based
  viewer, the standalone font helper and the internal Python planning snippets.
- The `python3-maxminddb` system dependency.

## [0.1.7] — 2026-11-07 — Token-protected visitor API

The visitor CSV is now readable over HTTPS without an SSH session.

### Added

- `GET /api/visitors` on `https://www.stkcraft.com`, backed by the private
  loopback service and protected by a 256-bit bearer token.
- JSON by default (`count`, `generated_at`, `fields`, `rows`) and
  `?format=csv` for a downloadable CSV.
- Token at `/etc/stkscraft/visitors.token` (0600), generated by the installer.
- `no-store` and `noindex` response headers; no CORS; no public link.
- `/api/visitors` requests are excluded from visitor statistics.

### Security

- Requests without the token return `401`.
- The endpoint is read-only and never exposes the webhook secret.
- Token rotation is a file replacement plus a webhook-service restart.

## [0.1.6] — 2026-11-07 — Visitor collector log-rotation fix

### Fixed

- The collector decodes each Caddy log line as UTF-8 explicitly before JSON
  parsing. A truncated log file can leave NUL padding; `json.loads(bytes)` was
  auto-detecting UTF-32 and aborting the whole collection run.
- The production access log was reset cleanly after the initial test so test
  traffic does not count as a visitor.

## [0.1.5] — 2026-11-07 — Private unique-visitor CSV

A small, private traffic record for the operator. Nothing is exposed to
visitors and there is no third-party analytics script.

### Added

- Caddy JSON access logging for `www.stkcraft.com` at
  `/var/log/caddy/stkscraft-access.log`.
- An initial incremental collector (superseded by the TypeScript collector in
  0.1.8) that keeps one CSV row per unique client IP, with first/last seen,
  hits, country, region, city, last path, referer and user agent.
- `stkscraft-visitors.timer`: runs every five minutes.
- Local DB-IP Lite city database, refreshed monthly by
  `stkscraft-geoip.timer`, with attribution to DB-IP (CC BY 4.0).
- `deploy/show-visitors.sh` for a readable root-only table over SSH
  (superseded by `pnpm visitors` in 0.1.8).

### Security and privacy

- CSV at `/var/lib/stkscraft/visitors.csv`, mode `0600`, outside the web root.
- Log directory `0750 caddy:caddy`; no public endpoint or dashboard.
- Loopback/private addresses, `/health` and `/webhook` are excluded.

## [0.1.4] — 2026-11-07 — Cache-busted updates

The webhook was deploying, but the logo URL had been cached by browsers for 30
days. This release makes mutable assets revalidate and gives the changed logo a
new URL.

### Changed

- Caddy now sends `Cache-Control: no-cache` for HTML and mutable assets. Only
  hashed `/_next/static/*` files keep the one-year immutable cache.
- The SVG logo and metadata images carry a version query (`?v=0.1.4`) to bypass
  already-cached copies.
- The webhook guide documents that `204` means an ignored tag/non-main ref and
  `202` means a deploy was queued.

### Fixed

- A push to `main` now updates the visible logo immediately instead of waiting
  for the previous 30-day browser cache to expire.
- The VPS build and the live asset hash are verified to match the commit.

## [0.1.3] — 2026-11-07 — Self-contained blue vector mark

The updated logo now carries its own blue rounded tile, so the page can use the
vector exactly as supplied.

### Changed

- Replaced `public/brand/albatross.svg` with the latest supplied vector. It
  includes the blue `#2d81ff` rounded background and the engraving.
- Header, family feature and footer images now load the SVG as-is, with no CSS
  padding, background or extra rounding. The vector fills its tile at every
  size.
- Regenerated the favicon, Apple Touch Icon and Open Graph card from the new
  self-contained SVG.

### Removed

- The CSS blue-tile wrapper and padding that were needed for the previous
  transparent SVG.

### Fixed

- The logo is now a true vector on the page at all sizes; no PNG is used for
  the page identity.

## [0.1.2] — 2026-11-07 — Vector identity and HTTPS-only serving

The supplied vector logo is now what the page actually uses, and the temporary
public port is gone.

### Changed

- Header, family feature and footer logos now load `public/brand/albatross.svg`
  directly, with the ArtCraft blue supplied by CSS. The favicon, Apple icon and
  Open Graph card are regenerated from that same vector.
- The public site is served only over HTTPS on `www.stkcraft.com`; port 80
  redirects and answers ACME. The webhook remains on
  `https://www.stkcraft.com/webhook`, with its upstream on loopback.

### Removed

- The public `:8787` Caddy site and every `http://176.122.160.172:8787/`
  reference.
- The separate `Caddyfile.domain` / `enable-domain.sh` step; the HTTPS site is
  now the only installed Caddy block.
- The obsolete transparent `albatross-flight.svg` master.

### Fixed

- The page no longer uses a PNG rendering of an older logo; it uses the current
  vector artwork.
- The default branch, README, About panel, release tags and changelog all agree
  on the current state of the repository.

## [0.1.1] — 2026-11-07 — Repository hygiene and launch metadata

A cleanup release: the site is live on the VPS, the repository is back to one development branch,
and the README, About panel and release process now describe the project accurately.

### Added

- Albatross logo at the top of the README, with version, stack and licence badges.
- `CHANGELOG.md` and `scripts/check-version.mjs`; `pnpm build` now fails if the newest changelog
  version and `package.json` disagree.
- `CONTRIBUTING.md` documenting the one-branch, patch-bump release flow.
- GitHub About metadata: description, homepage and topics.

### Changed

- Deployment is **VPS + signed GitHub webhook** at `https://www.stkcraft.com/`; the webhook is the
  only automatic deploy path.
- The copy and metadata present STKCraft as an **independent project preparing to join** the
  ArtCraft Craft family, not as an announced member. A visible disclaimer sits under the family
  grid and the OG image says “Preparing to join ArtCraft”.
- The correct live domain is `www.stkcraft.com` (the earlier `stkscraft.com` spelling was a typo).
- The family grid shows the official ArtCraft app icons at 84px, with the STKCraft feature mark at
  112px and the header mark at 34px.

### Removed

- GitHub Pages workflow and the `gh-pages` deployment branch.
- The temporary `feat/launch-site` branch.
- `public/CNAME` and the unused GitHub Pages custom-domain setup.
- All GitHub Actions workflows; deployment is now the webhook receiver on the VPS.

### Fixed

- The webhook no longer returns `500`: deployment is started through `/bin/bash`, and the deploy
  scripts are executable in Git.
- Caddy runs as an enabled service with `Restart=always`; the webhook service is enabled too.
- The HTTPS certificate for `www.stkcraft.com` is issued by Let's Encrypt through Caddy.

## [0.1.0] — 2026-11-07 — STKCraft launch site

The first public launch site.

### Added

- Next.js 16 App Router site in TypeScript, exported as static files.
- Giant STKCraft wordmark, albatross-in-flight identity on ArtCraft blue, and a light/dark theme
  that follows the system and remembers a manual choice.
- Interactive illustrative mission workspace: orthographic globe, ground track, station, access
  cone, pass windows, elevation/range readouts and a 24-hour scrubber.
- The craft, family, principles, status and get-started sections.
- English at `/` and Chinese at `/zh/`, with complete translated copy and typography overrides.
- Official ArtCraft app icons in the family grid, linking to each app page.
- Open Graph card, favicon, Apple touch icon, PWA manifest, sitemap and robots rules.
- VPS installer, isolated Caddy site on port `8787`, webhook receiver and signed push deployment.
