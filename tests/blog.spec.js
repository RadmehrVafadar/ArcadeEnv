import { test, expect } from '@playwright/test';

const entry = '/portfolio/src/blog-website/blog.html';

test('blog folders support keyboard navigation, refresh, history, and missing pages', async ({ page }, testInfo) => {
  await page.goto(entry);
  await expect(page.getByRole('heading', { name: "rad's blog" })).toBeVisible();
  await expect(page.getByRole('region', { name: 'whoamI' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: '/whoamI', exact: true })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('blog-home.png'), fullPage: true });
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: '/tech', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'tech', exact: true })).toBeFocused();
  await expect(page.getByRole('link', { name: 'Build. Build. Build.', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'tech', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('blog-folder.png'), fullPage: true });
  await page.getByRole('link', { name: 'Back to blog' }).click();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'tech', exact: true })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('heading', { name: "rad's blog" })).toBeVisible();
  for (const hash of ['#/missing', '#/tech/missing', '#/%E0%A4%A']) {
    await page.goto(entry + hash);
    await expect(page.getByRole('heading', { name: 'Not found' })).toBeVisible();
    await page.getByRole('link', { name: 'Back to blog' }).click();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('published Tech article renders and returns to its folder', async ({ page }, testInfo) => {
  await page.goto(entry + '#/tech');
  await page.getByRole('link', { name: 'Build. Build. Build.', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${entry}#/tech/build-build-build$`));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Build. Build. Build.');
  await expect(page.locator('article')).toContainText('Master Oogway');
  await expect(page.locator('article li')).toHaveCount(3);
  await expect(page.locator('article strong')).toHaveText('Build something you’ve always wanted to exist.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('published-tech-article.png'), fullPage: true });
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Build. Build. Build.');
  await page.getByRole('link', { name: 'Back to tech' }).click();
  await expect(page.getByRole('heading', { name: 'tech', exact: true })).toBeVisible();
  await page.goto(entry + '#/hobbies');
  await expect(page.getByText('No articles yet.')).toBeVisible();
});

test('article links underline only the cabinet selection', async ({ page }, testInfo) => {
  await page.goto(entry + '#/tech');
  const article = page.getByRole('link', { name: 'Build. Build. Build.', exact: true });
  expect(await article.evaluate(element => getComputedStyle(element).textDecorationLine)).toBe('none');
  await page.evaluate(() => window.arcadeControls.connect());
  await expect(article).toBeFocused();
  expect(await article.evaluate(element => getComputedStyle(element).textDecorationLine)).toBe('underline');
  await page.screenshot({ path: testInfo.outputPath('blog-first-article-selected.png'), fullPage: true });
  await page.keyboard.press('ArrowUp');
  await expect(page.getByRole('link', { name: 'Back to blog' })).toBeFocused();
  expect(await article.evaluate(element => getComputedStyle(element).textDecorationLine)).toBe('none');
  await page.goto(entry + '#/hobbies');
  await expect(page.getByText('No articles yet.')).toBeVisible();
  await page.evaluate(() => window.arcadeControls.connect());
  await expect(page.getByRole('link', { name: 'Back to blog' })).toBeFocused();
});

test('portfolio Blog link opens the reader in the current tab', async ({ page, context }) => {
  await page.goto('/portfolio/');
  const link = page.getByRole('link', { name: 'Blog', exact: true });
  await expect(link).not.toHaveAttribute('target', '_blank');
  await link.click();
  await expect(page).toHaveURL(new RegExp(`${entry}$`));
  await expect(page.getByRole('heading', { name: "rad's blog" })).toBeVisible();
  expect(context.pages()).toHaveLength(1);
  await page.goBack();
  await expect(page).toHaveURL(/\/portfolio\/$/);
  await expect(link).toBeVisible();
});

test('article scrolling handles held WASD, arrow keys, and overflowing code', { tag: '@development' }, async ({ page }, testInfo) => {
  const articles = [{ category: 'tech', slug: 'scroll', title: 'Scroll fixture',
    body: '```txt\n' + 'wide code '.repeat(100) + '\n```\n\n' + 'A paragraph for scrolling.\n\n'.repeat(60), path: './content/tech/scroll.md' }];
  await page.route('**/src/blog-website/content.ts*', route => route.fulfill({
    contentType: 'application/javascript', body: `export const articles = ${JSON.stringify(articles)}; export const assets = {};`,
  }));
  await page.goto(entry + '#/tech/scroll');
  await page.evaluate(() => window.arcadeControls.connect());
  const code = page.locator('pre');
  const scrollX = () => code.evaluate(element => element.scrollLeft);
  const scrollY = () => page.evaluate(() => window.scrollY);
  for (const [key, sign] of [['d', 1], ['ArrowLeft', -1], ['ArrowRight', 1], ['a', -1]]) {
    const before = await scrollX();
    await page.keyboard.down(key);
    await expect.poll(async () => ((await scrollX()) - before) * sign).toBeGreaterThan(20);
    await page.keyboard.up(key);
  }
  expect(await page.evaluate(() => window.scrollX)).toBe(0);
  for (const [key, sign] of [['s', 1], ['ArrowUp', -1], ['ArrowDown', 1], ['w', -1]]) {
    const before = await scrollY();
    await page.keyboard.down(key);
    await expect.poll(async () => ((await scrollY()) - before) * sign).toBeGreaterThan(20);
    await page.keyboard.up(key);
  }
  await page.keyboard.down('ArrowDown');
  await expect.poll(scrollY).toBeGreaterThan(200);
  await page.evaluate(() => window.arcadeControls.disconnect());
  await page.keyboard.up('ArrowDown');
  const stopped = await scrollY();
  await page.waitForTimeout(100);
  expect(await scrollY()).toBe(stopped);
  await page.screenshot({ path: testInfo.outputPath('article-scrolling.png'), fullPage: true });
});

test('blog renders unpublished Markdown fixtures and relative article links', { tag: '@development' }, async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('development'), 'Fixture module interception uses the development module URL; published builds exclude fixture articles.');
  const body = 'A quiet place for longer thoughts.\n\n## A small heading\n\n- First point\n- Second point\n\n> A little breathing room.\n\n```js\nconst sentence = "' + 'long text '.repeat(25) + '";\n```\n\n| Name | Value |\n| --- | --- |\n| Note | Readable |\n\n- [x] Checked\n\n[Next note](../work/next.md)\n\n<script>alert("unsafe")</script>';
  const articles = [
    { category: 'tech', slug: 'a-note', title: 'On keeping things simple', body, path: './content/tech/a-note.md' },
    { category: 'work', slug: 'next', title: 'The next note', body: 'Another paragraph.', path: './content/work/next.md' },
  ];
  await page.route('**/src/blog-website/content.ts*', route => route.fulfill({
    contentType: 'application/javascript', body: `export const articles = ${JSON.stringify(articles)}; export const assets = {};`,
  }));
  await page.goto(entry + '#/tech');
  await page.getByRole('link', { name: 'On keeping things simple' }).click();
  await expect(page.getByRole('heading', { name: 'On keeping things simple' })).toBeFocused();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.locator('pre code')).toContainText('const sentence');
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByRole('checkbox')).toBeChecked();
  await expect(page.locator('article script')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('blog-article.png'), fullPage: true });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'On keeping things simple' })).toBeVisible();
  await page.getByRole('link', { name: 'Next note' }).click();
  await expect(page.getByRole('heading', { name: 'The next note' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to work' }).click();
  await expect(page.getByRole('heading', { name: 'work', exact: true })).toBeVisible();
  // Mirror the cabinet's reconnection after each hash route renders new links.
  await page.evaluate(() => {
    window.addEventListener('arcade-controls-ready', () => window.arcadeControls.connect());
    window.arcadeControls.connect();
  });
  await page.getByRole('link', { name: 'The next note' }).click();
  await expect(page.getByRole('heading', { name: 'The next note' })).toBeVisible();
  await page.keyboard.press('x');
  await expect(page.getByRole('heading', { name: 'work', exact: true })).toBeVisible();
  await page.keyboard.press('X');
  await expect(page.getByRole('heading', { name: "rad's blog", exact: true })).toBeVisible();
  await page.keyboard.press('x');
  await expect(page).toHaveURL(/\/portfolio\/$/);
  await page.goto(entry + '#/tech/a-note/extra');
  await expect(page.getByRole('heading', { name: 'Not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to blog' })).toHaveAttribute('href', '#/');
});
