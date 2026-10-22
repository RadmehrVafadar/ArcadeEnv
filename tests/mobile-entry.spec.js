import { test, expect } from '@playwright/test';

test('an iPad using a desktop user agent automatically zooms the arcade @webgl', async ({ browser, isMobile, baseURL }) => {
  test.skip(isMobile, 'Device detection is covered once per server mode.');
  test.setTimeout(60000);
  const context = await browser.newContext({
    baseURL,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
    hasTouch: true,
  });
  await context.addInitScript(() => Object.defineProperty(navigator, 'maxTouchPoints', { value: 5 }));
  try {
    const page = await context.newPage();
    let releasePortfolio;
    const portfolioHeld = new Promise(resolve => { releasePortfolio = resolve; });
    await page.route('**/portfolio/', async route => {
      await portfolioHeld;
      await route.continue();
    });
    const screen = page.locator('iframe');
    let initialWidth;
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('canvas')).toBeVisible();
      await expect(page.locator('.arcade')).not.toHaveCSS('perspective', 'none', { timeout: 30000 });
      // A delayed runner must still measure the cabinet before automatic zoom.
      await page.waitForTimeout(7000);
      initialWidth = (await screen.boundingBox()).width;
      await expect(page.locator('#arcade-loading')).toBeVisible();
    } finally {
      releasePortfolio();
    }
    await expect(page.locator('#arcade-loading')).toHaveCount(0, { timeout: 30000 });
    await expect.poll(async () => (await screen.boundingBox()).width, { timeout: 10000 })
      .toBeGreaterThan(initialWidth * 1.5);
    expect(new URL(page.url()).pathname).toBe('/');
  } finally {
    await context.close();
  }
});

test('a desktop touch laptop retains the arcade and hover zoom', { tag: '@webgl' }, async ({ page, isMobile }) => {
  test.setTimeout(60000);
  test.skip(isMobile, 'Desktop touch regression.');
  await page.addInitScript(() => Object.defineProperty(navigator, 'maxTouchPoints', { value: 10 }));
  let releasePortfolio;
  const portfolioHeld = new Promise(resolve => { releasePortfolio = resolve; });
  await page.route('**/portfolio/', async route => {
    await portfolioHeld;
    await route.continue();
  });
  const screen = page.locator('iframe');
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(screen).toBeVisible({ timeout: 30000 });
    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.locator('.arcade')).not.toHaveCSS('perspective', 'none', { timeout: 30000 });
    await expect(page.getByRole('status')).toBeVisible();
  } finally {
    releasePortfolio();
  }
  await expect(page.locator('#arcade-loading')).toHaveCount(0, { timeout: 30000 });
  await expect(page.frameLocator('iframe').getByRole('link', { name: 'Start', exact: true })).toBeVisible();
  const initialWidth = (await screen.boundingBox()).width;
  await page.waitForTimeout(5500);
  expect((await screen.boundingBox()).width).toBeCloseTo(initialWidth, 0);
  const viewport = page.viewportSize();
  await page.mouse.move(viewport.width / 2, viewport.height * 0.82);
  await expect.poll(async () => (await screen.boundingBox()).width, { timeout: 15000 })
    .toBeGreaterThan(initialWidth * 1.5);
});
