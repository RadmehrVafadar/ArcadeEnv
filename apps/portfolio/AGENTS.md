# Radmehr Vafadar Portfolio

A personal portfolio with a React landing page and a standalone arcade showcase.
The blog reads Markdown articles from category folders.
Stack: TypeScript, JavaScript, React, Vite, and CSS.

## Commands

```bash
npm ci                                      # Install at repository root
npm run dev                                 # Run at repository root for integrated development
npm run lint                                # Lint application, configuration, and tests
npm test                                    # Run all tests against an existing build
npm run test:build                          # Build and run all tests independently
node --test tests/game.test.mjs              # Run a single test file
node --test --test-name-pattern="statue" tests/game.test.mjs # Run a single named test
npm run build                               # Type-check and build all pages into dist
npm run preview                             # Serve the production build
```

Other commands run from this app directory, or use `npm run <command> --workspace=portfolio-website` at root.
Deploy only root `dist/` using the root build command.

## Repo map

```text
src/                  React landing page and shared image assets
src/portfolio-game/   Standalone arcade HTML, JavaScript, and CSS
src/blog-website/     Markdown blog and category content
public/               Files copied unchanged to the build output
tests/                Game behavior and production navigation checks
docs/                 Architecture and verification guidance
```

## Conventions

- **Keep cleanup separate from features.** Preserve existing appearance, controls, and content unless explicitly tasked otherwise.
- **Respect the portfolio base.** Use `import.meta.env.BASE_URL` for menu links, downloads, and game exit navigation.
- **Register every HTML entry in Vite.** Linked pages otherwise disappear from production builds.
- **Keep unprocessed downloads in `public/`.** Root-level files are not automatically copied to production output.
- **Reproduce bugs with a failing test before fixing them.** Keep the test as regression coverage.
- **Run lint, tests, and build before finishing.** Build and runtime failures require different checks.
- **Update docs alongside code.** Keep claims tied to existing behavior, with one full sentence per line.
- **Stage without committing or merging.** The repository owner handles commits and merges.

## Docs

- Before changing entry points, navigation, assets, or styling, read `docs/site-structure.md`.
- Before changing arcade movement, collision, or interactions, read `docs/arcade.md`.
- Before editing maps or adding exhibits, read `docs/museum-authoring.md`.
- Before changing verification commands or tests, read `docs/testing.md`.
- Before adding articles or changing the blog, read `docs/blog.md`.
