# Blog

A minimal, folder-based reader for Markdown articles.

## Why

The blog publishes notes as ordinary Markdown files without a CMS or a separate deployment.

## How it works

Open the Blog link from the portfolio to read in the current page, inside the arcade cabinet on desktop.
Use `../` beneath the index folders to return to the portfolio menu without relying on browser history.
Category and article `../` links return to their parent folder, leading back through the blog index to the menu.
The menu link respects the portfolio base and stays inside the current tab or cabinet iframe.
Inside the cabinet, joystick tilts step through the current page's links, Z activates the underlined link, and Exit returns directly to the portfolio menu.
The selected link takes focus after the heading update, so Enter activates `../` immediately on entering a folder.
The index shows `/tech`, `/hobbies`, and `/work`, including when those folders are empty.
Folder titles sit at the right of a centered column, with `../` and article links below.
Article pages use a narrow serif reading column on warm paper, with monospace navigation.
The design is confined to the blog; it uses system fonts and no external font requests.

Add an article at `src/blog-website/content/<category>/<slug>.md` relative to this app.
Use a lowercase, hyphenated filename for a stable URL and a Markdown H1 for the title.
The first H1 becomes the article title and is removed from the rendered body to avoid duplication.
Without an H1, the filename becomes the title.
Articles are sorted alphabetically by title.
Adding a Markdown file in a new category makes that folder appear automatically.
Keep articles directly inside category folders; deeper article nesting is unsupported.

Standard Markdown and GFM tables, task lists, and strikethrough are supported.
Raw HTML is disabled.
Place images alongside articles or in a subfolder and use relative Markdown image paths.
Supported bundled image extensions are png, jpg, jpeg, gif, webp, svg, and avif.
Link to another article with its relative `.md` path, such as `../work/another-note.md`.
Obsidian syntax, YAML frontmatter, heading-anchor links, and syntax highlighting are not implemented.

Run `npm run dev` from the repository root to preview content, and rebuild to publish it through the existing static deployment.
The existing entry remains `/portfolio/src/blog-website/blog.html`, with hash routes such as `#/tech/my-note`.
Hash routing keeps refresh and direct links working without server rewrite rules.

## Tech

React and TypeScript render the reader.
Vite discovers Markdown and image files, and react-markdown with remark-gfm renders articles.
All Markdown is bundled eagerly; revisit loading if the collection grows enough to affect startup.

## Key files

- `src/blog-website/blog.tsx` - views, navigation, and article rendering.
- `src/blog-website/catalog.ts` - article metadata and relative links.
- `src/blog-website/content.ts` - Vite content discovery.

## Related

- [Site structure](site-structure.md)
- [Testing](testing.md)
