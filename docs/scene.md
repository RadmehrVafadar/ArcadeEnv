# Scene

The scene presents a portfolio iframe inside a textured 3D arcade cabinet.

## Why

The cabinet provides the presentation layer while the embedded portfolio is a separate workspace app served by the same deployment.

## How it works

`apps/arcade/src/index.jsx` sends phones and tablets directly to `/portfolio/` before importing the scene, avoiding Three.js, WebGL, and scene assets on mobile.
Desktop browsers, including touch laptops, dynamically load `apps/arcade/src/scene.jsx`, which mounts a full-window Canvas containing the cabinet, two floating cubes, a cloud, a spotlight, and a ground plane.
The camera starts at `[0, 3, 8]` and looks toward `[0, 1, 1]`.
Desktop pointer entry on the cabinet starts a persistent zoom toward `[0, 3, 3]`.

`apps/arcade/src/arcade.jsx` loads `apps/arcade/public/model9.glb` and places a transformed Drei Html iframe at the cabinet screen.
`VITE_IFRAME_URL` overrides both the desktop iframe and mobile destination at build time, using root `.env.local` or the process environment.
This URL is public configuration, so do not put secrets in it.

`apps/arcade/src/box.jsx` loads `apps/arcade/media/cube.png` through Vite and animates two cubes with Drei Float.
Each cube keeps its initial random rotation across rerenders.
The `cloudConfig` object in `apps/arcade/src/scene.jsx` controls the magenta cloud's dimensions, density, opacity, and position.
`apps/arcade/src/style.css` controls the dark gradient and the iframe's internal dimensions.

## Tech

React Three Fiber manages Three.js rendering.
Drei provides GLTF and texture loading, clouds, floating animation, and the HTML screen transform.

## Key files

- `apps/arcade/src/index.jsx` - mobile redirect and deferred desktop scene import.
- `apps/arcade/src/scene.jsx` - renderer, cloud settings, lighting, and ground.
- `apps/arcade/src/arcade.jsx` - model, camera interaction, and portfolio iframe.
- `apps/arcade/src/box.jsx` - textured floating cubes.
- `apps/arcade/src/style.css` - viewport layout, background, and screen sizing.
- `apps/arcade/public/model9.glb` - arcade model.
- `apps/arcade/media/cube.png` - bundled cube texture.

## Decisions and gotchas

The scene has a static gradient; it does not implement a day/night switch.
Clouds use Drei's default remote texture, so rendering requires network access to its asset host.
The embedded site must allow framing, and HTTPS deployments need an HTTPS iframe URL.
Shadow flags are configured on scene objects, but Canvas does not enable shadow maps.
The camera zoom remains active after pointer exit, matching the original interaction.
Mobile detection uses the mobile user agent and the desktop-user-agent iPad signature (Macintosh with multiple touch points).
Touch support alone does not redirect desktop laptops.

## Related

- [Development](development.md)
