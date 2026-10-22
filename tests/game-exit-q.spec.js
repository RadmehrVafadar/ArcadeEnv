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
