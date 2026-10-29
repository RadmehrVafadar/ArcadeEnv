import { test, expect } from '@playwright/test';

test('showcase links open on one X press after releasing X in the previous tab', async ({ page, context, isMobile }) => {
  test.skip(isMobile, 'Mobile projects navigate the current top-level window.');
  await context.route(/^https:\/\/(radmehrvafadar\.github\.io|www\.linkedin\.com)\//, route => route.fulfill({
    contentType: 'text/html', body: '<title>Showcase</title><p>Showcase fixture</p>',
  }));
  const keyboard = await context.newCDPSession(page);
  await page.goto('/portfolio/src/portfolio-game/game.html');
  const position = () => page.locator('.character').evaluate(element => {
    const pixelSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pixel-size'));
    const playerCenter = matchMedia('(pointer: coarse)').matches ? 16 : 0;
    return new DOMMatrixReadOnly(getComputedStyle(element).transform).m41 / pixelSize + playerCenter;
  });
  for (const [direction, target, url] of [
    ['ArrowLeft', 40, 'https://www.linkedin.com/in/radmehrv/'],
    ['ArrowLeft', 40, 'https://www.linkedin.com/in/radmehrv/'],
    ['ArrowLeft', 40, 'https://www.linkedin.com/in/radmehrv/'],
  ]) {
    await page.keyboard.down(direction);
    try {
      await expect.poll(async () => direction === 'ArrowRight' ? (await position()) >= target : (await position()) <= target).toBe(true);
    } finally {
      await page.keyboard.up(direction);
    }
    await expect(page.locator('.actionPrompt')).toContainText('Press X to open');
    const popupPromise = page.waitForEvent('popup');
    await keyboard.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'x', code: 'KeyX', windowsVirtualKeyCode: 88, autoRepeat: false });
    const popup = await popupPromise;
    await expect(popup).toHaveURL(url);
    await popup.bringToFront();
    await popup.keyboard.up('x');
    await popup.close();
    await page.bringToFront();
  }
});
