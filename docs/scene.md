# Scene

The scene presents a portfolio iframe inside a textured 3D arcade cabinet.

## Why

The cabinet provides the presentation layer while the embedded portfolio is a separate workspace app served by the same deployment.

## How it works

`apps/arcade/src/index.jsx` sends phones and tablets directly to `/portfolio/` before importing the scene, avoiding Three.js, WebGL, and scene assets on mobile.
Desktop browsers, including touch laptops, dynamically load `apps/arcade/src/scene.jsx`, which mounts a full-window Canvas containing the cabinet, its spotlight, and a horizontal floor.
The initial HTML displays an amber arcade loading screen using the portfolio's locally bundled Arcade Interlaced font while the desktop scene module and cabinet model load.
It clears after the portfolio iframe loads and a frame renders the cabinet, with no artificial delay or percentage.
The loading dots stay still when reduced motion is preferred, and an Open portfolio link provides direct access while loading, honoring `VITE_IFRAME_URL`.
The floor catches the spotlight beneath the cabinet; the background has no wall or enclosing box.
The warm theater spotlight aims at the floor directly beneath the cabinet, with a tighter penumbra and a visible, softly faded beam from Drei's `SpotLight`.
Its translucent matte floor catches a defined pool of light while retaining the dark background.
A softer fill from the original light position keeps the lower cabinet artwork visible.
The beam uses the existing Drei dependency without postprocessing, animated smoke, or remote textures.
The main spotlight intensity stays at `1.5` to retain saturated yellow trim and dark controls; its independent beam opacity stays at `0.32` so the overhead shaft remains visible.
Floating cubes and background smoke are omitted.
The camera starts at `[0, 3, 8]` and looks toward `[0, 1, 1]`.
Desktop pointer entry on the cabinet starts a persistent zoom toward `[0, 3, 3]`.
Zoom smoothing uses elapsed frame time, preserving its original 60 FPS feel while keeping the same speed on slower renderers.

`apps/arcade/src/arcade.jsx` loads `apps/arcade/public/model9.glb` and places a transformed Drei Html iframe at the cabinet screen.
`VITE_IFRAME_URL` overrides both the desktop iframe and mobile destination at build time, using root `.env.local` or the process environment.
This URL is public configuration, so do not put secrets in it.

`apps/arcade/src/style.css` controls the dark gradient and the iframe's internal dimensions.
The desktop iframe sits inside a fixed-size CRT glass wrapper with static scanlines, a faint RGB phosphor grille, and tiled monochrome grain from `apps/arcade/src/crt-grain.svg`.
Elliptical corner clipping, inset edge shading, and a soft reflection suggest gently curved glass without warping the live page or moving the screen.
Both decorative layers ignore pointer events, and the effect uses no animation or WebGL postprocessing.
The direct mobile portfolio remains free of the CRT treatment.

## Tech

React Three Fiber manages Three.js rendering.
Drei provides GLTF loading and the HTML screen transform.

## Key files

- `apps/arcade/src/index.jsx` - mobile redirect and deferred desktop scene import.
- `apps/arcade/src/loading.css` - initial loading screen and reduced-motion styling.
- `apps/arcade/src/scene.jsx` - renderer, cabinet lighting, and floor.
- `apps/arcade/src/arcade.jsx` - model, camera interaction, and portfolio iframe.
- `apps/arcade/src/style.css` - viewport layout, background, and screen sizing.
- `apps/arcade/public/model9.glb` - arcade model.

## Decisions and gotchas

The scene has a static gradient; it does not implement a day/night switch.
The scene loads no decorative cube or remote cloud textures.
The embedded site must allow framing, and HTTPS deployments need an HTTPS iframe URL.
Canvas does not enable shadow maps, and the spotlight explicitly disables them to preserve the cabinet artwork and avoid an additional render pass.
The camera zoom remains active after pointer exit, matching the original interaction.
Mobile detection uses the mobile user agent and the desktop-user-agent iPad signature (Macintosh with multiple touch points).
Touch support alone does not redirect desktop laptops.

## Related

- [Development](development.md)
