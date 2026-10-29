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
Game tests execute the actual script in an isolated VM with a minimal DOM substitute.
Startup regressions check the desktop project welcome and movement and Q exit hints, verify the mobile Z/X instructions, and verify that movement dismisses the dialogue and removes its startup styling.
Browser checks verify that the welcome and two larger control rows fit a compact dialogue without clipping and capture production desktop and mobile screenshots.
The production test reuses the existing build, starts a local preview server, and checks the `/portfolio/` homepage and each prefixed menu destination and its linked scripts and stylesheets over HTTP.
It verifies that local scripts and stylesheets use the portfolio prefix and that the resume bytes match the actual PDF.
Production tests only read `dist/`; root `npm run check` and CI build once before running the Node and browser tests.
Browser tests use two workers, with the stylesheet-mutating HMR check isolated in a dependency project that finishes before other browser tests start.
Menu motion checks run directly on the portfolio instead of loading the cabinet.
Font regressions verify that both portfolio fonts load successfully without external requests in development and production on desktop and mobile.
Mobile emulation preserves the device viewport and touch input while rendering at one device pixel per CSS pixel.
CI records traces only on a failed test's retry and treats flaky retries as failures.

## Key files

- `tests/game.test.mjs` - startup, arrow input, collisions, and interaction padding.
- `tests/punch-out-input.test.mjs` - deterministic source ownership, punch transitions, short taps, 60 ms chord boundaries, 600 ms Reset tap/hold, direct Start/Select, and timer cancellation.
- `tests/punch-out-sampling.test.mjs` - slow-core sampling, separate repeated presses, concurrent directions, and immediate queue cancellation.
- `../../tests/punch-out.spec.js` - internal exhibit entry, parent/iframe keyboard, cabinet feedback, multitouch, visibility, retry, teardown, and return position using `../../tests/fixtures/emulator.js` without ROM bytes.
- `../../tests/mobile-game.spec.js` - full-viewport mobile sizing without fallback controls, keyboard Z/X interactions, exit, and world edges.
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

VM tests do not replace browser rendering or real pointer and touch checks.
Punch-Out CI substitutes only the official pinned loader with a deterministic emulator adapter; it does not fetch or store a ROM and does not claim live gameplay coverage.
The fixture implements `gameManager.simulateInput` and polls simultaneous held buttons on running emulated frames, rather than treating canvas keyboard events as NES input.
Run `npm.cmd run test:browser -- tests/punch-out.spec.js --project=production-desktop --project=production-mobile --workers=1` after a root build for focused input checks.
Separately verify the real external source in a browser: check the direct CORS response and NES header, title screen, starting a bout, movement, both punches, Start/Select, gesture audio, and exit back to the exhibit.
Capture desktop and mobile instructions and live gameplay, checking the centered viewport, cabinet transitions, readable copy, and absence of emulator touch controls or toolbars.
Keep ROM bytes out of fixtures, screenshots' supporting files, build output, and committed artifacts.
Live Chromium desktop and iPhone 13 emulation verified a 200 CORS response with the NES header, title and bout startup, movement, both punches, Start/Select delivery into the real NES core, an active audio signal, and exact return position with the AudioContext closed on exit.
The focused input and retry regressions also pass in WebKit with an iPhone viewport; physical iPhone Safari remains untested.
Review the captured [desktop instructions](../../../docs/screenshots/punch-out-instructions-desktop.png), [desktop gameplay](../../../docs/screenshots/punch-out-gameplay-desktop.png), [mobile instructions](../../../docs/screenshots/punch-out-instructions-mobile.png), and [mobile gameplay](../../../docs/screenshots/punch-out-gameplay-mobile.png).
Cabinet input VM tests cover connection, disconnection, actions, source ownership, visibility resets, and projected text sizing.
`tests/cabinet-navigation.test.mjs` covers one-step joystick selection, wrapping, source reset, synchronous link activation, blog X parent navigation, Reset, and connection cleanup.
It verifies that both cabinet and keyboard X do nothing for every main menu selection.
`../../tests/resume-navigation.spec.js` verifies desktop menu preservation and mobile top-level resume navigation from an iframe that blocks popups.
The mobile navigation fixture serves HTML at the PDF URL to avoid depending on a native PDF viewer; production HTTP checks verify the real PDF bytes.
`../../tests/cabinet-input.test.mjs` checks joystick dead-zone and dominant-axis behavior, independently movable caps, the GLB's red Z/X caps and smaller Reset button, the slightly left-shifted joystick position, and the row's visibility from the original camera.
`../../tests/joystick-occlusion.spec.js` compares the joystick's red pixels with the iframe hidden and visible, captures desktop/mobile views, and checks iframe click-through after zoom.
It holds the portfolio response and hides only the loading overlay during the pixel comparison, keeping mobile auto-zoom from moving the measured crop.
A deliberate mobile delay between measuring and capturing protects against slow CI runners; the real portfolio response is released before checking zoom and navigation.
`../../tests/cabinet-controls.spec.js` exercises real cabinet mouse and multitouch input, action navigation, re-entry, keyboard coexistence, and viewport geometry.
Its mobile history regression dispatches persisted pagehide/pageshow events and checks that cabinet controls stay connected, fallback controls remain absent, and movement still works.
Its menu regression selects Start, Blog, and Resume with the joystick, opens the PDF in a new tab using Z, enters the game, and returns from both the game and blog with Reset.
It also enters `/tech`, verifies that its first article has focus, and opens it with Enter.
Article regressions cover continuous physical joystick scrolling, keyboard scrolling from the cabinet and iframe, release behavior, and removal of the underline when the article is no longer selected.
They move focus from the embedded reader to a cabinet button while the joystick is held, verifying that internal focus changes do not interrupt scrolling.
Development fixtures verify all WASD and arrow directions, horizontal code overflow, and stopping on disconnect.
The cabinet regression checks physical X navigation from a folder and the blog index; development article fixtures check keyboard X through all three levels.
Keyboard feedback checks cover Z/X cap depression, all arrow and WASD joystick directions, held aliases, and input from both the parent page and iframe.
Its camera regression checks the original zoom on desktop and mobile, transparent action targets, and working press feedback without visible control overlays.
Viewport regressions verify that exactly three action buttons form a visible row beside the joystick on PC and mobile.
Small-phone, landscape, and tablet screenshots capture the game and physical control deck together.
The idle-rendering regression also checks that WebGL stops drawing after cabinet button feedback settles.
Before changing UI behavior, inspect desktop and narrow-screen layouts, toggle the background, navigate every menu link, and check the browser console.
For the arcade, check movement, exhibit prompts, Z/X interactions, and the exit door.
Mobile browser regressions use Chromium device emulation and CDP touch input in development and production, covering small phones, portrait and landscape phones, and tablets.
The mobile project-opening regression disables popups and verifies that pressing X inside an iframe navigates the top-level page to the project.
They do not replace physical iOS and Android testing.

## Related

- [Site structure](site-structure.md)
- [Arcade](arcade.md)
