import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Keep the embedded site independent of its deployment and network availability.
  await page.route('https://portfolio-website-omega-flame.vercel.app/**', route =>
    route.fulfill({ contentType: 'text/html', body: '<h1>Portfolio fixture</h1>' }),
  );
});

test('loads the arcade without application errors', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('iframe')).toBeVisible({ timeout: 30000 });
  await expect(page.frameLocator('iframe').getByRole('heading')).toHaveText('Portfolio fixture');
  await page.screenshot({ path: testInfo.outputPath('arcade.png') });
  expect(errors).toEqual([]);
});

test('labels the embedded portfolio for assistive technology', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('iframe')).toHaveAttribute('title', 'Radmehr Vafadar portfolio', {
    timeout: 30000,
  });
});

test('zooms toward the cabinet on hover or touch', async ({ page, isMobile }, testInfo) => {
  await page.goto('/');
  const screen = page.locator('iframe');
  await expect(screen).toBeVisible({ timeout: 30000 });
  const initialWidth = (await screen.boundingBox()).width;
  const viewport = page.viewportSize();

  if (isMobile) {
    await page.touchscreen.tap(viewport.width * 0.1, viewport.height * 0.9);
  } else {
    await page.mouse.move(viewport.width / 2, viewport.height * 0.82);
  }

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
