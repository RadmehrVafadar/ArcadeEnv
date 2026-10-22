# Museum art provenance

The new museum artwork was generated with the built-in imagegen tool on 2026-10-22.
`atlas-source.png` preserves the original generated output; it is excluded from the game bundle.
The source was sliced into individual cells and resized with nearest-neighbor sampling into the committed production tiles and furnishings.
The existing player sprite at `../../assets/walk.png` is reused unchanged from the portfolio repository.

## Generation prompt

Create a production sprite atlas for a top-down 16-bit pixel art museum game.
Transparent background.
EXACT layout: 4 columns by 2 rows, each cell equal size, entire canvas square-ish 1024x512.
Each of 8 cells contains one asset filling its cell, no labels, no text, no grid lines.
Cell row 1 col 1: seamless dark warm oak plank floor square tile, fully opaque fills cell.
row1 col2: seamless burgundy carpet square tile with subtle woven pattern, fully opaque fills cell.
row1 col3: front-facing dark walnut paneled wall tile with gold trim along bottom, fully opaque fills cell.
row1 col4: burgundy carpet tile with thin antique gold border along all four edges, fully opaque fills cell.
Row2 col1: ornate freestanding oval turquoise glass mirror with antique gold frame and two wooden feet, isolated transparent background, front view top-down RPG perspective.
row2 col2: small golden glowing table lamp on walnut pedestal, isolated transparent.
row2 col3: dark walnut double entrance door with arched brass trim, isolated transparent.
row2 col4: leafy dark green potted plant in terracotta pot, isolated transparent.
Cohesive elegant warm haunted-museum aesthetic, rich brown wood, muted burgundy, warm amber gold, luminous cyan mirror.
Hard pixel edges, hand-crafted pixel art, no anti-aliasing, no gradients, no lettering.
Objects must not cross their cell boundaries, keep each isolated object centered with 8 percent transparent margin.
Orthographic RPG artwork, no isometric angle.

## Extraction

Coordinates below refer to the 1774-by-887 generated source, as x, y, width, height.

| Asset | Source rectangle | Output pixels |
| --- | --- | --- |
| floor | 24, 24, 392, 384 | 16 × 16 |
| carpet | 474, 30, 384, 376 | 16 × 16 |
| wall | 915, 24, 384, 384 | 16 × 16 |
| rug | 1354, 24, 396, 384 | 64 × 64 |
| mirror | 80, 434, 286, 420 | 32 × 48 |
| lamp | 590, 474, 156, 376 | 16 × 40 |
| door | 934, 432, 350, 414 | 48 × 56 |
| plant | 1404, 486, 304, 366 | 24 × 32 |

`tiles.png` concatenates floor, carpet, and wall horizontally into a 48-by-16 tileset.
