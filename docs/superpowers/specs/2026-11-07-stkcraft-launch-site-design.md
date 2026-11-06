# STKCraft Launch Site — Design

**Date:** 2026-11-07  
**Status:** Awaiting user review  
**Target:** <https://www.stkscraft.com>  
**Repository:** <https://github.com/spacelibres/STKCraft_web>

## 1. Purpose

STKCraft needs an official launch site: a page that makes a first-time visitor understand,
within a few seconds, that this is a serious open-source space mission-analysis tool and that
it belongs to the ArtCraft family.

The site is not a generic SaaS landing page. It is an editorial product page in the ArtCraft
house style, with STKCraft's own subject, evidence and identity. Its job is to earn a click
to the source, the roadmap or the community — not to invent a download that does not exist.

### Success criteria

- A visitor can answer **what STKCraft does**, **who it is for**, and **how to get involved**
  without scrolling past the first section.
- The page reads as a sibling of <https://getartcraft.com>, not as a fan imitation: same grid,
  typography, rules, tone, theme behaviour and section rhythm.
- The albatross identity is unmistakably STKCraft and unmistakably at home beside the other
  Craft animal marks.
- English and Chinese are both complete, including navigation, controls, metadata and
  accessibility labels.
- Light and dark themes both look intentional; system preference is respected and remembered.
- The page is fast, keyboard-accessible, and useful with JavaScript or animation disabled.

## 2. Audience and voice

**Audience:** mission analysts, astrodynamics engineers, Rust and open-source developers, and
ArtCraft users who want to know what the next craft is.

**Voice:** understated, technical, precise, confident. Short declarative sentences. No
"revolutionary", no invented benchmarks, no fake customer logos. The product is early alpha,
and the page says so without apologising for it.

The central promise:

> Know when the sky opens.

STKCraft builds a scenario of satellites, stations, sensors and targets; propagates it; and
answers when one can see another, and for how long.

## 3. Visual system

The system is derived from ArtCraft's public site and adapted, not copied wholesale. No
ArtCraft artwork, icon files or font binaries are copied into this repository.

### 3.1 Tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#f2f1ee` | `#121316` | page |
| `--bg-raised` | `#faf9f7` | `#101014` | raised surfaces |
| `--bg-sunken` | `#e9e8e4` | `#060607` | sunken surfaces |
| `--ink` | `#101014` | `#f2f1ee` | text |
| `--muted` | `#1010149e` | `#f2f1ee99` | secondary text |
| `--faint` | `#1010146b` | `#f2f1ee61` | meta text |
| `--line` | `#10101429` | `#f2f1ee26` | hairline rules |
| `--line-strong` | `#10101466` | `#f2f1ee66` | strong rules |
| `--accent` | `#2d81ff` | `#2d81ff` | emphasis, links |
| `--accent-ink` | `#1659c4` | `#74aaff` | accent text on light/dark |
| `--invert-bg` | `#101014` | `#ffffff` | primary button |
| `--invert-fg` | `#f2f1ee` | `#0b0b0c` | primary button text |

The app window embedded in the page is always dark, because the product's viewport is dark.
That contrast is deliberate: the page is paper, the product is glass.

### 3.2 Typography

- **Display:** Archivo variable, weight 620–750, width 118–125%, tight tracking. Letters are
  large, black and confident. All caps for the hero wordmark and major statements.
- **Body:** Inter, 16–20px, relaxed line height, muted ink.
- **Accent:** Instrument Serif italic for one or two words in a headline, never a whole
  paragraph. Chinese uses an accent colour instead of an italic face.
- **Labels:** Geist Mono, 11–12px, uppercase, wide tracking.
- **Chinese:** system CJK stack (`"Noto Sans SC"`, `"PingFang SC"`, `"Microsoft YaHei"`),
  with display sizes reduced 10–15% to preserve line breaks.

Fonts are open source (SIL OFL), self-hosted as latin subsets with their licence files.
Chinese is not bundled as a multi-megabyte webfont; system fonts keep the page fast.

### 3.3 Grid and components

- Content width: 1280px, side gutters 24px mobile / 40px desktop.
- A 1px rule frames the page content. Sections are separated by horizontal rules, and
  multi-column blocks by vertical rules.
- A section header row: `01 / THE CRAFT` in mono on the left, a short status phrase on the
  right.
- A fixed right-hand section index appears on wide screens only; it is decorative navigation,
  hidden on mobile and below 1100px.
- Buttons are square, 48px tall, mono uppercase, icon plus label. Primary is inverted;
  secondary is a hairline outline. No rounded corners, no shadows.
