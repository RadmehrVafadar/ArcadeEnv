import { test, expect } from '@playwright/test';
import { gamePath, player, ready, approachMirror, moveTo } from './game-helpers.js';

test('hallway uses the full viewport with 15% closer camera framing and no duplicate controls', async ({ page }, testInfo) => {
  for (const viewport of [{ width: 1280, height: 720 }, { width: 624, height: 780 }]) {
    await page.setViewportSize(viewport);
    await page.goto(gamePath);
    await ready(page);
    const controls = page.locator('.gameControls');
    await expect(controls).toHaveCount(0);
    const world = await page.locator('.world-panel').boundingBox();
    const frame = await page.locator('.frame').boundingBox();
    expect(world.width).toBe(frame.width);
    const framing = await player(page).evaluate(canvas => {
      const zoom = Number(canvas.dataset.zoom);
      const worldWidth = Number(canvas.dataset.worldWidth);
      return {
        zoomMultiplier: zoom / (canvas.clientWidth / (worldWidth - 16)),
        longHallway: Number(canvas.dataset.worldHeight) >= worldWidth * 2.5,
      };
    });
    expect(framing.zoomMultiplier).toBeCloseTo(1.15, 4);
    expect(framing.longHallway).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`museum-${viewport.width}x${viewport.height}.png`) });
  }
});

test('classic speech boxes fit their text and the world has no title bar', async ({ page }) => {
  await page.goto(gamePath);
  await ready(page);
  await expect(page.locator('.museum-header')).toHaveCount(0);
  const world = await page.locator('.world-panel').boundingBox();
  const frame = await page.locator('.frame').boundingBox();
  expect(world).toEqual(frame);
  const dialogue = page.locator('.dialogueBox');
  await expect(dialogue).toHaveCSS('background-color', 'rgb(245, 245, 245)');
  await expect(dialogue).toHaveCSS('color', 'rgb(0, 0, 0)');
  expect(await dialogue.evaluate(element => parseFloat(getComputedStyle(element).borderRadius))).toBeGreaterThanOrEqual(8);
  await dialogue.evaluate(element => { element.textContent = 'Hello!'; });
  const short = await dialogue.boundingBox();
  await dialogue.evaluate(element => { element.textContent = 'Explore the museum and discover a new project. '.repeat(15); });
  const long = await dialogue.boundingBox();
  expect(long.width).toBeGreaterThan(short.width);
  expect(long.height).toBeGreaterThan(short.height);
  expect(long.y).toBeGreaterThanOrEqual(world.y);
  expect(long.y + long.height).toBeLessThanOrEqual(world.y + world.height);
  expect(await dialogue.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
});

test('fractional camera zoom preserves the carpet palette across tile boundaries', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(gamePath);
  await ready(page);
  await moveTo(page, 'down', 'y', 256);
  const unexpectedPixels = await player(page).evaluate(async canvas => {
    const atlasUrl = performance.getEntriesByType('resource').find(entry => /\/tiles(?:-|\.png)/.test(entry.name)).name;
    const atlas = new Image();
    atlas.src = atlasUrl;
    await atlas.decode();
    const sample = document.createElement('canvas');
    sample.width = atlas.width; sample.height = atlas.height;
    const context = sample.getContext('2d');
    context.drawImage(atlas, 0, 0);
    const palette = new Set();
    // This strip contains only the authored carpet, away from the visitor and lamp pools.
    for (let index = 12; index <= 27; index++) {
      const pixels = context.getImageData(index % 8 * 16, Math.floor(index / 8) * 16, 16, 16).data;
      for (let i = 0; i < pixels.length; i += 4) palette.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`);
    }
    const zoom = Number(canvas.dataset.zoom);
    const x = Math.ceil((60 - Number(canvas.dataset.cameraX)) * zoom);
    const y = Math.ceil((232 - Number(canvas.dataset.cameraY)) * zoom);
    const pixels = canvas.getContext('2d').getImageData(x, y, Math.floor(24 * zoom), Math.floor(40 * zoom)).data;
    let unexpected = 0;
    for (let i = 0; i < pixels.length; i += 4) if (!palette.has(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`)) unexpected++;
    return unexpected;
  });
  expect(unexpectedPixels).toBe(0);
});

test('dialogue overlays the bottom of the world without reserving a bar', async ({ page }, testInfo) => {
  await page.goto(gamePath);
  await ready(page);
  const world = page.locator('.world-panel');
  const dialogue = page.locator('.dialogueBox');
  const initial = await world.boundingBox();
  const frame = await page.locator('.frame').boundingBox();
  expect(initial.y + initial.height).toBe(frame.y + frame.height);
  const checkOverlay = async () => {
    const box = await dialogue.boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(initial.y);
    expect(box.y + box.height).toBeLessThanOrEqual(initial.y + initial.height);
    expect(await dialogue.evaluate(element => Boolean(element.closest('.world-panel')))).toBe(true);
    expect(await world.boundingBox()).toEqual(initial);
  };
  await checkOverlay();
  await page.screenshot({ path: testInfo.outputPath('welcome-overlay.png') });
  await approachMirror(page);
  await expect(dialogue).toBeHidden();
  expect(await world.boundingBox()).toEqual(initial);
  await page.keyboard.press('z');
  await expect(dialogue).toContainText('Hey a mirror!');
  await checkOverlay();
  await page.screenshot({ path: testInfo.outputPath('exhibit-overlay.png') });
});
