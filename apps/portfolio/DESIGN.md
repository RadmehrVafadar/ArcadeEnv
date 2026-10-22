---
name: Pixel Museum
description: Warm pixel-art museum inside the portfolio game.
colors:
  canvas: "#211916"
  surround: "#171310"
  panel: "#2b201a"
  parchment: "#f6e4bf"
  brass: "#d7ae66"
  border: "#755537"
  turquoise: "#9ee0df"
  button: "#4b3025"
  button-hover: "#654331"
typography:
  title:
    fontFamily: "Press Start 2P, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Press Start 2P, monospace"
    fontSize: "10px"
    lineHeight: 2
  label:
    fontFamily: "Press Start 2P, monospace"
    fontSize: "9px"
spacing:
  small: "8px"
  medium: "12px"
  large: "20px"
components:
  action-button:
    backgroundColor: "{colors.button}"
    textColor: "{colors.parchment}"
    padding: "8px"
  action-button-hover:
    backgroundColor: "{colors.button-hover}"
    textColor: "{colors.parchment}"
---

# Design System: Pixel Museum

## Overview

**Creative North Star: "Warm pixel museum"**

These rules describe only the standalone museum game, not the portfolio landing page, blog, or 3D cabinet.
New raster artwork recalls the original dark wood, burgundy carpet, golden lamps, and whimsical objects while retaining the existing visitor sprite.

## Colors

Brass borders and parchment text sit on warm brown HTML surfaces.
Turquoise identifies focus and pointer interaction, echoing the mirror's glass.
Wood and burgundy material colors live in the reusable raster tiles and furnishings.

## Typography

The locally hosted Press Start 2P face carries all museum text.
The title becomes 11px on portrait layouts, while dialogue becomes 9px with generous line height.
Dialogue remains HTML, with a maximum measure of 76 characters, rather than text painted into the game canvas.

## Layout

The game fills its available viewport, including the cabinet iframe, with a maximum desktop width of 1200px.
A header frames the world, while dialogue appears as a box over its bottom edge only when text is displayed.
Dialogue reserves no layout space and remains inside the world so it cannot cover touch controls.
Desktop gives the world the full width and uses keyboard input without on-screen movement or action buttons.
Devices with a coarse primary pointer use a 180px side control area or a 148px control row in portrait.
Compact touch landscape uses a 160px side control area.
Safe-area padding belongs to the outer shell.
The long hallway is framed across its width with 15% additional zoom for a closer view of the player and exhibits.
Camera zoom follows width rather than height, with nearest-neighbor sampling at fractional scales.

## Elevation & Depth

HTML panels use tonal separation and thin borders rather than shadows.
World depth comes from raster artwork and the player's ordering against each furnishing's feet.

## Shapes

Controls use square geometry and crisp borders.
The D-pad retains the existing pixel arrow artwork, recolored to match the museum's warm palette.
Movement targets remain at least 44px square.

## Components

Read and Open buttons use brass borders, warmer hover surfaces, and reduced opacity when no interaction is available.
The persistent Menu link shows its Q shortcut and changes to turquoise on hover.
Keyboard focus is a 3px turquoise outline with a 3px offset.
The dialogue region announces text changes; continuous player movement is not announced.
The prompt sits inside the world panel and does not intercept pointer events.

## Do's and Don'ts

- Do preserve the warm pixel-art material palette and retained visitor sprite.
- Do keep dialogue, navigation, and controls readable outside the canvas.
- Do render world artwork with nearest-neighbor sampling and retain the 15% camera zoom increase.
- Don't scale collision geometry to match viewport pixels.
- Don't apply these museum-specific rules to the surrounding portfolio pages.
