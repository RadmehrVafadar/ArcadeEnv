# Scene

The scene presents a portfolio iframe inside a textured 3D arcade cabinet.

## Why

The cabinet provides the presentation layer while the embedded portfolio is a separate workspace app served by the same deployment.

## How it works

`apps/arcade/src/index.jsx` sends phones and tablets directly to `/portfolio/` before importing the scene, avoiding Three.js, WebGL, and scene assets on mobile.
Desktop browsers, including touch laptops, dynamically load `apps/arcade/src/scene.jsx`, which mounts a full-window Canvas containing the cabinet and the Blender-authored After Hours arcade surround.
The room includes a tiled platform, ribbed rear wall, short side walls, neon portal, lettering, and two speaker stacks.
Cool and coral lights complement the cabinet spotlight without shadow maps, bloom, or other postprocessing.
The renderer caps pixel density at 1.5 to limit GPU work on high-density displays.
Floating cubes and background smoke are omitted.
The camera starts at `[0, 3, 8]` and looks toward `[0, 1, 1]`.
Desktop pointer entry on the cabinet starts a persistent zoom toward `[0, 3, 3]`.

`apps/arcade/src/arcade.jsx` loads `apps/arcade/public/model9.glb` and places a transformed Drei Html iframe at the cabinet screen.
The surround loads separately from `apps/arcade/public/arcade-room.glb`, at the same vertical offset as the cabinet.
The existing cabinet model, screen alignment, and camera targets are unchanged.
`VITE_IFRAME_URL` overrides both the desktop iframe and mobile destination at build time, using root `.env.local` or the process environment.
This URL is public configuration, so do not put secrets in it.

`apps/arcade/src/style.css` controls the dark gradient and the iframe's internal dimensions.

## Tech

React Three Fiber manages Three.js rendering.
Drei provides GLTF loading and the HTML screen transform.

## Key files

- `apps/arcade/src/index.jsx` - mobile redirect and deferred desktop scene import.
- `apps/arcade/src/scene.jsx` - renderer, lighting, and room loading.
- `apps/arcade/src/arcade.jsx` - model, camera interaction, and portfolio iframe.
- `apps/arcade/src/style.css` - viewport layout, background, and screen sizing.
- `apps/arcade/public/model9.glb` - arcade model.
- `apps/arcade/public/arcade-room.glb` - texture-free room, approximately 174 KiB, 2,699 triangles, and six material batches.
- `assets/blender/after-hours.blend` - editable room and original cabinet, with a presentation camera and lighting.
- `scripts/blender/build_scene.py` - rebuilds the surround around an open original cabinet and exports only the room.

## Decisions and gotchas

The scene has a dark background; it does not implement a day/night switch.
The scene loads no decorative cube or remote cloud textures.
The embedded site must allow framing, and HTTPS deployments need an HTTPS iframe URL.
Shadow flags are configured on scene objects, but Canvas does not enable shadow maps.
Blender's presentation lights are for authoring previews; the browser uses the lights declared in `scene.jsx`.
To export edits from the saved blend, select the six meshes in the After Hours collection and export selected objects as GLB to `apps/arcade/public/arcade-room.glb`, with cameras, lights, and animations disabled.
Do not include the cabinet in this export, because the browser loads its existing model separately.
The build script expects an original cabinet scene without an After Hours collection and refuses to append duplicate room geometry.
Browser checks enforce a 256 KiB room budget, fewer than 5,000 triangles, at most seven mesh batches, and no image textures.
The camera zoom remains active after pointer exit, matching the original interaction.
Mobile detection uses the mobile user agent and the desktop-user-agent iPad signature (Macintosh with multiple touch points).
Touch support alone does not redirect desktop laptops.

## Related

- [Development](development.md)
