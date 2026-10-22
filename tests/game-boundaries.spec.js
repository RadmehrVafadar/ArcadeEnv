import { test, expect } from '@playwright/test';

test('player stays within authored world boundaries on every device', async ({ page }) => {
  test.setTimeout(20000);
  await page.goto('/portfolio/src/portfolio-game/game.html');
  await page.keyboard.down('ArrowDown');
  try {
    // Travel farther than the complete original map, including at 30 FPS.
    await page.waitForTimeout(9500);
  } finally {
    await page.keyboard.up('ArrowDown');
  }
  const bounds = await page.evaluate(() => {
    const canvas = document.querySelector('canvas[data-player-x]');
    if (canvas) return {
      bottom: Number(canvas.dataset.playerY) + 4,
      worldHeight: Number(canvas.dataset.worldHeight),
    };
    const character = document.querySelector('.character').getBoundingClientRect();
    const map = document.querySelector('.map').getBoundingClientRect();
    return { bottom: character.bottom - map.top, worldHeight: map.height };
  });
  expect(bounds.bottom).toBeLessThanOrEqual(bounds.worldHeight);
});
