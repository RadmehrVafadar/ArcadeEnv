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
  await page.evaluate(initialWidth => {
    let readyAt;
    const loadingObserver = new MutationObserver(() => {
      if (!document.querySelector('#arcade-loading') && readyAt === undefined) {
        readyAt = performance.now();
        loadingObserver.disconnect();
      }
    });
    loadingObserver.observe(document.body, { childList: true, subtree: true });
    const measureZoom = () => {
      if (readyAt !== undefined) {
        if (document.querySelector('iframe').getBoundingClientRect().width > initialWidth * 1.05) {
          window.arcadeZoomDelay = performance.now() - readyAt;
          return;
        }
      }
      requestAnimationFrame(measureZoom);
    };
    requestAnimationFrame(measureZoom);
  }, initialWidth);
  try {
    // Loading time must not consume the five-second pause before zooming.
    await page.waitForTimeout(5500);
    expect((await screen.boundingBox()).width).toBeCloseTo(initialWidth, 0);
    await expect(page.locator('#arcade-loading')).toBeVisible();
  } finally {
    releasePortfolio();
  }
  await expect(page.locator('#arcade-loading')).toHaveCount(0, { timeout: 30000 });
  await expect(page).toHaveURL(/\/$/);
  await expect(page.frameLocator('iframe').getByRole('link', { name: 'Start', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('mobile-arcade.png') });
  // Measure in the browser so delayed Playwright calls cannot shift the baseline.
  await expect.poll(() => page.evaluate(() => window.arcadeZoomDelay), { timeout: 15000 })
    .toBeGreaterThanOrEqual(4900);
  await expect.poll(async () => (await screen.boundingBox()).width, { timeout: 10000 })
    .toBeGreaterThan(initialWidth * 1.5);
  await page.screenshot({ path: testInfo.outputPath('mobile-zoomed.png') });
});
