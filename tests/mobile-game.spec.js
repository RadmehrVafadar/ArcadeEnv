import { test, expect } from '@playwright/test';
import { gamePath, player, position, ready, approachMirror, moveTo } from './game-helpers.js';

test.beforeEach(async ({ isMobile }) => test.skip(!isMobile, 'Mobile presentation and navigation'));

test('mobile museum fits portrait, landscape, and tablet without duplicate touch controls', async ({ page }, testInfo) => {
  for (const viewport of [{ width: 320, height: 568 }, { width: 412, height: 915 }, { width: 915, height: 412 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(viewport);
    await page.goto(gamePath);
    await ready(page);
    const layout = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight }));
    expect(layout.scrollWidth).toBe(layout.width);
    expect(layout.scrollHeight).toBe(layout.height);
    await expect(page.locator('.gameControls, .dpad')).toHaveCount(0);
    const menu = page.getByRole('link', { name: 'Menu Q' });
    const bounds = await menu.boundingBox();
    expect(bounds.width).toBeGreaterThanOrEqual(44);
    expect(bounds.height).toBeGreaterThanOrEqual(44);
    expect(await menu.evaluate(element => { const r = element.getBoundingClientRect(); return element.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); })).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`museum-${viewport.width}x${viewport.height}.png`) });
  }
});

test('cabinet source release and disconnect clear movement without releasing keyboard aliases', async ({ page }) => {
  await page.goto(gamePath);
  await ready(page);
  await page.evaluate(() => {
    window.arcadeControls.connect();
    window.arcadeControls.setDirection('pointer:1', 'down');
  });
  await expect(player(page)).toHaveAttribute('data-walking', 'true');
  await page.keyboard.down('ArrowDown');
  await page.evaluate(() => window.arcadeControls.reset());
  await expect(player(page)).toHaveAttribute('data-walking', 'true');
  await page.keyboard.up('ArrowDown');
  await expect(player(page)).toHaveAttribute('data-walking', 'false');
  for (const operation of ['reset', 'disconnect']) {
    await page.evaluate(() => { window.arcadeControls.connect(); window.arcadeControls.setDirection('pointer:1', 'down'); });
    await expect(player(page)).toHaveAttribute('data-walking', 'true');
    await page.evaluate(operation => window.arcadeControls[operation](), operation);
    await expect(player(page)).toHaveAttribute('data-walking', 'false');
    const stopped = await position(page);
    await page.waitForTimeout(100);
    expect(await position(page)).toEqual(stopped);
  }
});

test('mobile descriptions open nearby and X navigates the top-level page without popup support', async ({ page, context }) => {
  await context.route('https://www.linkedin.com/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Showcase</title>' }));
  await page.goto(gamePath);
  await ready(page);
  await approachMirror(page);
  await expect(page.locator('.dialogueBox')).toContainText('Hey a mirror!');
  await page.evaluate(() => { window.open = () => { throw new Error('Popups unavailable'); }; });
  await page.keyboard.press('x');
  await expect(page).toHaveURL('https://www.linkedin.com/in/radmehrv/');
  await expect(page).toHaveTitle('Showcase');
});

test('mobile door and Menu link return to the portfolio', async ({ page }) => {
  await page.goto(gamePath);
  await ready(page);
  await moveTo(page, 'up', 'y', 120);
  await expect(page.locator('.dialogueBox')).toContainText('X to exit');
  await page.keyboard.press('x');
  await expect(page).toHaveURL(/\/portfolio\/$/);
  await page.goto(gamePath);
  await ready(page);
  await page.getByRole('link', { name: 'Menu Q' }).tap();
  await expect(page).toHaveURL(/\/portfolio\/$/);
});

test('resizing and orientation changes preserve world position and boundaries', async ({ page }) => {
  await page.goto(gamePath);
  await ready(page);
  await moveTo(page, 'down', 'y', 200);
  const before = await position(page);
  for (const viewport of [{ width: 915, height: 412 }, { width: 320, height: 568 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(100);
    expect(await position(page)).toEqual(before);
    const zoom = Number(await player(page).getAttribute('data-zoom'));
    const camera = await page.locator('.camera').boundingBox();
    expect(camera.width / zoom).toBeCloseTo(192 / 1.15);
  }
  await page.keyboard.down('ArrowLeft');
  await expect.poll(async () => (await position(page)).x).toBe(22);
  await page.keyboard.up('ArrowLeft');
  const stopped = await position(page);
  await page.setViewportSize({ width: 412, height: 915 });
  expect(await position(page)).toEqual(stopped);
});
