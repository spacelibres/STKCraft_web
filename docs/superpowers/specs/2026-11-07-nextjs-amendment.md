# Amendment: Next.js + TypeScript

**Date:** 2026-11-07  
**Status:** Implemented  
**Supersedes:** the static-HTML implementation notes in
`docs/superpowers/specs/2026-11-07-stkcraft-launch-site-design.md` and
`docs/superpowers/plans/2026-11-07-stkcraft-launch-site.md`.

## Decision

The site is built with **Next.js 16 App Router**, **TypeScript** and **React 19**. It is exported
as a fully static site (`output: "export"`) and deployed to GitHub Pages.

This replaces the earlier plain HTML/CSS/ES-module approach. The visual design, page structure,
copy, identity, interaction model and deployment target are unchanged.

## Consequences

- The site has a build step: `pnpm build` produces `out/`.
- Copy lives in `lib/content.ts` as typed English and Chinese objects, not in a runtime JSON
  fetch.
- Components are React server components, with client components only where interaction is
  required: header menu, theme switch, section index, ruler, hero canvas, mission console and
  reveal controller.
- The globe uses `d3-geo` for correct orthographic clipping; this is a build dependency, not a
  runtime CDN request.
- GitHub Actions builds and deploys `out/` instead of uploading the repository root.
- Fonts are loaded with `next/font/local` from `app/fonts/`; licence files remain in
  `public/fonts/licenses/`.

## Verification

- `pnpm build` completes and generates `/`, `/zh/` and `/icon.svg`.
- `pnpm typecheck` passes.
- Static export contains `CNAME`, `robots.txt`, `sitemap.xml`, `og.png` and the icons.
- Browser verification covers both themes, both languages and 1440/1024/768/390 widths.

## Identity amendment (2026-11-07)

The supplied **albatross-in-flight engraving** replaces the earlier hand-drawn head mark. It is
shown on the ArtCraft accent blue (`#2d81ff`) with a rounded-square silhouette. The transparent
master is `public/brand/albatross-flight.svg`; the blue master is `public/brand/albatross.svg`;
the 512px UI asset is `public/brand/albatross.png`. The favicon and app icon are generated from
the blue master.
