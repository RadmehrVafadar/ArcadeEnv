# Testing

The portfolio workspace checks code quality, game behavior, and production navigation without an additional test framework.

## Why

Development routing can conceal missing production pages and downloads.
Game checks protect controls, collision rules, and base-aware exit navigation.

## How it works

`npm run lint` checks TypeScript, JavaScript, configuration, and tests.
`npm run build` runs TypeScript checks and builds all HTML entries.
`npm test --workspace=portfolio-website` at the repository root runs the built-in Node.js test runner against an existing portfolio build.
Use `npm run test:build --workspace=portfolio-website` to build and test this app independently.
Root `npm run test:unit` runs launcher and browser configuration checks before this app's unit suite.
Root `npm run check` additionally builds the combined site and runs the full browser feature suite on production desktop/mobile, plus focused development integration and content-fixture coverage.
Game unit tests import the actual TypeScript map, content, and input modules using Node 24 type stripping.
They validate authored content, geometry, moving an exhibit with its footprint, interaction selection, and held-key priority.
Browser tests exercise the real Phaser simulation through keyboard and pointer input and observe read-only canvas diagnostics.
Boundary coverage reproduces the former desktop escape below the artwork and now runs against both device profiles.
Museum checks cover wall and exhibit collisions, fixed-step movement at reduced rendering rates, focus loss, failed assets, mirror reading/opening, and resize invariants.
Desktop, small-phone portrait, landscape, and tablet screenshots check the controls and artwork.
The production test reuses the existing build, starts a local preview server, and checks the `/portfolio/` homepage and each prefixed menu destination and its linked scripts and stylesheets over HTTP.
It verifies that local scripts and stylesheets use the portfolio prefix and that the resume bytes match the actual PDF.
Production tests only read `dist/`; root `npm run check` and CI build once before running the Node and browser tests.
Browser tests use two workers, with the stylesheet-mutating HMR check isolated in a dependency project that finishes before other browser tests start.
Menu motion checks run directly on the portfolio instead of loading the cabinet.
Font regressions verify that both portfolio fonts load successfully without external requests in development and production on desktop and mobile.
Mobile emulation preserves the device viewport and touch input while rendering at one device pixel per CSS pixel.
CI records traces only on a failed test's retry and treats flaky retries as failures.

## Key files

- `tests/game.test.mjs` - map validation, authored footprints, interaction selection, and input priority.
- `../../tests/mobile-game.spec.js` - viewport sizing, unobstructed touch controls, cancellation, Space/E interactions, exit, and resize stability.
- `../../tests/museum.spec.js` and `../../tests/game-boundaries.spec.js` - collision, frame-rate, focus, loading-error, and world-boundary regressions.
- `tests/production.test.mjs` - built pages, scripts, stylesheets, and resume checks.
- `../../tests/portfolio.spec.js` - assembled production HTML bytes, embedded navigation, downloads, and desktop controls.
- `tests/blog.test.mjs` - Markdown catalog and relative content links.
- `../../tests/blog.spec.js` - blog navigation across desktop/mobile and development/production, with unpublished article fixtures intercepted in development.
- `../../tests/fonts.spec.js` - local font loading without external requests.

Blog browser checks verify that the portfolio link opens a separate top-level tab and leaves the originating page in place.
The embedded portfolio regression checks the same behavior from inside the arcade cabinet.
- `.eslintrc.cjs` - lint rules and environment configuration.
- `package.json` - verification commands.

## Decisions and gotchas

Pure module tests do not replace browser rendering or real pointer and touch checks.
Before changing UI behavior, inspect desktop and narrow-screen layouts, toggle the background, navigate every menu link, and check the browser console.
For the arcade, check movement, exhibit prompts, Space/E interactions, and the exit door.
Mobile browser regressions use Chromium device emulation and CDP touch input in development and production, covering small phones, portrait and landscape phones, and tablets.
They do not replace physical iOS and Android testing.

## Related

- [Site structure](site-structure.md)
- [Arcade](arcade.md)
