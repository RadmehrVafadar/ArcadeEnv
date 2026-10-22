import { test, expect } from '@playwright/test';
import { player } from './game-helpers.js';

test('Q exits the standalone game from spawn and stays inactive on other pages', async ({ page }) => {
  for (const key of ['q', 'Q']) {
    await page.goto('/portfolio/src/portfolio-game/game.html');
    await expect(player(page)).toBeVisible();
    if (key === 'Q') {
      await page.keyboard.down('s');
      await expect(player(page)).toHaveAttribute('data-walking', 'true');
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
