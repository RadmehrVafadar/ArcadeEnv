# Arcade Environment + Portfolio

An npm workspace serves a 3D arcade at `/` and its included portfolio at `/portfolio/`.
The apps retain independent tooling and ship as one static deployment.
Stack: JavaScript, TypeScript, React, React Three Fiber, Drei, Three.js, Vite.

## Commands

```bash
npm ci                                  # Install both apps from the root lockfile
npm run dev                             # Start both apps with portfolio and HMR proxying
npm run lint                            # Lint root scripts and both apps
npm run typecheck                       # Check portfolio TypeScript
npx playwright install chromium         # Install browser for integration tests
npm test                                # Launcher, game, production-route, and browser tests
npm run test:unit                        # Launcher, browser configuration, and portfolio unit tests
npm run test:browser -- --grep "labels"   # Run a single browser regression
npm run build                           # Build both apps and assemble root dist/
npm run preview                         # Serve combined dist/
npm run check                           # Lint, types, build, and all tests
npm run deploy                          # Build and publish combined dist/ using gh-pages
```

On PowerShell with script execution disabled, use `npm.cmd` and `npx.cmd`.
Build before running browser tests because they also serve root `dist/`.

## Repo map

```text
apps/arcade/      Cabinet scene and Vite/ESLint tooling
apps/portfolio/   Landing page, game, blog, resume, and app tests
scripts/         Development launcher and combined build assembly
tests/           Lifecycle and desktop/mobile integration tests
docs/            Workspace development and scene documentation
```

## Conventions

- Preserve the cabinet position, camera targets, portfolio content, and game controls.
- Keep one root lockfile and each app's existing tooling versions and lint configuration.
- Use the portfolio Vite base for navigation and downloads so prefixed routes work.
- Keep `VITE_IFRAME_URL` as an explicit override in the root environment.
- Reproduce bugs with a failing regression test before changing implementation.
- Run lint, types, builds, and browser tests; inspect desktop and mobile screenshots for scene changes.
- Update relevant docs alongside code, with each full Markdown sentence on its own line.
- Leave changes staged and uncommitted; the owner handles commits and merges.

## Docs

- Before changing commands, dependencies, tests, or deployment, read [Development](docs/development.md).
- Before changing scene assets, camera behavior, iframe integration, or styling, read [Scene](docs/scene.md).
- Before changing portfolio pages or controls, read its [instructions](apps/portfolio/AGENTS.md) and linked app docs.
