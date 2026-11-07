# Changelog

All notable changes to the STKCraft launch site are recorded here.

The site follows a simple release rule: **every commit that changes the product is a release-shaped
step**. The smallest version component goes up by one, and the matching section is added in the
same commit. `pnpm build` enforces the match between `package.json` and the newest heading.

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
