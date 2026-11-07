# STKCraft Launch Site Implementation Plan

> **Amended 2026-11-07:** the site is implemented with **Next.js 16 App Router + TypeScript**
> and a static export, not the plain-HTML structure described in the tasks below. See
> `docs/superpowers/specs/2026-11-07-nextjs-amendment.md` for the final architecture. The visual
> system, content, interaction model and deployment target remain as planned.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish the official STKCraft launch site at `https://www.stkcraft.com` — an ArtCraft-family editorial page with an original albatross identity, a live orbital demo, English/Chinese copy, and light/dark themes.

**Architecture:** A static site with no build step: semantic HTML (English source), layered CSS, and small ES modules for theme, language, navigation, reveals, the orbital canvas and the workspace demo. GitHub Pages serves the repository root; a GitHub Actions workflow deploys every push to `main`.

**Tech Stack:** HTML5, CSS custom properties, vanilla ES modules, Canvas 2D, Playwright (local visual QA only), GitHub Actions, GitHub Pages.

## Global Constraints

- No build step and no runtime framework. The files in the repository are the site.
- No external requests at runtime: self-host fonts, styles, scripts and images.
- English is the source language in `index.html`; Chinese lives in `locales/zh.json` and is applied by `js/i18n.js`.
- Both themes: respects `prefers-color-scheme`, persists an explicit choice, no flash of wrong theme.
- All ArtCraft-referenced material is nominative and linked, never copied. No ArtCraft icon files, page code or font binaries enter the repository.
- The albatross mark is original SVG artwork made for this repository.
- Do not claim installers, downloads or official ArtCraft directory inclusion that do not exist.
- No analytics, tracking pixels, cookies or third-party scripts.
- Canonical URL: `https://www.stkcraft.com/`.
- The page must remain readable with JavaScript disabled.
- `prefers-reduced-motion: reduce` removes all non-essential motion.
- WCAG AA contrast in both themes; every control keyboard-reachable and labelled.
- Deployment target: repository root on GitHub Pages with `CNAME` = `www.stkcraft.com`.
- Code and original artwork licence: MIT.
- Visual QA viewports: 1440×1000, 1024×768, 768×1024, 390×844.

---

### Task 1: Foundation, fonts and the page shell

**Files:**
- Create: `index.html`
- Create: `css/base.css`
- Create: `css/layout.css`
- Create: `scripts/fetch-fonts.py`
- Create: `assets/fonts/` (downloaded WOFF2 + OFL licence files)
- Create: `assets/brand/albatross.svg` (placeholder mark in this task; finished in Task 2)
- Create: `assets/favicon.svg`
- Test: local server + Playwright screenshot

**Interfaces:**
- Consumes: nothing.
- Produces: a valid HTML document with `<header class="site-header">`, `<main id="main">`, `<footer class="site-footer">`; CSS variables `--bg`, `--bg-raised`, `--bg-sunken`, `--ink`, `--ink-strong`, `--muted`, `--faint`, `--line`, `--line-strong`, `--accent`, `--accent-ink`, `--invert-bg`, `--invert-fg`, `--font-display`, `--font-body`, `--font-serif`, `--font-mono`, `--frame`.

- [ ] **Step 1: Create the directory tree and the font fetcher**

```powershell
New-Item -ItemType Directory -Force -Path css, js, locales, scripts, assets/fonts, assets/brand, assets/icons, tests | Out-Null
```

Write `scripts/fetch-fonts.py`:

```python
"""Download the OFL families used by the site and rewrite Google Fonts URLs locally.

Run from the repository root:  python scripts/fetch-fonts.py
"""
from __future__ import annotations

import hashlib
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONT_DIR = ROOT / "assets" / "fonts"
CSS_OUT = ROOT / "css" / "fonts.css"

CSS_URL = (
    "https://fonts.googleapis.com/css2"
    "?family=Archivo:wdth,wght@62..125,100..900"
    "&family=Inter:wght@100..900"
    "&family=Instrument+Serif:ital@0;1"
    "&family=Geist+Mono:wght@100..900"
    "&display=swap"
)
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"
)
LICENCES = {
    "archivo": "https://raw.githubusercontent.com/google/fonts/main/ofl/archivo/OFL.txt",
    "inter": "https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt",
    "instrument-serif": "https://raw.githubusercontent.com/google/fonts/main/ofl/instrumentserif/OFL.txt",
    "geist-mono": "https://raw.githubusercontent.com/google/fonts/main/ofl/geistmono/OFL.txt",
}


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as response:
        return response.read()


def main() -> None:
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    css = get(CSS_URL).decode("utf-8")
    urls = re.findall(r"url\((https://fonts\.gstatic\.com/[^)]+\.woff2)\)", css)
    for url in dict.fromkeys(urls):
        name = hashlib.sha256(url.encode()).hexdigest()[:16] + ".woff2"
        data = get(url)
        (FONT_DIR / name).write_bytes(data)
        css = css.replace(url, f"../assets/fonts/{name}")
    CSS_OUT.write_text(css, encoding="utf-8")
    for slug, url in LICENCES.items():
        (FONT_DIR / f"OFL-{slug}.txt").write_bytes(get(url))
    print(f"fonts: {len(set(urls))} files, {CSS_OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run the fetcher and confirm the assets**

Run: `python scripts/fetch-fonts.py`  
Expected: `fonts: N files, css/fonts.css` and at least 6 `.woff2` files plus 4 `OFL-*.txt` files.

Run: `Get-ChildItem assets/fonts | Measure-Object | Select-Object -ExpandProperty Count`  
Expected: a number greater than 10.

- [ ] **Step 3: Write the design tokens and reset**

`css/base.css`:

```css
@import url("fonts.css");

:root {
  --bg: #f2f1ee;
  --bg-raised: #faf9f7;
  --bg-sunken: #e9e8e4;
  --ink: #101014;
  --ink-strong: #000;
  --muted: #1010149e;
  --faint: #1010146b;
  --line: #10101429;
  --line-strong: #10101466;
  --accent: #2d81ff;
  --accent-ink: #1659c4;
  --invert-bg: #101014;
  --invert-fg: #f2f1ee;
  --danger: #b3261e;
  --scanline: #10101408;

  --font-display: "Archivo", "Archivo Fallback", system-ui, sans-serif;
  --font-body: "Inter", "Inter Fallback", system-ui, sans-serif;
  --font-serif: "Instrument Serif", Georgia, serif;
  --font-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  --font-cjk: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;

  --frame: 1280px;
  --gutter: 24px;
  --header: 48px;
  --ease: cubic-bezier(.2, .9, .2, 1);
  color-scheme: light;
}

