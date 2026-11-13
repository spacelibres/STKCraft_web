<p align="center">
  <img src="public/brand/albatross.png" width="120" alt="STKCraft albatross logo">
</p>

<h1 align="center">STKCraft</h1>

<p align="center"><strong>Know when the sky opens.</strong></p>

<p align="center">
  <a href="https://www.stkcraft.com">Live site</a> ·
  <a href="https://www.stkcraft.com/zh/">中文</a> ·
  <a href="https://github.com/spacelibres/STKCraft">Product source</a> ·
  <a href="CHANGELOG.md">Changelog</a>
</p>

<p align="center">
  <img alt="Version 0.1.14" src="https://img.shields.io/badge/version-0.1.14-2d81ff?style=flat-square">
  <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-000?style=flat-square&logo=nextdotjs">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="MIT" src="https://img.shields.io/badge/license-MIT-2d81ff?style=flat-square">
</p>

The official launch site for [STKCraft](https://github.com/spacelibres/STKCraft), built in the
visual language of the ArtCraft Craft family while preparing to join it.

STKCraft is an independent project. It has not yet been announced as an official ArtCraft Craft
app; the family section describes the standard it is preparing to meet and shows the family it
hopes to join.

## About

**STKCraft** is open-source space mission analysis: build a scenario of satellites, ground
stations, sensors and targets, propagate it, and read the access windows. This repository is its
public launch site — a bilingual, static Next.js site deployed on a VPS and updated from GitHub
through a signed push webhook.

- **Website:** <https://www.stkcraft.com>
- **Chinese:** <https://www.stkcraft.com/zh/>
- **Product source:** <https://github.com/spacelibres/STKCraft>
- **Deployment:** Caddy on the VPS, HTTPS only on `www.stkcraft.com`
- **Repository:** <https://github.com/spacelibres/STKCraft_web>

## What this is

A single-page, bilingual product site with:

- the STKCraft wordmark and albatross-in-flight identity;
- an interactive, illustrative mission workspace (globe, orbit, station, access windows);
- the ArtCraft family context and the standard STKCraft is preparing to meet;
- an honest early-alpha status and roadmap;
- private, root-only unique-IP visitor statistics (never exposed on the site);
- English at `/`, Chinese at `/zh/`;
- light and dark themes, following the system preference and remembering a manual choice;
- a static export deployed to a VPS and refreshed by GitHub webhook.

The page is design-led: warm paper, 1px rules, Archivo display type, Instrument Serif accents,
Geist Mono labels and the ArtCraft blue. It follows the family's visual rules; it does not copy
ArtCraft page code.

## Stack

- **Next.js 16** (App Router, static export)
- **TypeScript**
- **React 19**
- **d3-geo** for the orthographic globe
- plain CSS with custom properties (no CSS framework)
- self-hosted, OFL-licensed fonts
- Caddy on the VPS, GitHub push webhook for deployment

## Local development

```sh
pnpm install
pnpm dev
```

Open <http://localhost:3000>. The Chinese page is at <http://localhost:3000/zh/>.

Production build and static export:

```sh
pnpm build
# static files are written to out/
```

Preview the exported site:

```sh
pnpm dlx serve@14 out --listen 4173
```

Type-check and version check:

```sh
pnpm typecheck
pnpm check:version
```

## Project structure

```
app/
  layout.tsx            root document, fonts, metadata, theme boot script
  page.tsx              English landing page and metadata
  zh/page.tsx           Chinese landing page and metadata
  not-found.tsx         404
  icon.png              favicon / app icon (the albatross mark)
  fonts/                self-hosted WOFF2 files
  globals.css           CSS entry point
components/
  SitePage.tsx          composes header, sections, footer and instrumentation
  Header.tsx            navigation, language link, theme switch, mobile menu
  Hero.tsx              wordmark and first view
  HeroCanvas.tsx        starfield and slow orbital arcs
  MissionConsole.tsx    interactive illustrative workspace
  ...                   one component per section
lib/
  content.ts            English and Chinese copy, typed
  land.ts               Natural Earth 110m land, public domain
styles/
  base.css              tokens, reset, typography, Chinese overrides
  layout.css            header, frame, footer shell
  sections.css          page sections
  console.css           the dark app window
public/
  brand/albatross.svg   albatross vector mark with its own blue tile
  brand/albatross.png   512px blue mark for README/social
  apps/                 official ArtCraft app icons used in the family grid
  og.png                social card
  app-icon-512.png      app icon
  apple-touch-icon.png  iOS icon
  robots.txt, sitemap.xml
deploy/                 VPS installer, Caddy config and webhook receiver
```

## Editing copy

All user-facing copy lives in `lib/content.ts`:

- `en` is the source text.
- `zh` implements the same typed shape.
- Both are rendered on the server; there is no runtime translation fetch.

The demo readouts (pass windows, elevation, range) are computed in `components/MissionConsole.tsx`
from a fixed, illustrative circular orbit. They are labelled **not SGP4** on the page. Do not
present them as mission output.

## Versioning and changelog

**Every change to the site bumps the smallest version component by one and updates
[`CHANGELOG.md`](CHANGELOG.md) in the same commit.**

For example, `0.1.14` becomes `0.1.15`. The `version` field in `package.json` is the single source
of truth; `pnpm build` runs `pnpm check:version` first and fails when the newest changelog heading
does not match.

Release flow:

1. Update `package.json` and add a `## [x.y.z] — title` section to `CHANGELOG.md`.
2. Run `pnpm check:version && pnpm build`.
3. Commit with a message that names the release, then push `main`.
4. The GitHub webhook deploys the commit to the VPS automatically.

There is **one development branch: `main`**. Feature branches are temporary, merged and deleted.
The old `feat/launch-site` branch and the GitHub Pages `gh-pages` branch have been removed.

## Private visitor statistics

There is no public analytics dashboard. Caddy writes JSON access logs, and a
systemd timer turns them into a private CSV on the server.

- Access log: `/var/log/caddy/stkscraft-access.log` (directory `0750 caddy:caddy`)
- CSV: `/var/lib/stkscraft/visitors.csv` (`0600 root:root`, outside `/var/www`)
- One row per unique IP: first/last seen, hits, country code/country, region,
  city, last path, last referer and last user agent
- `localhost`, private ranges, `/health` and `/webhook` requests are excluded
- Collector: `stkscraft-visitors.timer` every five minutes
- GeoIP: local DB-IP Lite city database, refreshed monthly by
  `stkscraft-geoip.timer`; attribution: <https://db-ip.com> (CC BY 4.0)

View it over SSH only:

```bash
ssh root@176.122.160.172 'cd /opt/stkscraft && pnpm visitors'
# or the raw file
ssh root@176.122.160.172 'cat /var/lib/stkscraft/visitors.csv'
```

### Read-only API

The same data is available through a token-protected endpoint, so no SSH session
is needed:

```text
GET https://www.stkcraft.com/api/visitors
```

Authenticate with `Authorization: Bearer <token>` or, for a browser bookmark,
`?token=<token>`. JSON is the default; add `&format=csv` to download the CSV.

```bash
TOKEN=$(ssh root@176.122.160.172 'cat /etc/stkscraft/visitors.token')
curl -sS -H "Authorization: Bearer $TOKEN" https://www.stkcraft.com/api/visitors
curl -sS -H "Authorization: Bearer $TOKEN" 'https://www.stkcraft.com/api/visitors?format=csv'
```

The token is generated on the server at `/etc/stkscraft/visitors.token` (0600).
The endpoint sends `Cache-Control: no-store` and `X-Robots-Tag: noindex`, has no
CORS policy, and is not linked from the public page. Rotate it by replacing that
file and restarting `stkscraft-webhook`.

Implementation: [`deploy/visitor-log.ts`](deploy/visitor-log.ts) and
[`deploy/webhook.ts`](deploy/webhook.ts). All runtime services are TypeScript;
shell is only the one-time bootstrap/deploy glue.

## Deployment

The VPS also checks GitHub every five minutes for main-site, GeoCalc and time
updates. See [automatic update operations](deploy/auto-update/README.md).

GeoCalc runs independently at <https://geocalc.stkcraft.com/>. Both home-page
languages link to it and to the GeoCalc and STKCraft-time module repositories.
See [the GeoCalc operations guide](deploy/geocalc/README.md) for its dedicated
native build, pinned kernels, service limits and proxy configuration.

The site is served by Caddy on the VPS at `https://www.stkcraft.com/`, from
`/var/www/stkscraft`. Pushing to `main` triggers the GitHub webhook at
`https://www.stkcraft.com/webhook`; the receiver validates `X-Hub-Signature-256`, pulls, builds
and swaps the live root only after a successful build.

- Installer: [`deploy/install.sh`](deploy/install.sh)
- Deploy script: [`deploy/deploy.sh`](deploy/deploy.sh)
- Webhook and visitor API: [`deploy/webhook.ts`](deploy/webhook.ts)
- Visitor collector: [`deploy/visitor-log.ts`](deploy/visitor-log.ts)
- Caddy config: [`deploy/Caddyfile.stkscraft`](deploy/Caddyfile.stkscraft)
- Operations guide: [`deploy/README.md`](deploy/README.md)

There is no GitHub Pages deployment and no GitHub Actions workflow. The only automatic deploy
path is the signed webhook.

### DNS

`www.stkcraft.com` points at the VPS:

| Type | Name | Value |
|---|---|---|
| A | `www` | `176.122.160.172` |
| AAAA | `www` | `2607:8700:5501:67ab::2` |

Caddy manages the Let's Encrypt certificate. The apex `stkcraft.com` is not currently published.
The old GitHub Pages A/CNAME records are no longer used.

## Licensing

- Site code: MIT (see `LICENSE`).
- STKCraft albatross artwork: supplied project artwork, © the STKCraft/ArtCraft team.
  The site code is MIT; the artwork is not relicensed by that grant.
- Fonts: SIL Open Font License. Licence texts are in `public/fonts/licenses/`.
- Natural Earth 110m land: public domain. Source noted in `lib/land.ts`.
- ArtCraft app icons in `public/apps/` are the official marks of the corresponding Craft apps,
  loaded from `getartcraft.com` and used to identify the family. They remain © the ArtCraft
  Team and are not relicensed by this repository's MIT grant.
- ArtCraft name and marks are trademarks of the ArtCraft Team.
