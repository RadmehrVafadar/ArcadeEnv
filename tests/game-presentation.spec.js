import { test, expect } from '@playwright/test';
import { gamePath, player, ready, approachMirror } from './game-helpers.js';

test('hallway controls stay mobile-only with 15% closer camera framing', async ({ page, isMobile }, testInfo) => {
  for (const viewport of [{ width: 1280, height: 720 }, { width: 624, height: 780 }]) {
    await page.setViewportSize(viewport);
    await page.goto(gamePath);
    await ready(page);
    const controls = page.locator('.gameControls');
    if (isMobile) await expect(controls).toBeVisible();
    else {
      await expect(controls).toBeHidden();
      const world = await page.locator('.world-panel').boundingBox();
      const frame = await page.locator('.frame').boundingBox();
      expect(world.width).toBe(frame.width);
    }
    const framing = await player(page).evaluate(canvas => {
      const zoom = Number(canvas.dataset.zoom);
      const worldWidth = Number(canvas.dataset.worldWidth);
      return {
        zoomMultiplier: zoom / (canvas.clientWidth / (worldWidth - 16)),
        longHallway: Number(canvas.dataset.worldHeight) >= worldWidth * 3,
      };
    });
    expect(framing.zoomMultiplier).toBeCloseTo(1.15, 4);
    expect(framing.longHallway).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`museum-${viewport.width}x${viewport.height}.png`) });
  }
});

test('dialogue overlays the bottom of the world without reserving a bar', async ({ page, isMobile }, testInfo) => {
  await page.goto(gamePath);
  await ready(page);
  const world = page.locator('.world-panel');
  const dialogue = page.locator('.dialogueBox');
  const initial = await world.boundingBox();
  const frame = await page.locator('.frame').boundingBox();
  if (isMobile) {
    const controls = await page.locator('.gameControls').boundingBox();
    expect(controls.y + controls.height).toBe(frame.y + frame.height);
  } else expect(initial.y + initial.height).toBe(frame.y + frame.height);
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
  await page.keyboard.press('Space');
  await expect(dialogue).toContainText('Hey a mirror!');
  await checkOverlay();
  await page.screenshot({ path: testInfo.outputPath('exhibit-overlay.png') });
});
