# Testing

The workspace checks authored geometry, input, production routes, and real browser behavior.

## Why

Development routing can conceal missing production pages and downloads.
Game checks protect consistent collision, controls, and base-aware navigation.

## How it works

Run root `npm run check` for lint, TypeScript, both builds, unit tests, and browser tests.
`npm test` expects an existing build; `npm run test:unit` runs launcher, browser configuration, cabinet/audio, and portfolio module checks.
`npm test --workspace=portfolio-website` checks the app independently against its existing build.
Use `npm run test:build --workspace=portfolio-website` to build it first.

Museum unit tests import actual TypeScript modules with Node 24 type stripping.
They validate all six content records, map references, marker uniqueness, unsupported shapes, moved and horizontally mirrored footprints, opposite-wall lamp orientation, nearest interaction selection, source priority, and safe Punch-Out return positions.
Browser helpers observe real Phaser canvas diagnostics and move through normal keyboard events; there is no teleport API.
Movement helpers observe coordinate mutations directly, allow a target crossing within 12 world pixels, and correct larger misses so fixed-step catch-up cannot cause oscillation or excessive overshoot.
Collision checks request two-pixel alignment with the exhibit base before testing its solid body.
Interaction helpers derive approach points from Tiled footprints and require a visible description before any project action.
Exhibit interaction regressions run at five rendered frames per second and after a 500ms frame stall, and cabinet checks wait for museum readiness before asserting reconnected controls.
The boundary assertion preserves the original regression: the player's feet must remain within authored artwork dimensions on desktop and mobile.
A travel assertion ensures the character reaches the bottom rather than passing from spawn without moving.
Collision checks exercise walls and exhibit bases with the same feet body.
All restored exhibits must be reachable and display their own descriptions automatically with X to open, hiding again outside their interaction range.
The top-right action prompt must be absent, and opposite-wall lamp rails must overlap the stone trim.
Movement checks compare 60 Hz and throttled 20 Hz rendering.
Resize and orientation checks preserve position and camera scale without rebuilding geometry.
Loading failures retain the Menu link; keyboard aliases, blur, and hidden tabs clear correctly.
Desktop popup checks release X in the project tab and require the next single press to reopen it.
Mobile checks disable popups and require top-level project navigation.

Presentation captures include desktop, small-phone portrait, phone landscape, tablet, and the real cabinet iframe.
Check crisp artwork, feet layering, lamp pools, readable dialogue, visible navigation, and unobstructed physical controls.
Reference captures show the rebuilt [desktop hallway](../../../docs/screenshots/museum-desktop.png), [tablet hallway](../../../docs/screenshots/museum-tablet.png), and [phone cabinet](../../../docs/screenshots/museum-cabinet-phone.png).
The game must have no duplicate on-screen D-pad or Read/Open buttons.
The fractional-zoom regression checks rendered carpet pixels against the source palette, rejecting dark tile seams introduced by compositing.
Classic-UI checks reject a reserved title bar, require the original white/black rounded dialogue style, and verify that short and long text change box dimensions without horizontal overflow.
Cabinet text-range assertions keep Menu and dialogue inside the visible browser width, including the 412-by-915 projected-screen crop.
Dialogue overlays the bottom of the world without reserving a bar or changing its dimensions.

Production desktop and mobile run the full feature suite.
Development projects retain `@smoke` integration and `@development` content fixtures.
The stylesheet-mutating HMR dependency finishes before other projects.
Mobile retains touch and viewport emulation with one device pixel per CSS pixel.
Passing tests record no trace; CI records a failed retry and treats flaky retries as failures.
Software WebGL tests have scoped timeouts and run serially per CI shard.
See the root [development guide](../../../docs/development.md) for runner, cache, and sharding details.

Production HTTP checks verify every prefixed HTML entry and linked local script/style, plus exact resume PDF bytes.
The menu, blog, fonts, downloads, override, and embedded navigation retain their existing coverage.
Cabinet browser tests use real mouse and CDP multitouch to exercise joystick directions, release/cancellation, keyboard coexistence, focus handoff, re-entry, and cached history.
They also cover menu selection, Z activation, blog scrolling, X parent navigation, physical key feedback, and projected control geometry.
Small-phone, landscape, and tablet captures show the game together with its physical control deck.
Audio checks cover synthesis, mute preferences, gesture unlock, iPhone touch-release unlock, visibility, and disposal.
Idle-rendering checks ensure cabinet feedback settles without continuous WebGL work.

Punch-Out unit checks cover source ownership, chord timing, tap/hold boundaries, actual core-frame sampling, and cancellation.
Browser checks substitute only the pinned EmulatorJS loader using a deterministic joypad fixture; CI fetches no ROM.
They exercise internal exhibit entry, parent/iframe keyboard, cabinet feedback, simultaneous inputs, retry, teardown, and exact return position.
The fixture samples held NES buttons only during running core frames, so canvas keyboard events alone cannot satisfy assertions.
Instructions must fit, list the cabinet mappings, and keep Press Start steady with reduced motion.
Run `npm.cmd run test:browser -- tests/punch-out.spec.js --project=production-desktop --project=production-mobile --workers=1` after a root build for focused emulator checks.
The museum merge does not change emulator runtime behavior.

## Key files

- `tests/game.test.mjs` - map, content, interaction, return positions, and input priority.
- `../../tests/game-helpers.js` - normal movement and read-only canvas observations.
- `../../tests/museum.spec.js` and `../../tests/game-boundaries.spec.js` - collision, reachability, focus, loading, speed, and boundary regression.
- `../../tests/game-presentation.spec.js` and `../../tests/mobile-game.spec.js` - viewport geometry, overlay dialogue, mobile navigation, and screenshots.
- `../../tests/showcase.spec.js` - repeated external-tab activation.
- `../../tests/cabinet-controls.spec.js` - physical controls, focus, multitouch, and iframe lifecycle.
- `tests/punch-out-input.test.mjs`, `tests/punch-out-sampling.test.mjs`, and `../../tests/punch-out.spec.js` - emulator input and integration.
- `../../tests/fixtures/emulator.js` - deterministic loader fixture without ROM bytes.
- `tests/production.test.mjs` and `../../tests/portfolio.spec.js` - production assets and integrated navigation.
- `tests/cabinet-navigation.test.mjs` - menu/blog selection, synchronous activation, and cleanup.
- `../../tests/arcade-audio.spec.js` and `../../tests/arcade-audio.test.mjs` - cabinet audio and lifecycle.

## Decisions and gotchas

Browser emulation does not replace physical iOS and Android testing.
Separately verify the real external ROM/CDN source, starting a bout, movement, both punches, Start/Select, gesture audio, and return navigation.
Keep ROM bytes out of fixtures, build output, and committed artifacts.
Previous master verification captured [desktop instructions](../../../docs/screenshots/punch-out-instructions-desktop.png), [desktop gameplay](../../../docs/screenshots/punch-out-gameplay-desktop.png), [mobile instructions](../../../docs/screenshots/punch-out-instructions-mobile.png), and [mobile gameplay](../../../docs/screenshots/punch-out-gameplay-mobile.png).
Those captures document the emulator, not the rebuilt hallway.

## Related

- [Site structure](site-structure.md)
- [Arcade](arcade.md)
