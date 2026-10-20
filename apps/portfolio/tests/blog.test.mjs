import assert from 'node:assert/strict';
import { test } from 'node:test';
import { makeCatalog, articleHref, resolveLocal } from '../src/blog-website/catalog.ts';

test('Markdown catalog discovers titles, removes one title, and sorts articles', () => {
  const articles = makeCatalog({
    './content/work/zebra.md': '# Zebra\n\nText\n\n## Detail',
    './content/tech/apple-note.md': 'A note without a heading.',
  });
  assert.deepEqual(articles.map(item => item.title), ['apple note', 'Zebra']);
  assert.match(articles[1].body, /## Detail/);
  assert.ok(!articles[1].body.includes('# Zebra'));
  assert.equal(articleHref(articles[0]), '#/tech/apple-note');
  assert.deepEqual(makeCatalog({}), []);
  assert.throws(() => makeCatalog({ './content/loose.md': 'Loose' }), /category folder/);
});

test('relative article links and colocated assets retain the portfolio base', () => {
  const articles = makeCatalog({ './content/tech/one.md': '# One', './content/work/two.md': '# Two' });
  const article = articles.find(item => item.slug === 'one');
  assert.equal(resolveLocal('../work/two.md', article, articles, {}), '#/work/two');
  assert.equal(resolveLocal('photo.png', article, articles, { './content/tech/photo.png': '/portfolio/assets/photo.png' }), '/portfolio/assets/photo.png');
  assert.equal(resolveLocal('https://example.com', article, articles, {}), 'https://example.com');
});

test('title discovery respects Markdown code fences and inline formatting', () => {
  const [article] = makeCatalog({ './content/tech/note.md': '```sh\n# not a heading\n```\n\n# A **real** title\n\nBody.' });
  assert.equal(article.title, 'A real title');
  assert.match(article.body, /# not a heading/);
});
