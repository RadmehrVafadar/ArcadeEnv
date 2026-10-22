import { test, expect } from '@playwright/test';
import { gamePath, player, position, ready, approachMirror, moveTo } from './game-helpers.js';

async function holdDirection(page, direction) {
  const touch = await page.context().newCDPSession(page);
  const bounds = await page.locator(`.dpad-${direction}`).boundingBox();
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }] });
  return async (type = 'touchEnd') => { await touch.send('Input.dispatchTouchEvent', { type, touchPoints: [] }); await touch.detach(); };
}

test.beforeEach(async ({ isMobile }) => test.skip(!isMobile, 'Mobile layout and touch controls'));

test('mobile museum fits portrait, landscape, and tablet without covering controls', async ({ page }, testInfo) => {
  for (const viewport of [{ width: 320, height: 568 }, { width: 412, height: 915 }, { width: 915, height: 412 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(viewport);
    await page.goto(gamePath);
    await ready(page);
    const layout = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight }));
    expect(layout.scrollWidth).toBe(layout.width);
    expect(layout.scrollHeight).toBe(layout.height);
    for (const selector of ['.dpad-up', '.dpad-down', '.dpad-left', '.dpad-right', '.action-read', '.action-open', '.menu-link']) {
      const button = page.locator(selector);
      await expect(button).toBeVisible();
      const bounds = await button.boundingBox();
      expect(bounds.width).toBeGreaterThanOrEqual(44);
      expect(bounds.height).toBeGreaterThanOrEqual(44);
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
      expect(await button.evaluate(element => { const r = element.getBoundingClientRect(); return element.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); })).toBe(true);
    }
    await page.screenshot({ path: testInfo.outputPath(`museum-${viewport.width}x${viewport.height}.png`) });
  }
});

test('mobile movement stops on touch release and cancellation', async ({ page }) => {
  for (const type of ['touchEnd', 'touchCancel']) {
    await page.goto(gamePath);
    await ready(page);
    const release = await holdDirection(page, 'down');
    await expect(player(page)).toHaveAttribute('data-walking', 'true');
    await expect.poll(async () => (await position(page)).y).toBeGreaterThan(112);
    await release(type);
    await expect(player(page)).toHaveAttribute('data-walking', 'false');
    const stopped = await position(page);
    await page.waitForTimeout(100);
    expect(await position(page)).toEqual(stopped);
  }
});

test('mobile Read and Open buttons inspect the mirror and the door exits', async ({ page, context }) => {
  await context.route('https://www.linkedin.com/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Showcase</title>' }));
  await page.goto(gamePath);
  await ready(page);
  await approachMirror(page);
  await page.getByRole('button', { name: 'Space: Read' }).tap();
  await expect(page.locator('.dialogueBox')).toContainText('Hey a mirror!');
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'E: Open' }).tap();
  const popup = await popupPromise;
  await expect(popup).toHaveURL('https://www.linkedin.com/in/radmehrv/');
  await popup.close();
  await page.bringToFront();
  await moveTo(page, 'right', 'x', 104);
  await moveTo(page, 'up', 'y', 84);
  await page.getByRole('button', { name: 'Space: Read' }).tap();
  await expect(page).toHaveURL(/\/portfolio\/$/);
});

test('resizing and orientation changes preserve world position and boundaries', async ({ page }) => {
  await page.goto(gamePath);
  await ready(page);
  await moveTo(page, 'down', 'y', 180);
  const before = await position(page);
  for (const viewport of [{ width: 915, height: 412 }, { width: 320, height: 568 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(100);
    expect(await position(page)).toEqual(before);
    const zoom = Number(await player(page).getAttribute('data-zoom'));
    const camera = await page.locator('.camera').boundingBox();
    expect(camera.width / zoom).toBeCloseTo(192 / 1.15);
  }
  const release = await holdDirection(page, 'left');
  await expect.poll(async () => (await position(page)).x).toBe(22);
  await release();
  const stopped = await position(page);
  await page.setViewportSize({ width: 412, height: 915 });
  expect(await position(page)).toEqual(stopped);
});
