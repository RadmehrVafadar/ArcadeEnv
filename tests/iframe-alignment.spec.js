import { test, expect } from '@playwright/test';

test('iframe projection avoids WebKit offsets across in-app browser sizes @webgl', async ({ page }, testInfo) => {
  test.setTimeout(60000);
  await page.route('**/portfolio/', route => route.fulfill({
    contentType: 'text/html',
    body: '<!doctype html><style>body { margin: 0; display: grid; place-items: center; height: 100vh; }</style><button>Portfolio</button>',
  }));
  await page.goto('/');
  await expect(page.locator('.arcade')).not.toHaveCSS('perspective', 'none', { timeout: 30000 });
  await expect(page.locator('#arcade-loading')).toHaveCount(0, { timeout: 30000 });

  for (const size of [
    { width: 393, height: 751 },
    { width: 393, height: 667 },
    { width: 751, height: 393 },
    { width: 1280, height: 720 },
  ]) {
    await page.setViewportSize(size);
    const expected = {
      width: Math.ceil(size.width / 2) * 2,
      height: Math.ceil(size.height / 2) * 2,
    };
    await expect.poll(() => page.locator('canvas').evaluate(canvas => ({
      width: canvas.getBoundingClientRect().width,
      height: canvas.getBoundingClientRect().height,
    }))).toEqual(expected);
    await expect(page.locator('.arcade')).toHaveCSS('width', `${expected.width}px`);
    await expect(page.locator('.arcade')).toHaveCSS('height', `${expected.height}px`);
    await page.screenshot({ path: testInfo.outputPath(`iframe-${size.width}x${size.height}.png`) });
  }

  // WebViews can also report fractional layout dimensions.
  await page.locator('html').evaluate(element => {
    element.style.width = '393.5px';
    element.style.height = '667.25px';
  });
  await expect(page.locator('.arcade')).toHaveCSS('width', '394px');
  await expect(page.locator('.arcade')).toHaveCSS('height', '668px');
  await page.frameLocator('iframe').getByRole('button', { name: 'Portfolio' }).click();
});
