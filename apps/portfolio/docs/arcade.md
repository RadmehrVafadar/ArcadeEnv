# Arcade

The portfolio game is a narrow pixel-art museum hallway authored in Tiled and rendered with Phaser.

## Why

Art, wall collision, exhibit footprints, and interaction ranges share one world coordinate system.
Resizing changes the viewport and camera, never the map or player geometry.

## How it works

`game.html` remains the standalone entry at `/portfolio/src/portfolio-game/game.html`.
`game.ts` starts a Canvas-rendered Phaser scene only on that page.
`scene.ts` loads the map, creates tile layers and reusable furnishings, and runs Arcade Physics at a fixed 60 Hz with 120 world pixels per second movement.
Frame smoothing is disabled so low rendering rates do not reduce movement speed during startup.
The existing character uses 64px source frames displayed at 32px with a 12-by-8 feet body.
The hallway dimensions, arrival point, and exit region come from `world/museum.tmj`.
The 208-by-640 world is a long hallway with a central carpet runner.
The camera starts from a one-tile-narrower hallway frame, then applies 15% additional zoom.
Zoom follows viewport width, including fractional scales, with nearest-neighbor rendering and slightly cropped side walls at the hallway center.

Arrow keys, WASD, and the pointer D-pad share ordered input state.
The latest newly pressed source wins; releasing one alias does not release another held source.
Blur, hidden tabs, pointer cancellation, and lost capture clear movement.
Space reads the nearby exhibit and E opens its link once per key press.
The only current exhibit is the LinkedIn mirror, with its original description and destination.
Q, Menu, or Space/E at the door returns to the portfolio menu inside the current iframe.
External exhibit links open a separate tab with `noopener,noreferrer`.

HTML dialogue, contextual prompts, and controls remain outside the canvas.
Dialogue appears in a box over the bottom of the world only while text is displayed, without reserving a bar or changing the camera area.
The D-pad and Read/Open buttons appear only with a coarse primary pointer, so PC layouts give the full width to the world.
Touch portrait layouts reserve space below the world; touch landscape layouts put controls beside it.
The welcome message disappears on the first actual movement.
Read and Open are disabled outside an interaction range.
The error state retains a Menu link when an asset cannot load.

## Tech

Phaser 3.90, TypeScript, Tiled JSON, and the existing Vite build handle the game.
The Node tests import pure TypeScript modules using Node 24 type stripping.
No React rendering runs inside the game loop.

## Key files

- `src/portfolio-game/game.ts` and `scene.ts` - lifecycle, rendering, camera, and physics.
- `src/portfolio-game/model.ts` - map validation, footprint conversion, and interaction selection.
- `src/portfolio-game/input.ts` and `ui.ts` - input state and accessible HTML feedback.
- `src/portfolio-game/content.ts` - exhibit titles, descriptions, and destinations.
- `src/portfolio-game/world/museum.tmj` - editable map and embedded tilesets.

## Decisions and gotchas

Collision remains intentionally authored, rather than inferred from artwork pixels.
Tile-object collision is stored in its tileset, so moving or resizing a placed object also moves or scales its footprint.
The loader supports finite orthogonal 16px maps, unrotated tile objects, and rectangular collision shapes.
The development URL query `?debug` shows walls, object bodies, interaction ranges, spawn, and exit.
Production ignores that query.
Canvas data attributes expose read-only player and camera diagnostics for browser tests; there is no teleport API.
The game runtime adds a separate large bundle, loaded only when visiting the game.

## Related

- [Museum authoring](museum-authoring.md)
- [Site structure](site-structure.md)
- [Testing](testing.md)