- Cards are not floating boxes. They are cells in a ruled grid, with generous padding.
- The app window is the one exception: it has a subtle 1px border, a dark fill and a soft
  outer glow, so it reads as a physical screen.

### 3.4 Motion

- Hero/first-view content fades and rises 8–12px over 500ms, staggered.
- Sections reveal once on scroll with a short opacity/translate transition.
- The orbital canvas animates continuously but slowly; it pauses when offscreen or when the
  page is hidden.
- `prefers-reduced-motion: reduce` removes all non-essential motion and renders a static
  orbital frame.
- No scroll-jacking, no custom cursor, no autoplaying sound.

## 4. Identity

### 4.1 The albatross mark

A wandering albatross head in three-quarter profile, facing right, drawn as original
black-ink linework with a warm-ivory fill on a deep sky-blue rounded square. It has the long
hooked beak, tube nostril and calm eye of a real albatross, not a generic bird silhouette.
A thin black orbital arc passes behind the head, tying the animal to the product's subject.

The mark must work at 512px (app icon), 128px (family strip) and 32px (favicon). At 32px the
head remains readable; the arc may drop out.

### 4.2 Wordmark

`STKCRAFT` set in Archivo 750, width 125%, tracking -0.02em, all caps. The wordmark is plain
type; the albatross is the separate mark. This mirrors the family's separation between the
geometric ArtCraft monogram and its app illustrations.

Hero treatment: a single line of `STKCRAFT` at 14.2cqw, centred, with a very subtle radial
halo. On small screens it scales down and may use two lines only below 360px.

### 4.3 Asset rules

- All new artwork is original SVG or CSS; no downloaded ArtCraft icon is committed.
- The ArtCraft name and links are used nominatively; the footer notes that the ArtCraft name
  and marks belong to the ArtCraft Team.
- The albatross illustration is original work for this repository and is licensed with the
  site's code (MIT), unless a separate licence is stated.

## 5. Page structure

### Header

Sticky 48px bar, hairline bottom border. Left: albatross mark, `STKCRAFT` wordmark, then
`HOME / THE CRAFT / WORKSPACE / FAMILY / PRINCIPLES / STATUS` in mono. Right: language
toggle `EN / 中`, theme toggle, and a compact `GITHUB ↗` button. On mobile the nav collapses
to a menu button; the language/theme controls remain visible.

### 1. Hero

- Giant `STKCRAFT` wordmark.
- H1: **Know when the sky opens.**
- Subhead: open-source space mission analysis. Build a scenario of satellites, ground
  stations, sensors and targets; propagate it; see exactly when one can see another.
- Primary CTA: `EXPLORE THE CRAFT` (scrolls to section 01).
- Secondary CTA: `VIEW SOURCE ↗` (GitHub).
- Meta line: `OPEN SOURCE · PURE RUST · EARLY ALPHA · NO SUBSCRIPTION`.
- Background: a restrained starfield and three slow orbital arcs, drawn in canvas. The
  wordmark sits on a radial clearing, like the family hero.
- A small line: `By the ArtCraft team. Part of the Craft family.`

### 2. `01 / THE CRAFT` — What it is

Headline: **Mission analysis, brought into the open.**

Subhead: STKCraft is a native, agent-drivable orbital analysis workspace. It is built from
published standards, verified against published references, and free to use.

Three ruled cells:

1. **Every pass, accounted for.** Build a scenario of satellites, stations, sensors and
   targets. Propagate it over a timeline. Ask who can see what, when, and for how long.
2. **Correct before plausible.** SGP4 against the official verification vectors, IAU time
   scales against SOFA, access geometry against hand-computable cases. If it cannot be
   verified, it returns an error instead of a plausible number.
3. **An engine, not a silo.** Every user action is a command. The menus, CLI, JSON control
   channel and MCP server dispatch the same ids, so an agent can do anything a person can.

### 3. `02 / MISSION WORKSPACE` — The product

Headline: **A mission you can see.**

A large dark app window, framed as a product shot, containing:

- left rail: scenario tree (`ISS · Madrid · Iberia target`), layers;
- centre: interactive orthographic globe with graticule, ground track, station marker,
  access cone and satellite;
- right rail: access windows, next pass countdown, elevation/range readouts;
- bottom: a time scrubber with play/pause and a `UTC` label;
- top bar: `STKCRAFT / IBERIA PASS`, `EARLY ALPHA` tag, `SCENARIO` and `COMMAND` tabs.

The demo is interactive: dragging the scrubber moves the satellite, updates the elevation,
range and pass status; toggles switch ground track, access cone and labels. The canvas is a
simplified illustrative orbit, not a claim of live SGP4 output. A small `ILLUSTRATIVE SCENARIO`
label makes that explicit.

