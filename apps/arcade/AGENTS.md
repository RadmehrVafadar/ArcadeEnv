# Arcade Environment

The cabinet scene embeds the included portfolio at `/portfolio/`.
Stack: JavaScript, JSX, React Three Fiber, Drei, Three.js, Vite.

## Commands

Run these from the repository root.

```bash
npm run dev                                  # Start both apps and portfolio proxy
npm run lint --workspace=arcade-env           # Lint this app
npm run build --workspace=arcade-env          # Build only this app
npm run test:browser -- --grep "zooms"        # Run camera regressions after root build
```

## Repo map

```text
src/      Scene components and global CSS
public/   Unprocessed cabinet model
media/    Bundled cube texture
```

## Conventions

- Preserve cabinet and cube positions, cloud settings, and camera targets to avoid visual changes.
- Use `import.meta.env.BASE_URL` for public assets and module-relative URLs for bundled assets.
- Keep the default iframe at `/portfolio/` and root `VITE_IFRAME_URL` as an override.
- Keep hooks unconditional and mapped React elements keyed to preserve identity.
- Keep flat ESLint configuration scoped here because the portfolio uses different tooling.

## Docs

- Before changing scene assets, camera behavior, iframe integration, or styling, read [Scene](../../docs/scene.md).
- Before changing commands, dependencies, checks, or deployment, read [Development](../../docs/development.md).
