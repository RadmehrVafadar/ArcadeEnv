import { test, expect } from '@playwright/test';

test('mobile opens the portfolio without loading the arcade scene', async ({ page, isMobile }, testInfo) => {
  test.skip(!isMobile, 'Mobile entry regression.');
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/');
  await expect(page).toHaveURL(/\/portfolio\/$/);
  await expect(page.getByRole('link', { name: 'Start', exact: true })).toBeVisible();
  await expect(page.locator('canvas, iframe')).toHaveCount(0);
  expect(requests.filter(url => /scene[.-]|model9\.glb|cube\.png|three|drei|fiber/i.test(url))).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('mobile-portfolio.png') });
});

test('an iPad using a desktop user agent opens the portfolio', async ({ browser, isMobile, baseURL }) => {
  test.skip(isMobile, 'Device detection is covered once per server mode.');
  const context = await browser.newContext({
    baseURL,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
    hasTouch: true,
  });
  await context.addInitScript(() => Object.defineProperty(navigator, 'maxTouchPoints', { value: 5 }));
  try {
    const page = await context.newPage();
    await page.goto('/');
    await expect(page).toHaveURL(/\/portfolio\/$/);
    await expect(page.getByRole('link', { name: 'Start', exact: true })).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test('a desktop touch laptop retains the arcade and hover zoom', { tag: '@webgl' }, async ({ page, isMobile }) => {
  test.setTimeout(60000);
  test.skip(isMobile, 'Desktop touch regression.');
  await page.addInitScript(() => Object.defineProperty(navigator, 'maxTouchPoints', { value: 10 }));
  await page.goto('/');
  const screen = page.locator('iframe');
  await expect(screen).toBeVisible({ timeout: 30000 });
  await expect(page.locator('canvas')).toBeVisible();
  const initialWidth = (await screen.boundingBox()).width;
  const viewport = page.viewportSize();
  await page.mouse.move(viewport.width / 2, viewport.height * 0.82);
  await expect.poll(async () => (await screen.boundingBox()).width, { timeout: 15000 })
    .toBeGreaterThan(initialWidth * 1.5);
});
