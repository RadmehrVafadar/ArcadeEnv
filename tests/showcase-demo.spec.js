import { test, expect } from '@playwright/test';

const demoPath = '/portfolio/src/portfolio-game/demo.html';
const position = page => page.locator('.demo-player').evaluate(el => ({ x: Number(el.dataset.x), y: Number(el.dataset.y) }));
async function walk(page, direction, duration) {
  await page.keyboard.down(`Arrow${direction}`);
  await page.clock.runFor(duration);
  await page.keyboard.up(`Arrow${direction}`);
  await page.clock.runFor(16);
}

test.beforeEach(async ({ page }) => {
  const time = new Date('2026-01-01T00:00:00Z');
  await page.clock.install({ time });
  await page.clock.pauseAt(time);
});

test('scene demo blocks walking through the lower computer on every viewport', async ({ page }, testInfo) => {
  await page.goto(demoPath);
  await page.clock.runFor(32);
  await expect(page.getByRole('heading', { name: 'Showcase scene demo' })).toBeVisible();
  // Use the actual input loop to approach the computer from the central aisle.
  await page.keyboard.down('ArrowDown');
  await page.clock.runFor(3040);
  await page.keyboard.up('ArrowDown');
  const y = Number(await page.locator('.demo-player').getAttribute('data-y'));
  expect(y).toBeGreaterThan(1020);
  expect(y).toBeLessThan(1048);
  await page.keyboard.down('ArrowLeft');
  await page.clock.runFor(1500);
  await page.keyboard.up('ArrowLeft');
  await expect(page.locator('.demo-status')).toContainText('Distributed-Video-Player');
  const player = await page.locator('.demo-player').evaluate(el => ({ x: Number(el.dataset.x), y: Number(el.dataset.y) }));
  const collider = await page.locator('[data-collider="Distributed-Video-Player"]').evaluate(el => ({
    x: Number(el.dataset.x), width: Number(el.dataset.width),
  }));
  expect(player.x - 9).toBeGreaterThanOrEqual(collider.x + collider.width - 0.1);
  expect(player.x - 9).toBeLessThan(collider.x + collider.width + 4);
  await page.getByRole('button', { name: 'Geometry', exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath('lower-computer-geometry.png') });
});

test('moving an exhibit carries its sprite, solid boundary, and interaction area together', async ({ page, isMobile }, testInfo) => {
  await page.goto(demoPath);
  await page.clock.runFor(32);
  await page.getByRole('button', { name: 'Geometry', exact: true }).click();
  await page.getByRole('button', { name: 'Move exhibits', exact: true }).click();
  const sprite = page.locator('[data-exhibit="Mirror"]');
  const solid = page.locator('[data-collider="Mirror"]');
  const positions = () => page.evaluate(() => {
    const sprite = document.querySelector('[data-exhibit="Mirror"]');
    const solid = document.querySelector('[data-collider="Mirror"]');
    const interaction = solid.nextElementSibling;
    return { sprite: parseFloat(sprite.style.left), solid: Number(solid.dataset.x), interaction: Number(interaction.dataset.x) };
  });
  const before = await positions();
  await sprite.focus();
  await page.keyboard.press('ArrowRight');
  expect(await positions()).toEqual(Object.fromEntries(Object.entries(before).map(([key, value]) => [key, value + 8])));
  const bounds = await sprite.boundingBox(), start = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  if (isMobile) {
    const touch = await page.context().newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x + 36, y: start.y + 32 }] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await touch.detach();
  } else {
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 36, start.y + 32);
    await page.mouse.up();
  }
  const after = await positions();
  expect(after.sprite).toBeGreaterThan(before.sprite + 8);
  expect(after.solid - before.solid).toBe(after.sprite - before.sprite);
  expect(after.interaction - before.interaction).toBe(after.sprite - before.sprite);
  await expect(solid).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('moved-exhibit-geometry.png') });
  await page.getByRole('button', { name: 'Reset scene' }).click();
  expect(await positions()).toEqual(before);
  expect(await position(page)).toEqual({ x: 218, y: 300 });
});

test('scene actions read and open the original exhibit links and the door exits', async ({ page, context }) => {
  await context.route('https://www.linkedin.com/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Showcase fixture</title>' }));
  await page.goto(demoPath);
  await page.clock.runFor(32);
  await walk(page, 'Left', 500);
  await page.getByRole('button', { name: 'Space Read' }).click();
  await expect(page.locator('.demo-message')).toContainText('Hey a mirror!');
  const opened = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'E Open' }).click();
  const popup = await opened;
  await expect(popup).toHaveURL('https://www.linkedin.com/in/radmehrv/');
  await popup.close();
  for (const action of ['Space Read', 'E Open']) {
    await page.goto(demoPath);
    await page.clock.runFor(32);
    await walk(page, 'Up', 500);
    await expect(page.locator('.demo-status')).toContainText('Door');
    await page.getByRole('button', { name: action }).click();
    await expect(page).toHaveURL(/\/portfolio\/$/);
  }
});

test('movement aliases, pointer cancellation, and focus loss stop correctly', async ({ page }) => {
  await page.goto(demoPath);
  await page.clock.runFor(32);
  await page.keyboard.down('s');
  await page.keyboard.down('ArrowDown');
  await page.keyboard.up('s');
  await page.clock.runFor(160);
  expect((await position(page)).y).toBeGreaterThan(300);
  await page.keyboard.up('ArrowDown');
  await page.clock.runFor(16);
  await expect(page.locator('.demo-player')).toHaveAttribute('walking', 'false');
  const button = page.getByRole('button', { name: 'Move down', exact: true });
  await button.hover();
  await page.mouse.down();
  await page.clock.runFor(160);
  await button.dispatchEvent('pointercancel', { pointerId: 1 });
  await page.mouse.up();
  await page.clock.runFor(16);
  await expect(page.locator('.demo-player')).toHaveAttribute('walking', 'false');
  await page.keyboard.down('ArrowDown');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.clock.runFor(160);
  const stopped = await position(page);
  await page.clock.runFor(160);
  expect(await position(page)).toEqual(stopped);
  await page.keyboard.up('ArrowDown');
});

test('mobile scene keeps controls visible through resizing and rotation', async ({ page, isMobile }, testInfo) => {
  test.skip(!isMobile, 'Mobile portrait, landscape, and tablet layouts');
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(demoPath);
  await page.clock.runFor(32);
  for (const viewport of [{ width: 320, height: 568 }, { width: 915, height: 412 }, { width: 768, height: 1024 }]) {
    const before = await position(page);
    await page.setViewportSize(viewport);
    await page.clock.runFor(32);
    expect(await position(page)).toEqual(before);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
    for (const name of ['Move up', 'Move left', 'Move down', 'Move right', 'Space Read', 'E Open']) {
      const button = page.getByRole('button', { name, exact: true });
      const bounds = await button.boundingBox();
      expect(bounds.width).toBeGreaterThanOrEqual(44);
      expect(bounds.height).toBeGreaterThanOrEqual(44);
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
      expect(await button.evaluate(el => {
        const rect = el.getBoundingClientRect();
        return el.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
      })).toBe(true);
    }
    await page.screenshot({ path: testInfo.outputPath(`scene-${viewport.width}x${viewport.height}.png`) });
  }
  expect(errors).toEqual([]);
});
