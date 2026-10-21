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
  const screenshot = await page.screenshot({ path: testInfo.outputPath('arcade.png') });
  const lighting = await page.evaluate(async base64 => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const green = (x, y) => context.getImageData(
      Math.floor(image.width * x), Math.floor(image.height * y), 1, 1,
    ).data[1];
    return {
      floor: green(0.5, 0.94),
      floorSide: green(0.1, 0.94),
      background: green(0.5, 0.1),
      backgroundSide: green(0.1, 0.1),
    };
  }, screenshot.toString('base64'));
  expect(lighting.floor).toBeGreaterThan(lighting.floorSide + 10);
  // The overhead beam should read against the dark wings of the stage.
  expect(lighting.background).toBeGreaterThan(lighting.backgroundSide + 8);
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

test('CRT glass keeps the portfolio clickable and respects screen dimensions', async ({ page, isMobile }, testInfo) => {
  test.skip(isMobile, 'Mobile opens the portfolio without CRT glass.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const glass = page.locator('.crt-screen');
  await expect(glass).toBeVisible({ timeout: 30000 });
  await expect(glass).toHaveCSS('width', '624px');
  await expect(glass).toHaveCSS('height', '780px');
  await expect(glass).toHaveCSS('overflow', 'hidden');
  await expect(glass).toHaveCSS('border-top-left-radius', '5% 4%');
  for (const layer of ['::before', '::after']) {
    const styles = await glass.evaluate((element, layer) => {
      const css = getComputedStyle(element, layer);
      return { pointerEvents: css.pointerEvents, animation: css.animationName, background: css.backgroundImage };
    }, layer);
    expect(styles.pointerEvents).toBe('none');
    expect(styles.animation).toBe('none');
    expect(styles.background).not.toBe('none');
  }
  const viewport = page.viewportSize();
  const screen = page.locator('iframe');
  const initialWidth = (await screen.boundingBox()).width;
  await page.mouse.move(viewport.width / 2, viewport.height * 0.82);
  await expect.poll(async () => (await screen.boundingBox()).width, { timeout: 15000 })
    .toBeGreaterThan(initialWidth * 1.5);
  const blog = page.frameLocator('iframe').getByRole('link', { name: 'Blog', exact: true });
  await expect(blog).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('crt-screen.png') });
  const popupPromise = page.waitForEvent('popup');
  await blog.click();
  const popup = await popupPromise;
  await expect(popup.getByRole('heading', { name: "rad's blog", exact: true })).toBeVisible();
  await popup.close();
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
