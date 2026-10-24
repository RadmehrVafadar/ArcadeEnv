# Scene

The scene presents a portfolio iframe inside a textured 3D arcade cabinet.

## Why

The cabinet provides the presentation layer while the embedded portfolio is a separate workspace app served by the same deployment.

## How it works

`apps/arcade/src/index.jsx` imports the arcade scene on every device.
All browsers dynamically load `apps/arcade/src/scene.jsx`, which mounts a full-window Canvas containing the cabinet, its spotlight, and a horizontal floor.
The entry point observes the document viewport and rounds the arcade root's width and height up to even CSS pixels, including after toolbar resizing and orientation changes.
This avoids the [WebKit transformed Html offset](https://github.com/pmndrs/drei/issues/720) that can place the iframe below the cabinet screen in mobile in-app browsers such as LinkedIn.
The canvas and HTML projection share the adjusted size, extending less than two pixels past the viewport without changing the screen's 3D position or camera targets.
The initial HTML displays an amber arcade loading screen using the portfolio's locally bundled Arcade Interlaced font while the scene module and cabinet model load.
It clears after the portfolio iframe loads and a frame renders the cabinet, with no artificial delay or percentage.
The loading dots stay still when reduced motion is preferred, and a Skip 3D arcade link provides direct portfolio access while loading, honoring `VITE_IFRAME_URL`.
The floor catches the spotlight beneath the cabinet; the background has no wall or enclosing box.
The warm theater spotlight aims at the floor directly beneath the cabinet, with a tighter penumbra and a visible, softly faded beam from Drei's `SpotLight`.
Its translucent matte floor catches a defined pool of light while retaining the dark background.
A softer fill from the original light position keeps the lower cabinet artwork visible.
The beam uses the existing Drei dependency without postprocessing, animated smoke, or remote textures.
The main spotlight intensity stays at `1.5` to retain saturated yellow trim and dark controls; its independent beam opacity stays at `0.32` so the overhead shaft remains visible.
Floating cubes and background smoke are omitted.
The camera starts at `[0, 3, 8]` and looks toward `[0, 1, 1]`.
Desktop pointer entry on the cabinet starts a persistent zoom toward `[0, 3, 3]`.
A warm neon “PRESS TO PLAY” sign sits above and behind the cabinet, with responsive lettering sized from 18 to 28 pixels.
Its text bops vertically by three pixels using the portfolio menu's stepped rhythm.
Pressing the sign with a pointer, Enter, or Space starts the same zoom; clicking the cabinet also starts it.
The sign stays mounted throughout the zoom and disappears once the camera is within 0.05 units of its destination, after it has naturally moved out of view.
Its text stays still when reduced motion is preferred.
On phones and tablets, the same persistent zoom starts automatically five seconds after the loading screen clears, once both the cabinet frame and portfolio iframe are ready.
Desktop touch laptops retain hover entry.
Zoom smoothing uses elapsed frame time, preserving its original 60 FPS feel while keeping the same speed on slower renderers.
The canvas renders on demand and schedules frames only while the camera zooms, stopping once it is within 0.001 world units of its target.
The mobile delay uses a timer after loading clears, and zoom timing excludes time spent idle before interaction.
The HTML portfolio continues to animate and respond independently while the WebGL canvas is idle.

All devices retain the original camera targets, with no additional gameplay zoom-out.
PC instructions describe movement, Z to read, X to open, and Q to exit.
The GLB contains three action buttons in a single row on the left: Z/Read, X/Open, and Q/Menu from left to right.
The original five-button cluster is removed, the two buttons formerly beside the joystick are relocated, and a third button supplies Q.
The row sits toward the back of the control deck so all three buttons are visible and clickable from the original camera.
The joystick sits 0.12 model units left of its original deck position, with its ball aligned with the button faces from the original camera.
Its moving shaft and ball and its separate fixed base share the same leftward shift.
Two red caps labeled Z (Z/Read) and X (X/Open) sit beside a smaller red RESET (Q/Menu) button without black collars or borders.
The raised caps have rounded shoulders and a red base lip, matching the supplied classic arcade reference.
The cap faces match their base lips' deeper red, with glossy materials and tinted reflections to retain saturation under the spotlight; thin, solid-black lettering uses an unlit material.
Each rounded cap is a separate GLB child node so it depresses together with its modeled lettering while its base lip stays fixed.
The joystick has a polished red ball, metal shaft, and a ribbed rubber boot, all scaled up by 25% to balance the larger buttons.
Subtle red emission and feathered transparent model geometry give the caps and joystick ball a static red glow without animated effects or extra render passes.
Dragging the joystick beyond an eight-pixel dead zone selects its dominant axis; centering or releasing it stops movement.
Accessible DOM buttons follow the model controls with circular targets of at least 24 CSS pixels, growing toward 44 pixels where space permits.
Targets follow the model and stay visually transparent during hover and presses, retaining a visible keyboard focus outline.
No HTML control overlays or labels are drawn over the buttons or joystick on any device.
Targets shrink near viewport edges and shift onto the visible part of the hardware when needed to keep their minimum hit area reachable without moving the model or camera.
Mouse, keyboard activation, and independent touch pointers share the game input interface, allowing movement while pressing an action.
Button depression and joystick tilt invalidate frames only while settling, with immediate feedback when reduced motion is preferred.
Keyboard Z/X/Q presses depress their matching cabinet buttons, and arrow keys or WASD tilt the joystick whether focus is in the cabinet page or its iframe.
Visual feedback tracks held keys by source, so releasing one movement alias does not cancel another held key, and clears on navigation or focus loss.
Release, cancellation, lost capture, page hiding, navigation, and focus leaving the browser clear the appropriate held inputs.
Focusing the embedded page does not cancel a captured cabinet gesture.

The same-origin game, menu, and blog expose `window.arcadeControls` for connection, disconnection, directional input by source, actions, reset, and projected text sizing.
The cabinet connects after iframe load or the `arcade-controls-ready` event, allowing React pages to finish mounting, and disconnects on navigation.
When `pagehide.persisted` indicates history caching, it clears held input but retains the connection because restoration reuses the iframe without another load event.
On the menu, each joystick tilt advances or reverses the selected link, wraps at either end, and leaves a full-width underscore beneath the current choice.
Centering or releasing the stick rearms the next step; holding it does not skip multiple entries.
Z activates the selected native link synchronously, opening Resume in a new tab on desktop or the current top-level browser on touch devices, while Reset returns to the main portfolio menu from the menu, blog, or game.
Blog folders and article links use the same joystick selection and Z activation, with an underline identifying the selected link.
In the blog, X follows the current view's `../` link: article to folder, folder to blog index, and index to portfolio menu.
Action calls remain synchronous with pointer or keyboard activation so desktop project popups retain user activation.
The game has no fallback on-screen D-pad or action buttons, so a disconnected cabinet cannot reveal an old control overlay.
Standalone game visits require a keyboard; incompatible or cross-origin `VITE_IFRAME_URL` pages retain their own controls.

`apps/arcade/src/arcade.jsx` loads `apps/arcade/public/model9.glb` and places a transformed Drei Html iframe at the cabinet screen.
The screen uses Html blending occlusion so foreground model geometry, including the joystick, covers only the overlapping iframe pixels.
The canvas stays above the screen and below the transparent control targets, including after those targets reconnect on iframe navigation.
Canvas pointer events pass through to the HTML while the shared scene event container retains cabinet hover and click handling.
`VITE_IFRAME_URL` overrides the iframe and loading-screen portfolio link at build time, using root `.env.local` or the process environment.
This URL is public configuration, so do not put secrets in it.

`apps/arcade/src/style.css` controls the dark gradient and the iframe's internal dimensions.
The iframe sits inside a fixed-size CRT glass wrapper with static scanlines, a faint RGB phosphor grille, and tiled monochrome grain from `apps/arcade/src/crt-grain.svg`.
Elliptical corner clipping, inset edge shading, and a soft reflection suggest gently curved glass without warping the live page or moving the screen.
Both decorative layers ignore pointer events, and the effect uses no animation or WebGL postprocessing.
Visiting `/portfolio/` directly remains available on every device without the cabinet or CRT treatment.

## Tech

React Three Fiber manages Three.js rendering.
Drei provides GLTF loading and the HTML screen transform.

## Key files

- `apps/arcade/src/index.jsx` - loading-screen portfolio link and deferred scene import.
- `apps/arcade/src/loading.css` - initial loading screen and reduced-motion styling.
- `apps/arcade/src/scene.jsx` - renderer, cabinet lighting, and floor.
- `apps/arcade/src/arcade.jsx` - model, camera interaction, and portfolio iframe.
- `apps/arcade/src/cabinet-controls.jsx` - projected controls, pointer capture, and model feedback.
- `apps/arcade/src/cabinet-input.js` - model button mapping and joystick direction calculation.
- `apps/arcade/src/style.css` - viewport layout, background, and screen sizing.
- `apps/arcade/public/model9.glb` - arcade model.

## Decisions and gotchas

The scene has a static gradient; it does not implement a day/night switch.
The scene loads no decorative cube or remote cloud textures.
The embedded site must allow framing, and HTTPS deployments need an HTTPS iframe URL.
Canvas does not enable shadow maps, and the spotlight explicitly disables them to preserve the cabinet artwork and avoid an additional render pass.
The camera zoom remains active after pointer exit, matching the original interaction.
Mobile detection uses the mobile user agent and the desktop-user-agent iPad signature (Macintosh with multiple touch points).
Touch support alone does not enable automatic zoom on desktop laptops.

## Related

- [Development](development.md)