Below the window, three short annotations explain what is being shown: `GROUND TRACK`,
`ACCESS WINDOW`, `SENSOR CONE`.

### 4. `03 / THE FAMILY` — ArtCraft context

Headline: **One more craft in the family.**

Copy: STKCraft follows the rules shared by every Craft app: open source, native Rust, local
files, no subscription, agent-ready. It is built to sit beside PhotoCraft, CADCraft,
GridCraft and the rest — same conventions, different domain.

A typographic family strip lists the sixteen current apps as text cells, each linking to
`https://getartcraft.com/apps`. STKCraft has its own highlighted cell, labelled
`SPACE MISSION ANALYSIS · EARLY ALPHA`. No ArtCraft icons are copied.

Closing line and link: `See the whole family ↗`.

### 5. `04 / PRINCIPLES` — Six shared rules

A 3×2 ruled grid, each with a small original line icon:

1. **Open source.** MIT or Apache-2.0. Read it, fork it, build on it.
2. **Correct before plausible.** A published reference behind every numerical layer.
3. **Native, not wrapped.** Pure Rust, real desktop apps. No Electron, no web view.
4. **Agent-native.** CLI, JSON control channel and MCP server over one command registry.
5. **Your scenario, your machine.** Local files, no telemetry, no licence server.
6. **Everywhere.** macOS, Windows, Linux, FreeBSD and WebAssembly from one codebase.

### 6. `05 / STATUS` — Evidence and roadmap

Headline: **Built in the open. Shipped with evidence.**

A two-column ledger:

- **Shipped:** time scales and leap seconds; SGP4/SDP4; reference frames; access geometry;
  scenario and commands; 3D viewport; ephemerides; MCP/agent surface; sensors and targets;
  CCSDS/NAIF corpora.
- **Next:** the window surface for the newest commands; target rendering on the globe;
  coverage analysis; a timeline; extension store; team scenarios.

A callout: `EARLY ALPHA — installers are not published yet. Build from source.` with a link to
the README and releases. The page never shows a download button that does nothing.

A small evidence strip: `MIT / Apache-2.0`, `PURE RUST`, `495 CCSDS PUBLICATIONS`,
`27 NAIF DOCUMENTS`, `NO TELEMETRY`.

### 7. `06 / GET STARTED` — Call to action

Headline: **Build it with us.**

Copy: Early builds, roadmaps and the people making the Craft apps live in the ArtCraft
community. The source is open today.

CTAs: `STAR ON GITHUB ↗`, `JOIN THE DISCORD ↗`, `READ THE SOURCE ↗`.

A compact code block:

```sh
git clone https://github.com/spacelibres/STKCraft.git
cd STKCraft
cargo run --release -p stkcraft
```

Footnote: `Early alpha. Expect unfinished surfaces. The roadmap says what is next.`

### Footer

Five columns: albatross mark + one-line description; The craft (What it is, Workspace,
Principles, Status); Family (ArtCraft, Craft apps, PhotoCraft, CADCraft, GridCraft);
Resources (GitHub, Releases, README, Roadmap); Community (Discord, ArtCraft).
Bottom line: `© 2026 ArtCraft Team and the STKCraft contributors` · `MIT / Apache-2.0` ·
`FREE AND OPEN SOURCE` · language/theme controls repeated.

## 6. Bilingual behaviour

- English is the source language and is present in the HTML for SEO and no-JS readers.
- Chinese lives in `locales/zh.json`; `main.js` swaps text nodes, attributes and metadata.
- The toggle cycles `EN → 中`; the choice persists in `localStorage` under `stk-lang`.
- `<html lang>` updates, as do `<title>`, meta description and the visible section labels.
- Chinese copy is written for engineers, not machine-translated word for word.
- Chinese display type uses system CJK fonts; line lengths and headline sizes are adjusted.
- `hreflang` alternates are not used because both languages share one URL. The English
  source remains the canonical indexable version.

## 7. Technical architecture

**No build step.** Plain HTML, CSS and ES modules, served as static files. This keeps GitHub
Pages deployment trivial and the page auditable.

```
index.html                 semantic content, English source
styles.css                 tokens, layout, components, motion, print
main.js                    theme, language, reveals, canvas, demo controls
locales/zh.json            Chinese dictionary; English lives in the HTML source
assets/albatross.svg       primary mark
assets/albatross-wordmark.svg
assets/favicon.svg
assets/og.png              social card
assets/fonts/              Archivo, Inter, Instrument Serif, Geist Mono (OFL)
assets/icons/              original UI icons
CNAME                      www.stkscraft.com
.nojekyll
robots.txt
sitemap.xml
404.html
.github/workflows/pages.yml
README.md
LICENSE
```

