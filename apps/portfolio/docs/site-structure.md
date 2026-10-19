# Site structure

The portfolio combines a React landing page with two standalone HTML pages.

## Why

Each page must be included in the production build so menu links work after deployment.

## How it works

`index.html` loads `src/main.tsx`, which renders `Background` and `Menu` inside React strict mode.
The background chooses daytime before 18:00 in the browser's local time and toggles when its sun or moon is clicked.
CSS animates clouds and background colors; the menu switches from a row to a column on narrow screens.
The menu links directly to the arcade, the static blog placeholder, and the resume.
Vite builds all three HTML entries and processes their scripts, stylesheets, and referenced images.
Files in `public/`, including the resume, are copied unchanged into `dist/`.

## Tech

React and TypeScript power the landing page.
The arcade uses plain JavaScript and CSS; the blog uses static HTML and CSS.

## Key files

- `vite.config.ts` - production HTML entries.
- `src/main.tsx` - React entry point.
- `src/Background.tsx` - day/night state.
- `src/Background.css` - sky, clouds, and sun/moon styles.
- `src/menu.tsx` - navigation links.
- `src/menu.css` - responsive menu styles.
- `src/blog-website/blog.html` - blog placeholder.
- `public/RVafadar_Resume.pdf` - downloadable resume.

## Decisions and gotchas

Page paths retain the existing `src/` suffixes beneath `/portfolio/` for compatibility.
Vite uses `/portfolio/` as its base.
Menu destinations, the resume link, and the game exit use `import.meta.env.BASE_URL`.
Development requests and HMR are proxied through the root arcade server; production files live under root `dist/portfolio/`.
Fonts load from external providers and require network access.
The blog has no article implementation.

## Related

- [Arcade](arcade.md)
- [Testing](testing.md)
