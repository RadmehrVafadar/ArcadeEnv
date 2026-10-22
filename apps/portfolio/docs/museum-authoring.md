# Museum authoring

The Tiled project is the editable source of the museum world.

## Why

Adding or moving an exhibit should not require changes to input, movement, camera, or collision code.

## How it works

Open `src/portfolio-game/world/museum.tiled-project` in Tiled, then open `museum.tmj`.
Save the map directly as JSON with embedded tilesets and uncompressed numeric tile arrays.
The app consumes this file without a separate export step.
The current hallway is 13 tiles wide and 40 tiles long, with one-tile side walls and a centered arrival point.
The camera frames one tile less than the full map width, then applies 15% additional zoom for a closer view.

The `floor`, `walls`, and `foreground` layers are tile layers.
Use the `museum` tileset to paint them; the wall tile carries the boolean `collides` property.
The `decoration` and `objects` layers contain tile objects.
Decorative rugs render under the player; furnishings sort by their bottom edge so the player can walk behind them.
The object named Arrival has type `spawn`, and Menu door has type `exit` with a rectangular trigger.
Keep exactly one of each.

To add an exhibit:

1. Add one record to `content.ts` with a unique `id`, factual `title`, `description`, and HTTPS `url`.
2. Add its PNG beside the other world assets and add that image to the embedded `furnishings` collection tileset.
3. In Tiled's Tile Collision Editor, draw one unrotated rectangle around the object's feet/base, not its entire artwork.
4. Set the tile's integer `interactionPadding` property in world pixels; 20 is the mirror's value.
5. Place that tile as an object in the `objects` layer and set its string `exhibitId` property to the content ID.
6. Save, run `node --test apps/portfolio/tests/game.test.mjs` from the repository root, and visit the game with `?debug` during development.
7. Walk to the object, test Read and Open, and run `npm run check` before finishing.

Tile objects use bottom-left alignment.
Collision rectangles are local to the original image dimensions; the loader applies the object's position and scale.
Changing a placed object's position or size therefore updates the visual, solid body, and interaction region together.
Do not flip or rotate collision objects, use polygons, add infinite-map chunks, or switch to external tilesets without extending and testing the loader first.

## Key files

- `src/portfolio-game/world/museum.tiled-project` - editor project.
- `src/portfolio-game/world/museum.tmj` - world geometry, layers, and reusable object definitions.
- `src/portfolio-game/content.ts` - exhibit content independent of geometry.
- `src/portfolio-game/world/art-provenance.md` - source and processing notes for the new assets.

## Decisions and gotchas

The map validator rejects unknown or duplicate exhibit references, unplaced content, duplicate object IDs, missing spawn/exit markers, malformed tile layers, and unsupported shapes.
A valid map still needs a walkthrough to ensure an exhibit is reachable and the art matches its authored footprint.
New standalone PNGs are discovered by Vite; keep production world assets small and at their intended pixel dimensions.
The source atlas is excluded from runtime loading.

## Related

- [Arcade](arcade.md)
- [Testing](testing.md)
