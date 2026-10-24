import { test, expect } from '@playwright/test';

test.describe.configure({ timeout: 60000 });

async function startGame(page) {
  await page.goto('/');
  await expect(page.locator('#arcade-loading')).toHaveCount(0, { timeout: 30000 });
  if (!await page.evaluate(() => matchMedia('(pointer: coarse)').matches)) {
    await page.getByRole('button', { name: 'PRESS TO PLAY' }).click();
  }
  await page.frameLocator('iframe').getByRole('link', { name: 'Start', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cabinet: Joystick: drag to move', exact: true })).toBeVisible();
  await expect(page.locator('.neon-play-sign')).toHaveCount(0, { timeout: 15000 });
  return page.frameLocator('iframe');
}

async function position(game) {
  return game.locator('.character').evaluate(element => {
    const value = getComputedStyle(document.documentElement).getPropertyValue('--pixel-size');
    const scale = matchMedia('(pointer: coarse)').matches ? parseFloat(value) : parseInt(value);
    const transform = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return { x: transform.m41 / scale, y: transform.m42 / scale };
  });
}

async function grabJoystick(page, mobile) {
  const stick = page.getByRole('button', { name: 'Cabinet: Joystick: drag to move', exact: true });
  await stick.scrollIntoViewIfNeeded();
  const bounds = await stick.boundingBox();
  const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2, id: 1 };
  const session = mobile ? await page.context().newCDPSession(page) : null;
  if (session) await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [center] });
  else {
    await page.mouse.move(center.x, center.y);
    await page.mouse.down();
  }
  return {
    async move(dx, dy) {
      const point = { ...center, x: center.x + dx, y: center.y + dy };
      if (session) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
      else await page.mouse.move(point.x, point.y);
    },
    async release() {
      if (session) {
        await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await session.detach();
      } else await page.mouse.up();
    },
  };
}

test('original zoom keeps three invisible working action targets on every device', { tag: '@webgl' }, async ({ page, isMobile }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('#arcade-loading')).toHaveCount(0, { timeout: 30000 });
  await page.getByRole('button', { name: 'PRESS TO PLAY' }).click();
  await expect(page.locator('.neon-play-sign')).toHaveCount(0, { timeout: 15000 });
  const screen = page.locator('iframe');
  const originalWidth = (await screen.boundingBox()).width;
  const game = page.frameLocator('iframe');
  await game.getByRole('link', { name: 'Start', exact: true }).click();
  const read = page.getByRole('button', { name: 'Cabinet: A: Space Read', exact: true });
  await expect(page.locator('.cabinet-control')).toHaveCount(4);
  await expect(page.getByRole('button', { name: /^Cabinet: Move/ })).toHaveCount(0);
  await expect(read).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(read).toHaveCSS('color', 'rgba(0, 0, 0, 0)');
  await expect(game.locator('.dialogueBox')).toContainText(isMobile ? 'Joystick: move' : 'Move: WASD');
  await expect(page.locator('.cabinet-control')).toHaveText(['', '', '', '']);
  await expect(game.locator('.gameControls')).toBeHidden();
  await read.hover();
  await page.mouse.down();
  await expect(read).toHaveAttribute('data-pressed', '');
  await expect(read).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await page.mouse.up();
  await expect(read).not.toHaveAttribute('data-pressed');
  expect((await screen.boundingBox()).width / originalWidth).toBeGreaterThan(0.99);
  expect((await screen.boundingBox()).width / originalWidth).toBeLessThan(1.02);
  await page.screenshot({ path: testInfo.outputPath('original-gameplay.png') });
});

test('joystick moves in four directions, Q reconnects, and Space and E retain their actions', { tag: '@webgl' }, async ({ page, context, isMobile }) => {
  await context.route('https://www.linkedin.com/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Cabinet project fixture</title>' }));
  const game = await startGame(page);
  await expect(game.locator('.gameControls')).toBeHidden();
  const gesture = await grabJoystick(page, isMobile);
  await expect(game.locator('.character')).toHaveAttribute('walking', 'false');
  for (const [direction, dx, dy] of [['up', 0, -30], ['right', 30, 0], ['down', 0, 30], ['left', -30, 0]]) {
    await gesture.move(dx, dy);
    await expect(game.locator('.character')).toHaveAttribute('facing', direction);
    await expect(game.locator('.character')).toHaveAttribute('walking', 'true');
  }
  await gesture.move(0, 0);
  await expect(game.locator('.character')).toHaveAttribute('walking', 'false');
  await gesture.move(-150, 0);
  await expect(game.locator('.character')).toHaveAttribute('walking', 'true');
  await gesture.release();
  await expect(game.locator('.character')).toHaveAttribute('walking', 'false');
  await page.getByRole('button', { name: 'Cabinet: Exit: Q Menu', exact: true }).click();
  await expect(game.getByRole('link', { name: 'Start', exact: true })).toBeVisible();
  await expect(page.locator('.cabinet-control')).toHaveCount(0);
  await game.getByRole('link', { name: 'Start', exact: true }).click();
  await expect(page.locator('.cabinet-control')).toHaveCount(4);
  const left = await grabJoystick(page, isMobile);
  await left.move(-30, 0);
  await expect.poll(async () => (await position(game)).x, { intervals: [16] }).toBeLessThanOrEqual(isMobile ? 24 : 40);
  await left.release();
  await page.getByRole('button', { name: 'Cabinet: A: Space Read', exact: true }).click();
  await expect(game.locator('.dialogueBox')).toContainText('mirror');
  if (isMobile) {
    await page.evaluate(() => { window.open = () => { throw new Error('Popups unavailable'); }; });
    await page.getByRole('button', { name: 'Cabinet: B: E Open', exact: true }).tap();
    await expect(page).toHaveURL(/linkedin\.com/);
    await expect(page).toHaveTitle('Cabinet project fixture');
  } else {
    const popup = page.waitForEvent('popup');
    await page.getByRole('button', { name: 'Cabinet: B: E Open', exact: true }).click();
    const project = await popup;
    await expect(project).toHaveTitle('Cabinet project fixture');
    await project.close();
  }
});

