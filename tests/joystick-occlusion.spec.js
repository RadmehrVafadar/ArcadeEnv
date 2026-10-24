import { test, expect } from '@playwright/test';

test('iframe preserves joystick depth and click-through after zoom @webgl', async ({ page, isMobile }, testInfo) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#arcade-loading')).toHaveCount(0, { timeout: 30000 });
  await expect(page.locator('.arcade')).not.toHaveCSS('perspective', 'none');

  const screen = await page.locator('iframe').boundingBox();
  const visible = await page.screenshot({ path: testInfo.outputPath('joystick-initial.png') });
  // Removing only the HTML exposes the complete model as a pixel reference.
  await page.locator('.arcade').evaluate(element => { element.style.visibility = 'hidden'; });
  const reference = await page.screenshot();
  await page.locator('.arcade').evaluate(element => { element.style.visibility = ''; });
  const pixels = await page.evaluate(async ({ visible, reference, screen }) => {
    const read = async base64 => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      // The joystick is beside the lower right edge of the projected screen.
      return context.getImageData(
        screen.x + screen.width * 0.75, screen.y + screen.height - screen.width * 0.15,
        screen.width * 0.25, screen.width * 0.3,
      ).data;
    };
    const [actual, model] = await Promise.all([read(visible), read(reference)]);
    const red = (data, i) => data[i] > 60 && data[i] > data[i + 1] * 1.8 && data[i] > data[i + 2] * 1.8;
    let expected = 0;
    let retained = 0;
    for (let i = 0; i < model.length; i += 4) {
      if (!red(model, i)) continue;
      expected++;
      if (red(actual, i)) retained++;
    }
    return { expected, retained };
  }, { visible: visible.toString('base64'), reference: reference.toString('base64'), screen });
  expect(pixels.expected).toBeGreaterThan(2);
  // Allow the translucent glow and antialiased edge to pick up the iframe color.
  expect(pixels.retained / pixels.expected, 'Red joystick hardware must survive iframe compositing').toBeGreaterThan(0.85);
  if (!isMobile) await page.getByRole('button', { name: 'PRESS TO PLAY' }).click();
  await expect(page.getByRole('button', { name: 'PRESS TO PLAY' })).toHaveCount(0, { timeout: 15000 });
  await page.screenshot({ path: testInfo.outputPath('joystick-zoomed.png') });
  await page.frameLocator('iframe').getByRole('link', { name: 'Blog', exact: true }).click();
  await expect(page.frameLocator('iframe').getByRole('heading', { name: "rad's blog", exact: true })).toBeVisible();
});
