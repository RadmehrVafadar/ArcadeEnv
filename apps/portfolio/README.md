# Radmehr Vafadar Portfolio

A personal portfolio with an arcade showcase and a React landing page.

Run it locally using the quick start below.

## Features

- Animated clouds and a clickable day/night background.
- Arcade map with six interactive portfolio exhibits.
- Arrow-key and on-screen direction controls.
- Resume download and a minimal Markdown blog organized by topic.

## Quick start

From the repository root, install Node.js with npm, then run:

```bash
npm ci
npm run dev
```

Open http://127.0.0.1:5173/portfolio/ directly or use the cabinet at http://127.0.0.1:5173/.
Root `npm run build` assembles the complete site in root `dist/`; root `npm run preview` serves it.

## Docs

- [Site structure](docs/site-structure.md) - pages, styling, navigation, and assets.
- [Arcade](docs/arcade.md) - movement, collisions, and exhibit interactions.
- [Testing](docs/testing.md) - checks and manual browser verification.
- [Blog](docs/blog.md) - adding Markdown articles, images, and categories.

## Backlog

These ideas from the original README remain outside the cleanup scope:

- Merge the portfolio and arcade environment into one monorepo.
- Simplify the UI and fix menu link underlines.
- Automatically zoom the arcade on mobile.
- Support WASD movement alongside arrow keys.
- Improve movement guidance and explore phone motion controls.
- Make the showcase modular with dedicated rooms or expandable exhibits.
- Explore minigames, mazes, and easter eggs.
