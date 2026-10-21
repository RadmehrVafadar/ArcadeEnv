# Testing

The portfolio workspace checks code quality, game behavior, and production navigation without an additional test framework.

## Why

Development routing can conceal missing production pages and downloads.
Game checks protect controls, collision rules, and base-aware exit navigation.

## How it works

`npm run lint` checks TypeScript, JavaScript, configuration, and tests.
`npm run build` runs TypeScript checks and builds all HTML entries.
`npm test --workspace=portfolio-website` at the repository root runs the built-in Node.js test runner for this app.
Root `npm run check` additionally builds the combined site and runs launcher checks and desktop/mobile browser coverage against development and production.
Game tests execute the actual script in an isolated VM with a minimal DOM substitute.
The production test builds the site, starts a local preview server, and checks the `/portfolio/` homepage and each prefixed menu destination and its linked scripts and stylesheets over HTTP.
It verifies that local scripts and stylesheets use the portfolio prefix and that the resume bytes match the actual PDF.
Production tests write to `dist/`; avoid concurrent builds against that directory.
Blog browser checks verify navigation in the current page and browser Back to the portfolio menu without opening another tab.
The embedded portfolio regression checks navigation inside the arcade cabinet, and resume downloads retain PDF byte checks.

## Key files

- `tests/game.test.mjs` - startup, arrow input, collisions, and interaction padding.
- `../../tests/mobile-game.spec.js` - mobile viewport sizing, unobstructed touch controls, release and cancellation, Space/E interactions, exit, and world edges.
- `tests/production.test.mjs` - built pages, scripts, stylesheets, and resume checks.
- `../../tests/portfolio.spec.js` - embedded menu navigation, browser Back, and resume downloads.
- `tests/blog.test.mjs` - Markdown catalog and relative content links.
- `../../tests/blog.spec.js` - blog navigation across desktop/mobile and development/production, with unpublished article fixtures intercepted in development.
- `.eslintrc.cjs` - lint rules and environment configuration.
- `package.json` - verification commands.

## Decisions and gotchas

VM tests do not replace browser rendering or real pointer and touch checks.
Before changing UI behavior, inspect desktop and narrow-screen layouts, toggle the background, navigate every menu link, and check the browser console.
For the arcade, check movement, exhibit prompts, Space/E interactions, and the exit door.
Mobile browser regressions use Chromium device emulation and CDP touch input in development and production, covering small phones, portrait and landscape phones, and tablets.
They do not replace physical iOS and Android testing.

## Related

- [Site structure](site-structure.md)
- [Arcade](arcade.md)
