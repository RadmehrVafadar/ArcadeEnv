import { test, expect } from '@playwright/test';

test('mobile keeps the arcade and automatically zooms after loading @webgl', async ({ page, isMobile }, testInfo) => {
  test.skip(!isMobile, 'Mobile entry regression.');
  test.setTimeout(60000);
  let releasePortfolio;
  const portfolioHeld = new Promise(resolve => { releasePortfolio = resolve; });
  await page.route('**/portfolio/', async route => {
    await portfolioHeld;
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('.arcade')).not.toHaveCSS('perspective', 'none', { timeout: 30000 });
  const screen = page.locator('iframe');
  const initialWidth = (await screen.boundingBox()).width;
  try {
    // Loading time must not consume the two-second pause before zooming.
    await page.waitForTimeout(2500);
    expect((await screen.boundingBox()).width).toBeCloseTo(initialWidth, 0);
    await expect(page.locator('#arcade-loading')).toBeVisible();
  } finally {
    releasePortfolio();
  }
  await expect(page.locator('#arcade-loading')).toHaveCount(0, { timeout: 30000 });
  await expect(page).toHaveURL(/\/$/);
  await expect(page.frameLocator('iframe').getByRole('link', { name: 'Start', exact: true })).toBeVisible();
  await page.waitForTimeout(1000);
  expect((await screen.boundingBox()).width).toBeCloseTo(initialWidth, 0);
  await page.screenshot({ path: testInfo.outputPath('mobile-arcade.png') });
  await expect.poll(async () => (await screen.boundingBox()).width, { timeout: 10000 })
    .toBeGreaterThan(initialWidth * 1.5);
  await page.screenshot({ path: testInfo.outputPath('mobile-zoomed.png') });
});
