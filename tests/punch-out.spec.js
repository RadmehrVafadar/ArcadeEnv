import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const route = '/portfolio/src/punch-out/punch-out.html';
const fixture = await readFile(new URL('./fixtures/emulator.js', import.meta.url), 'utf8');

async function mockEmulator(page, { delay = 0, fail = false } = {}) {
  await page.route('https://cdn.emulatorjs.org/4.2.3/data/loader.js', request => fail
    ? request.abort('failed')
    : request.fulfill({ contentType: 'text/javascript', body: `window.fixtureDelay = ${delay};\n${fixture}` }));
}

const events = frame => frame.locator('#emulator-frame').evaluate(element => element.contentWindow.EJS_emulator.events);
const samples = frame => frame.locator('#emulator-frame').evaluate(element => element.contentWindow.EJS_emulator.samples);

test('keyboard directions, punches, Start/Select, visibility and cancellation use the emulator adapter', async ({ page }) => {
  await mockEmulator(page);
  await page.goto(route);
  await expect(page.locator('body')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#instructions')).toContainText('Z + X');
  await page.keyboard.press('q');
  await expect.poll(() => events(page)).toContainEqual({ player: 0, button: 3, pressed: 1 });
  await expect.poll(() => events(page)).toContainEqual({ player: 0, button: 3, pressed: 0 });
  await expect(page.locator('#instructions')).toBeHidden();
  await page.locator('#emulator-frame').evaluate(element => { element.contentWindow.EJS_emulator.events.length = 0; });
  await page.evaluate(() => {
    for (const [key, code] of [['z', 'KeyZ'], ['x', 'KeyX']]) document.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true }));
  });
  await page.waitForTimeout(80);
  expect(await events(page)).toEqual([{ player: 0, button: 2, pressed: 1 }]);
  await page.evaluate(() => {
    for (const [key, code] of [['z', 'KeyZ'], ['x', 'KeyX']]) document.dispatchEvent(new KeyboardEvent('keyup', { key, code, bubbles: true }));
  });
  await expect.poll(() => events(page)).toContainEqual({ player: 0, button: 2, pressed: 0 });
  await page.locator('#emulator-frame').evaluate(element => { element.contentWindow.EJS_emulator.events.length = 0; });
  for (const key of ['z', 'x', 'z', 'x']) {
    await page.keyboard.press(key, { delay: 10 });
    await page.waitForTimeout(40);
  }
  expect((await events(page)).filter(event => event.pressed).map(event => event.button)).toEqual([0, 8, 0, 8]);
  await page.keyboard.down('ArrowUp');
  await page.keyboard.down('z');
  await expect.poll(() => events(page)).toContainEqual({ player: 0, button: 0, pressed: 1 });
  await expect.poll(() => samples(page)).toContainEqual([0, 4]);
  await page.keyboard.up('z');
  await page.keyboard.up('ArrowUp');
  await page.keyboard.press('x');
  await expect.poll(() => events(page)).toContainEqual({ player: 0, button: 8, pressed: 1 });
  await page.keyboard.press('Enter');
  await page.keyboard.press('Shift');
  await expect.poll(() => events(page)).toContainEqual({ player: 0, button: 3, pressed: 1 });
  await expect.poll(() => events(page)).toContainEqual({ player: 0, button: 2, pressed: 1 });
  await page.keyboard.down('a');
  await page.keyboard.down('z');
  await page.evaluate(() => {
    document.hasFocus = () => false;
    window.dispatchEvent(new Event('blur'));
  });
  await page.keyboard.up('a');
  await page.keyboard.up('z');
  await page.waitForTimeout(100);
  const held = new Set();
  for (const event of await events(page)) event.pressed ? held.add(event.button) : held.delete(event.button);
  expect([...held]).toEqual([]);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  expect(await page.locator('#emulator-frame').evaluate(el => el.contentWindow.EJS_emulator.paused)).toBe(true);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
  expect(await page.locator('#emulator-frame').evaluate(el => el.contentWindow.EJS_emulator.paused)).toBe(false);
});

