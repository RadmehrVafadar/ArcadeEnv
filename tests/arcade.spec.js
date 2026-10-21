import { test, expect } from '@playwright/test';

test.describe.configure({ timeout: 60000 });

async function loadArcade(page) {
  await test.step('Load the cabinet and embedded portfolio', async () => {
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible();
    const screen = page.locator('iframe');
    await expect(screen).toBeVisible({ timeout: 30000 });
    // Html is visible at its CSS width before the first WebGL frame transforms it.
    await expect(page.locator('.arcade')).not.toHaveCSS('perspective', 'none', { timeout: 30000 });
    await expect(page.frameLocator('iframe').getByRole('link', { name: 'Start', exact: true }))
      .toBeVisible({ timeout: 10000 });
  });
}

async function zoomArcade(page, timeout = 15000) {
  await test.step('Hover the cabinet and wait for zoom', async () => {
    const screen = page.locator('iframe');
    const initialWidth = (await screen.boundingBox()).width;
    const viewport = page.viewportSize();
    await page.mouse.move(viewport.width / 2, viewport.height * 0.82);
    await expect.poll(async () => (await screen.boundingBox()).width, { timeout })
      .toBeGreaterThan(initialWidth * 1.5);
  });
}

test('loads the arcade without application errors', { tag: '@webgl' }, async ({ page, isMobile }, testInfo) => {
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
  await loadArcade(page);
  await expect(page.locator('iframe')).toHaveAttribute('src', '/portfolio/');
  const screenshot = await test.step('Capture the spotlight', () =>
    page.screenshot({ path: testInfo.outputPath('arcade.png') }));
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

test('labels the embedded portfolio for assistive technology', { tag: '@webgl' }, async ({ page, isMobile }) => {
  test.skip(isMobile, 'Mobile opens the portfolio directly.');
  await page.goto('/');
  await expect(page.locator('iframe')).toHaveAttribute('title', 'Radmehr Vafadar portfolio', {
    timeout: 30000,
  });
});

test('CRT glass respects screen dimensions and keeps decorative layers inert', { tag: '@webgl' }, async ({ page, isMobile }, testInfo) => {
  test.skip(isMobile, 'Mobile opens the portfolio without CRT glass.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await loadArcade(page);
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
  await test.step('Capture the CRT appearance', () =>
    page.screenshot({ path: testInfo.outputPath('crt-screen.png') }));
});

test('CRT glass keeps the embedded portfolio clickable after zoom', { tag: '@webgl' }, async ({ page, isMobile }) => {
  test.skip(isMobile, 'Mobile opens the portfolio without CRT glass.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await loadArcade(page);
  await zoomArcade(page);
  await test.step('Navigate to Blog inside the CRT glass', async () => {
    const portfolio = page.frameLocator('iframe');
    await portfolio.getByRole('link', { name: 'Blog', exact: true }).click({ timeout: 10000 });
    await expect(portfolio.getByRole('heading', { name: "rad's blog", exact: true }))
      .toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/\/$/);
    expect(page.context().pages()).toHaveLength(1);
  });
});

test('zooms toward the cabinet on hover', { tag: '@webgl' }, async ({ page, isMobile }, testInfo) => {
  test.skip(isMobile, 'Mobile opens the portfolio directly.');
  await loadArcade(page);
  await zoomArcade(page);
  await test.step('Capture the zoomed cabinet', () =>
    page.screenshot({ path: testInfo.outputPath('zoomed.png') }));
});

test('does not reference a missing favicon', { tag: '@webgl' }, async ({ page, request }) => {
  await page.goto('/');
  const icon = page.locator('link[rel="icon"]');
  if (await icon.count()) {
    const response = await request.get(await icon.getAttribute('href'));
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toMatch(/^image\//);
  }
});

test('hover zoom keeps its speed at one rendered frame per second', { tag: '@webgl' }, async ({ page, isMobile }) => {
  test.skip(isMobile, 'Mobile opens the portfolio directly.');
  await page.addInitScript(() => {
    window.requestAnimationFrame = callback => window.setTimeout(() => callback(performance.now()), 1000);
    window.cancelAnimationFrame = id => window.clearTimeout(id);
  });
  await loadArcade(page);
  await zoomArcade(page, 3000);
});
