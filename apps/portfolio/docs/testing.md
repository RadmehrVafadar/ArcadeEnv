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

## Key files

- `tests/game.test.mjs` - startup, arrow input, collisions, and interaction padding.
- `tests/production.test.mjs` - built pages, scripts, stylesheets, and resume checks.
- `tests/blog.test.mjs` - Markdown catalog and relative content links.
- `../../tests/blog.spec.js` - blog navigation across desktop/mobile and development/production, with unpublished article fixtures intercepted in development.

Blog browser checks verify that the portfolio link opens a separate top-level tab and leaves the originating page in place.
The embedded portfolio regression checks the same behavior from inside the arcade cabinet.
- `.eslintrc.cjs` - lint rules and environment configuration.
- `package.json` - verification commands.

## Decisions and gotchas

VM tests do not replace browser rendering or real pointer and touch checks.
Before changing UI behavior, inspect desktop and narrow-screen layouts, toggle the background, navigate every menu link, and check the browser console.
For the arcade, check movement, exhibit prompts, Space/E interactions, and the exit door.
The cleanup preserves the current UI and leaves existing mobile limitations documented in the arcade guide.

## Related

- [Site structure](site-structure.md)
- [Arcade](arcade.md)
