import { test, expect } from '@playwright/test';
import { gamePath, ready, player, position, approachMirror, approachExhibit, moveTo } from './game-helpers.js';

test('walls and exhibit footprints block the same feet body on every device', async ({ page }) => {
  await page.goto(gamePath);
  await ready(page);
  // Collision needs the feet aligned with the base, beyond merely entering its interaction range.
  await moveTo(page, 'down', 'y', 164, 2);
  await moveTo(page, 'left', 'x', 68, 2);
  await page.keyboard.down('ArrowLeft');
  await expect.poll(async () => (await position(page)).x).toBe(58);
  await page.waitForTimeout(200);
  expect((await position(page)).x).toBe(58);
  await page.keyboard.up('ArrowLeft');
  await expect(page.locator('.dialogueBox')).toContainText('Hey a mirror!');
  await page.keyboard.down('ArrowDown');
  await expect.poll(async () => (await position(page)).y, { timeout: 10000 }).toBe(556);
  await page.keyboard.up('ArrowDown');
});

test('movement aliases survive release and focus loss clears movement', async ({ page }) => {
  await page.goto(gamePath);
  await ready(page);
  await page.keyboard.down('s');
  await page.keyboard.down('ArrowDown');
  await page.keyboard.up('s');
  await expect(player(page)).toHaveAttribute('data-walking', 'true');
  await page.evaluate(() => { document.hasFocus = () => false; window.dispatchEvent(new Event('blur')); });
  await expect(player(page)).toHaveAttribute('data-walking', 'false');
  const stopped = await position(page);
  await page.waitForTimeout(150);
  expect(await position(page)).toEqual(stopped);
  await page.keyboard.up('ArrowDown');
});

test('every restored project is reachable and resolves its own description', async ({ page }, testInfo) => {
  await page.goto(gamePath);
  await ready(page);
  for (const [id, title] of [['linkedin', 'The looking glass'], ['punch-out', "Mike Tyson's Punch-Out!!"], ['fake-news', 'Fake News Detector'], ['music-orb', 'Music Orb'], ['distributed-video', 'Distributed Video Streaming'], ['minesweeper', 'Minesweeper']]) {
    await approachExhibit(page, id);
    await expect(page.locator('.dialogueBox')).toContainText(title);
    await expect(page.locator('.dialogueBox')).toBeVisible();
    await expect(page.locator('.dialogueBox')).toContainText('X to open');
    await page.screenshot({ path: testInfo.outputPath(`exhibit-${id}.png`) });
  }
});

test('nearby exhibits open their descriptions automatically with X to open', async ({ page }) => {
  await page.goto(gamePath);
  await ready(page);
  await approachMirror(page);
  const dialogue = page.locator('.dialogueBox');
  await expect(dialogue).toBeVisible();
  await expect(dialogue).toContainText('Hey a mirror!');
  await expect(dialogue).toContainText('X to open');
  await expect(dialogue).not.toContainText('Z to read');
  await expect(page.locator('.actionPrompt')).toHaveCount(0);
  await moveTo(page, 'right', 'x', 104);
  await expect(dialogue).toBeHidden();
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

test('exhibits remain reachable at slow rendering rates', async ({ page }) => {
  await page.addInitScript(() => {
    const original = window.requestAnimationFrame.bind(window);
    const last = new WeakMap();
    window.requestAnimationFrame = callback => original(function frame(time) {
      if (time - (last.get(callback) ?? -Infinity) >= 1000 / 5 - 1) { last.set(callback, time); callback(time); }
      else original(frame);
    });
  });
  await page.goto(gamePath);
  await ready(page);
  await approachExhibit(page, 'punch-out');
  await expect(page.locator('.dialogueBox')).toContainText('Punch-Out');
  await expect(page.locator('.dialogueBox')).toBeVisible();
});

test('exhibits remain reachable after one delayed rendering frame', async ({ page }) => {
  await page.addInitScript(() => {
    const original = window.requestAnimationFrame.bind(window);
    let stalled = false, resumeAt = 0;
    window.requestAnimationFrame = callback => original(function frame(time) {
      if (!stalled && document.querySelector('canvas[data-walking="true"]')) {
        stalled = true; resumeAt = time + 500;
      }
      if (time < resumeAt) original(frame);
      else callback(time);
    });
  });
  await page.goto(gamePath);
  await ready(page);
  await approachExhibit(page, 'punch-out');
  await expect(page.locator('.dialogueBox')).toContainText('Punch-Out');
  await expect(page.locator('.dialogueBox')).toBeVisible();
});

test('failed artwork loading keeps a usable menu link', async ({ page }) => {
  await page.route('**/*walk*.png', route => route.abort());
  await page.goto(gamePath);
  await expect(page.locator('.loading')).toContainText('could not load');
  await page.getByRole('link', { name: 'Menu Q' }).click();
  await expect(page).toHaveURL(/\/portfolio\/$/);
});
