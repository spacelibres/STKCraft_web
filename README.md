# STKCraft — launch site

The official launch site for [STKCraft](https://github.com/spacelibres/STKCraft), built as a
member of the ArtCraft Craft family.

**Live:** <https://www.stkscraft.com>  
**Repository:** <https://github.com/spacelibres/STKCraft_web>

## What this is

A single-page, bilingual product site with:

- a giant STKCraft wordmark and the STKCraft albatross-in-flight identity;
- an interactive, illustrative mission workspace (globe, orbit, station, access windows);
- the ArtCraft family story and shared principles;
- an honest early-alpha status and roadmap;
- English at `/`, Chinese at `/zh/`;
- light and dark themes, following the system preference and remembering a manual choice;
- a static export deployed to GitHub Pages.

The page is design-led: warm paper, 1px rules, Archivo display type, Instrument Serif accents,
Geist Mono labels and the ArtCraft blue. It follows the family's visual rules; it does not copy
ArtCraft artwork, icons or page code.

## Stack

- **Next.js 16** (App Router, static export)
- **TypeScript**
- **React 19**
- **d3-geo** for the orthographic globe
- plain CSS with custom properties (no CSS framework)
- self-hosted, OFL-licensed fonts
- GitHub Actions → GitHub Pages

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

Type-check only:

```sh
pnpm typecheck
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
  brand/albatross.svg   albatross mark (blue background master)
  brand/albatross-flight.svg  transparent artwork master
  brand/albatross.png   512px UI mark
  og.png                social card
  app-icon-512.png      app icon
  apple-touch-icon.png  iOS icon
  CNAME                 custom domain
  robots.txt, sitemap.xml
```

## Editing copy

All user-facing copy lives in `lib/content.ts`:

- `en` is the source text.
- `zh` implements the same typed shape.
- Both are rendered on the server; there is no runtime translation fetch.

The demo readouts (pass windows, elevation, range) are computed in `components/MissionConsole.tsx`
from a fixed, illustrative circular orbit. They are labelled **not SGP4** on the page. Do not
present them as mission output.

## Deployment

The workflow in `.github/workflows/pages.yml` installs, builds and deploys `out/` on every push
to `main`.

1. Push to `main`.
2. In **Settings → Pages**, set the source to **GitHub Actions**.
3. Set the custom domain to `www.stkscraft.com`.
4. Add the DNS records below.
5. Enable **Enforce HTTPS** after GitHub verifies the domain.

### DNS

For the `www` host:

| Type | Name | Value |
|---|---|---|
| CNAME | `www` | `spacelibres.github.io` |

For the apex domain:

| Type | Name | Value |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |

The repository cannot configure DNS. Until the records exist, the site is available at
`https://spacelibres.github.io/STKCraft_web/`.

## Licensing

- Site code: MIT (see `LICENSE`).
- STKCraft albatross artwork: supplied project artwork, © the STKCraft/ArtCraft team.
  The site code is MIT; the artwork is not relicensed by that grant.
- Fonts: SIL Open Font License. Licence texts are in `public/fonts/licenses/`.
- Natural Earth 110m land: public domain. Source noted in `lib/land.ts`.
- ArtCraft name and marks: trademarks of the ArtCraft Team, used nominatively. No ArtCraft
  artwork or code is included.
