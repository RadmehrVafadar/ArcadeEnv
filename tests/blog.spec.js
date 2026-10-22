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
  await expect(page.getByText('No articles yet.')).toBeVisible();
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

test('blog renders unpublished Markdown fixtures and relative article links', { tag: '@development' }, async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('development'), 'Fixture module interception uses the development module URL; published builds contain no test articles.');
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
  await page.goto(entry + '#/tech/a-note/extra');
  await expect(page.getByRole('heading', { name: 'Not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to blog' })).toHaveAttribute('href', '#/');
});
