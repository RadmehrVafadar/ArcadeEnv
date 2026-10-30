# Portfolio product

## Platform

web

## Product Purpose

The portfolio introduces Radmehr Vafadar through a landing page, blog, resume, and interactive pixel-art museum inside an optional 3D arcade cabinet.
The museum lets visitors explore, read about an exhibit, and open its destination without progression gates.

## Users

Visitors explore the owner's work on desktop, phone, or tablet, either directly with a keyboard or through the cabinet's joystick and buttons.

## Capabilities and Constraints

The museum recreates the original hallway using modular Tiled assets and a focused TypeScript/Phaser runtime.
Tiled owns world layout, wall collision, furnishing footprints, interaction padding, spawn, and exit.
TypeScript content records own exhibit descriptions and destinations.
Geometry stays in world coordinates and never depends on CSS size or device layout.

Six newly illustrated exhibits occupy three pairs: LinkedIn and Punch-Out, Fake News Detector and Music Orb, Distributed Video Streaming and Minesweeper.
WASD or arrow keys move, Z reads, X opens, and Q or the floating Menu link returns to the portfolio.
The cabinet joystick and Z/X/Start buttons provide the same museum actions on desktop and touch devices.
The game has no on-screen D-pad or Read/Open buttons on any device.
Standalone visits require a keyboard; touch interaction uses the cabinet controls.

External destinations open a separate tab on desktop and the top-level browser on coarse-pointer devices.
Punch-Out stays inside the current iframe and restores the visitor's saved session position only when that position still fits the authored geometry.
Navigation and downloads respect the portfolio's configured base path.
The surrounding portfolio, cabinet, blog, and resume retain their independent design and tooling.

## Brand Commitments

The original hallway image and original light dialogue styling are the visual authorities.
The image remains a reference, not a flattened runtime background or collision source.
New artwork retains the tall three-panel door, horizontal boards, broad burgundy runner, yellow lamps on iron scroll brackets, cyan mirror, and distinct project silhouettes.
The palette closely follows the original dark olive-brown boards, subdued burgundy carpet, grey door, taupe paneling, and restrained brass, with colored project accents.
Palette corrections remain small and material-specific, without a global exposure lift.
Wall-mounted lamps face inward on both sides of the corridor.
Every project exhibit uses newly generated artwork, with source images and prompts retained beside the production assets.
The original visitor sprite and locally hosted Press Start 2P font are retained.

The world fills the frame height without a title or header bar.
A small floating Menu/Q link, compact contextual prompt, and light rounded dialogue provide the interface.
Dialogue fits its content at the bottom left, with bounded scrolling for longer text and no reserved bottom bar.
The periwinkle surround and white desktop frame outline preserve the original UI character.
The camera fits one tile less than the hallway width and adds the requested 15% zoom, using nearest-neighbor rendering at fractional scales.

## Accessibility & Inclusion

The floating Menu link remains a native keyboard-focusable link with a visible focus outline.
Dialogue and contextual instructions use readable HTML outside the canvas.
Dialogue changes are announced politely, while continuous movement is not announced.
The startup message presents separate welcome, movement, and action lines, with joystick and Start guidance when using touch cabinet controls.
Coarse-pointer layouts and cabinet projection scale the HTML text for readability without changing world geometry.
Projection-aware left and right insets keep Menu, prompts, and dialogue within the visible cabinet screen.
Loading errors preserve access to the Menu link.
