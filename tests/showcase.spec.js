import { test, expect } from '@playwright/test';
import { gamePath, ready, approachMirror } from './game-helpers.js';

test('showcase link opens on one X press after releasing X in the previous tab', async ({ page, context, isMobile }) => {
  test.skip(isMobile, 'Touch devices navigate the top-level page instead of opening tabs.');
  await context.route('https://www.linkedin.com/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Showcase</title>' }));
  await page.goto(gamePath);
  await ready(page);
  await approachMirror(page);
  const keyboard = await context.newCDPSession(page);
  for (let i = 0; i < 3; i++) {
    const popupPromise = page.waitForEvent('popup');
    await keyboard.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'x', code: 'KeyX', windowsVirtualKeyCode: 88, autoRepeat: false });
    const popup = await popupPromise;
    await expect(popup).toHaveURL('https://www.linkedin.com/in/radmehrv/');
    await popup.bringToFront();
    await popup.keyboard.up('x');
    await popup.close();
    await page.bringToFront();
  }
  await keyboard.detach();
});
