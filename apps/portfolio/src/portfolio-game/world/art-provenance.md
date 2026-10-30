# Museum art provenance

The hallway and all six project exhibits use new artwork generated with the built-in imagegen tool on 2026-10-29.
The visual reference is the original `pixelB.png` from the master branch, retained in Git history.
The original flattened map and its project icons are never used as game textures.
The original visitor sprite `../../assets/walk.png` remains unchanged.

## Sources

`sources/` preserves every unprocessed generated PNG.
`sources/prompts.json` records the exact prompt sent for each output and its reference.
The original hallway guided the muted olive-brown boards, faded red runner, grey paneled entrance, golden lamps on curled brackets, cyan mirror, and three pairs of exhibits.
Punch-Out uses a newly drawn walnut/brass boxing cabinet rather than the original Boids icon.
The news machine, music orb, video computer, Minesweeper flag, and mirror are newly drawn sprites.

## Production artwork

Generated objects were cropped to their visible alpha bounds and sampled with nearest-neighbor interpolation.
Their proportions are preserved within bottom-aligned pixel frames.
The transparent light pool is a low-opacity decoration under the visitor.
Only root-level production PNGs are loaded by Phaser; source images and this document are authoring files.

| Production file | Frame pixels |
| --- | --- |
| `mirror.png` | 32 × 48 |
| `punch-out.png` | 32 × 48 |
| `news.png` | 32 × 44 |
| `orb.png` | 32 × 40 |
| `video.png` | 36 × 40 |
| `mines.png` | 32 × 32 |
| `door.png` | 64 × 88 |
| `lamp.png` | 28 × 48 |
| `light.png` | 96 × 64 |
| `tiles.png` | 128 × 96, 16px cells |

## Tile preparation

The generated material source is a 1774-by-887 sheet with four columns and two rows.
Production `tiles.png` uses eight columns of 16px tiles.
Tile indices below are zero-based; Tiled global IDs add the tileset's `firstgid`.

| Tile indices | Material |
| --- | --- |
| 0–1 | Two horizontal-board floor samples |
| 2–5 | Small carpet swatches and borders retained in the tileset |
| 6–7 | Left and reflected right side trim |
| 8–9 | Wall panel and threshold |
| 10–11 | Carpet hem and bottom threshold |
| 12–27 | Sixteen adjoining cells from a 64 × 64 carpet material |
| 28–30 | Three adjoining pieces of a 48px wall panel |
| 31–34 | Left runner border, four vertical variants |
| 35–38 | Right runner border, four vertical variants |
| 39–42 | Bottom runner hem, four horizontal variants |

The remaining atlas cells are unused.
Wall and threshold tiles carry `collides: true` in the Tiled tileset.
Exhibit footprints and interaction padding are stored on their reusable image tiles.

## Extraction rectangles

Source coordinates are x, y, width, height.
Floor samples use `8,6,422,200` and `8,205,422,200`.
The central carpet uses `446,2,438,438`, reduced to 64 × 64 before slicing.
The broad wall panel uses `447,447,436,310`, reduced to 48 × 16 before slicing.
Runner edges use `890,2,436,436` and `1333,2,436,436`, each reduced to 16 × 64.
The bottom hem uses `891,447,436,436`, reduced to 64 × 16.
Side trim uses `0,447,200,436`; threshold uses `1335,447,436,436`.
