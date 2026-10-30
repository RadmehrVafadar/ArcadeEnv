import { test, expect } from '@playwright/test';
import { ready } from './game-helpers.js';

test('the static cabinet stops drawing between interactions @webgl', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop idle rendering; mobile delayed zoom is covered separately.');
  test.setTimeout(60000);
  await page.addInitScript(() => {
    window.arcadeDraws = 0;
    for (const Context of [WebGLRenderingContext, WebGL2RenderingContext]) {
      const draw = Context.prototype.drawElements;
      Context.prototype.drawElements = function (...args) {
        window.arcadeDraws++;
        return draw.apply(this, args);
      };
    }
  });
  await page.goto('/');
  await expect(page.locator('#arcade-loading')).toHaveCount(0, { timeout: 30000 });
  await expect(page.locator('.arcade')).not.toHaveCSS('perspective', 'none');
  await expect.poll(() => page.evaluate(() => window.arcadeDraws)).toBeGreaterThan(0);
  const drawsWhileIdle = () => page.evaluate(async () => {
    const before = window.arcadeDraws;
    await new Promise(resolve => setTimeout(resolve, 500));
    return window.arcadeDraws - before;
  });
  await expect.poll(drawsWhileIdle).toBe(0);
  const screen = page.locator('iframe');
  const initialWidth = (await screen.boundingBox()).width;
  await page.mouse.move(page.viewportSize().width / 2, page.viewportSize().height * 0.82);
  await expect.poll(async () => (await screen.boundingBox()).width, { timeout: 15000 })
    .toBeGreaterThan(initialWidth * 1.5);
  await expect.poll(drawsWhileIdle, { timeout: 15000 }).toBe(0);
  await page.frameLocator('iframe').getByRole('link', { name: 'Start', exact: true }).click();
  await ready(page.frameLocator('iframe'));
  const control = page.getByRole('button', { name: 'Cabinet: Z Read', exact: true });
  await expect(control).toBeVisible();
  await expect.poll(drawsWhileIdle, { timeout: 15000 }).toBe(0);
  await control.hover();
  await page.mouse.down();
  await expect(control).toHaveAttribute('data-pressed', '');
  await page.mouse.up();
  await expect(control).not.toHaveAttribute('data-pressed');
  await expect.poll(drawsWhileIdle, { timeout: 15000 }).toBe(0);
});
