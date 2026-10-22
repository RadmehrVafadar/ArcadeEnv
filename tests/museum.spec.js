import { test, expect } from '@playwright/test';
import { gamePath, ready, player, position, approachMirror } from './game-helpers.js';

test('walls and exhibit footprints block the same feet body on every device', async ({ page }) => {
  await page.goto(gamePath);
  await ready(page);
  await approachMirror(page);
  await page.keyboard.down('ArrowLeft');
  await expect.poll(async () => (await position(page)).x).toBe(58);
  await page.waitForTimeout(200);
  expect((await position(page)).x).toBe(58);
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.press('Space');
  await expect(page.locator('.dialogueBox')).toContainText('Hey a mirror!');
  await page.keyboard.down('ArrowDown');
  await expect.poll(async () => (await position(page)).y, { timeout: 10000 }).toBe(620);
  await page.keyboard.up('ArrowDown');
});

test('movement aliases survive release and focus loss clears movement', async ({ page }) => {
  await page.goto(gamePath);
  await ready(page);
  await page.keyboard.down('s');
  await page.keyboard.down('ArrowDown');
  await page.keyboard.up('s');
  await expect(player(page)).toHaveAttribute('data-walking', 'true');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(player(page)).toHaveAttribute('data-walking', 'false');
  const stopped = await position(page);
  await page.waitForTimeout(150);
  expect(await position(page)).toEqual(stopped);
  await page.keyboard.up('ArrowDown');
});

test('movement speed stays consistent at reduced rendering rates', async ({ browser, baseURL }) => {
  const distances = [];
  for (const rate of [60, 20]) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.addInitScript(rate => {
      const original = window.requestAnimationFrame.bind(window);
      let last = 0;
      window.requestAnimationFrame = callback => original(function frame(time) {
        if (time - last >= 1000 / rate - 1) { last = time; callback(time); }
        else original(frame);
      });
    }, rate);
    await page.goto(`${baseURL}${gamePath}`);
    await ready(page);
    const before = await position(page);
    await page.evaluate(() => new Promise(resolve => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', bubbles: true }));
      setTimeout(() => { document.dispatchEvent(new KeyboardEvent('keyup', { key: 's', bubbles: true })); resolve(); }, 600);
    }));
    await expect(player(page)).toHaveAttribute('data-walking', 'false');
    distances.push((await position(page)).y - before.y);
    await context.close();
  }
  for (const distance of distances) expect(distance).toBeGreaterThan(54);
  expect(Math.abs(distances[0] - distances[1])).toBeLessThanOrEqual(10);
});

test('failed artwork loading keeps a usable menu link', async ({ page }) => {
  await page.route('**/*walk*.png', route => route.abort());
  await page.goto(gamePath);
  await expect(page.locator('.loading')).toContainText('could not load');
  await page.getByRole('link', { name: 'Menu Q' }).click();
  await expect(page).toHaveURL(/\/portfolio\/$/);
});
