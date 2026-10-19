# Scene

The scene presents a portfolio iframe inside a textured 3D arcade cabinet.

## Why

The cabinet provides the presentation layer while the embedded portfolio remains independently hosted.

## How it works

`src/index.jsx` mounts a full-window Canvas containing the cabinet, two floating cubes, a cloud, a spotlight, and a ground plane.
The camera starts at `[0, 3, 8]` and looks toward `[0, 1, 1]`.
Desktop pointer entry on the cabinet starts a persistent zoom toward `[0, 3, 3]`.
Devices identified by a mobile user agent or multiple touch points activate the same zoom through an invisible scene-sized tap plane.

`src/arcade.jsx` loads `public/model9.glb` and places a transformed Drei Html iframe at the cabinet screen.
`VITE_IFRAME_URL` overrides the default `https://portfolio-website-omega-flame.vercel.app/` at build time.
This URL is public configuration, so do not put secrets in it.

`src/box.jsx` loads `media/cube.png` through Vite and animates two cubes with Drei Float.
Each cube keeps its initial random rotation across rerenders.
The `cloudConfig` object in `src/index.jsx` controls the magenta cloud's dimensions, density, opacity, and position.
`src/style.css` controls the dark gradient and the iframe's internal dimensions.

## Tech

React Three Fiber manages Three.js rendering.
Drei provides GLTF and texture loading, clouds, floating animation, and the HTML screen transform.

## Key files

- `src/index.jsx` - renderer, cloud settings, lighting, and ground.
- `src/arcade.jsx` - model, camera interaction, and portfolio iframe.
- `src/box.jsx` - textured floating cubes.
- `src/style.css` - viewport layout, background, and screen sizing.
- `public/model9.glb` - arcade model.
- `media/cube.png` - bundled cube texture.

## Decisions and gotchas

The scene has a static gradient; it does not implement a day/night switch.
Clouds use Drei's default remote texture, so rendering requires network access to its asset host.
The embedded site must allow framing, and HTTPS deployments need an HTTPS iframe URL.
Shadow flags are configured on scene objects, but Canvas does not enable shadow maps.
The camera zoom remains active after pointer exit, matching the original interaction.
The mobile detection heuristic also treats laptops with multiple touch points as mobile.

## Related

- [Development](development.md)
