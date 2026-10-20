# Rad's Portfolio

A 3D arcade cabinet wraps Radmehr Vafadar's portfolio in one npm workspace and deployment.

## Features

- Desktop arcade at `/` with hover camera zoom and direct portfolio entry on mobile.
- Included portfolio at `/portfolio/` inside the cabinet screen.
- Pixel-art showcase game, blog placeholder, and resume PDF.
- One install, development command, build, and deployment.

## Quick start

Use an active Node.js LTS release with npm.

```bash
npm ci
npm run dev
```

Open http://127.0.0.1:5173/ for the cabinet or http://127.0.0.1:5173/portfolio/ for the portfolio.
The launcher starts both apps and proxies portfolio requests and hot reload through the arcade server.
Set `VITE_IFRAME_URL` in root `.env.local` to use an external site for the desktop iframe and mobile destination.

Install Chromium once with `npx playwright install chromium`, then run `npm run check` for all checks.
On PowerShell with script execution disabled, use `npm.cmd` and `npx.cmd`.

## Production build

Build both apps into root `dist/` and preview the production site locally:

```bash
npm run build
npm run preview
```

Deploy root `dist/` at the domain root using `npm run build` as the build command.
`npm run deploy` builds and publishes the same combined output using gh-pages.

## Docs

- [Development](docs/development.md) - commands, testing, deployment, and import provenance.
- [Scene](docs/scene.md) - cabinet rendering and iframe configuration.
- [Portfolio](apps/portfolio/README.md) - landing page, game, and content.
