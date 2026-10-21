import { test, expect } from '@playwright/test';

test('Q exits the standalone game from spawn and stays inactive on other pages', async ({ page }) => {
  for (const key of ['q', 'Q']) {
    await page.goto('/portfolio/src/portfolio-game/game.html');
    await expect(page.locator('.character')).toBeVisible();
    if (key === 'Q') {
      await page.keyboard.down('s');
      await expect(page.locator('.character')).toHaveAttribute('walking', 'true');
      await page.keyboard.up('s');
    }
    await page.keyboard.press(key);
    await expect(page).toHaveURL(/\/portfolio\/$/);
    await expect(page.getByRole('link', { name: 'Start', exact: true })).toBeVisible();
    await page.keyboard.press(key);
    await expect(page).toHaveURL(/\/portfolio\/$/);
  }
  await page.goto('/portfolio/src/blog-website/blog.html');
  await expect(page.getByRole('heading', { name: "rad's blog" })).toBeVisible();
  await page.keyboard.press('q');
  await expect(page).toHaveURL(/\/portfolio\/src\/blog-website\/blog.html$/);
});

test('Q returns only the cabinet game iframe to the portfolio menu', { tag: '@webgl' }, async ({ page, isMobile }) => {
  test.skip(isMobile, 'Mobile opens the standalone portfolio instead of an iframe.');
  test.setTimeout(60000);
  await page.goto('/');
  const screen = page.locator('iframe');
  await expect(screen).toBeVisible({ timeout: 30000 });
  const portfolio = page.frameLocator('iframe');
  const start = portfolio.getByRole('link', { name: 'Start', exact: true });
  const viewport = page.viewportSize();
  const initialWidth = (await screen.boundingBox()).width;
  await page.mouse.move(viewport.width / 2, viewport.height * 0.82);
  await expect.poll(async () => (await screen.boundingBox()).width, { timeout: 15000 }).toBeGreaterThan(initialWidth * 1.5);
  await start.click();
  await expect(portfolio.locator('.character')).toBeVisible();
  await page.keyboard.press('q');
  await expect(start).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/');
  expect(page.frames().some(frame => new URL(frame.url()).pathname === '/portfolio/')).toBe(true);
});
