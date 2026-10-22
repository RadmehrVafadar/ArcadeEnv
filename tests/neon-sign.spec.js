import { test, expect } from '@playwright/test';

test.describe.configure({ timeout: 60000 });

for (const activation of ['click', 'Enter', 'Space']) {
  test(`neon sign starts the cabinet zoom with ${activation} @webgl`, async ({ page, isMobile }, testInfo) => {
    test.skip(isMobile, 'Mobile tap entry is covered separately before automatic zoom.');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('#arcade-loading')).toHaveCount(0, { timeout: 30000 });
    const sign = page.getByRole('button', { name: 'PRESS TO PLAY', exact: true });
    await expect(sign).toBeVisible();
    await expect(sign.locator('svg')).toHaveCount(0);
    await expect(sign.locator('span')).toHaveCSS('animation-name', 'none');
    const bounds = await sign.boundingBox();
    const viewport = page.viewportSize();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    const screen = page.locator('iframe');
    const initialWidth = (await screen.boundingBox()).width;
    if (activation === 'click') {
      await page.screenshot({ path: testInfo.outputPath('neon-sign.png') });
      await sign.click();
    } else {
      await sign.focus();
      await expect(sign).toBeFocused();
      await page.keyboard.press(activation);
    }
    await expect(sign).toHaveCount(1);
    await expect.poll(async () => (await screen.boundingBox()).width, { timeout: 15000 })
      .toBeGreaterThan(initialWidth * 1.5);
    await expect(sign).toHaveCount(0, { timeout: 15000 });
  });
}

test('mobile can tap the neon sign before automatic zoom @webgl', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile tap entry regression.');
  let releasePortfolio;
  const portfolioHeld = new Promise(resolve => { releasePortfolio = resolve; });
  await page.route('**/portfolio/', async route => {
    await portfolioHeld;
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const sign = page.getByRole('button', { name: 'PRESS TO PLAY', exact: true });
  const screen = page.locator('iframe');
  let initialWidth;
  try {
    await expect(sign).toBeVisible({ timeout: 30000 });
    await expect(page.locator('.arcade')).not.toHaveCSS('perspective', 'none', { timeout: 30000 });
    initialWidth = (await screen.boundingBox()).width;
  } finally {
    releasePortfolio();
  }
  // Tap as soon as the loading cover clears, before the five-second auto zoom.
  await sign.tap();
  await expect(sign).toHaveCount(1);
  await expect.poll(async () => (await screen.boundingBox()).width, { timeout: 15000 })
    .toBeGreaterThan(initialWidth * 1.5);
  await expect(sign).toHaveCount(0, { timeout: 15000 });
});

test('neon text bops only when motion is allowed @webgl', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Motion preferences are covered once per server mode.');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('#arcade-loading')).toHaveCount(0, { timeout: 30000 });
  const label = page.getByRole('button', { name: 'PRESS TO PLAY' }).locator('span');
  await expect(page.getByRole('button', { name: 'PRESS TO PLAY' })).toHaveCSS('font-size', '28px');
  await expect(label).toHaveCSS('animation-name', 'neon-text-bop');
  const positions = await label.evaluate(element => {
    const animation = element.getAnimations()[0];
    animation.pause();
    return [0, 300, 600].map(time => {
      animation.currentTime = time;
      return new DOMMatrixReadOnly(getComputedStyle(element).transform).m42;
    });
  });
  expect(positions).toEqual([0, -3, 0]);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(label).toHaveCSS('animation-name', 'none');
});