test('a second finger can press Space without releasing the joystick; cancellation stops movement', { tag: '@webgl' }, async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Native multitouch regression.');
  const game = await startGame(page);
  const session = await page.context().newCDPSession(page);
  const bounds = await page.getByRole('button', { name: 'Cabinet: Joystick: drag to move', exact: true }).boundingBox();
  const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2, id: 1 };
  const send = (type, touchPoints) => session.send('Input.dispatchTouchEvent', { type, touchPoints });
  const held = { ...center, y: center.y + 30 };
  await send('touchStart', [center]);
  await send('touchMove', [held]);
  await expect(game.locator('.character')).toHaveAttribute('walking', 'true');
  const read = await page.getByRole('button', { name: 'Cabinet: A: Space Read', exact: true }).boundingBox();
  const second = { x: read.x + read.width / 2, y: read.y + read.height / 2, id: 2 };
  await send('touchStart', [held, second]);
  await send('touchMove', [held]);
  await expect(game.locator('.character')).toHaveAttribute('walking', 'true');
  await send('touchMove', [center]);
  await expect(game.locator('.character')).toHaveAttribute('walking', 'false');
  await send('touchMove', [held]);
  await expect(game.locator('.character')).toHaveAttribute('walking', 'true');
  await send('touchCancel', []);
  await expect(game.locator('.character')).toHaveAttribute('walking', 'false');
  await session.detach();
});

test('keyboard movement survives joystick release and action buttons support keyboard activation', { tag: '@webgl' }, async ({ page, isMobile }) => {
  const game = await startGame(page);
  await game.locator('.camera').click({ position: { x: 10, y: 10 } });
  await page.keyboard.down('ArrowDown');
  const gesture = await grabJoystick(page, isMobile);
  await gesture.move(0, 30);
  await gesture.release();
  await expect(game.locator('.character')).toHaveAttribute('walking', 'true');
  await page.keyboard.up('ArrowDown');
  await expect(game.locator('.character')).toHaveAttribute('walking', 'false');
  const menu = page.getByRole('button', { name: 'Cabinet: Exit: Q Menu', exact: true });
  await menu.focus();
  await page.keyboard.press('Enter');
  await expect(game.getByRole('link', { name: 'Start', exact: true })).toBeVisible();
});

test('three action buttons form a visible row beside the joystick on desktop and mobile', { tag: '@webgl' }, async ({ page, isMobile }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const game = await startGame(page);
  for (const viewport of isMobile
    ? [{ width: 412, height: 915 }, { width: 320, height: 568 }, { width: 915, height: 412 }, { width: 768, height: 1024 }]
    : [{ width: 1280, height: 720 }]) {
    await page.setViewportSize(viewport);
    await expect(async () => {
      const targets = await page.locator('.cabinet-control').evaluateAll(elements => elements.map(element => {
        const rect = element.getBoundingClientRect();
        return { action: element.dataset.action, x: rect.x, y: rect.y, width: rect.width, height: rect.height,
          reachable: element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)) };
      }));
      expect(targets).toHaveLength(4);
      expect(targets.slice(0, 3).map(target => target.action)).toEqual(['read', 'open', 'menu']);
      for (const target of targets) {
        expect(target.width).toBeGreaterThanOrEqual(23.99);
        expect(target.height).toBeGreaterThanOrEqual(23.99);
        expect(target.x).toBeGreaterThanOrEqual(0);
        expect(target.y).toBeGreaterThanOrEqual(0);
        expect(target.x + target.width).toBeLessThanOrEqual(viewport.width);
        expect(target.y + target.height).toBeLessThanOrEqual(viewport.height);
        expect(target.reachable).toBe(true);
      }
      for (let i = 0; i < targets.length; i++) for (let j = i + 1; j < targets.length; j++) {
        const a = targets[i], b = targets[j];
        expect(Math.hypot(a.x + a.width / 2 - b.x - b.width / 2, a.y + a.height / 2 - b.y - b.height / 2))
          .toBeGreaterThanOrEqual((a.width + b.width) / 2);
      }
      for (let i = 1; i < 3; i++) {
        expect(targets[i].x).toBeGreaterThan(targets[i - 1].x);
        expect(Math.abs(targets[i].y + targets[i].height / 2 - targets[0].y - targets[0].height / 2)).toBeLessThan(1);
      }
    }).toPass();
    await expect(game.locator('.dialogueBox')).toContainText(isMobile ? 'Joystick: move' : 'Move: WASD');
    if (isMobile) {
      await expect(async () => {
        const fontSize = await game.locator('.dialogueBox').evaluate(element => parseFloat(getComputedStyle(element).fontSize));
        const screenWidth = (await page.locator('iframe').boundingBox()).width;
        expect(fontSize * screenWidth / 624).toBeLessThan(20);
      }).toPass();
    }
    await page.screenshot({ path: testInfo.outputPath('cabinet-' + viewport.width + 'x' + viewport.height + '.png') });
  }
});
