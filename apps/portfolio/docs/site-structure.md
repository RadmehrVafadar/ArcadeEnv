# Site structure

The portfolio combines a React landing page with two standalone HTML pages.

## Why

Each page must be included in the production build so menu links work after deployment.

## How it works

`index.html` loads `src/main.tsx`, which renders `Background` and `Menu` inside React strict mode.
The background chooses daytime before 18:00 in the browser's local time and toggles when its sun or moon is clicked.
CSS animates clouds and background colors; the menu switches from a row to a column on narrow screens.
The menu links directly to the arcade, the Markdown blog, and the resume.
The Blog link navigates in the current page, staying inside the cabinet iframe on desktop.
Browser Back returns to the portfolio menu.
The Resume link opens the PDF in a separate browser tab, preserving the portfolio menu and cabinet.
Close that tab to return to the menu; browsers configured to download PDFs leave the menu available as well.
The link announces the new tab to assistive technology and includes a matching tooltip.
Menu links use button styling without text underlines while retaining native link navigation and keyboard focus.
Start, Blog, and Resume text bops upward by 3px and back in a stepped 600ms CSS loop, keeping the link hit areas stationary.
The labels remain still when the visitor prefers reduced motion.
Vite builds all three HTML entries and processes their scripts, stylesheets, and referenced images.
Files in `public/`, including the resume, are copied unchanged into `dist/`.

## Tech

React and TypeScript power the landing page.
The arcade uses TypeScript, Phaser, and Tiled maps with an HTML control interface; the blog mounts its own React reader from a standalone HTML entry.

## Key files

- `vite.config.ts` - production HTML entries.
- `src/main.tsx` - React entry point.
- `src/Background.tsx` - day/night state.
- `src/Background.css` - sky, clouds, and sun/moon styles.
- `src/menu.tsx` - navigation links.
- `src/menu.css` - responsive menu styles.
- `src/blog-website/blog.html` - Markdown blog entry.
- `public/RVafadar_Resume.pdf` - downloadable resume.

## Decisions and gotchas

Page paths retain the existing `src/` suffixes beneath `/portfolio/` for compatibility.
Vite uses `/portfolio/` as its base.
Menu destinations, the resume link, and the game exit use `import.meta.env.BASE_URL`.
Development requests and HMR are proxied through the root arcade server; production files live under root `dist/portfolio/`.
The existing Arcade Interlaced and Press Start 2P fonts are served locally from `src/assets/fonts/` and bundled by Vite.
Font sources, attribution, and the Press Start 2P license are retained beside the assets.
The blog discovers Markdown articles at build time and uses hash routes for static-host compatibility.

## Related

- [Arcade](arcade.md)
- [Testing](testing.md)
- [Blog](blog.md)
