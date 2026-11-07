# Contributing

## One development branch

`main` is the only long-lived branch. Work locally, or use a short-lived feature branch, then merge
or squash it into `main` and delete it. There is no `gh-pages` branch and no GitHub Pages
deployment; the VPS webhook is the deployment path.

## Every change is a release

Every commit that changes the site must bump the smallest version component and update
[`CHANGELOG.md`](CHANGELOG.md) in the same commit.

Example: `0.1.3` → `0.1.4`.

1. Change the `version` field in `package.json`.
2. Add `## [x.y.z] — <title>` to `CHANGELOG.md`, with the relevant `Added` / `Changed` / `Fixed` /
   `Removed` sections.
3. Run:

   ```sh
   pnpm check:version
   pnpm typecheck
   pnpm build
   ```

4. Commit and push `main`.
5. The GitHub webhook deploys the commit to the VPS.

`pnpm build` runs `scripts/check-version.mjs` first, so a commit whose changelog heading and
`package.json` version disagree cannot deploy.

## Deployment

Push to `main`; the signed webhook at `https://www.stkcraft.com/webhook` pulls, builds and
publishes to `/var/www/stkscraft`. See [`deploy/README.md`](deploy/README.md) for the server
layout, logs and recovery commands.

## Copy rules

- STKCraft is independent and preparing to join the ArtCraft Craft family. Do not describe it as
  an announced official Craft app.
- English is the source language in `lib/content.ts`; Chinese implements the same typed shape.
- The mission workspace is explicitly illustrative and **not SGP4 output**.
- No invented benchmarks, fake downloads or unverifiable claims.
