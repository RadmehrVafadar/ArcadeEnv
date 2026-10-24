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
Z displays exhibit text; X opens its external link once per press.
Repeated keydown events are ignored, so returning from a showcase tab does not require a second X press even when the key was released in that tab.
Z or X near the door returns to the `/portfolio/` landing page inside the current iframe.
Q returns to the portfolio menu from anywhere in the game, including before the first move, and stays inside the current iframe when embedded.
The shortcut accepts either letter case and is active only on the game page during standalone visits; connected cabinet pages also use Q to return home.
The welcome message disappears after the player first moves.

On devices with a coarse primary pointer, the game fills the available viewport, including safe-area padding.
Portrait mode places the D-pad and Z/Read and X/Open buttons below the world; landscape mode places them beside it.
Messages stay inside the world area and cannot cover these controls.
Touch movement uses pointer capture and stops on release, cancellation, lost capture, or focus loss.
The action buttons use the same exhibit and door interactions as the keyboard.
When the same-origin cabinet connects through `window.arcadeControls`, the game hides its on-screen controls and gives their space to the world.
The cabinet joystick moves the player; its red Z and X buttons read with Z and open with X, and its smaller Exit button returns to the menu with Q.
Mobile startup instructions describe those controls, and mobile dialogue text scales to remain readable on the projected CRT.
PC keeps its welcome and movement guidance, with Z/Read, X/Open, and Q/Exit shortcuts, while hiding the on-screen D-pad.
Keyboard, screen controls, and joystick track movement by source, so releasing one input does not cancel another held input.
The cabinet connection resets on navigation and reconnects when the game is reopened.
Standalone visits retain their on-screen controls; cross-origin embeds do not connect to the cabinet interface.
On mobile, X/Open navigates the current top-level browser window so project links work in in-app browsers without popup support and leave the cabinet iframe.
Desktop project links continue to open a separate tab.
Mobile artwork, sprites, movement, and collision coordinates share a fractional scale based on the camera width.
The mobile camera stays inside the 208-by-544 map, and player bounds keep the sprite above the bottom wall.
Mobile collision and exhibit detection use the character's feet rather than the sprite's top-left corner.
Desktop layout, camera offsets, bounds, and mouse controls retain their existing behavior.

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
Mobile mode follows the primary pointer media query, so desktop laptops with a mouse or trackpad retain the desktop presentation.

## Related

- [Site structure](site-structure.md)
- [Testing](testing.md)
