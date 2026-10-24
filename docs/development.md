# Development

Two npm workspace apps retain independent toolchains and ship one static site.

## Why

The cabinet and portfolio install, run, test, build, and deploy together without an external portfolio deployment.

## How it works

Run `npm ci` at the repository root using the single root lockfile.
`npm run dev` runs `scripts/dev.mjs`, starting portfolio Vite first and arcade Vite second in one Node process.
The arcade listens at `127.0.0.1:5173` and proxies `/portfolio/`, including WebSocket upgrades, to `127.0.0.1:5174`.
The portfolio HMR client connects through the arcade port at `/portfolio/__hmr`.
The arcade's development plugin uses `http-proxy-3` for portfolio HTTP and WebSocket traffic, avoiding the deprecated APIs in Vite 4's bundled proxy without changing either app's Vite version.
An `ECONNRESET`, `ECONNABORTED`, or `EPIPE` on an already destroyed browser WebSocket is treated as a disconnect; other proxy errors remain logged, and failed HTTP upstream requests return 502.
Override ports with `npm run dev -- --port 5180 --portfolio-port 5181`; `--host 0.0.0.0` permits LAN access.
Ports are strict, and the launcher closes both servers on interruption or startup failure.
Root `.env.local` supplies arcade configuration, including `VITE_IFRAME_URL`.

`npm run build` builds each workspace into its own `dist/`, then `scripts/assemble.mjs` replaces root `dist/` with arcade output and copies portfolio output under `dist/portfolio/`.
`npm run preview` serves that combined directory.
Its proxy is explicitly empty so Vite preview cannot inherit the development portfolio proxy and accidentally serve source files instead of the assembled build.
Deploy at the domain root with build command `npm run build` and output directory `dist/`.
Vercel and the retained `npm run deploy` gh-pages command use this combined output.
Subdirectory deployment requires revisiting both route bases.

Install Chromium with `npx playwright install chromium`, then run `npm run check` for lint, portfolio types, both builds, launcher checks, game tests, production HTTP checks, and browser integration tests.
`npm test` expects an existing root build; `npm run check` creates it first.
Production desktop and Pixel mobile projects run the full feature suite using software WebGL.
Development desktop and mobile projects run `@smoke` integration checks and `@development` content fixtures, retaining real embedded navigation, game exits, downloads, fonts, proxying, and HMR coverage without repeating every production scene assertion.
Mobile projects retain their device viewport, user agent, and touch input with a device scale factor of one, avoiding four times as many WebGL pixels on the software renderer.
The `development-hmr` dependency project finishes its stylesheet mutation and restoration before the other projects start, so parallel tests cannot observe the temporary stylesheet.
Menu motion checks open `/portfolio/` directly; cabinet loading, CRT interaction, hover zoom, and embedded navigation retain real scene coverage.
Scene tests have a scoped 60-second total budget for loading, rendering, and interaction; lightweight browser tests keep the 30-second default.
The cabinet renders on demand, reducing software WebGL work during idle periods and iframe interactions.
Root unit checks include the cabinet joystick's dead-zone and axis selection alongside launcher and browser configuration checks.
Cabinet browser checks cover mouse, multitouch, keyboard coexistence, iframe reconnection, project actions, and projected controls at desktop, phone, landscape, and tablet sizes.
An idle-rendering regression counts actual WebGL draw calls before and after zooming, while the launcher regression resets a real HMR connection and rejects deprecation or socket-error output.
Zoom assertions poll for the screen-width threshold with a 15-second allowance, while a regression throttles rendering to one frame per second and requires the same zoom within three seconds.
Lighting, iframe labels, and CRT layer assertions share an initial scene load; hover zoom and CRT click-through share another.
The embedded game navigation flow checks Q exit before exercising the exit door, avoiding a separate cabinet load.
Use `npm run test:browser -- --project=production-mobile` for one profile or `npm run test:browser -- --grep "labels"` for one regression.
The external override project uses a separate dev server and intercepts only its external portfolio fixture.
Default tests use the real portfolio and verify navigation, game movement and exit, PDF bytes, desktop scene loading and zoom, mobile scene entry with delayed automatic zoom, tablet and touch-laptop detection, and browser errors.
The iPad zoom regression holds the portfolio response until it records the transformed screen width, including a delayed-runner check, so automatic zoom cannot consume its baseline.
The mobile delay check observes loading-screen removal directly so a late animation frame cannot shorten the measured pause.
The embedded navigation test uses `history.back()` on desktop and mobile because only the iframe navigates.
It leaves scene screenshots to the dedicated appearance tests so software WebGL capture time cannot exhaust its navigation budget.
Automatic zoom tests hold the portfolio response while measuring the initial screen width, preventing a slow runner from taking its baseline after zooming has finished.
Screenshots and JSON timing reports are saved under ignored `test-results/`, and the list reporter prints each test's duration.
CI retries a failure once to record its trace; passing first attempts record no trace, and flaky retries still fail the run.
`npm run test:unit` runs launcher checks, browser configuration guards, and the portfolio unit suite.

