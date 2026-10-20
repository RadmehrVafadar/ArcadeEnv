import { test, expect } from '@playwright/test';

test('loads the arcade without application errors', async ({ page, isMobile }, testInfo) => {
  test.skip(isMobile, 'Mobile opens the portfolio directly.');
  const errors = [];
  const decorationRequests = [];
  page.on('request', request => {
    if (/cube(?:[-.]|\.png)|cloud\.png/i.test(request.url())) decorationRequests.push(request.url());
  });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('iframe')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('iframe')).toHaveAttribute('src', '/portfolio/');
  await expect(page.frameLocator('iframe').getByRole('link', { name: 'Start', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('arcade.png') });
  expect(errors).toEqual([]);
  expect(decorationRequests).toEqual([]);
});

test('labels the embedded portfolio for assistive technology', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Mobile opens the portfolio directly.');
  await page.goto('/');
  await expect(page.locator('iframe')).toHaveAttribute('title', 'Radmehr Vafadar portfolio', {
    timeout: 30000,
  });
});

test('zooms toward the cabinet on hover', async ({ page, isMobile }, testInfo) => {
  test.skip(isMobile, 'Mobile opens the portfolio directly.');
  await page.goto('/');
  const screen = page.locator('iframe');
  await expect(screen).toBeVisible({ timeout: 30000 });
  const initialWidth = (await screen.boundingBox()).width;
  const viewport = page.viewportSize();

  await page.mouse.move(viewport.width / 2, viewport.height * 0.82);

  await expect.poll(async () => (await screen.boundingBox()).width, { timeout: 15000 })
    .toBeGreaterThan(initialWidth * 1.5);
  await page.screenshot({ path: testInfo.outputPath('zoomed.png') });
});

test('does not reference a missing favicon', async ({ page, request }) => {
  await page.goto('/');
  const icon = page.locator('link[rel="icon"]');
  if (await icon.count()) {
    const response = await request.get(await icon.getAttribute('href'));
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toMatch(/^image\//);
  }
});
