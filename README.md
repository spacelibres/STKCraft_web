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
  <img alt="Version 0.1.2" src="https://img.shields.io/badge/version-0.1.2-2d81ff?style=flat-square">
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
python -m http.server 4173 --directory out
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
  brand/albatross.svg   albatross vector master (transparent; page supplies the blue tile)
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

For example, `0.1.2` becomes `0.1.3`. The `version` field in `package.json` is the single source
of truth; `pnpm build` runs `pnpm check:version` first and fails when the newest changelog heading
does not match.

Release flow:

1. Update `package.json` and add a `## [x.y.z] — title` section to `CHANGELOG.md`.
2. Run `pnpm check:version && pnpm build`.
3. Commit with a message that names the release, then push `main`.
4. The GitHub webhook deploys the commit to the VPS automatically.

There is **one development branch: `main`**. Feature branches are temporary, merged and deleted.
The old `feat/launch-site` branch and the GitHub Pages `gh-pages` branch have been removed.

## Deployment

The site is served by Caddy on the VPS at `https://www.stkcraft.com/`, from
`/var/www/stkscraft`. Pushing to `main` triggers the GitHub webhook at
`https://www.stkcraft.com/webhook`; the receiver validates `X-Hub-Signature-256`, pulls, builds
and swaps the live root only after a successful build.

- Installer: [`deploy/install.sh`](deploy/install.sh)
- Deploy script: [`deploy/deploy.sh`](deploy/deploy.sh)
- Webhook receiver: [`deploy/webhook.py`](deploy/webhook.py)
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
