---
name: "rad's blog"
description: "Stripped-down writing on warm paper, organized like folders."
colors:
  paper: "#f7f5ef"
  charcoal: "#33312c"
  muted: "#716b60"
  interaction: "#796044"
  selection: "#dfd7c5"
  selected-ink: "#24221e"
  code-paper: "#eeebe2"
  quote-rule: "#bcb4a5"
  divider: "#d5cfc2"
typography:
  display:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "clamp(38px, 6vw, 52px)"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-.025em"
  headline:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "clamp(32px, 5vw, 44px)"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-.025em"
  title:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 1.2
  body:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "18px"
    lineHeight: 1.75
  label:
    fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace"
    fontSize: "15px"
    lineHeight: 1.75
spacing:
  heading-gap: "28px"
  section-gap: "36px"
  home-block: "64px"
  directory-bottom: "96px"
components:
  folder-link:
    textColor: "{colors.charcoal}"
    typography: "{typography.label}"
    padding: "8px 12px"
  folder-link-hover:
    textColor: "{colors.interaction}"
  reading-column:
    width: "min(100% - 48px, 680px)"
    textColor: "{colors.charcoal}"
    typography: "{typography.body}"
  code-block:
    backgroundColor: "{colors.code-paper}"
    padding: "20px"
---

# Design System: rad's blog

## Overview

**Creative North Star: "Warm paper folders"**

A quiet, stripped-down reading surface pairs warm paper with charcoal text and system serif typography.
Small monospace paths provide the folder metaphor without decorative effects.
This system applies only to the blog and does not govern the portfolio landing page or arcade.

**Key Characteristics:**

- Warm paper and charcoal.
- Serif reading with monospace navigation.
- Centered, narrow columns and generous whitespace.
- Flat surfaces without animation or effects.

## Colors

### Primary

Interaction brown marks hovered links and visible keyboard focus.

### Neutral

Paper is the page background; charcoal is the default ink.
Muted ink supports empty states and quotations.
Code paper separates code from prose; quote rules and dividers provide restrained structure.
Selection uses its own paper tint and darker ink.
The frontmatter records the exact CSS values.

## Typography

Georgia with Times New Roman and generic serif fallbacks carries headings and articles.
System monospace carries folder links and code, with no downloaded fonts.
Headings use regular weight; body text uses generous line spacing.
Folder titles become 28px on narrow screens; article subheadings use 28px and 23px.
Parent navigation uses 16px monospace, and empty states use 17px muted serif.

## Layout

The home group is centered horizontally and vertically in a minimum full small viewport height.
Its title sits above the vertical `/tech`, `/hobbies`, and `/work` links.
Folder and article views share the centered reading column defined in the frontmatter.
Folder titles align right, followed by `../` navigation and the article list or empty state.
Directory top padding is `clamp(48px, 10vh, 104px)`.
At widths up to 480px, side gutters become 20px and directory top padding becomes 40px.
Images fit the reading column; wide tables and code scroll horizontally.

## Elevation & Depth

The surface is flat, with no shadows, gradients, transitions, or animated effects.
Whitespace and type hierarchy establish structure.

## Shapes

Content uses plain rectangular flow without cards, rounded containers, or ornamental framing.
Thin rules are reserved for quotations, table rows, and article separators.

## Components

Folder links are plain monospace paths with a minimum 44px target height.
Parent navigation has a minimum 44px square target.
Folder and parent links gain an underline on hover; article links retain underlines.
Keyboard focus uses a 2px interaction-colored outline with a 5px offset.
Route changes focus the heading without a visual outline and return to the page top.
Articles render serif prose, simple quotations, shaded monospace code, responsive images, and scrollable tables.
Empty folders use the quiet `No articles yet.` message.

## Do's and Don'ts

- Do keep this visual system scoped to the blog.
- Do preserve visible keyboard focus and comfortable reading spacing.
- Do use real published articles and honest empty states.
- Don't add decorative effects or animation.
- Don't publish sample content to fill the layout.