test('entry stays in the cabinet, held inputs animate, Start returns to the exhibit', { tag: '@webgl' }, async ({ page, isMobile }, testInfo) => {
  test.setTimeout(90000);
  await mockEmulator(page);
  await page.goto('/');
  await expect(page.locator('#arcade-loading')).toHaveCount(0, { timeout: 30000 });
  await page.getByRole('button', { name: 'PRESS TO PLAY' }).click();
  await expect(page.locator('.neon-play-sign')).toHaveCount(0, { timeout: 15000 });
  const frame = page.frameLocator('.crt-screen > iframe');
  await expect(frame.locator('.button')).toHaveText(['Start', 'Blog', 'Resume']);
  await frame.getByRole('link', { name: 'Start', exact: true }).click();
  await expect(frame.locator('.frame')).toHaveClass(/cabinet-connected/);
  await page.keyboard.down('ArrowRight');
  await expect(frame.locator('.actionPrompt')).toContainText('X to open');
  await page.keyboard.up('ArrowRight');
  await page.keyboard.press('z');
  await expect(frame.locator('.dialogueBox')).toContainText('Punch-Out');
  const position = await frame.locator('.character').getAttribute('style');
  const before = await page.locator('.crt-screen > iframe').boundingBox();
  await page.locator('.crt-screen').evaluate(element => { window.originalCRT = element; window.originalCanvas = document.querySelector('canvas'); });
  await page.keyboard.press('x');
  await expect(frame.locator('body')).toHaveAttribute('data-state', 'ready');
  const emulator = frame.frameLocator('#emulator-frame');
  await expect(emulator.locator('.ejs_virtualGamepad_parent')).toBeHidden();
  await expect(emulator.locator('.ejs_menu_bar')).toBeHidden();
  expect(await frame.locator('#instructions').evaluate(element => element.scrollHeight <= element.clientHeight)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('punch-out-instructions.png') });
  const read = page.locator('[data-action="read"]'), open = page.locator('[data-action="open"]'), reset = page.locator('[data-action="menu"]');
  await read.click();
  await expect(frame.locator('#instructions')).toBeHidden();
  const gameBounds = await emulator.locator('canvas').boundingBox();
  const viewport = page.viewportSize();
  expect(gameBounds.x).toBeGreaterThanOrEqual(-1);
  expect(gameBounds.x + gameBounds.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(gameBounds.y).toBeGreaterThanOrEqual(-1);
  expect(gameBounds.y + gameBounds.height).toBeLessThanOrEqual(viewport.height + 1);
  await page.keyboard.down('ArrowLeft');
  await page.keyboard.down('z');
  await expect(read).toHaveAttribute('data-pressed');
  await expect(page.locator('[data-direction="left"]')).toBeVisible();
  await expect.poll(() => events(frame)).toContainEqual({ player: 0, button: 0, pressed: 1 });
  await frame.locator('body').focus();
  await read.focus();
  await expect.poll(async () => (await samples(frame)).at(-1)).toEqual([0, 6]);
  await page.keyboard.up('z');
  await page.keyboard.up('ArrowLeft');
  await frame.locator('body').focus();
  await page.keyboard.down('x');
  await expect(open).toHaveAttribute('data-pressed');
  await expect.poll(() => events(frame)).toContainEqual({ player: 0, button: 8, pressed: 1 });
  await page.keyboard.up('x');
  await expect(open).not.toHaveAttribute('data-pressed');
  await frame.locator('#emulator-frame').evaluate(element => { element.contentWindow.EJS_emulator.events.length = 0; });
  await read.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => events(frame)).toContainEqual({ player: 0, button: 3, pressed: 1 });
  await expect.poll(() => events(frame)).toContainEqual({ player: 0, button: 3, pressed: 0 });
  await read.focus();
  await page.keyboard.down('Space');
  await expect(read).toHaveAttribute('data-pressed');
  await expect.poll(() => events(frame)).toContainEqual({ player: 0, button: 0, pressed: 1 });
  await page.keyboard.up('Space');
  await expect(read).not.toHaveAttribute('data-pressed');
  await expect.poll(() => events(frame)).toContainEqual({ player: 0, button: 0, pressed: 0 });
  if (isMobile) {
    await frame.locator('#emulator-frame').evaluate(element => { element.contentWindow.EJS_emulator.events.length = 0; });
    const session = await page.context().newCDPSession(page);
    const center = async (locator, id) => { const b = await locator.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, id }; };
    const stick = await center(page.getByRole('button', { name: /Cabinet: Joystick/ }), 1);
    const punch = await center(read, 2);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [stick] });
    const left = { ...stick, x: stick.x - 30 };
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [left] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [left, punch] });
    await expect(read).toHaveAttribute('data-pressed');
    await expect.poll(() => events(frame)).toContainEqual({ player: 0, button: 0, pressed: 1 });
    await expect.poll(() => samples(frame)).toContainEqual([0, 6]);
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(read).not.toHaveAttribute('data-pressed');
    await page.waitForTimeout(40);
    await frame.locator('#emulator-frame').evaluate(element => { element.contentWindow.EJS_emulator.events.length = 0; });
    const secondPunch = await center(open, 3);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [stick, punch, secondPunch] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [left, punch, secondPunch] });
    await expect(read).toHaveAttribute('data-pressed');
    await expect(open).toHaveAttribute('data-pressed');
    await expect.poll(() => events(frame)).toContainEqual({ player: 0, button: 2, pressed: 1 });
    expect((await events(frame)).some(event => [0, 8].includes(event.button) && event.pressed)).toBe(false);
    await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await expect(read).not.toHaveAttribute('data-pressed');
    await expect(open).not.toHaveAttribute('data-pressed');
    await expect(page.getByRole('button', { name: /Cabinet: Joystick/ })).toHaveAttribute('data-direction', '');
    await session.detach();
  }
  await reset.click();
  await expect.poll(() => events(frame)).toContainEqual({ player: 0, button: 3, pressed: 1 });
  await page.screenshot({ path: testInfo.outputPath('punch-out-gameplay.png') });
  const after = await page.locator('.crt-screen > iframe').boundingBox();
  expect(Math.abs(after.width - before.width)).toBeLessThan(2);
  expect(await page.evaluate(() => window.originalCRT === document.querySelector('.crt-screen') && window.originalCanvas === document.querySelector('canvas'))).toBe(true);
  await reset.hover();
  await page.mouse.down();
  await expect(frame.locator('.character')).toBeVisible();
  await page.mouse.up();
  await expect(frame.locator('.character')).toHaveAttribute('style', position);
  await page.keyboard.press('q');
  await expect(frame.getByRole('link', { name: 'Start', exact: true })).toBeVisible();
});

test('failure retries with Z and Start cancels pending initialization and exits', async ({ page }) => {
  await mockEmulator(page, { fail: true });
  await page.goto(route);
  await expect(page.locator('body')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#status')).toContainText('Z');
  await page.unroute('https://cdn.emulatorjs.org/4.2.3/data/loader.js');
  await mockEmulator(page, { delay: 10000 });
  await page.keyboard.press('z');
  await expect(page.locator('#emulator-frame')).toBeAttached();
  await expect(page.locator('body')).toHaveAttribute('data-state', 'loading');
  await page.keyboard.press('q');
  await expect(page).toHaveURL(/portfolio-game\/game.html$/);
  await expect(page.locator('#emulator-frame')).toHaveCount(0);
});
