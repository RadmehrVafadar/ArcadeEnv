# Development

Two npm workspace apps retain independent toolchains and ship one static site.

## Why

The cabinet and portfolio install, run, test, build, and deploy together without an external portfolio deployment.

## How it works

Run `npm ci` at the repository root using the single root lockfile.
`npm run dev` runs `scripts/dev.mjs`, starting portfolio Vite first and arcade Vite second in one Node process.
The arcade listens at `127.0.0.1:5173` and proxies `/portfolio/`, including WebSocket upgrades, to `127.0.0.1:5174`.
The portfolio HMR client connects through the arcade port at `/portfolio/__hmr`.
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
Browser projects exercise development and production on desktop and Pixel mobile profiles using two workers and software WebGL.
The `development-hmr` dependency project finishes its stylesheet mutation and restoration before the other projects start, so parallel tests cannot observe the temporary stylesheet.
Menu motion checks open `/portfolio/` directly; cabinet loading, CRT interaction, hover zoom, and embedded navigation retain real scene coverage.
Scene tests have a scoped 60-second total budget for loading, rendering, and interaction; lightweight browser tests keep the 30-second default.
Zoom assertions poll for the screen-width threshold with a 15-second allowance, while a regression throttles rendering to one frame per second and requires the same zoom within three seconds.
CRT appearance and click-through behavior are separate tests, with named loading, zoom, screenshot, and embedded navigation steps in traces.
Use `npm run test:browser -- --project=production-mobile` for one profile or `npm run test:browser -- --grep "labels"` for one regression.
The external override project uses a separate dev server and intercepts only its external portfolio fixture.
Default tests use the real portfolio and verify navigation, game movement and exit, PDF bytes, desktop scene loading and zoom, mobile scene entry with delayed automatic zoom, tablet and touch-laptop detection, and browser errors.
The iPad zoom regression holds the portfolio response until it records the transformed screen width, including a delayed-runner check, so automatic zoom cannot consume its baseline.
The mobile delay check observes loading-screen removal directly so a late animation frame cannot shorten the measured pause.
The embedded navigation test uses `history.back()` on desktop and mobile because only the iframe navigates.
It leaves scene screenshots to the dedicated appearance tests so software WebGL capture time cannot exhaust its navigation budget.
Automatic zoom tests hold the portfolio response while measuring the initial screen width, preventing a slow runner from taking its baseline after zooming has finished.
Screenshots and failure traces are saved under ignored `test-results/`.

`.github/workflows/check.yml` runs two parallel jobs for each opened or reopened pull request and whenever commits are pushed to it.
The `Quality` job runs `npm run lint` and `npm run typecheck`.
The `Tests` job installs Chromium with its system dependencies, builds both apps, runs unit tests, then runs browser tests in two groups.
Tests tagged `@webgl` run with one worker so software-rendered scenes do not compete; the remaining portfolio checks retain two workers.
The two browser groups save artifacts under `test-results/portfolio/` and `test-results/webgl/` so the second run cannot erase the first run's results.
Both jobs use Ubuntu and Node.js 24 and install the locked npm dependencies.
Together, they run the same checks as local `npm run check`, keeping builds and their consuming tests in one job.
New commits cancel an older run for the same pull request.
Failed runs upload available browser screenshots and traces as the `browser-test-results` artifact, retained for seven days.
After committing and pushing the workflow, results appear in the pull request's Checks tab.
To require passing checks before merging, configure a GitHub branch ruleset for `master` that requires both the `Quality` and `Tests` status checks.
Replace the former `Lint, types, build, and tests` required check with these two names if it was already configured.

## Key files

- `package.json` and `package-lock.json` - commands, workspaces, and locked resolutions.
- `scripts/dev.mjs` - development server lifecycle.
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
