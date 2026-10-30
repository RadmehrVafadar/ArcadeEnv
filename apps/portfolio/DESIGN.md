---
name: Pixel Museum
description: The original pixel hallway recreated as a modular interactive portfolio museum.
colors:
  canvas: "#211916"
  surround: "#171310"
  dialogue-surface: "#2b201af2"
  prompt-surface: "#211916ed"
  parchment: "#f6e4bf"
  brass: "#d7ae66"
  border: "#755537"
  turquoise: "#9ee0df"
typography:
  title:
    fontFamily: "Press Start 2P, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Press Start 2P, monospace"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 2
  prompt:
    fontFamily: "Press Start 2P, monospace"
    fontSize: "9px"
    fontWeight: 400
    lineHeight: 1.8
  navigation:
    fontFamily: "Press Start 2P, monospace"
    fontSize: "11px"
    fontWeight: 400
  label:
    fontFamily: "Press Start 2P, monospace"
    fontSize: "9px"
    fontWeight: 400
  loading:
    fontFamily: "Press Start 2P, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 2
spacing:
  shortcut: "5px"
  small: "8px"
  prompt: "10px"
  medium: "12px"
  dialogue: "16px"
  large: "20px"
components:
  museum-header:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.parchment}"
    typography: "{typography.title}"
    padding: "0 20px"
    height: "56px"
  menu-link:
    textColor: "{colors.parchment}"
    typography: "{typography.navigation}"
  menu-link-hover:
    textColor: "{colors.turquoise}"
  shortcut:
    textColor: "{colors.brass}"
    typography: "{typography.label}"
    padding: "5px"
  action-prompt:
    backgroundColor: "{colors.prompt-surface}"
    textColor: "{colors.parchment}"
    typography: "{typography.prompt}"
    padding: "10px 12px"
    width: "fit-content"
  dialogue:
    backgroundColor: "{colors.dialogue-surface}"
    textColor: "{colors.parchment}"
    typography: "{typography.body}"
    padding: "16px 20px"
  loading:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.parchment}"
    typography: "{typography.loading}"
---

# Design System: Pixel Museum

## Overview

**Creative North Star: "The original pixel hallway"**

These rules describe the museum game and its HTML shell.
The surrounding landing page, blog, resume, and 3D cabinet retain their existing design.
The world closely recreates the supplied hallway through new modular raster artwork while preserving the original visitor sprite.
Muted boards and a faded runner carry the long interior, with yellow lamplight and cyan glass providing the brightest accents.
The interface recedes into a narrow header, contextual instructions, and floating dialogue.
The cabinet's projected screen bounds keep the header, prompts, and dialogue inside its visible area.

**Key Characteristics:**

- Grey and olive horizontal boards surround a broad faded burgundy runner.
- A tall grey three-panel door and yellow lamps on iron scroll brackets preserve the reference's architecture.
- Newly illustrated project objects share the hallway's chunky pixel scale and muted materials.
- Crisp world pixels coexist with readable HTML text.
- Exploration uses keyboard or cabinet controls without on-screen movement or action buttons.

## Colors

The HTML shell uses a restrained warm palette that supports the hallway artwork.

### Primary

- **Parchment** carries titles, dialogue, prompts, and navigation.
- **Brass** marks the Menu shortcut and echoes the warm lamps.
- **Turquoise** identifies keyboard focus, navigation hover, and text selection, echoing the cyan mirror.

### Neutral

- **Canvas** frames the world and provides the loading surface.
- **Surround** fills any space outside the centered frame.
- **Dialogue surface** and **Prompt surface** use translucent warm dark fills that separate text from the artwork.
- **Border** supplies the thin structural lines around the header, shortcut, dialogue, and prompt.

World material colors belong to the production tiles and furnishings rather than HTML theme tokens.
Preserve the grey/olive boards, faded burgundy runner, yellow lamps, cyan glass, and restrained iron and brass details established by the reference.

## Typography

The locally hosted Press Start 2P face carries all museum text, with monospace as its fallback.
The title, dialogue, prompt, navigation, shortcut, and loading roles use the frontmatter's observed sizes and line heights.
Dialogue remains HTML with a maximum measure of 76 characters instead of text painted into the canvas.
Coarse-pointer portrait layouts reduce the title to 11px and dialogue to 9px with a 1.9 line height.
Compact coarse-pointer landscape uses 9px dialogue with a 1.7 line height.
The cabinet adapter increases prompt and dialogue font size to compensate for CRT projection, clamped between 18px and 48px.

## Layout

