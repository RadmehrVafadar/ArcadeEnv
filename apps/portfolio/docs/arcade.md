# Arcade

The arcade presents six portfolio links as exhibits in a scrolling pixel-art map.

## Why

Movement and proximity interactions let visitors explore the existing portfolio showcase.

## How it works

`game.html` supplies the map, character, directional buttons, dialogue, and interaction prompt.
`game.js` tracks held directions and updates the character and camera using `requestAnimationFrame`.
Arrow keys, WASD, and the on-screen directional buttons drive movement.
Each on-screen arrow moves the character in its indicated direction using mouse or touch, matching keyboard movement and sprite facing.
WASD works with either letter case, and releasing one keyboard alias keeps movement active while another key for that direction remains held.
The player remains inside map limits and cannot enter statue rectangles.
Statue coordinates are normalized so reversed rectangle endpoints work.
An inflated rectangle controls each exhibit's interaction range.
Space displays exhibit text; E opens its external link once per press.
Repeated keydown events are ignored, so returning from a showcase tab does not require a second E press even when the key was released in that tab.
Space or E near the door returns to the `/portfolio/` landing page inside the current iframe.
The welcome dialogue appears at the top of the game viewport and disappears after the player first moves.
The frame stays centered when it fits and aligns to the top in shorter viewports so the dialogue remains reachable.
Exhibit dialogue uses the same top position, with interaction guidance below it so both remain clear of the directional controls.
Exhibit dialogue appears only after interaction and hides when the player leaves the exhibit.

## Tech

Plain JavaScript uses DOM events and CSS sprite animations.
CSS custom properties control pixel scaling at viewport breakpoints.

## Key files

- `src/portfolio-game/game.html` - map and controls.
- `src/portfolio-game/game.js` - state, collision, interactions, and input.
- `src/portfolio-game/game.css` - camera, sprite animation, and controls.
- `src/assets/pixelB.png` - map artwork.
- `src/assets/walk.png` - character sprite sheet.

## Decisions and gotchas

Movement is measured per frame, so speed depends on display refresh rate.
The current controls do not implement touch buttons for reading and opening exhibits.
Touch controls register press events but have no dedicated touch-release handler.
These existing limitations are outside the cleanup scope.

## Related

- [Site structure](site-structure.md)
- [Testing](testing.md)
