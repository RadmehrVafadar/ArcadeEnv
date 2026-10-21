import { test, expect } from '@playwright/test';

test('portfolio fonts load locally without external requests', async ({ page, baseURL }) => {
  const externalRequests = [];
  page.on('request', request => {
    if (new URL(request.url()).origin !== new URL(baseURL).origin) externalRequests.push(request.url());
  });
  for (const [path, family] of [
    ['/portfolio/', 'Arcade Interlaced'],
    ['/portfolio/src/portfolio-game/game.html', 'Press Start 2P'],
  ]) {
    await page.goto(path);
    const loaded = await page.evaluate(async family => {
      const fonts = await document.fonts.load(`16px "${family}"`);
      return fonts.length > 0 && fonts.every(font => font.status === 'loaded');
    }, family);
    expect(loaded, family).toBe(true);
  }
  expect(externalRequests).toEqual([]);
});
