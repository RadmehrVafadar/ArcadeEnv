# Arcade Environment

An interactive 3D arcade scene wraps an external portfolio in an embedded screen.
Keep scene behavior and the portfolio URL configurable without coupling this repository to the portfolio implementation.
Stack: JavaScript, JSX, React, React Three Fiber, Drei, Three.js, Vite.

## Commands

```bash
npm ci                              # Install locked dependencies
npm run dev                         # Start the Vite development server
npm run lint                        # Check JavaScript, JSX, and hook usage
npx playwright install chromium     # Install the browser used by the test suite
npm test                            # Run desktop and mobile browser tests
npm test -- --grep "labels"          # Run a single named regression test
npm run build                       # Build the production site into dist/
npm run preview                     # Serve the production build locally
npm run check                       # Run lint, production build, and browser tests
```

On PowerShell with script execution disabled, use `npm.cmd` and `npx.cmd`.

## Repo map

```text
src/           Scene components and global CSS
public/        Arcade model copied unchanged into the build
media/         Cube texture bundled by Vite
tests/         Playwright desktop and mobile regression tests
docs/          Scene and development documentation
```

## Conventions

- Preserve the cabinet, cube positions, cloud settings, and camera targets during cleanup to avoid accidental visual changes.
- Use `import.meta.env.BASE_URL` for public assets and module-relative URLs for bundled assets so Vite resolves them correctly.
- Keep `VITE_IFRAME_URL` as the portfolio override so deployments can select their embedded content.
- Keep hooks unconditional and give mapped React elements stable keys to preserve component identity.
- Reproduce bugs with a failing test before changing implementation, then keep that test in the suite.
- Run lint, build, and browser tests after changes; inspect desktop and mobile screenshots for scene changes.
- Update relevant docs with code changes and put each full Markdown sentence on its own line.
- Leave changes staged and uncommitted unless explicitly asked to commit.

## Docs

- Before changing assets, camera behavior, iframe integration, or styling, read [Scene](docs/scene.md).
- Before changing checks, dependencies, or deployment, read [Development](docs/development.md).
