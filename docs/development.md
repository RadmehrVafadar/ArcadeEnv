# Development

Vite builds the static site, ESLint checks source code, and Playwright verifies desktop and mobile browser behavior.

## Why

The 3D renderer and transformed iframe need browser checks in addition to a successful production build.

## How it works

Install dependencies with `npm ci` and Chromium with `npx playwright install chromium`.
Run `npm run check` to lint, build, and execute browser tests.
Use `npm test -- --project=desktop` or `npm test -- --project=mobile` to select a viewport.
Use `npm test -- --grep "labels"` to run the iframe accessibility regression alone.

Playwright starts Vite on `127.0.0.1:4173` with a strict port and one worker to limit competing software WebGL contexts.
Tests replace the external portfolio response with a local HTML fixture while loading the actual model, cube texture, and cloud texture.
Screenshots are saved in the ignored `test-results/` directory for visual review.
Failures retain browser traces and screenshots.

`npm run build` writes `dist/`; `npm run preview` serves it locally.
Vercel can build with `npm run build` and publish `dist/`.
The retained `npm run deploy` command publishes `dist/` through gh-pages.
The current Vite base is `/`; subdirectory hosting requires configuring an appropriate base path first.

## Tech

ESLint checks unused variables, mapped element keys, hook ordering, and effect dependencies.
Playwright runs Chromium using desktop and Pixel viewport profiles with software WebGL.

## Key files

- `package.json` - commands and dependency ranges.
- `package-lock.json` - reproducible dependency resolution.
- `eslint.config.js` - JavaScript and JSX checks.
- `playwright.config.js` - browser projects and local server.
- `tests/arcade.spec.js` - loading, accessibility, assets, and interaction checks.
- `vite.config.js` - React plugin and root deployment base.

## Decisions and gotchas

The existing Three.js dependency predates some transitive Drei requirements; installation reports peer warnings and the build reports a missing BatchedMesh export in an unused dependency path.
The current scene renders in the browser tests, but dependency modernization requires compatibility testing beyond this cleanup.
The cleanup baseline also reports 17 npm audit findings, including 12 high-severity findings; dependency security upgrades remain outstanding.
The production bundle exceeds Vite's default chunk warning threshold because it includes the 3D renderer.
Browser checks still require access to Drei's remote cloud texture.
External portfolio behavior is outside this repository's test coverage.
The README's former monorepo note did not define an implementation spec; this repository remains a standalone scene.

## Related

- [Scene](scene.md)
