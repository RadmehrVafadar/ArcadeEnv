import { test, expect } from '@playwright/test';

test('arcade audio responds to cabinet input and remembers separate music and FX preferences', { tag: '@webgl' }, async ({ page, isMobile }, testInfo) => {
  test.setTimeout(60000);
  await page.addInitScript(() => {
    window.audioNotes = [];
    window.audioContexts = [];
    const NativeAudioContext = window.AudioContext;
    window.AudioContext = class extends NativeAudioContext {
      constructor(...args) {
        super(...args);
        window.audioContexts.push(this);
      }
      createOscillator() {
        const node = super.createOscillator();
        const start = node.start.bind(node);
        node.start = (...args) => {
          window.audioNotes.push({ type: node.type, frequency: node.frequency.value });
          start(...args);
        };
        return node;
      }
    };
  });
  await page.goto('/');
  await expect(page.locator('#arcade-loading')).toHaveCount(0, { timeout: 30000 });
  const fx = page.getByRole('button', { name: /Sound FX:/ });
  const music = page.getByRole('button', { name: /Music:/ });
  await expect(fx).toHaveAttribute('aria-pressed', 'true');
  await expect(music).toHaveAttribute('aria-pressed', 'false');
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(await page.evaluate(() => window.audioContexts.length)).toBe(0);
  await page.getByRole('button', { name: 'PRESS TO PLAY' }).click();
  await expect(page.locator('.neon-play-sign')).toHaveCount(0, { timeout: 15000 });
  await page.getByRole('button', { name: 'Cabinet: X Open', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.audioNotes.length)).toBe(1);
  expect(await page.evaluate(() => window.audioNotes[0].type)).toBe('square');
  const stick = page.getByRole('button', { name: /Cabinet: Joystick/ });
  const bounds = await stick.boundingBox();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2 + 20, bounds.y + bounds.height / 2);
  await page.mouse.move(bounds.x + bounds.width / 2 + 24, bounds.y + bounds.height / 2);
  await page.mouse.up();
  expect(await page.evaluate(() => window.audioNotes.map(n => n.type))).toEqual(['square', 'triangle']);
  // Keyboard events in the actual iframe share the cabinet audio, without repeat spam.
  await page.frameLocator('iframe').getByRole('link', { name: 'Start', exact: true }).focus();
  await page.keyboard.down('x');
  await page.keyboard.down('x');
  await page.keyboard.up('x');
  expect(await page.evaluate(() => window.audioNotes.length)).toBe(3);
  await fx.click();
  await page.keyboard.press('x');
  expect(await page.evaluate(() => window.audioNotes.length)).toBe(3);
  await music.click();
  await expect.poll(() => page.evaluate(() => window.audioNotes.length)).toBeGreaterThan(3);
  expect(await page.evaluate(() => window.audioContexts[0].state)).toBe('running');
  if (isMobile) await page.setViewportSize({ width: 320, height: 568 });
  const audioBounds = await page.getByRole('group', { name: 'Arcade audio' }).boundingBox();
  expect(audioBounds.x).toBeGreaterThanOrEqual(0);
  const controlBounds = await stick.boundingBox();
  expect(audioBounds.y + audioBounds.height).toBeLessThan(controlBounds.y);
  await page.screenshot({ path: testInfo.outputPath('audio-controls.png') });
  await page.reload();
  await expect(fx).toHaveAttribute('aria-pressed', 'false');
  await expect(music).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(await page.evaluate(() => window.audioContexts.length)).toBe(0);
  await music.click();
  await expect(music).toHaveAttribute('aria-pressed', 'false');
});
