# Showcase scene demo

An opt-in showcase demonstrates visually authored objects with one position for their sprite, collision footprint, and interaction area.

## Why

The original game paints exhibits into a background while maintaining their boundaries separately in JavaScript.
The demo makes placement the shared source of truth and uses identical physics on desktop and mobile.
It does not replace the existing game or change the Start menu destination.

## How it works

Run the usual root `npm run dev` and open `/portfolio/src/portfolio-game/demo.html`.
The original game remains available through the demo's Original game link.
Geometry displays red collision footprints, cyan interaction regions, yellow player feet, white floor limits, and a green exit trigger.
Move exhibits enables dragging with mouse or touch, or moving a focused exhibit with arrows or WASD in eight-pixel increments.
An exhibit cannot be moved onto the player, another footprint, or outside the floor.
Reset scene restores the source placements and player spawn.
Browser edits are temporary and are not saved to the map.

### Authoring in Tiled

1. Open `src/portfolio-game/scene/showcase.tmj` in Tiled.
2. Select an object in the Exhibits layer and move it, preserving its size and rotation.
3. Open the external `exhibits.tsj` tileset to edit an exhibit's footprint in the Tile Collision Editor or its text, URL, and interaction padding in tile properties.
4. Edit the World layer's Walkable rectangle, Spawn point, or Exit rectangle to change the room's playable area.
5. Save the map or tileset and reload the demo; Vite consumes those exact JSON sources, with no manually maintained export.
6. To add an exhibit, add its PNG to `scene/assets/`, add it to the image-collection tileset, define its footprint and properties, then place a tile object in the map with a unique exhibit id.

The map uses native 426-by-1114 artwork pixels, with explicitly top-left-aligned tile objects.
It uses Tiled 1.10+ JSON, where object and tile classes are serialized in the `type` field.
Each exhibit's footprint is local to its sprite; its interaction area expands that footprint by the tile's interaction padding.
The character uses a bottom-center feet anchor and an 18-by-10 ground footprint, rather than its full 64-by-64 sprite silhouette.
Depth ordering lets the player walk behind tall artwork while its ground footprint remains solid.
Movement uses elapsed time at 240 world pixels per second, with collision substeps to prevent tunneling.
Camera scaling, resizing, and pointer type do not change simulation geometry.
Keyboard, mouse, and touch feed the same movement and action handlers.

## Tech

The demo retains the DOM renderer, existing character sprites, locally hosted font, and all six showcase descriptions and URLs.
Tiled is an optional authoring application, not a browser or build dependency.
The scene loader supports one finite orthogonal map, one room image, one World layer, one Exhibits layer, and one external image-collection tileset.
Scaled, flipped, rotated, hidden, or offset objects and layers, and per-instance property overrides, are rejected rather than silently misrendered.
Footprints are rectangles; complex polygons, tile layers, and Tiled object templates are outside this demo.

## Key files

- `src/portfolio-game/demo.html`, `demo.js`, and `demo.css` - opt-in demo, controls, placement tools, and geometry overlay.
- `src/portfolio-game/scene.js` - source validation, derived geometry, movement, interaction selection, and camera calculations.
- `src/portfolio-game/scene/showcase.tmj` - room dimensions, object placements, floor, spawn, and exit.
- `src/portfolio-game/scene/exhibits.tsj` - reusable exhibit artwork, local footprints, and content.
- `src/portfolio-game/scene/assets/` - extracted exhibit sprites and reconstructed room background.
- `../../scripts/extract-showcase-assets.mjs` - reproducible pixel extraction from the existing `pixelB.png`.
- `tests/scene.test.mjs` and `../../tests/showcase-demo.spec.js` - geometry, reachability, controls, placement, and responsive browser regressions.

## Decisions and gotchas

The source artwork is flattened, so the demo uses hand-traced alpha masks and nearby floor samples to separate its exhibits.
Moving a sprite may reveal texture seams; a production adoption should use the original layered artwork or deliberately authored clean floor and transparent sprites.
To regenerate these demo assets, run `node scripts/extract-showcase-assets.mjs` at the repository root after installing Playwright Chromium.
That extraction script is a migration aid; map authoring and normal builds do not run it.
Source validation and PNG dimension tests catch incompatible editor changes, but authored footprints still need visual review against the artwork.
Node tests prove all exhibits and the door remain reachable from spawn and protect against tunneling and invalid placements.
Browser tests exercise the same scene in development and production on desktop and mobile, including the lower computer regression.
Chromium emulation does not replace physical iOS and Android verification.

## Related

- [Arcade](arcade.md)
- [Testing](testing.md)
- [Site structure](site-structure.md)
