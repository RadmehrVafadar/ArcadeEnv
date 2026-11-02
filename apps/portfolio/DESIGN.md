---
name: Pixel Museum
description: The original pixel hallway with muted modular artwork and its light rounded dialogue.
colors:
  surround: "#9fa7e4"
  frame: "#83e5f8"
  surface: "#f5f5f5"
  ink: "#000"
  white: "#fff"
  focus: "#175d9f"
  selection: "#b9e9ff"
typography:
  body:
    fontFamily: "Press Start 2P, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  compact-body:
    fontFamily: "Press Start 2P, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.7
  startup:
    fontFamily: "Press Start 2P, monospace"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  status:
    fontFamily: "Press Start 2P, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.7
  navigation:
    fontFamily: "Press Start 2P, monospace"
    fontSize: "11px"
    fontWeight: 400
  shortcut:
    fontFamily: "Press Start 2P, monospace"
    fontSize: ".8em"
    fontWeight: 400
  exhibit-action:
    fontFamily: "Press Start 2P, monospace"
    fontSize: ".85em"
    fontWeight: 400
rounded:
  dialogue: "2em"
  compact: "8px"
spacing:
  small: "8px"
  medium: "12px"
  edge: "16px"
  dialogue: "1em"
components:
  menu-link:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.navigation}"
    rounded: "{rounded.compact}"
    padding: "8px 12px"
  menu-link-hover:
    backgroundColor: "{colors.white}"
  dialogue:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.dialogue}"
    padding: "1em"
    width: "fit-content"
  dialogue-coarse:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.compact-body}"
    rounded: "{rounded.compact}"
    padding: "12px"
    width: "fit-content"
  startup:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.startup}"
    rounded: "{rounded.dialogue}"
    padding: "1em"
    width: "fit-content"
  loading:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.status}"
    rounded: "{rounded.dialogue}"
    padding: "24px"
---

# Design System: Pixel Museum

## Overview

**Creative North Star: "The original pixel hallway"**

These rules describe the museum game and its HTML shell.
The surrounding landing page, blog, resume, and 3D cabinet retain their existing design.
The original hallway and original light dialogue establish the visual character, with newly generated modular artwork and the retained visitor sprite.
Dark olive-brown boards, subdued burgundy carpet, a grey door, taupe panels, and restrained brass closely follow the original hallway, while colored project accents identify individual exhibits.
The world fills the frame, while a small floating Menu link and content-sized dialogue recede around it.
Projection-aware text insets keep these overlays inside the visible cabinet screen.

**Key Characteristics:**

- Dark olive-brown horizontal boards surround a broad subdued burgundy runner.
- A tall three-panel grey door and inward-facing yellow lamps attached to stone trim preserve the hallway's architecture.
- Light rounded dialogue uses black text and a strong black border.
- The full-height world has no title bar or reserved dialogue strip.
- Crisp world pixels coexist with readable HTML text and physical cabinet controls.

## Colors

The original light UI sits over muted warm pixel artwork, with strong black-on-whitesmoke dialogue contrast.

### Primary

- **Periwinkle surround** preserves the original page background.
- **Frame cyan** remains the fallback surface behind the world.
- **Focus blue** marks native keyboard focus, while **Selection blue** highlights selected text.

### Neutral

- **Whitesmoke surface** carries dialogue, startup guidance, loading, and Menu navigation.
- **Ink** supplies dialogue text and the strong UI borders.
- **White** outlines the desktop frame and brightens Menu hover.

World material colors belong to the production tiles and furnishings rather than HTML theme tokens.
Preserve the original dark olive-brown boards, subdued burgundy runner, grey door, taupe panels, yellow lamps, cyan glass, and restrained brass details.
Keep colored project accents distinct without lifting the exposure of the whole scene.
Keep existing object identities, silhouettes, proportions, and pixel dimensions when adjusting their color.

## Typography

The locally hosted Press Start 2P face carries all museum text, with monospace as its fallback.
Standard exhibit dialogue uses the body role, while the startup box uses a larger line-based hierarchy.
The welcome line is .8em with .65em bottom spacing, movement occupies its own line, and the action line is .85em.
Exhibit descriptions end with a separate .85em action line and .65em top spacing.
Loading and recovery guidance use the status role.
The Menu shortcut is .8em beside its navigation label.

On coarse-pointer devices, dialogue uses 11px text with a 1.7 line height.
Cabinet-connected dialogue uses the adapter's projection-compensated font size, clamped between 18px and 48px, with a 1.5 line height.
Text remains HTML rather than being painted into the game canvas.

## Layout

The frame fills the available viewport, including the cabinet iframe, and centers at a maximum width of 1200px.
The world panel and camera occupy the full frame height.
There is no title, header row, control strip, or reserved bottom dialogue bar.
Safe-area padding belongs to the outer page.

The authored world measures 208 by 576 world pixels on a 16px tile grid.
Six exhibits occupy three left/right pairs: LinkedIn/Punch-Out, Fake News Detector/Music Orb, and Distributed Video Streaming/Minesweeper.
The camera fits one tile less than the world width, then adds 15% zoom.
Camera scale follows width rather than height and permits fractional nearest-neighbor scales.
Static floor and wall tiles are cached together at the original world resolution, with foreground tiles cached separately above the scene, so fractional zoom does not expose seams between tiles.
Tiled remains the authoring and collision source for these cached layers.
Resizing changes the viewport and camera framing, never collision geometry, furnishing positions, or the visitor's position.

