# Arcade Environment

A React Three Fiber arcade cabinet embeds the workspace portfolio at `/portfolio/`.

## Features

- Full-window scene with floating textured cubes and magenta clouds.
- Camera zoom on desktop hover or mobile scene tap.
- Configurable iframe through root `VITE_IFRAME_URL`.

## Quick start

From the repository root:

```bash
npm ci
npm run dev
```

Open http://127.0.0.1:5173/.
Use root `npm run build` and `npm run preview` for the complete site.
The app-only build writes `apps/arcade/dist/`.

## Docs

- [Scene](../../docs/scene.md) - rendering, assets, and camera behavior.
- [Development](../../docs/development.md) - workspace verification and deployment.
