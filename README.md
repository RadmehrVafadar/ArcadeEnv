# Arcade Environment

A React Three Fiber scene with a floating arcade cabinet and an embedded portfolio.

[Live demo](https://arcade-env.vercel.app/)

## Features

- Interactive portfolio displayed inside a 3D arcade cabinet.
- Camera zoom on desktop hover or a mobile scene tap.
- Animated textured cubes and configurable magenta clouds.
- Full-window canvas with a dark gradient background.

## Quick start

Use an active Node.js LTS release and npm.

```bash
git clone https://github.com/RadmehrVafadar/ArcadeEnv.git
cd ArcadeEnv
npm ci
npm run dev
```

Open the local URL printed by Vite.
The screen loads the deployed portfolio by default.
Set `VITE_IFRAME_URL` in `.env.local` to embed another site or a local portfolio server.

```dotenv
VITE_IFRAME_URL=http://localhost:5174/
```

Build with `npm run build` and preview the output with `npm run preview`.
Run `npx playwright install chromium` once, then `npm run check` to lint, build, and test desktop and mobile rendering.
On Windows PowerShell with script execution disabled, use `npm.cmd` and `npx.cmd`.

## Docs

- [Scene](docs/scene.md) - assets, animation, styling, and embedded content.
- [Development](docs/development.md) - checks, deployment, and known limitations.
