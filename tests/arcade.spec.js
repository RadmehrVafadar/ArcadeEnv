import { test, expect } from '@playwright/test';

test.describe.configure({ timeout: 60000 });

async function loadArcade(page) {
  await test.step('Load the cabinet and embedded portfolio', async () => {
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible();
    const screen = page.locator('iframe');
    await expect(screen).toBeVisible({ timeout: 30000 });
    await expect(page.locator('#arcade-loading')).toHaveCount(0, { timeout: 30000 });
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

test('loads and labels the arcade with its lighting and CRT glass intact', { tag: '@webgl' }, async ({ page, isMobile }, testInfo) => {
  test.skip(isMobile, 'Desktop scene regression; mobile auto zoom is covered separately.');
  const errors = [];
  const decorationRequests = [];
  page.on('request', request => {
    if (/cube(?:[-.]|\.png)|cloud\.png/i.test(request.url())) decorationRequests.push(request.url());
  });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await loadArcade(page);
  await expect(page.locator('iframe')).toHaveAttribute('src', '/portfolio/');
  await test.step('Check the accessible label and inert CRT layers', async () => {
    await expect(page.locator('iframe')).toHaveAttribute('title', 'Radmehr Vafadar portfolio');
    const glass = page.locator('.crt-screen');
    await expect(glass).toBeVisible();
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
  });
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
      controls: green(620 / 1280, 515 / 720),
      trimBlue: context.getImageData(
        Math.floor(image.width * 532 / 1280), Math.floor(image.height / 2), 1, 1,
      ).data[2],
    };
  }, screenshot.toString('base64'));
  expect(lighting.floor).toBeGreaterThan(lighting.floorSide + 10);
  // The overhead beam should read against the dark wings of the stage.
  expect(lighting.background).toBeGreaterThan(lighting.backgroundSide + 8);
  // Keep the control deck dark and the yellow rails saturated under the spotlight.
  expect(lighting.controls).toBeLessThan(60);
  expect(lighting.trimBlue).toBeLessThan(170);
  expect(errors).toEqual([]);
  expect(decorationRequests).toEqual([]);
});

test('hover zoom preserves CRT click-through', { tag: '@webgl' }, async ({ page, isMobile }, testInfo) => {
  test.skip(isMobile, 'Desktop CRT regression; mobile entry is covered separately.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await loadArcade(page);
  await zoomArcade(page);
  await test.step('Capture the zoomed cabinet', () =>
    page.screenshot({ path: testInfo.outputPath('zoomed.png') }));
  await test.step('Navigate to Blog inside the CRT glass', async () => {
    const portfolio = page.frameLocator('iframe');
    await portfolio.getByRole('link', { name: 'Blog', exact: true }).click({ timeout: 10000 });
    await expect(portfolio.getByRole('heading', { name: "rad's blog", exact: true }))
      .toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/\/$/);
    expect(page.context().pages()).toHaveLength(1);
  });
});

test('does not reference a missing favicon', async ({ request }) => {
  const response = await request.get('/');
  expect(response.ok()).toBe(true);
  const html = await response.text();
  const icon = html.match(/<link\b(?=[^>]*\brel=["']icon["'])[^>]*\bhref=["']([^"']+)["']/i);
  if (icon) {
    const response = await request.get(icon[1]);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toMatch(/^image\//);
  }
});

test('hover zoom keeps its speed at one rendered frame per second', { tag: '@webgl' }, async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop scene regression; mobile auto zoom is covered separately.');
  await page.addInitScript(() => {
    window.requestAnimationFrame = callback => window.setTimeout(() => callback(performance.now()), 1000);
    window.cancelAnimationFrame = id => window.clearTimeout(id);
  });
  await loadArcade(page);
  await zoomArcade(page, 3000);
});
