# Arcade

The portfolio game recreates the original pixel hallway with a Tiled map, separate artwork, and Phaser physics.

## Why

Art, collision, and interaction share world coordinates rather than device-specific CSS scaling.
Each exhibit can move in Tiled without engine changes.

## How it works

`game.html` remains at `/portfolio/src/portfolio-game/game.html`.
Only that entry loads Phaser.
`game.ts` creates a Canvas scene; `scene.ts` owns layers, camera, animation, and Arcade Physics.
Physics runs at a fixed 60 Hz with movement at 120 world pixels per second and frame smoothing disabled.
The original character retains its four-direction animation, 32px display size, and one 12-by-8 feet body on every device.

`world/museum.tmj` defines a 208-by-576 hallway, spawn, door trigger, wall tiles, and reusable furnishings.
New sprites recall the original grey paneled door, muted olive-brown boards, subdued burgundy runner, golden lamps, and cyan mirror, with colorful project accents.
Opposite-wall lamps use Tiled horizontal flips so their bracket rails face the wall, with footprints mirrored by the loader.
Their image frames overlap the wall trim so the mounting rails touch the stone instead of floating over the boards.
Six exhibits occupy three pairs: LinkedIn and Punch-Out, Fake News Detector and Music Orb, Distributed Video Streaming and Minesweeper.
Their descriptions and destinations remain separate in `content.ts`.
The new artwork replaces the former flattened project icons.
The original backdrop is a visual reference, never a rendering or collision source.

Wall collision comes from tile properties.
Image collection tiles carry local rectangular footprints and interaction padding.
A placed tile object's scale and position transform its artwork, footprint, and interaction range together.
Decoration sits below the visitor; furniture and the visitor sort by their feet.
Map validation rejects missing references, duplicate IDs, missing markers, malformed layers, and unsupported shapes.

WASD and arrows move in four directions, with the most recently pressed source taking priority.
Nearby exhibit descriptions open automatically, X opens their destination once per press, and C or the visible Menu link returns to the portfolio.
Ctrl/Cmd/Alt+C remain browser shortcuts; only plain C or Shift+C triggers the game control.
The entrance displays X to exit and returns inside the current iframe.
Z remains a compatibility read alias without an on-screen instruction.
Keyboard aliases and joystick sources release independently.
Blur and hidden tabs clear movement and pause physics; focus changes between cabinet hardware and iframe preserve held cabinet input.
The welcome disappears after the first move, and a readable HTML description appears whenever the visitor approaches an exhibit.
It includes X to open, hides on leaving the interaction range, and updates its live text only when the nearby exhibit changes.
There is no top-right action prompt.
Dialogue appears over the bottom of the world only while text is visible and reserves no layout space.
It restores the original whitesmoke surface, black text, black outline, and rounded corners, while width and height fit the content and long text can scroll.
There is no title bar; a floating Menu link remains available above the full-height world, including during loading or a failed load.

The game has no on-screen D-pad or Read/Open buttons.
Touch users use the cabinet joystick, Z/X buttons, and Start; standalone visits require a keyboard.
The same-origin cabinet connects synchronously through `window.arcadeControls`, preserving popup user activation.
It reconnects after navigation and cached history restoration.
Mobile dialogue scales for the projected CRT.
Projected Menu and dialogue insets keep their text inside the visible browser width when the cabinet screen extends offscreen.
Desktop external projects open a separate tab with `noopener,noreferrer`; coarse-pointer devices navigate the top-level window so in-app browsers need no popup support.

The camera frames one tile less than the hallway width and applies the requested 15% additional zoom.
Nearest-neighbor rendering and rounded drawing positions keep pixel edges sharp.
Phaser caches the static Tiled layers into world-resolution render textures, preventing seams between separately scaled tiles at fractional zoom.
The tile layers remain the collision and authoring source; no baked backdrop is maintained by hand.
Resizing changes only the canvas viewport and camera, never geometry or player position.
Camera bounds clamp to the map and center a world smaller than the viewport.
The development-only `?debug` overlay shows walls, feet bodies, interaction regions, spawn, and exit.
Loading failure leaves a usable Menu link.

Punch-Out opens `src/punch-out/punch-out.html` inside the cabinet and saves the visitor position in session storage.
Return restores it only if the same feet body still fits the authored geometry.
The emulator retains master's controls: Z is NES B, X is A, and joystick/arrows/WASD move.
An overlapping Z+X press within 60 ms sends Select, suppressing punches until release.
Taps remain pressed for at least 32 ms and actual running core frames so slow renderers sample them.
Tap Start/C to send Start on release; hold for two seconds to return to the exhibit in any state, including loading or paused.
Loading ignores short Start/C taps and cancelled holds rather than exiting.
Enter and Shift provide direct Start and Select.
Esc or P pauses the emulator itself and clears held inputs.
Resume with Esc, P, or a short Start/C press without sending an extra NES Start.
A manual pause survives hiding and showing the page.
Gameplay has no on-screen Pause/Resume button.
Esc and P share the cabinet adapter and work with keyboard focus in the cabinet, wrapper, or emulator runtime.
Held inputs and pending transitions clear on blur, cancellation, hiding, navigation, and disconnect.

EmulatorJS 4.2.3 loads its NES core from its official CDN.
The ROM is requested directly from NES Ninja with browser CORS; this deployment never bundles, proxies, or serves ROM bytes.
A disposable same-origin runtime iframe owns each session and is removed on retry or exit.
Initialization times out after 45 seconds, with Z to retry and Start/C to exit.
Gesture audio and source-aware input use the existing emulator adapter.
External source availability and the source's unverified redistribution authorization remain limitations.

## Tech

Phaser 3.90, TypeScript, Tiled JSON, HTML, and Vite implement the museum.
No React rendering runs in the game loop.
Pure module tests use Node 24 type stripping; canvas diagnostics expose read-only player and camera state for browser tests.

## Key files

- `src/portfolio-game/scene.ts` - rendering, physics, camera, and navigation.
- `src/portfolio-game/model.ts` - map validation, footprints, interaction, and return-position validation.
- `src/portfolio-game/input.ts` and `ui.ts` - ordered input, cabinet connection, and HTML feedback.
- `src/portfolio-game/content.ts` - project titles, descriptions, and destinations.
- `src/portfolio-game/world/` - editable Tiled project, map, production sprites, and generated sources.
- `src/punch-out/` - emulator wrapper, isolated runtime, and input sampling.

## Related

- [Museum authoring](museum-authoring.md)
- [Site structure](site-structure.md)
- [Testing](testing.md)
