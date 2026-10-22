import { test, expect } from '@playwright/test';

const entry = '/portfolio/src/blog-website/blog.html';

test('blog ../ returns to the portfolio menu without browser history', async ({ page }, testInfo) => {
  await page.goto(entry);
  const back = page.getByRole('link', { name: 'Back to portfolio menu' });
  await expect(back).toHaveText('../');
  await expect(back).toHaveAttribute('href', '/portfolio/');
  await back.focus();
  await expect(back).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath('blog-menu-link.png'), fullPage: true });
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/portfolio\/$/);
  await expect(page.getByRole('link', { name: 'Start', exact: true })).toBeVisible();
});

test('blog folders retain parent navigation and lead back to the menu', async ({ page }) => {
  await page.goto(entry + '#/tech');
  await page.getByRole('link', { name: 'Back to blog', exact: true }).click();
  await page.getByRole('link', { name: 'Back to portfolio menu' }).click();
  await expect(page).toHaveURL(/\/portfolio\/$/);
});

test('blog articles retain the folder and menu return path', { tag: '@development' }, async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('development'), 'Unpublished article fixture uses the development content module.');
  await page.route('**/src/blog-website/content.ts*', route => route.fulfill({
    contentType: 'application/javascript',
    body: 'export const articles = [{category:"tech",slug:"note",title:"A note",body:"Read me.",path:"./content/tech/note.md"}]; export const assets = {};',
  }));
  await page.goto(entry + '#/tech/note');
  await expect(page.getByRole('heading', { name: 'A note', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Back to tech', exact: true }).click();
  await page.getByRole('link', { name: 'Back to blog', exact: true }).click();
  await page.getByRole('link', { name: 'Back to portfolio menu' }).click();
  await expect(page).toHaveURL(/\/portfolio\/$/);
});

test('blog ../ returns within its containing iframe', async ({ page }) => {
  await page.goto('/portfolio/');
  await page.setContent(`<iframe title="Portfolio" src="${entry}"></iframe>`);
  const portfolio = page.frameLocator('iframe');
  await portfolio.getByRole('link', { name: 'Back to portfolio menu' }).click();
  await expect(portfolio.getByRole('link', { name: 'Start', exact: true })).toBeVisible();
  await expect(page.locator('iframe')).toBeVisible();
  await expect(page).toHaveURL(/\/portfolio\/$/);
});