Menu floats at the top left with a 12px inset.
Dialogue sits at the bottom left with 16px side and bottom insets.
It fits its text width and height, with a maximum width of 72 characters or the available width.
Long content scrolls within a height bounded by 60dvh and the space left below the top overlays.
The welcome disappears on the first movement, and nearby exhibit descriptions appear automatically within their footprint-relative interaction ranges.

Coarse-pointer layouts use 8px top and bottom overlay insets and remove the frame outline.
When connected, measured offscreen portions of the same-origin iframe add projection-aware left and right insets.
Menu adds the left inset to its 12px baseline, and dialogue adds both insets to its 16px side edges.
These text adjustments preserve world geometry, camera zoom, and cabinet pose.

## Elevation & Depth

HTML overlays use light fills, strong outlines, and rounded corners without shadows.
World depth comes from the muted raster artwork, dithered lamplight, fixed tile layers, and sorting furniture against the visitor's feet.
Decorations render below the visitor while foreground tiles can render above the world.
Collision uses Tiled-authored rectangular footprints around furnishing bases rather than the full visible sprite.
The retained visitor displays at 32px with a consistent 12-by-8 world-pixel feet body.

The reusable lamp has its wall-attachment rail on the right and its shelf extending left into the room.
The three left-wall lamp instances use Tiled horizontal flips, while the three right-wall instances remain unflipped, so every bracket attaches to its wall and faces inward.
The 28px-wide lamp frames start at x8 on the left and x172 on the right, placing both mounting rails over the stone trim.
The loader mirrors local collision footprints with the artwork.
Vertical and diagonal tile-object flips remain unsupported.

## Shapes

Dialogue, startup, and loading surfaces retain the original rounded form with a 4px black border and 2em corners.
Coarse-pointer dialogue uses a 2px border and 8px corners.
Menu uses a 2px black border and 8px corners.
The desktop frame has a 4px white outline.
The world uses chunky pixel clusters, strong object silhouettes, a rectangular runner, a paneled door, and an oval cyan mirror.
Do not smooth or blur the raster assets when scaling them.

## Components

### Floating Menu

The small native Menu link overlays the world's top left with the C shortcut beside it.
It uses a whitesmoke fill, black text, and a minimum 44px width and height.
Hover brightens the fill to white.
Keyboard focus uses a 3px blue outline with a 3px offset.
C and the cabinet's Start action perform the same menu navigation.

### Floating dialogue

The light rounded dialogue fits its title and description at the bottom left.
It reserves no world layout space and announces changes through a polite HTML status region.
Width and height follow the content until their bounds require wrapping or scrolling.
Approaching an exhibit shows its description automatically, followed by a separate X to open line.
The entrance uses the same presentation with X to exit.
Leaving the interaction range after the first movement hides the description.
The status text changes only when the nearby exhibit ID changes, keeping live announcements stable while the visitor stays in range.

### Startup guidance

The original welcome reads "Welcome to my project showcase!" above separate movement and action lines.
The movement line states WASD or arrow keys, and the action line states X to open and C to exit.
Touch cabinet visitors instead see separate Joystick, X, and Start lines.
The first movement hides the startup box.

### Loading and failure

Loading guidance uses a light rounded panel centered within a 20px world inset.
A failed load replaces the status text with reload and menu guidance while the floating Menu link remains available.

### Visitor and exhibits

The original visitor uses four directional walking frames at eight frames per second.
The latest held keyboard or cabinet direction wins, and movement remains cardinal.
Descriptions appear automatically within each exhibit's authored interaction range, and X opens once per press.
Z remains a legacy read alias without an on-screen instruction.
The game exposes no on-screen D-pad or Read/Open buttons.
Touch visitors use the cabinet joystick and buttons, while standalone visits require a keyboard.
Desktop external projects open separate tabs and coarse-pointer devices open them in the top-level browser.
Punch-Out stays in the current iframe and restores a saved session position only when its feet body still fits the map.

## Do's and Don'ts

### Do:

- Do preserve the original hallway architecture, muted material palette, and exhibit pair arrangement with modular assets.
- Do attach lamp rails to the stone trim, face lamps inward, and mirror their authored footprints with the artwork.
- Do retain the original visitor sprite and locally hosted pixel font.
- Do use the original light rounded dialogue, periwinkle surround, and white desktop frame outline.
- Do keep dialogue content-sized and protect all overlays with projection-aware text insets.
- Do render the world with nearest-neighbor sampling and retain the requested 15% camera zoom increase.
- Do author footprints and interaction ranges in Tiled world coordinates.

### Don't:

- Don't add a title or header bar above the world.
- Don't replace the original light UI with dark parchment panels.
- Don't apply a global exposure lift to the hallway or furnishings.
- Don't add an on-screen D-pad or Read/Open buttons on any device.
- Don't add a top-right action prompt or require an action to read exhibit descriptions.
- Don't reserve a bottom control or dialogue bar.
- Don't use the original hallway image as the runtime world or collision source.
- Don't scale collision geometry from CSS or viewport pixels.
- Don't apply these museum-specific rules to the surrounding portfolio, blog, or cabinet.