The frame fills the available viewport, including the cabinet iframe, and centers at a maximum desktop width of 1200px.
The header occupies 56px above a world panel that receives all remaining space.
Coarse-pointer portrait and landscape below 500px height use a 48px header.
Safe-area padding belongs to the outer page.
There is no reserved control strip or bottom dialogue bar.

The authored world measures 208 by 576 world pixels on a 16px tile grid.
Six exhibits occupy three left/right pairs: LinkedIn/Punch-Out, Fake News Detector/Music Orb, and Distributed Video Streaming/Minesweeper.
The camera fits one tile less than the world width, then adds 15% zoom.
Camera scale follows width rather than height and permits fractional nearest-neighbor scales.
Static floor and wall tiles are cached together at the original world resolution, with foreground tiles cached separately above the scene, so fractional zoom does not expose seams between tiles.
Tiled remains the authoring and collision source for these cached layers.
Resizing changes the viewport and camera framing, never collision geometry, furnishing positions, or the visitor's position.

The contextual prompt sits 12px from the world's upper edges and ignores pointer input.
Dialogue floats 16px above the world's bottom edge with 16px side insets and a scrollable height limit.
Without a cabinet connection, coarse-pointer portrait uses 12px dialogue insets; compact landscape uses 12px side and 8px bottom insets.
When connected, measured offscreen portions of the same-origin iframe add left and right insets to the header's 20px padding, the prompt's 12px edges, and the dialogue's 16px side edges.
These projection-aware text insets preserve the world geometry, camera zoom, and cabinet pose.
The welcome disappears on the first movement, leaving the artwork unobstructed until an exhibit is read.

## Elevation & Depth

HTML panels use translucent tonal separation and thin borders without shadows.
World depth comes from the artwork, dithered lamplight, fixed tile layers, and sorting furniture against the visitor's feet.
Decorations render below the visitor while foreground tiles can render above the world.
Collision uses Tiled-authored rectangular footprints around furnishing bases rather than the full visible sprite.
The retained visitor displays at 32px with a consistent 12-by-8 world-pixel feet body.

## Shapes

The HTML shell uses square corners and crisp one-pixel borders.
The world uses chunky pixel clusters, strong object silhouettes, a rectangular runner, a paneled door, and an oval cyan mirror.
Do not smooth or blur the raster assets when scaling them.

## Components

### Museum header and Menu

The title and Menu link anchor opposite ends of a single compact row.
The native Menu link has a minimum 44px height, a bordered Q shortcut, and a turquoise hover state.
Keyboard focus uses a 3px turquoise outline with a 3px offset.
Q and the cabinet's Start action perform the same menu navigation.

### Contextual prompt

The small bordered prompt names the nearby exhibit and states Z to read and X to open.
Near the entrance it instead states that Z or X exits.
It is informational and never becomes an on-screen action button.

### Floating dialogue

The translucent bordered dialogue contains the welcome or an exhibit's title and description.
It appears over the world only while text is visible and announces changes through a polite HTML status region.
It supports scrolling when text exceeds the available space.
Moving away to another interaction clears the previous description.

### Loading and failure

Loading text sits centered within the world panel with a 20px inset.
A failed load replaces the status text with reload and menu guidance while the persistent header remains available.

### Visitor and exhibits

The original visitor uses four directional walking frames at eight frames per second.
The latest held keyboard or cabinet direction wins, and movement remains cardinal.
Z reads and X opens once per press; the game exposes no on-screen D-pad or Read/Open buttons.
Touch visitors use the cabinet joystick and buttons, while standalone visits require a keyboard.
Desktop external projects open separate tabs and coarse-pointer devices open them in the top-level browser.
Punch-Out stays in the current iframe and restores a saved session position only when its feet body still fits the map.

## Do's and Don'ts

### Do:

- Do recreate the original hallway's materials, architectural silhouettes, and exhibit pair arrangement with modular assets.
- Do retain the original visitor sprite and the locally hosted pixel font.
- Do keep dialogue, contextual instructions, and Menu navigation readable in HTML.
- Do render the world with nearest-neighbor sampling and retain the requested 15% camera zoom increase.
- Do author footprints and interaction ranges in Tiled world coordinates.

### Don't:

- Don't add an on-screen D-pad or Read/Open buttons on any device.
- Don't reserve a bottom control or dialogue bar.
- Don't use the original hallway image as the runtime world or collision source.
- Don't scale collision geometry from CSS or viewport pixels.
- Don't apply these museum-specific rules to the surrounding portfolio, blog, or cabinet.