### JavaScript modules

- `theme.js` — resolve system preference, persist override, update meta theme-color.
- `i18n.js` — load dictionary, apply translations, update language button and document.
- `orbit.js` — 2D canvas globe: projection, graticule, stars, orbit, station, cone; one
  requestAnimationFrame loop; pause via IntersectionObserver and visibility API.
- `demo.js` — scrubber, play/pause, layer toggles, readout updates.
- `main.js` — boot, reveals, nav state, mobile menu, share/copy link.

The code is split by responsibility so each file is small enough to reason about. No global
state beyond a single `site` object; no third-party runtime dependencies.

### Data model for the demo

A single fixed scenario:

```js
{
  satellite: { name: "ISS", altitudeKm: 420, inclinationDeg: 51.6, periodMin: 92.7 },
  station: { name: "Madrid", lat: 40.4, lon: -3.7, minElevationDeg: 10 },
  target: { name: "Iberia", polygon: [[...]] },
  windows: [{ start: 0, end: 412 }, { start: 5310, end: 5688 }]
}
```

The canvas uses a circular orbit for visual clarity. The readouts are derived from the same
parameters with a simple elevation formula; they are labelled illustrative. The demo never
claims to be SGP4 output.

## 8. Accessibility and performance

- Semantic landmarks, one `h1`, logical heading order, skip link.
- All controls are real `<button>` or `<a>` elements with visible focus rings.
- Canvas has `role="img"` and a text alternative describing the scenario; all controls have
  labels; the demo works without pointer dragging via buttons and slider.
- Colour contrast meets WCAG AA in both themes.
- `prefers-reduced-motion` stops reveals and animation.
- No layout shift: font `size-adjust` fallbacks, fixed media aspect ratios.
- Budget: HTML+CSS+JS < 150KB uncompressed; fonts < 220KB total; no external requests at
  runtime; LCP < 2.0s on a warm local server; Lighthouse ≥ 95 for Performance, Accessibility,
  Best Practices and SEO.
- `loading="lazy"` and explicit dimensions for any raster image.

## 9. Deployment

- GitHub Actions workflow builds nothing; it uploads the repository root as the Pages
  artifact and deploys on every push to `main`.
- `CNAME` contains `www.stkscraft.com`; `.nojekyll` is present.
- GitHub Pages custom domain is set through the repository API when the site is enabled.
- DNS is outside this repository: `www` needs a CNAME to `spacelibres.github.io`, and the apex
  needs GitHub Pages' four A records. The README documents both.
- The site must also work at `https://spacelibres.github.io/STKCraft_web/` while DNS is being
  configured. All internal links are relative.
- Canonical URL: `https://www.stkscraft.com/`.

## 10. Out of scope

- A CMS, blog, docs portal, pricing, payments, accounts or backend.
- Real installer downloads or a web build that is not deployed.
- Copying ArtCraft's icons, fonts, code or page copy.
- Claiming official inclusion in the ArtCraft apps directory before it is true.
- Analytics or tracking pixels.

## 11. Acceptance criteria

1. `index.html` renders correctly at 1440×1000, 1024×768, 768×1024 and 390×844 in both themes.
2. The EN/中文 toggle translates every visible string and persists across reloads.
3. The theme toggle switches all tokens and persists; no flash of wrong theme.
4. The hero wordmark, albatross mark and app window are visually coherent at all breakpoints.
5. The demo slider moves the satellite, updates readouts and plays/pauses.
6. Keyboard-only navigation reaches every control in order; focus is always visible.
7. With JavaScript disabled, the English content and all links remain readable.
8. `prefers-reduced-motion` produces a static, complete page.
9. No broken links; GitHub, Discord, ArtCraft and release links resolve.
10. Lighthouse ≥ 95 in all four categories on desktop and ≥ 90 on mobile.
11. `python -m http.server` serves the site from any subpath; Pages deployment succeeds.
12. `https://www.stkscraft.com` serves the site with a valid certificate once DNS is set.

## 12. Open questions for review

- Is "The seventeenth craft" acceptable, or should the copy stay with "a new craft in the
  family" until ArtCraft officially lists STKCraft? The current plan uses the latter.
- Should the family strip list all sixteen current apps, or only a short representative row?
  The current plan lists all sixteen as text links, with no borrowed icons.
- Is the MIT licence appropriate for the site code, while the albatross artwork remains
  original work by the ArtCraft Team? The plan marks both as MIT for simplicity.