`.github/workflows/check.yml` runs the required `Quality` and `Tests` jobs for each opened or reopened pull request and whenever commits are pushed to it.
The `Quality` job runs `npm run lint` and `npm run typecheck`.
Three `Browser tests` matrix jobs follow `Quality`, each reusing its installed-dependency cache before building both apps and running unit tests and its share of two browser groups.
They run on separate runners in the official `mcr.microsoft.com/playwright:v1.64.1-noble` container, which includes browsers and their system dependencies, avoiding package-mirror downloads during test setup.
The container uses `--init --ipc=host` for process cleanup and Chromium shared memory.
Keep the image version aligned with the locked `@playwright/test` version when updating Playwright; a browser configuration guard verifies the match.
Tests tagged `@webgl` run with one worker per runner so software-rendered scenes do not compete; the remaining portfolio checks retain two workers per runner.
Both browser groups use Playwright's three-way sharding, with `--fully-parallel` on WebGL to distribute individual cases rather than whole files while `--workers=1` keeps execution serial within each runner.
Each shard runs the HMR dependency before its selected browser tests, retaining the stylesheet mutation and restoration ordering.
The required `Tests` job aggregates `Quality` and all three browser shards and fails if any dependency fails, is cancelled, or is skipped.
Matrix failures do not cancel the remaining shards, preserving their results and artifacts.
The two browser groups save artifacts under `test-results/portfolio/` and `test-results/webgl/` so the second run cannot erase the first run's results.
Quality and browser jobs use Ubuntu and Node.js 24 and install the locked npm dependencies.
They restore installed workspace dependencies using an exact cache key containing the operating system, architecture, Node version, and root lockfile hash.
Cache misses use `npm ci --prefer-offline --no-audit --no-fund`; cache hits skip installation entirely, and no partial-key restore is used.
Together, they run the same checks as local `npm run check`, keeping each shard's build and its consuming tests on the same runner.
New commits cancel an older run for the same pull request.
Each shard uploads available JSON timing reports, failure screenshots, and retry traces as a separate `browser-test-results-<shard>` artifact with an `always()` condition, retained for seven days.
After committing and pushing the workflow, results appear in the pull request's Checks tab.
To require passing checks before merging, configure a GitHub branch ruleset for `master` that requires both the `Quality` and `Tests` status checks.
Replace the former `Lint, types, build, and tests` required check with these two names if it was already configured.

## Key files

- `package.json` and `package-lock.json` - commands, workspaces, and locked resolutions.
- `scripts/dev.mjs` - development server lifecycle.
- `scripts/portfolio-proxy.mjs` - portfolio HTTP and HMR forwarding with WebSocket cleanup.
- `scripts/assemble.mjs` - combined build output.
- `playwright.config.js` - development, production, and override browser projects.
- `.github/workflows/check.yml` - automatic pull request verification.
- `tests/` - launcher and integration regressions.
- `apps/arcade/eslint.config.js` and `apps/portfolio/.eslintrc.cjs` - separate app lint rules.

## Decisions and gotchas

Each app retains its existing tooling ranges and locked versions; no dependency modernization is included.
Root lint configuration lives in `scripts/` so the portfolio's legacy ESLint config has no competing ancestor flat config.
The existing Three.js dependency still produces a missing BatchedMesh export warning in an unused dependency path, and the arcade bundle still exceeds Vite's chunk warning threshold.
Portfolio fonts are bundled locally, so page loads and browser tests do not depend on external font hosts.
Existing dependency security findings remain outside this migration.

The portfolio was imported from local `portfolio-website-rad` without history.
Its source is [RadmehrVafadar/portfolio-website-rad](https://github.com/RadmehrVafadar/portfolio-website-rad) at commit `8991c8be3ced38466600de41666167abc7de2e0f`.
All tracked files were SHA-256 verified before edits.
Ignored `.local-backups/portfolio.git` retains its Git metadata, `.local-backups/portfolio-import.json` records its commit and hashes, and both original lockfiles are saved beside it.
The original remote was not modified.
Rollback consists of switching to the pre-migration branch; the ignored backup can restore the original clone separately.
Do not publish `.local-backups/` or use it as deployment input.

## Related

- [Scene](scene.md)
- [Portfolio testing](../apps/portfolio/docs/testing.md)