html[data-theme="dark"] {
  --bg: #121316;
  --bg-raised: #101014;
  --bg-sunken: #060607;
  --ink: #f2f1ee;
  --ink-strong: #fff;
  --muted: #f2f1ee99;
  --faint: #f2f1ee61;
  --line: #f2f1ee26;
  --line-strong: #f2f1ee66;
  --accent-ink: #74aaff;
  --invert-bg: #fff;
  --invert-fg: #0b0b0c;
  --danger: #ff6259;
  --scanline: #ffffff06;
  color-scheme: dark;
}

*, *::before, *::after { box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

img, svg, canvas { display: block; max-width: 100%; }
a { color: inherit; text-decoration-thickness: 1px; text-underline-offset: .18em; }
button, input { font: inherit; }
button { color: inherit; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }

::selection { background: var(--accent); color: #fff; }

.skip-link {
  position: fixed; left: 12px; top: -80px; z-index: 999;
  background: var(--invert-bg); color: var(--invert-fg);
  padding: 10px 14px; font-family: var(--font-mono); font-size: 12px;
  text-transform: uppercase; letter-spacing: .08em;
}
.skip-link:focus { top: 12px; }

.mono {
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.4;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.serif { font-family: var(--font-serif); font-style: italic; font-weight: 400; }
.accent { color: var(--accent); }
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
```

- [ ] **Step 4: Write the frame, header and footer shell**

`css/layout.css`:

```css
.site-header {
  position: sticky; top: 0; z-index: 80;
  height: var(--header);
  display: flex; align-items: stretch;
  border-bottom: 1px solid var(--line);
  background: color-mix(in srgb, var(--bg) 92%, transparent);
  backdrop-filter: blur(12px);
}

.site-header__brand {
  display: flex; align-items: center; gap: 10px;
  padding: 0 16px; border-right: 1px solid var(--line);
  text-decoration: none;
}
.site-header__brand img { width: 24px; height: 24px; }
.site-header__brand span {
  font-family: var(--font-display);
  font-weight: 750; font-stretch: 125%;
  letter-spacing: -.02em; font-size: 14px;
}

.site-nav { display: flex; align-items: stretch; }
.site-nav a {
  display: flex; align-items: center;
  padding: 0 18px; border-right: 1px solid var(--line);
  font-family: var(--font-mono); font-size: 11px;
  letter-spacing: .1em; text-transform: uppercase;
  text-decoration: none; color: var(--muted);
}
.site-nav a:hover, .site-nav a[aria-current="page"] { color: var(--ink); background: var(--bg-raised); }

.site-header__tools { margin-left: auto; display: flex; align-items: stretch; }
.tool-button {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 48px; padding: 0 14px; border: 0; border-left: 1px solid var(--line);
  background: transparent; cursor: pointer;
  font-family: var(--font-mono); font-size: 11px; letter-spacing: .08em;
}
.tool-button:hover { background: var(--bg-raised); }
.github-button {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 0 18px; background: var(--invert-bg); color: var(--invert-fg);
  text-decoration: none; font-family: var(--font-mono);
  font-size: 11px; letter-spacing: .08em; text-transform: uppercase;
}

.frame {
  width: min(100% - (var(--gutter) * 2), var(--frame));
  margin-inline: auto;
  border-inline: 1px solid var(--line);
  background: var(--bg);
}

.site-footer {
  border-top: 1px solid var(--line);
  background: var(--bg);
}
.site-footer__inner {
  width: min(100% - (var(--gutter) * 2), var(--frame));
  margin-inline: auto; border-inline: 1px solid var(--line);
}

@media (max-width: 900px) {
  .site-nav { display: none; }
  .github-button span { display: none; }
}
```

- [ ] **Step 5: Write the complete document skeleton**

`index.html`:

```html
<!doctype html>
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>STKCraft — Space mission analysis, in the open</title>
  <meta name="description" content="STKCraft is open-source space mission analysis. Build a scenario of satellites, ground stations, sensors and targets, propagate it, and see exactly when one can see another.">
  <link rel="canonical" href="https://www.stkcraft.com/">
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="css/base.css">
  <link rel="stylesheet" href="css/layout.css">
  <script>
    (() => {
      const stored = localStorage.getItem("stk-theme");
      const dark = matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.dataset.theme = stored || (dark ? "dark" : "light");
    })();
  </script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <a class="site-header__brand" href="#top" aria-label="STKCraft home">
      <img src="assets/brand/albatross.svg" alt="" width="24" height="24">
      <span>STKCRAFT</span>
    </a>
    <nav class="site-nav" aria-label="Primary">
      <a href="#craft" data-i18n="nav.craft">The craft</a>
      <a href="#workspace" data-i18n="nav.workspace">Workspace</a>
      <a href="#family" data-i18n="nav.family">Family</a>
      <a href="#principles" data-i18n="nav.principles">Principles</a>
      <a href="#status" data-i18n="nav.status">Status</a>
    </nav>
    <div class="site-header__tools">
      <button class="tool-button" id="lang-toggle" type="button" aria-label="Switch language to Chinese">EN / 中</button>
      <button class="tool-button" id="theme-toggle" type="button" aria-label="Switch to dark theme">☾</button>
      <a class="github-button" href="https://github.com/spacelibres/STKCraft" target="_blank" rel="noopener">
        <span>GitHub</span> ↗
      </a>
    </div>
  </header>
  <main id="main">
    <section id="top" class="hero frame">
      <h1>STKCRAFT</h1>
    </section>
  </main>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <p class="mono">© 2026 ArtCraft Team and the STKCraft contributors</p>
    </div>
  </footer>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

Create a temporary `assets/brand/albatross.svg` and `assets/favicon.svg` with a simple albatross silhouette so the shell renders; Task 2 replaces it:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#2d81ff"/>
  <path d="M116 380c54-18 71-66 83-118 12-55 43-96 104-111 54-13 95 11 100 51 4 33-18 51-50 51-27 0-31 25-12 43 16 15 36 20 36 46 0 33-32 50-74 39-29-8-51-4-72 18-19 19-42 27-68 22-22-5-36-20-47-41Z" fill="#f2f1ee" stroke="#101014" stroke-width="14" stroke-linejoin="round"/>
  <circle cx="346" cy="247" r="11" fill="#101014"/>
</svg>
```

- [ ] **Step 6: Serve and verify the shell**

Run in a background job: `python -m http.server 4173 --bind 127.0.0.1`  
Open `http://127.0.0.1:4173/` with Playwright and capture `tests/shell.png` at 1440×1000.  
Expected: header with mark and nav, a blank hero containing `STKCRAFT`, footer, no console errors, fonts loaded (`document.fonts.status === "loaded"`).

- [ ] **Step 7: Commit**

```powershell
git add index.html css js scripts assets .gitignore
git commit -m "feat: scaffold the STKCraft site and type system"
```

---

### Task 2: Original albatross identity and social imagery

**Files:**
- Modify: `assets/brand/albatross.svg`
- Create: `assets/brand/albatross-mark.svg` (mark without background, for footer and favicon)
- Modify: `assets/favicon.svg`
- Create: `assets/app-icon-512.png`
- Create: `assets/apple-touch-icon.png` (180×180)
- Create: `assets/og.png` (1200×630)
- Create: `assets/site.webmanifest`
- Test: `tests/brand.html`, screenshots at 512, 128 and 32

**Interfaces:**
- Consumes: the visual tokens from Task 1.
- Produces: `albatross.svg` used by header/footer/family; `favicon.svg`; `og.png` referenced by metadata.

- [ ] **Step 1: Draw the albatross mark**

Create `assets/brand/albatross.svg`. The composition is a 512×512 rounded square, blue field, black orbital arc, ivory albatross head in profile facing right, black ink outline, hatching and a warm beak. Use these core paths as the starting geometry, then adjust the curves while checking the rendering (the eye and beak must read at 32px):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-labelledby="title">
  <title id="title">STKCraft albatross mark</title>
  <defs>
    <clipPath id="squircle"><rect width="512" height="512" rx="112"/></clipPath>
    <pattern id="hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)">
      <line x1="0" y1="0" x2="0" y2="12" stroke="#101014" stroke-width="3" opacity=".28"/>
    </pattern>
  </defs>
  <g clip-path="url(#squircle)">
    <rect width="512" height="512" fill="#2d81ff"/>
    <ellipse cx="268" cy="270" rx="198" ry="114" fill="none" stroke="#101014" stroke-width="10" opacity=".75" transform="rotate(-21 268 270)"/>
    <circle cx="449" cy="159" r="9" fill="#101014"/>
    <path d="M136 464c-5-59 13-111 55-157 31-34 55-63 64-101 8-34 30-58 64-69 42-14 81 3 94 38 11 30-6 56-38 63-23 5-33 19-27 35 7 19 25 27 39 39 25 21 29 56 8 82-24 30-66 31-100 12-22-12-38-9-55 10-21 23-48 35-78 34-15 0-22 6-26 14Z" fill="#f2f1ee" stroke="#101014" stroke-width="14" stroke-linejoin="round"/>
    <path d="M205 300c31 16 49 43 53 80" fill="none" stroke="#101014" stroke-width="10" stroke-linecap="round"/>
    <path d="M183 348c36 12 55 35 62 70" fill="none" stroke="#101014" stroke-width="10" stroke-linecap="round"/>
    <path d="M161 393c31 11 48 30 55 62" fill="none" stroke="#101014" stroke-width="10" stroke-linecap="round"/>
    <path d="M263 190c-10 25-4 42 17 57 20 14 35 15 54 5" fill="none" stroke="#101014" stroke-width="8" stroke-linecap="round"/>
    <path d="M288 164c-9 17-5 31 12 42" fill="none" stroke="#101014" stroke-width="8" stroke-linecap="round"/>
    <path d="M326 245c32 2 58-4 78-18 12-8 22-7 27 4 4 9-1 17-13 22-22 9-42 24-56 44-8 11-19 18-33 19" fill="#e9c46a" stroke="#101014" stroke-width="14" stroke-linejoin="round"/>
    <path d="M410 235c13-5 22-1 26 8 4 8 2 15-4 21" fill="#f2f1ee" stroke="#101014" stroke-width="10" stroke-linecap="round"/>
    <circle cx="351" cy="208" r="15" fill="#101014"/>
    <circle cx="355" cy="203" r="4" fill="#f2f1ee"/>
    <path d="M330 188c13-10 29-9 40 1" fill="none" stroke="#101014" stroke-width="8" stroke-linecap="round"/>
    <path d="M226 424c41-8 73-2 99 20" fill="none" stroke="#101014" stroke-width="8" stroke-linecap="round" opacity=".55"/>
  </g>
</svg>
```

- [ ] **Step 2: Produce the standalone mark and favicon**

`assets/brand/albatross-mark.svg` is the same drawing without the blue rectangle, sized for transparent use in the footer. `assets/favicon.svg` is a 64×64 simplification: blue rounded square, ivory head shape and black eye/beak, no hatching.

- [ ] **Step 3: Render and inspect at three sizes**

Create `tests/brand.html` with the mark at 512, 128, 64 and 32px on both light and dark backgrounds. Use Playwright to capture `tests/brand.png`.  
Expected: at 32px the silhouette, eye and beak direction are still legible; at 512px the hatching is clean; the arc does not obscure the head.

- [ ] **Step 4: Generate the PNG app icon and social card**

Use Playwright to screenshot `assets/brand/albatross.svg` at 512×512 and 180×180 with transparent/blue backgrounds, saving `assets/app-icon-512.png` and `assets/apple-touch-icon.png`.

Create a temporary `og.html` (keep it in `tests/` or delete after use) with a 1200×630 canvas: `STKCRAFT` in Archivo, the albatross at 180px, the line "Know when the sky opens.", and `www.stkcraft.com`. Screenshot to `assets/og.png`. Check that the text is not clipped and the image is under 300KB.

- [ ] **Step 5: Add the web manifest**

`assets/site.webmanifest`:

```json
{
  "name": "STKCraft",
  "short_name": "STKCraft",
  "description": "Open-source space mission analysis.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f2f1ee",
  "theme_color": "#2d81ff",
  "icons": [
    { "src": "/assets/app-icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/assets/favicon.svg", "sizes": "any", "type": "image/svg+xml" }
  ]
}
```

- [ ] **Step 6: Commit**

```powershell
git add assets tests
git commit -m "feat: add the original albatross identity"
```

---

### Task 3: Theme, language and navigation behaviour

**Files:**
- Create: `js/main.js`
- Create: `js/theme.js`
- Create: `js/i18n.js`
- Create: `js/nav.js`
- Create: `js/reveal.js`
- Create: `locales/zh.json` (start with header/hero keys; complete in Task 6)
- Modify: `index.html`
- Modify: `css/base.css`, `css/layout.css`
- Test: browser checks for persistence, keyboard, no-JS

**Interfaces:**
- Consumes: `data-i18n`, `data-i18n-attr`, `data-theme`, `#theme-toggle`, `#lang-toggle`.
- Produces: `initTheme()`, `initI18n()`, `initNav()`, `initReveal()`, `t(key)`; global `window.STK` with `{ lang, theme }`.

- [ ] **Step 1: Implement theme resolution and persistence**

`js/theme.js`:

```js
const KEY = "stk-theme";
const root = document.documentElement;

function apply(theme) {
  root.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === "dark" ? "#121316" : "#f2f1ee";
  const button = document.querySelector("#theme-toggle");
  if (button) {
    button.textContent = theme === "dark" ? "☀" : "☾";
    button.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  }
}

export function initTheme() {
  const stored = localStorage.getItem(KEY);
  const systemDark = matchMedia("(prefers-color-scheme: dark)");
  const initial = stored || (systemDark.matches ? "dark" : "light");
  apply(initial);
  document.querySelector("#theme-toggle")?.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem(KEY, next);
    apply(next);
  });
  systemDark.addEventListener("change", (event) => {
    if (!localStorage.getItem(KEY)) apply(event.matches ? "dark" : "light");
  });
}
```

- [ ] **Step 2: Implement translation loading**

`js/i18n.js`:

```js
const KEY = "stk-lang";
let dict = null;
let lang = "en";

export function t(key, fallback = "") {
  return dict?.[key] ?? fallback;
}

function setText(el, value) {
  if (typeof value === "string") el.textContent = value;
}

function apply() {
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const value = dict?.[el.dataset.i18n];
    if (value) setText(el, value);
  });
  document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    for (const pair of el.dataset.i18nAttr.split(";")) {
      const [attr, key] = pair.split(":").map((s) => s.trim());
      const value = dict?.[key];
      if (attr && value) el.setAttribute(attr, value);
    }
  });
  document.title = lang === "zh" ? "STKCraft — 开源空间任务分析" : "STKCraft — Space mission analysis, in the open";
  const button = document.querySelector("#lang-toggle");
  if (button) {
    button.textContent = lang === "zh" ? "中 / EN" : "EN / 中";
    button.setAttribute("aria-label", lang === "zh" ? "Switch language to English" : "Switch language to Chinese");
  }
  document.dispatchEvent(new CustomEvent("stk:language", { detail: { lang } }));
}

export async function initI18n() {
  const stored = localStorage.getItem(KEY);
  lang = stored === "zh" ? "zh" : "en";
  if (lang === "zh") {
    const response = await fetch("locales/zh.json");
    if (!response.ok) throw new Error("Unable to load Chinese copy");
    dict = await response.json();
    apply();
  }
  document.querySelector("#lang-toggle")?.addEventListener("click", async () => {
    if (lang === "en") {
      const response = await fetch("locales/zh.json");
      dict = await response.json();
      lang = "zh";
    } else {
      lang = "en";
      dict = null;
    }
    localStorage.setItem(KEY, lang);
    apply();
    if (lang === "en") location.reload();
  });
  return { lang };
}
```

The English fallback lives in the HTML; switching back to English reloads so every node is restored exactly.

- [ ] **Step 3: Add navigation and reveal behaviour**

`js/nav.js` marks the section link matching the section currently in view with `aria-current="page"` using an IntersectionObserver. It also toggles a mobile menu (`#menu-toggle` + `.site-nav.is-open`) and closes it on Escape or link click.

`js/reveal.js` adds `js` to `<html>`, observes `[data-reveal]` with `threshold: 0.15`, and adds `.is-visible`. If `matchMedia("(prefers-reduced-motion: reduce)").matches`, it adds `.is-visible` to all immediately.

`js/main.js`:

```js
import { initTheme } from "./theme.js";
import { initI18n } from "./i18n.js";
import { initNav } from "./nav.js";
import { initReveal } from "./reveal.js";

initTheme();
initNav();
initReveal();
initI18n().catch((error) => console.error(error));
```

- [ ] **Step 4: Style the reveal and mobile menu**

Add to `css/base.css`:

```css
html.js [data-reveal] {
  opacity: 0;
  transform: translateY(10px);
  transition: opacity .55s var(--ease), transform .55s var(--ease);
}
html.js [data-reveal].is-visible { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  html.js [data-reveal] { opacity: 1; transform: none; }
}
```

Mobile menu CSS: `.menu-toggle` visible below 900px; `.site-nav.is-open` becomes a fixed panel under the header with a solid `--bg` background, full-width links and 48px rows.

- [ ] **Step 5: Verify persistence, keyboard and no-JS**

- Reload after switching theme: the theme stays; no flash.
- Switch to Chinese, reload: Chinese is applied; switch back to English, page restores.
- Tab through header: skip link, brand, nav, language, theme, GitHub in order; focus is visible.
- Disable JavaScript: header links, hero text and footer remain readable; theme defaults to light.

- [ ] **Step 6: Commit**

```powershell
git add index.html css js locales
git commit -m "feat: add theme, language and navigation behaviour"
```

---

### Task 4: Hero, The Craft and Principles

**Files:**
- Create: `css/sections.css`
- Modify: `index.html`
- Create: `js/orbit.js` (hero starfield only in this task; full globe in Task 5)
- Test: screenshots at 1440, 768, 390

**Interfaces:**
- Consumes: tokens, `.frame`, reveal.
- Produces: sections `#craft` and `#principles`; `.hero`, `.section`, `.section-head`, `.feature-grid`, `.principle-grid`; `initHeroOrbit()`.

- [ ] **Step 1: Build the hero markup**

```html
<section id="top" class="hero frame" aria-labelledby="hero-title">
  <canvas class="hero__canvas" id="hero-canvas" aria-hidden="true"></canvas>
  <div class="hero__clear" aria-hidden="true"></div>
  <div class="hero__inner">
    <p class="mono hero__eyebrow" data-reveal>SPACE MISSION ANALYSIS · OPEN SOURCE</p>
    <div class="hero__wordmark" role="img" aria-label="STKCRAFT" data-reveal>STKCRAFT</div>
    <h1 id="hero-title" data-reveal>Know when the sky opens.</h1>
    <p class="hero__lede" data-reveal>STKCraft is open-source space mission analysis. Build a scenario of satellites, ground stations, sensors and targets; propagate it; then see exactly when one can see another — and for how long.</p>
    <div class="hero__actions" data-reveal>
      <a class="button button--primary" href="#craft">Explore the craft <span aria-hidden="true">↓</span></a>
      <a class="button" href="https://github.com/spacelibres/STKCraft" target="_blank" rel="noopener">View source <span aria-hidden="true">↗</span></a>
    </div>
    <p class="mono hero__meta" data-reveal>OPEN SOURCE · PURE RUST · EARLY ALPHA · NO SUBSCRIPTION</p>
    <p class="hero__by" data-reveal>By the ArtCraft team. One more craft in the family.</p>
  </div>
  <nav class="section-index" aria-label="Sections">
    <a href="#top" class="is-active">STKCRAFT</a>
    <a href="#craft">THE CRAFT</a>
    <a href="#workspace">WORKSPACE</a>
    <a href="#family">FAMILY</a>
    <a href="#principles">PRINCIPLES</a>
    <a href="#status">STATUS</a>
    <a href="#start">GET STARTED</a>
  </nav>
</section>
```

- [ ] **Step 2: Style the hero**

The hero is `min-height: calc(100svh - var(--header))`, position relative, overflow hidden, display grid place-items center, padding 96px 24px. The wordmark:

```css
.hero__wordmark {
  font-family: var(--font-display);
  font-weight: 750;
  font-stretch: 125%;
  font-size: clamp(3.6rem, 14.2cqw, 15.5rem);
  line-height: .92;
  letter-spacing: -.045em;
  color: var(--ink-strong);
  white-space: nowrap;
  container-type: inline-size;
}
```

Use a wrapper with `container-type: inline-size` on `.hero__inner` so `cqw` resolves against the content width. Add `.hero__clear` as a radial gradient of `--bg` behind the text to separate it from the canvas. The h1 is `clamp(2rem, 5.2vw, 4.6rem)` in `--font-display`, max-width 820px, centered. Buttons use `.button` styles from Task 1. The section index is fixed at right 64px bottom 48px, text-align right, mono 13px, hidden below 1180px.

- [ ] **Step 3: Build The Craft section**

```html
<section id="craft" class="section frame" aria-labelledby="craft-title">
  <header class="section-head">
    <span class="mono">01 / THE CRAFT</span>
    <span class="mono">MISSION ANALYSIS · PURE RUST</span>
  </header>
  <div class="section-body craft-intro">
    <h2 id="craft-title" data-reveal>Mission analysis, <span class="accent">brought into the open.</span></h2>
    <p class="section-lede" data-reveal>STKCraft is a native, agent-drivable orbital analysis workspace. Build the scenario, propagate it, and ask the question that matters: who can see what, when, and for how long?</p>
  </div>
  <div class="feature-grid">
    <article class="feature" data-reveal>
      <span class="mono feature__index">01</span>
      <h3>Every pass, accounted for.</h3>
      <p>Satellites, ground stations, sensors and targets in one scenario. Propagate them over a timeline. Read the access window, not just a count.</p>
    </article>
    <article class="feature" data-reveal>
      <span class="mono feature__index">02</span>
      <h3>Correct before plausible.</h3>
      <p>SGP4 against the official verification vectors. Time scales against SOFA. Access geometry against hand-computable cases. If it cannot be verified, it says so.</p>
    </article>
    <article class="feature" data-reveal>
      <span class="mono feature__index">03</span>
      <h3>An engine, not a silo.</h3>
      <p>Every action is a command. The menus, CLI, JSON control channel and MCP server dispatch the same ids, so an agent can do anything a person can.</p>
    </article>
  </div>
</section>
```

- [ ] **Step 4: Build the Principles section**

Use six `<article class="principle">` cells with inline 24px line icons and the copy from the spec. Add an SVG sprite at the top of `index.html`:

```html
<svg class="svg-sprite" aria-hidden="true" width="0" height="0" style="position:absolute">
  <symbol id="i-code" viewBox="0 0 24 24"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
  <symbol id="i-chip" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
  <symbol id="i-command" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m7 9 4 3-4 3M13 15h4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-drive" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7 15h.01M11 15h2M3 10h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
  <symbol id="i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3 12h18M12 3c2.5 2.5 3.5 5.7 3.5 9S14.5 18.5 12 21M12 3C9.5 5.5 8.5 8.7 8.5 12s1 6.5 3.5 9" fill="none" stroke="currentColor" stroke-width="1.5"/></symbol>
</svg>
```

Each principle uses `<svg class="icon"><use href="#i-code"/></svg>`, an index `01`–`06`, and a heading. Grid is 3 columns, cells separated by 1px rules via `gap: 1px; background: var(--line);` and each cell `background: var(--bg); padding: 32px;`.

- [ ] **Step 5: Draw the hero starfield and orbital arcs**

`js/orbit.js` exports `initHeroOrbit(canvas)`. It creates a seeded star list from `mulberry32(0x53544b)` (200 stars), draws on a DPR-capped canvas, and animates three slow arcs with `requestAnimationFrame`. Pause when `document.hidden` or when the hero is offscreen. If reduced motion, draw one static frame.

- [ ] **Step 6: Screenshot and compare**

Capture at 1440×1000, 768×1024 and 390×844 in both themes.  
Expected: wordmark is one line at 1440 and 768; at 390 it fits without horizontal scrolling or clips only by a few pixels; h1 line breaks are deliberate; section rules align to the 1280 frame; no text overlaps the fixed index.

- [ ] **Step 7: Commit**

```powershell
git add index.html css js
git commit -m "feat: build the hero, product story and principles"
```

---

### Task 5: The interactive mission workspace

**Files:**
- Create: `js/orbit.js` additions (or `js/globe.js`)
- Create: `js/demo.js`
- Create: `assets/data/land-110m.js`
- Create: `css/console.css`
- Modify: `index.html`
- Test: interaction checks and screenshots

**Interfaces:**
- Consumes: `#mission-canvas`, `#timeline`, `#play`, layer toggle buttons, readout elements.
- Produces: `initWorkspace()`; updates `[data-readout="utc"]`, `[data-readout="elevation"]`, `[data-readout="range"]`, `[data-readout="status"]`, `[data-readout="next-pass"]`; exposes `window.STK.demo` for QA.

- [ ] **Step 1: Prepare the land geometry**

Download Natural Earth 110m land:

```powershell
python - <<'PY'
import json, urllib.request
url = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson"
data = json.load(urllib.request.urlopen(url, timeout=60))
rings = []
for feature in data["features"]:
    geom = feature["geometry"]
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    for poly in polys:
        for ring in poly:
            simplified = ring[::3]
            if len(simplified) > 3:
                rings.append([[round(lon, 2), round(lat, 2)] for lon, lat in simplified])
with open("assets/data/land-110m.js", "w", encoding="utf-8") as fh:
    fh.write("export const LAND = " + json.dumps(rings, separators=(",", ":")) + ";\n")
print(len(rings), "rings")
PY
```

Expected: a file under 80KB; Natural Earth is public domain. Add a comment in the file naming the source and its public-domain status.

- [ ] **Step 2: Build the workspace markup**

The section contains a heading, the app window, and three annotations. The app window structure:

```html
<div class="console" role="group" aria-label="Illustrative STKCraft workspace">
  <div class="console__bar">
    <span class="console__brand">STKCRAFT <span>/ IBERIA PASS</span></span>
    <span class="console__tag">EARLY ALPHA</span>
    <span class="console__tabs"><b>SCENARIO</b><span>COMMAND</span></span>
  </div>
  <div class="console__body">
    <aside class="console__left">
      <p class="console__label">SCENARIO</p>
      <ul class="tree">
        <li class="is-active"><span class="dot dot--sat"></span>ISS <small>LEO · 420 km</small></li>
        <li><span class="dot dot--station"></span>Madrid <small>40.4°N 3.7°W</small></li>
        <li><span class="dot dot--target"></span>Iberia target <small>POLYGON</small></li>
      </ul>
      <p class="console__label">LAYERS</p>
      <button class="layer" data-layer="track" aria-pressed="true"><span>Ground track</span><i></i></button>
      <button class="layer" data-layer="cone" aria-pressed="true"><span>Access cone</span><i></i></button>
      <button class="layer" data-layer="labels" aria-pressed="true"><span>Labels</span><i></i></button>
    </aside>
    <div class="console__stage">
      <canvas id="mission-canvas" role="img" aria-label="Illustrative orthographic globe showing the ISS ground track, Madrid ground station and access geometry."></canvas>
      <div class="console__hud">
        <span class="mono">UTC <b data-readout="utc">00:00:00</b></span>
        <span class="mono">ILLUSTRATIVE ORBIT · NOT SGP4</span>
      </div>
      <div class="console__legend">
        <span><i class="key key--orbit"></i>ORBIT</span>
        <span><i class="key key--station"></i>STATION</span>
        <span><i class="key key--pass"></i>ACCESS</span>
      </div>
    </div>
    <aside class="console__right">
      <p class="console__label">ACCESS WINDOWS</p>
      <ol class="windows" id="window-list"></ol>
      <div class="console__stat">
        <span class="mono">STATUS</span>
        <strong data-readout="status">BELOW HORIZON</strong>
      </div>
      <div class="console__stat">
        <span class="mono">ELEVATION</span>
        <strong><span data-readout="elevation">—</span>°</strong>
      </div>
      <div class="console__stat">
        <span class="mono">RANGE</span>
        <strong><span data-readout="range">—</span> km</strong>
      </div>
    </aside>
  </div>
  <div class="console__timeline">
    <button id="play" class="play" type="button" aria-label="Play the scenario">▶</button>
    <span class="mono console__clock" data-readout="utc">00:00:00</span>
    <div class="scrub">
      <input id="timeline" type="range" min="0" max="1439" step="1" value="0" aria-label="Time of day, UTC">
      <div class="scrub__ticks" id="scrub-ticks"></div>
    </div>
    <span class="mono">24H</span>
  </div>
</div>
```

- [ ] **Step 3: Model the illustrative orbit**

Use a circular orbit, not SGP4. In `js/demo.js`:

```js
const R = 6371;
const ALT = 420;
const INC = 51.6 * Math.PI / 180;
const PERIOD = 92.7; // minutes
const STATION = { lat: 40.4 * Math.PI / 180, lon: -3.7 * Math.PI / 180 };
const U0 = -0.6;
const LON0 = -8 * Math.PI / 180;

function subpoint(minutes) {
  const u = U0 + 2 * Math.PI * (minutes / PERIOD);
  const lat = Math.asin(Math.sin(INC) * Math.sin(u));
  const lon = Math.atan2(Math.cos(INC) * Math.sin(u), Math.cos(u)) + LON0
    - 2 * Math.PI * (minutes / 1436);
  return { lat, lon: ((lon + Math.PI * 3) % (Math.PI * 2)) - Math.PI };
}

function elevation(sat, station) {
  const dLon = sat.lon - station.lon;
  const cosC = Math.sin(station.lat) * Math.sin(sat.lat)
    + Math.cos(station.lat) * Math.cos(sat.lat) * Math.cos(dLon);
  const c = Math.acos(Math.max(-1, Math.min(1, cosC)));
  return Math.atan2(Math.cos(c) - R / (R + ALT), Math.sin(c)) * 180 / Math.PI;
}
```

Sample every 30 seconds over 24 hours to build windows where elevation ≥ 10°. Merge contiguous samples. Assert in a QA script that the chosen parameters produce at least two windows.

- [ ] **Step 4: Render the globe**

`js/globe.js` exports `createGlobe(canvas, options)` with `setTime(minutes)` and `setLayers({track, cone, labels})`. Each frame:

1. Size canvas to its CSS box × `min(devicePixelRatio, 2)`.
2. Draw the space background and 180 seeded stars.
3. Project with orthographic projection centered on `lat0 = 22°`, `lon0 = -8°`; draw a clipped circle (`ctx.arc`, `ctx.clip`).
4. Fill ocean `#071421`, draw land `#12304a` with `#2a5578` strokes from `LAND`.
5. Draw graticule every 30° in `#1d4264`.
6. Draw the ground track over one period in `#e0533f`, with visible segments solid and hidden segments skipped.
7. Draw the station as a blue pulse ring; draw the access cone as a translucent circle of radius corresponding to the 10° elevation footprint (compute geodesic circle points).
8. Draw a dashed station→satellite line when in pass.
9. Draw the satellite as a white dot with an accent halo and label.
10. Add a radial shading overlay for the sphere.

Stop the animation loop when the canvas is offscreen (`IntersectionObserver`) or `document.hidden`.

- [ ] **Step 5: Wire the timeline and readouts**

`initWorkspace()`:
- initialises `time = firstWindowStart - 8`;
- renders window list rows (`PASS 01`, `06:12–06:19 UTC`, duration) and click-to-jump;
- on `input`, updates time, canvas, UTC clock, elevation, range, status, next pass;
- on play, advances time by `deltaSeconds * 12` minutes; loops at 1440;
- toggles layers with `aria-pressed`;
- uses `t()` for dynamic labels and re-renders on `stk:language`.

Format UTC as `HH:MM` from minutes. Range from elevation and altitude with the law of cosines; label as approximate.

- [ ] **Step 6: Style the console**

Dark surface `#070b10`, 1px `#203247` border, 4px radius, subtle outer shadow. Grid: `220px minmax(0, 1fr) 250px`; min-height 560px. Stage has `aspect-ratio: 16 / 10` and a radial vignette. Panels use 1px borders, 14px mono labels, muted blue-gray text. Timeline is 56px tall with a 1px top border. Range input is custom-styled with a 2px track and a 12px square thumb; window ticks are absolutely positioned.

Mobile below 900px: console body becomes one column; left panel becomes a two-column summary above the stage; right panel below; timeline remains; canvas min-height 320px.

- [ ] **Step 7: Verify interactions**

Playwright test:
- load page, scroll to workspace, screenshot;
- read initial status and elevation;
- drag slider to a window, expect `IN PASS` and elevation ≥ 10;
- click play, wait 1s, expect clock changed;
- toggle `Ground track`, expect `aria-pressed="false"`;
- verify canvas is non-blank by sampling `toDataURL()` length or pixel variance;
- screenshot both themes and 390px.

- [ ] **Step 8: Commit**

```powershell
git add index.html css js assets/data
git commit -m "feat: add the interactive mission workspace"
```

---

### Task 6: Family, status, get started, footer and Chinese

**Files:**
- Modify: `index.html`
- Modify: `css/sections.css`
- Modify: `css/layout.css`
- Modify: `locales/zh.json`
- Create: `js/i18n` copy updates
- Test: full-page screenshots in both languages

**Interfaces:**
- Consumes: all prior components.
- Produces: complete page; every visible string has a `data-i18n` key or is a proper noun.

- [ ] **Step 1: Build the family section**

Header `03 / THE FAMILY` / `ONE MORE CRAFT`. H2 "One more craft in the family." Copy from the spec. A featured STKCraft cell with the albatross mark, name, category and `EARLY ALPHA` badge. A grid of 16 text links (name + category) to `https://getartcraft.com/apps`. End link `See the whole family ↗`.

- [ ] **Step 2: Build the status section**

Header `05 / STATUS` / `EARLY ALPHA · ACTIVE DEVELOPMENT`. H2 "Built in the open. Shipped with evidence." Two columns: SHIPPED list (10 items) and IN PROGRESS list (5 items). A bordered callout for the installer note with links to README and releases. Evidence strip with `MIT / APACHE-2.0`, `PURE RUST`, `NO TELEMETRY`, `MACOS · WINDOWS · LINUX · WEB`.

- [ ] **Step 3: Build the get-started section and footer**

Use the copy and code block from the spec. Three buttons: `Star on GitHub ↗`, `Join the Discord ↗`, `Read the source ↗`. The footer has five columns and a bottom bar with copyright, licence, and repeated theme/language controls. Add `Part of the ArtCraft family` and a trademark note.

- [ ] **Step 4: Write the full Chinese dictionary**

`locales/zh.json` contains every key used by `data-i18n`, including nav, hero, sections, console labels, principles, status, footer, ARIA labels, theme labels and dynamic demo labels. Follow the copy in the spec; use `——` sparingly, Chinese punctuation, and no machine-translated English word order.

- [ ] **Step 5: Add the Chinese typography overrides**

```css
html[lang="zh-CN"] {
  --font-body: var(--font-cjk);
  --font-display: var(--font-cjk);
}
html[lang="zh-CN"] .hero__wordmark {
  font-family: var(--font-display);
  letter-spacing: -.03em;
}
html[lang="zh-CN"] h1, html[lang="zh-CN"] h2, html[lang="zh-CN"] h3 {
  letter-spacing: -.02em;
  line-height: 1.2;
}
html[lang="zh-CN"] .serif { font-style: normal; color: var(--accent); }
```

Slightly reduce `clamp()` maxima for Chinese h2 and hero h1 to avoid orphan characters.

- [ ] **Step 6: Verify translation completeness**

Write a quick QA script that collects all `[data-i18n]` keys in `index.html` and compares them with `locales/zh.json`; fail if any are missing. Also verify `[data-i18n-attr]` keys. Run at both 1440 and 390.

- [ ] **Step 7: Full-page screenshots**

Capture full-page screenshots for `light/en`, `dark/en`, `light/zh`, `dark/zh`. Check: no untranslated English UI strings except proper nouns; Chinese headlines do not overflow; console labels fit; footer columns align.

- [ ] **Step 8: Commit**

```powershell
git add index.html css locales
git commit -m "feat: complete the page and Chinese edition"
```

---

### Task 7: Metadata, accessibility, 404 and performance

**Files:**
- Modify: `index.html`
- Create: `404.html`
- Create: `robots.txt`
- Create: `sitemap.xml`
- Create: `README.md`
- Create: `LICENSE`
- Test: no-JS, keyboard, metadata, Lighthouse

**Interfaces:**
- Consumes: final page.
- Produces: deployable, indexable, accessible site.

- [ ] **Step 1: Complete the head metadata**

Add:
- `<meta name="theme-color" content="#f2f1ee">`
- Open Graph: `og:type=website`, `og:site_name=STKCraft`, `og:title`, `og:description`, `og:url=https://www.stkcraft.com/`, `og:image=https://www.stkcraft.com/assets/og.png`, `og:image:width=1200`, `og:image:height=630`.
- Twitter: `summary_large_image`, title, description, image.
- `<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">`
- `<link rel="manifest" href="assets/site.webmanifest">`
- JSON-LD `SoftwareApplication` with `name`, `applicationCategory: "ScienceApplication"`, `operatingSystem`, `license`, `url`, `sameAs` GitHub.
- `<link rel="alternate" hreflang="en" href="...">` and `hreflang="zh-CN"` pointing to the same URL only if acceptable; otherwise omit. Use `x-default`.

- [ ] **Step 2: Write the 404 page**

Reuse the header/footer and styles, with a large `404`, "This orbit does not exist.", a link home and a link to GitHub. No JS dependencies.

- [ ] **Step 3: Add robots and sitemap**

`robots.txt`:

```txt
User-agent: *
Allow: /
Sitemap: https://www.stkcraft.com/sitemap.xml
```

`sitemap.xml` with the single canonical URL and `lastmod`.

- [ ] **Step 4: Audit accessibility**

- Every image has `alt` (decorative marks use `alt=""`).
- The canvas has a meaningful `role="img"` label and a visible text summary.
- Buttons have `type="button"` and labels.
- The range input has a visible label and `aria-valuetext` updated with UTC time.
- Landmarks: header/nav/main/footer; one h1.
- Focus rings remain visible on dark and light.
- Check contrast with a script: all text tokens ≥ 4.5:1 for body, ≥ 3:1 for large.
- Keyboard test: tab through the page; no trap; mobile menu Escape closes.
- Test with JavaScript disabled: all content visible, no hidden sections.

- [ ] **Step 5: Performance pass**

- Preload only the display font (`Archivo` latin) if it improves LCP; do not preload every face.
- Add `font-display: swap` already provided by Google CSS.
- Ensure `LAND` data is loaded only with the workspace module (dynamic `import()` when the section approaches the viewport) to keep initial JS small.
- Defer non-critical JS: `main.js` type=module is deferred by default.
- Check total transferred bytes < 500KB excluding the social image.
- Run Lighthouse locally with Chrome; target ≥ 95/100/100/100 desktop, ≥ 90 performance mobile.

- [ ] **Step 6: Write README and licence**

README must cover: what the site is, local preview, file map, how to edit copy, how to add translations, deployment, DNS records, and the fact that installers do not exist yet. Use MIT for code and original artwork.

- [ ] **Step 7: Commit**

```powershell
git add index.html 404.html robots.txt sitemap.xml README.md LICENSE assets
git commit -m "feat: add metadata, accessibility and site docs"
```

---

### Task 8: GitHub Pages deployment

**Files:**
- Create: `CNAME`
- Create: `.nojekyll`
- Create: `.github/workflows/pages.yml`
- Modify: `README.md`
- Test: live URL and custom domain

**Interfaces:**
- Consumes: complete static site.
- Produces: deployment on every push to `main`; custom domain `www.stkcraft.com`.

- [ ] **Step 1: Add `CNAME` and `.nojekyll`**

`CNAME` exactly:

```txt
www.stkcraft.com
```

`.nojekyll` is empty.

- [ ] **Step 2: Add the Pages workflow**

`.github/workflows/pages.yml`:

```yaml
name: Deploy site

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: .
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Push and enable Pages**

```powershell
git push -u origin main
gh api -X POST repos/spacelibres/STKCraft_web/pages -f build_type=workflow
```

If Pages already exists, use:

```powershell
gh api -X PUT repos/spacelibres/STKCraft_web/pages -f build_type=workflow
```

Then set the custom domain:

```powershell
gh api -X PUT repos/spacelibres/STKCraft_web/pages `
  -f cname=www.stkcraft.com `
  -F https_enforced=true
```

- [ ] **Step 4: Wait for the workflow and verify the Pages URL**

```powershell
gh run list --repo spacelibres/STKCraft_web --limit 3
gh run watch <run-id> --repo spacelibres/STKCraft_web --exit-status
```

Expected: the `Deploy site` workflow succeeds; `https://spacelibres.github.io/STKCraft_web/` returns 200 and serves the page.

- [ ] **Step 5: Document DNS**

Add to README:
- `www` CNAME → `spacelibres.github.io`
- apex A → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- apex AAAA (optional) → `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
- Enforce HTTPS after DNS verifies.

- [ ] **Step 6: Verify custom domain when DNS is available**

```powershell
Resolve-DnsName www.stkcraft.com -Type CNAME
Invoke-WebRequest https://www.stkcraft.com/ -UseBasicParsing
```

Expected: CNAME to `spacelibres.github.io`, HTTP 200 over HTTPS. If DNS is not configured, report the exact records the user must add; do not claim the domain is live.

- [ ] **Step 7: Commit deployment files**

```powershell
git add CNAME .nojekyll .github README.md
git commit -m "chore: deploy the site to GitHub Pages"
git push
```

---

### Task 9: Visual QA and final polish

**Files:**
- Modify: any file needed after inspection
- Test: screenshots in `tests/` (not committed if large; keep a small final set)

**Interfaces:**
- Consumes: deployed site.
- Produces: evidence that the site matches the design in both themes and languages.

- [ ] **Step 1: Capture the full matrix**

For each combination (light/dark × en/zh) and viewport 1440×1000, 1024×768, 768×1024, 390×844:
- open the local site;
- screenshot the full page;
- record console errors and horizontal scroll width.

Expected: no horizontal overflow (`document.documentElement.scrollWidth <= innerWidth + 1`), no console errors, all sections visible.

- [ ] **Step 2: Inspect the screenshots against the spec**

Check specifically:
- hero wordmark is one line and optically centred;
- albatross reads clearly at header and family sizes;
- section rules line up with the frame;
- console canvas is not blank and labels do not overlap;
- Chinese text does not wrap awkwardly or clip buttons;
- dark theme has no light-theme artifacts (white panels, invisible text);
- footer grid is aligned; fixed index does not cover content.

Fix any issue and re-capture.

- [ ] **Step 3: Test interactions and links**

- All internal anchors resolve and scroll to the intended section.
- GitHub, Discord, ArtCraft, releases and README links return 200 or a valid redirect.
- Play/pause, scrubber, layer toggles, window rows, theme and language all work with mouse and keyboard.
- Copy link button (if included) copies the canonical URL; if not included, omit it.
- No dead `#` links.

- [ ] **Step 4: Run the final checks**

```powershell
python -m http.server 4173 --bind 127.0.0.1
# in another terminal:
node tests/qa.mjs
```

`tests/qa.mjs` uses Playwright to assert:
- title and meta description present;
- no missing translation keys;
- no broken internal anchors;
- both themes set the expected `data-theme`;
- the demo changes state when the slider moves;
- canvas has pixel variance;
- mobile menu opens/closes;
- no horizontal overflow at the four widths.

- [ ] **Step 5: Commit the final polish**

```powershell
git add .
git commit -m "fix: polish responsive layout and interaction details"
git push
```

---

## Self-Review

- **Spec coverage:** identity (Tasks 1–2), visual system (Tasks 1, 4), hero (Task 4), workspace (Task 5), family/principles/status/CTA/footer (Tasks 4, 6), bilingual (Tasks 3, 6), accessibility/performance/SEO (Task 7), deployment (Task 8), QA (Task 9).
- **Placeholder scan:** each task names exact files and commands; no TBD/TODO; the only intentionally temporary item is the placeholder albatross in Task 1, replaced in Task 2.
- **Type consistency:** `initTheme`, `initI18n`, `initNav`, `initReveal`, `initWorkspace`, `createGlobe`, `t(key)`, `data-readout` names and `data-i18n` keys are consistent across tasks.
- **Open risk:** the Google Fonts CSS endpoint may omit a width axis or return a different number of subsets; if so, fall back to `family=Archivo:wght@100..900` and set `font-stretch: 125%` in CSS, keeping the same visual weight. The font fetcher still rewrites every returned URL.
