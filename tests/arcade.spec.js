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
  const roomResponse = page.waitForResponse(response => response.url().endsWith('/arcade-room.glb'));
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('iframe')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('iframe')).toHaveAttribute('src', '/portfolio/');
  await expect(page.frameLocator('iframe').getByRole('link', { name: 'Start', exact: true })).toBeVisible();
  const room = await (await roomResponse).body();
  expect(room.length).toBeLessThan(256 * 1024);
  expect(room.toString('ascii', 0, 4)).toBe('glTF');
  const gltf = JSON.parse(room.toString('utf8', 20, 20 + room.readUInt32LE(12)));
  expect(gltf.images ?? []).toHaveLength(0);
  const primitives = gltf.meshes.flatMap(mesh => mesh.primitives);
  expect(primitives.length).toBeLessThanOrEqual(7);
  const triangles = primitives
    .reduce((count, primitive) => count + gltf.accessors[primitive.indices].count / 3, 0);
  expect(triangles).toBeLessThan(5000);
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
    const pixels = context.getImageData(0, 0, image.width, image.height).data;
    let cyan = 0;
    let coral = 0;
    for (let y = 0; y < image.height; y++) {
      for (let x = 0; x < image.width; x++) {
        const i = (y * image.width + x) * 4;
        const [r, g, b] = pixels.slice(i, i + 3);
        if (x < image.width * 0.4 && g > 100 && b > 120 && b > r * 1.2) cyan++;
        if (x > image.width * 0.6 && r > 120 && b > 70 && r > g * 1.3) coral++;
      }
    }
    return { cyan, coral };
  }, screenshot.toString('base64'));
  expect(lighting.cyan).toBeGreaterThan(100);
  expect(lighting.coral).toBeGreaterThan(100);
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
