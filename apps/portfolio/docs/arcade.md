# Arcade

The arcade presents five portfolio links and Punch-Out as exhibits in a scrolling pixel-art map.

## Why

Movement and proximity interactions let visitors explore the existing portfolio showcase.

## How it works

`game.html` supplies the map, character, dialogue, and interaction prompt.
`game.js` tracks held directions and updates the character and camera using `requestAnimationFrame`.
Arrow keys and WASD drive keyboard movement.
WASD works with either letter case, and releasing one keyboard alias keeps movement active while another key for that direction remains held.
The player remains inside map limits and cannot enter statue rectangles.
Statue coordinates are normalized so reversed rectangle endpoints work.
An inflated rectangle controls each exhibit's interaction range.
Z displays exhibit text; X opens its destination once per press.
The former Boids exhibit is Mike Tyson's Punch-Out!! with the same location, collision rectangle, and interaction padding.
Its X action opens `/portfolio/src/punch-out/punch-out.html` inside the cabinet on every device, saving the player position in session storage for return.
Other exhibits retain their existing external navigation.
Z reading is synchronous so a tap between animation frames is preserved.
Repeated keydown events are ignored, so returning from a showcase tab does not require a second X press even when the key was released in that tab.
Z or X near the door returns to the `/portfolio/` landing page inside the current iframe.
Q returns to the portfolio menu from anywhere in the game, including before the first move, and stays inside the current iframe when embedded.
The shortcut accepts either letter case and is active only on the game page during standalone visits; connected cabinet pages also use Q to return home.
The welcome message disappears after the player first moves.

On devices with a coarse primary pointer, the game fills the available viewport, including safe-area padding.
The game has no on-screen D-pad or action buttons; the world uses the full viewport in portrait and landscape.
Touch users play through the cabinet joystick and buttons on the main page.
Standalone game visits require a keyboard.
The same-origin cabinet connects through `window.arcadeControls`.
The cabinet joystick moves the player; its red Z and X buttons read with Z and open with X, and its smaller Reset button returns to the menu with Q.
Mobile startup instructions describe those controls, and mobile dialogue text scales to remain readable on the projected CRT.
PC keeps its welcome and movement guidance, with Z/Read, X/Open, and Q/Exit shortcuts.
Keyboard and joystick track movement by source, so releasing one input does not cancel another held input.
The cabinet connection resets on navigation and reconnects when the game is reopened.
Cached browser history retains the connection while clearing held cabinet input.
Cross-origin embeds do not connect to the cabinet interface.
Punch-Out extends it with source-aware button transitions, mapping Z to NES B, X to A, and joystick/arrows/WASD to directions.
Each initial punch waits up to 60 ms for an overlapping Z+X chord, which sends Select and suppresses both punches until released.
Short unchorded taps and newly released held punches remain pressed for at least 32 ms so the NES core samples them.
The runtime also waits for actual emulated frames before releasing or repeating an input, preserving taps on slow renderers; reset discards queued transitions immediately.
Tap Reset or Q to send Start on release, or hold for 600 ms to exit without Start.
Enter and Shift provide direct Start and Select.
Instructions precede the viewport; Z/X begins play, and tapping Reset/Q or pressing Enter begins play with Start.
Held inputs and timers clear on blur, cancellation, hiding, navigation, and disconnect; hidden games pause and resume without replaying input.
Exit restores the saved exhibit position, and Q/menu works normally after release.

EmulatorJS 4.2.3 loads the NES core from its [official CDN](https://cdn.emulatorjs.org/4.2.3/data/).
The emulator requests the URL-encoded `Mike Tyson's Punch-Out!! (U) (PRG1) [!].nes` filename directly from `https://nesninja.com/downloadsnes/` using CORS.
No ROM bytes are bundled, proxied, uploaded, or served by this deployment.
Each session runs in a disposable same-origin runtime iframe; retry or exit removes its realm, cancelling pending requests and destroying audio and emulator resources.
Initialization times out after 45 seconds, with Z to retry and Reset/Q to exit inside the cabinet.
Audio starts automatically where browser policy permits and resumes from cabinet or keyboard gestures without a separate focus click.
Input focuses the emulator viewport automatically, forwarding its keyboard events through the same adapter and cabinet feedback.
The pinned legacy NES core uses its direct keyboard interface for adapter-generated transitions; native keys are intercepted first so they cannot bypass chord timing or duplicate input.
External source/CDN availability and the source's unverified redistribution authorization remain limitations.
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
- `src/punch-out/` - game entry, isolated EmulatorJS runtime, and input timing adapter.

## Decisions and gotchas

Movement is measured per frame, so speed depends on display refresh rate.
Mobile mode follows the primary pointer media query, so desktop laptops with a mouse or trackpad retain the desktop presentation.

## Related

- [Site structure](site-structure.md)
- [Testing](testing.md)
