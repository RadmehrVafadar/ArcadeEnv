import { test, expect } from '@playwright/test';

test.describe.configure({ timeout: 60000 });

async function startGame(page) {
  await page.goto('/');
  await expect(page.locator('#arcade-loading')).toHaveCount(0, { timeout: 30000 });
  if (!await page.evaluate(() => matchMedia('(pointer: coarse)').matches)) {
    await page.getByRole('button', { name: 'PRESS TO PLAY' }).click();
  }
  await page.frameLocator('iframe').getByRole('link', { name: 'Start', exact: true }).click();
  await expect(page.frameLocator('iframe').locator('.frame')).toHaveClass(/cabinet-connected/);
  await expect(page.getByRole('button', { name: 'Cabinet: Joystick: drag to move', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cabinet: Joystick: drag to move', exact: true })).toHaveAttribute('data-input-page', '/portfolio/src/portfolio-game/game.html');
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
  const currentPage = await page.frameLocator('iframe').locator('body').evaluate(() => location.pathname);
  await expect(stick).toHaveAttribute('data-input-page', currentPage);
  await expect(stick).toBeVisible();
  let bounds;
  await expect(async () => {
    await stick.scrollIntoViewIfNeeded();
    bounds = await stick.boundingBox();
    expect(bounds).not.toBeNull();
  }).toPass({ timeout: 5000 });
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

test('cabinet selects menu links, activates with Z, and exits from the blog and game', { tag: '@webgl' }, async ({ page, context, isMobile }, testInfo) => {
  test.setTimeout(90000);
  await page.goto('/');
  await expect(page.locator('#arcade-loading')).toHaveCount(0, { timeout: 30000 });
  await page.getByRole('button', { name: 'PRESS TO PLAY' }).click();
  await expect(page.locator('.neon-play-sign')).toHaveCount(0, { timeout: 15000 });
  await expect(page.locator('.cabinet-control')).toHaveCount(4);
  const frame = page.frameLocator('iframe');
  const selected = () => frame.locator('[data-cabinet-selected]');
  await expect(selected()).toHaveText('Start');
  await expect(selected()).toHaveAccessibleName('Start');
  await page.getByRole('button', { name: 'Cabinet: X Open', exact: true }).click();
  await expect(selected()).toHaveText('Start');
  await expect(frame.locator('body')).toHaveJSProperty('baseURI', new URL('/portfolio/', page.url()).href);
  await page.keyboard.press('x');
  await expect(selected()).toHaveText('Start');
  expect(await selected().evaluate(element => parseFloat(getComputedStyle(element, '::after').width))).toBeGreaterThan(0);
  const gesture = await grabJoystick(page, isMobile);
  await gesture.move(0, 30);
  await expect(selected()).toHaveText('Blog');
  await gesture.move(0, 40);
  await expect(selected()).toHaveText('Blog');
  await gesture.move(0, 0);
  await gesture.move(0, 30);
  await expect(selected()).toHaveText('Resume');
  await gesture.release();
  const resumeResponse = context.waitForEvent('response', response => response.url().endsWith('/portfolio/RVafadar_Resume.pdf'));
  await page.getByRole('button', { name: 'Cabinet: Z Read', exact: true }).click();
  expect((await resumeResponse).ok()).toBe(true);
  // Headless Chromium may download the PDF instead of loading a viewer tab.
  for (const opened of context.pages()) if (opened !== page) await opened.close();
  const next = await grabJoystick(page, isMobile);
  await next.move(0, 30);
  await next.release();
  await expect(selected()).toHaveText('Start');
  await page.getByRole('button', { name: 'Cabinet: Z Read', exact: true }).click();
  await expect(frame.locator('.character')).toBeVisible();
  await page.getByRole('button', { name: 'Cabinet: Start: Q Menu', exact: true }).click();
  await expect(selected()).toHaveText('Start');
  const blog = await grabJoystick(page, isMobile);
  await blog.move(0, 30);
  await expect(selected()).toHaveText('Blog');
  await blog.release();
  for (const viewport of isMobile
    ? [{ width: 320, height: 568 }, { width: 915, height: 412 }, { width: 768, height: 1024 }]
    : [{ width: 1280, height: 720 }]) {
    await page.setViewportSize(viewport);
    await expect(selected()).toHaveText('Blog');
    await expect(async () => {
      const canvas = await page.locator('canvas').boundingBox();
      const screen = await page.locator('iframe').boundingBox();
      expect(Math.abs(canvas.width - viewport.width)).toBeLessThanOrEqual(2);
      expect(Math.abs(canvas.height - viewport.height)).toBeLessThanOrEqual(2);
      expect(Math.abs(screen.x + screen.width / 2 - viewport.width / 2)).toBeLessThan(2);
    }).toPass();
    await page.screenshot({ path: testInfo.outputPath(`cabinet-menu-${viewport.width}x${viewport.height}.png`) });
  }
  await page.getByRole('button', { name: 'Cabinet: Z Read', exact: true }).click();
  await expect(frame.getByRole('heading', { name: "rad's blog", exact: true })).toBeVisible();
  await expect(page.locator('.cabinet-control')).toHaveCount(4);
  await expect(selected()).toHaveText('/tech');
  await page.getByRole('button', { name: 'Cabinet: Z Read', exact: true }).click();
  await expect(frame.getByRole('heading', { name: 'tech', exact: true })).toBeVisible();
  const article = frame.getByRole('link', { name: 'Build. Build. Build.', exact: true });
  await expect(article).toBeFocused();
  await expect(selected()).toHaveText('Build. Build. Build.');
  await page.keyboard.press('Enter');
  await expect(frame.getByRole('heading', { name: 'Build. Build. Build.', exact: true })).toBeVisible();
  const scrollY = () => frame.locator('body').evaluate(() => window.scrollY);
  for (const shortRange of [false, true]) {
    // Also exercise the 95-pixel range seen in CI, without requiring impossible scroll distances.
    const maxScroll = await frame.locator('main').evaluate(async (element, short) => {
      await document.fonts.ready;
      element.style.height = short ? `${innerHeight + 95}px` : '';
      element.style.overflow = short ? 'hidden' : '';
      window.scrollTo(0, 0);
      return document.scrollingElement.scrollHeight - innerHeight;
    }, shortRange);
    testInfo.annotations.push({ type: 'article-scroll-range', description: `${shortRange ? 'short' : 'natural'}: ${maxScroll}` });
    expect(maxScroll).toBeGreaterThan(0);
    const scroll = await grabJoystick(page, isMobile);
    await scroll.move(0, 30);
    // Focus can move between the reader and cabinet while the physical stick stays held.
    await page.getByRole('button', { name: 'Cabinet: Z Read', exact: true }).focus();
    await expect.poll(scrollY).toBeGreaterThan(Math.min(100, maxScroll / 2));
    await scroll.release();
    await frame.locator('body').evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const stopped = await scrollY();
    await page.waitForTimeout(100);
    expect(await scrollY()).toBe(stopped);
    await page.keyboard.down('ArrowUp');
    await expect.poll(scrollY).toBeLessThan(stopped - Math.min(30, stopped / 2));
    await page.keyboard.up('ArrowUp');
    await frame.getByRole('heading', { name: 'Build. Build. Build.', exact: true }).focus();
    const before = await scrollY();
    const distance = Math.min(30, (maxScroll - before) / 2);
    expect(distance).toBeGreaterThan(0);
    await page.keyboard.down('s');
    await expect.poll(scrollY).toBeGreaterThan(before + distance);
    await page.keyboard.up('s');
  }
  await page.getByRole('button', { name: 'Cabinet: X Open', exact: true }).click();
  await expect(article).toBeFocused();
  const parent = await grabJoystick(page, isMobile);
  await parent.move(0, -30);
  await parent.release();
  await expect(frame.getByRole('link', { name: 'Back to blog', exact: true })).toBeFocused();
  expect(await article.evaluate(element => getComputedStyle(element).textDecorationLine)).toBe('none');
  await page.screenshot({ path: testInfo.outputPath('blog-folder-parent-selected.png') });
  await page.keyboard.press('Enter');
  await expect(frame.getByRole('heading', { name: "rad's blog", exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cabinet: Z Read', exact: true }).click();
  await expect(frame.getByRole('heading', { name: 'tech', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cabinet: X Open', exact: true }).click();
  await expect(frame.getByRole('heading', { name: "rad's blog", exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cabinet: X Open', exact: true }).click();
  await expect(selected()).toHaveText('Start');
  await frame.getByRole('link', { name: 'Blog', exact: true }).click();
  await expect(frame.getByRole('heading', { name: "rad's blog", exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cabinet: Start: Q Menu', exact: true }).click();
  await expect(selected()).toHaveText('Start');
});

test('cached mobile history restoration keeps cabinet controls connected', { tag: '@webgl' }, async ({ page, isMobile }, testInfo) => {
  test.skip(!isMobile, 'Mobile history cache lifecycle regression');
  const game = await startGame(page);
  await game.locator('body').evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
  });
  await expect(game.locator('.frame')).toHaveClass(/cabinet-connected/);
  await expect(game.locator('.gameControls')).toHaveCount(0);
  await expect(page.locator('.cabinet-control')).toHaveCount(4);
  const before = await position(game);
  await page.keyboard.down('ArrowRight');
  try {
    await expect.poll(async () => (await position(game)).x).toBeGreaterThan(before.x + 2);
  } finally {
    await page.keyboard.up('ArrowRight');
  }
  await page.screenshot({ path: testInfo.outputPath('restored-cabinet.png') });
});

test('original zoom keeps three invisible working action targets on every device', { tag: '@webgl' }, async ({ page, isMobile }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('#arcade-loading')).toHaveCount(0, { timeout: 30000 });
  await page.getByRole('button', { name: 'PRESS TO PLAY' }).click();
  await expect(page.locator('.neon-play-sign')).toHaveCount(0, { timeout: 15000 });
  const screen = page.locator('iframe');
  const originalWidth = (await screen.boundingBox()).width;
  const game = page.frameLocator('iframe');
  await game.getByRole('link', { name: 'Start', exact: true }).click();
  await expect(game.locator('.frame')).toHaveClass(/cabinet-connected/);
  const read = page.getByRole('button', { name: 'Cabinet: Z Read', exact: true });
  await expect(page.locator('.cabinet-control')).toHaveCount(4);
  await expect(page.getByRole('button', { name: /^Cabinet: Move/ })).toHaveCount(0);
  await expect(read).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(read).toHaveCSS('color', 'rgba(0, 0, 0, 0)');
  await expect(game.locator('.dialogueBox')).toContainText(isMobile ? 'Joystick: move' : 'Move: WASD');
  await expect(page.locator('.cabinet-control')).toHaveText(['', '', '', '']);
  await expect(game.locator('.gameControls')).toHaveCount(0);
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

test('joystick moves in four directions, Q reconnects, and Z and X retain their actions', { tag: '@webgl' }, async ({ page, context, isMobile }) => {
  await context.route('https://www.linkedin.com/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Cabinet project fixture</title>' }));
  const game = await startGame(page);
  await expect(game.locator('.gameControls')).toHaveCount(0);
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
  await page.getByRole('button', { name: 'Cabinet: Start: Q Menu', exact: true }).click();
  await expect(game.getByRole('link', { name: 'Start', exact: true })).toBeVisible();
  await expect(page.locator('.cabinet-control')).toHaveCount(4);
  await game.getByRole('link', { name: 'Start', exact: true }).click();
  await expect(page.locator('.cabinet-control')).toHaveCount(4);
  await expect(page.getByRole('button', { name: 'Cabinet: Joystick: drag to move', exact: true })).toHaveAttribute('data-input-page', '/portfolio/src/portfolio-game/game.html');
  const left = await grabJoystick(page, isMobile);
  await left.move(-30, 0);
  await expect.poll(async () => (await position(game)).x, { intervals: [16] }).toBeLessThanOrEqual(isMobile ? 24 : 40);
  await left.release();
  await page.getByRole('button', { name: 'Cabinet: Z Read', exact: true }).click();
  await expect(game.locator('.dialogueBox')).toContainText('mirror');
  if (isMobile) {
    await page.evaluate(() => { window.open = () => { throw new Error('Popups unavailable'); }; });
    await page.getByRole('button', { name: 'Cabinet: X Open', exact: true }).tap();
    await expect(page).toHaveURL(/linkedin\.com/);
    await expect(page).toHaveTitle('Cabinet project fixture');
  } else {
    const popup = page.waitForEvent('popup');
    await page.getByRole('button', { name: 'Cabinet: X Open', exact: true }).click();
    const project = await popup;
    await expect(project).toHaveTitle('Cabinet project fixture');
    await project.close();
  }
});

test('a second finger can press Z without releasing the joystick; cancellation stops movement', { tag: '@webgl' }, async ({ page, isMobile }) => {
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
  const read = await page.getByRole('button', { name: 'Cabinet: Z Read', exact: true }).boundingBox();
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
  const menu = page.getByRole('button', { name: 'Cabinet: Start: Q Menu', exact: true });
  await menu.focus();
  await page.keyboard.press('Enter');
  await expect(game.getByRole('link', { name: 'Start', exact: true })).toBeVisible();
});

test('keyboard Z/X depress buttons and arrows/WASD tilt the physical joystick', { tag: '@webgl' }, async ({ page, isMobile }, testInfo) => {
  test.skip(isMobile, 'Physical keyboard feedback.');
  const game = await startGame(page);
  await game.locator('.camera').click({ position: { x: 10, y: 10 } });
  const stick = page.getByRole('button', { name: 'Cabinet: Joystick: drag to move', exact: true });
  // Check actions at spawn, before movement can bring the player to the exit.
  for (const [key, label] of [['z', 'Z Read'], ['x', 'X Open']]) {
    const button = page.getByRole('button', { name: 'Cabinet: ' + label, exact: true });
    await page.keyboard.down(key);
    await expect(button).toHaveAttribute('data-pressed');
    await page.screenshot({ path: testInfo.outputPath(`keyboard-${key}.png`) });
    await page.keyboard.up(key);
    await expect(button).not.toHaveAttribute('data-pressed');
  }
  for (const [key, direction] of [['ArrowUp', 'up'], ['ArrowDown', 'down'], ['ArrowLeft', 'left'], ['ArrowRight', 'right'], ['w', 'up'], ['a', 'left'], ['s', 'down'], ['d', 'right']]) {
    await page.keyboard.down(key);
    await expect(stick).toHaveAttribute('data-direction', direction);
    await expect(game.locator('.character')).toHaveAttribute('walking', 'true');
    await page.keyboard.up(key);
    await expect(stick).toHaveAttribute('data-direction', '');
  }
  await page.keyboard.down('s');
  await page.keyboard.down('ArrowDown');
  await page.keyboard.up('s');
  await expect(stick).toHaveAttribute('data-direction', 'down');
  await page.screenshot({ path: testInfo.outputPath('keyboard-stick.png') });
  await page.keyboard.up('ArrowDown');
  await stick.focus();
  await page.keyboard.down('ArrowDown');
  await expect(stick).toHaveAttribute('data-direction', 'down');
  await page.keyboard.up('ArrowDown');
  await expect(stick).toHaveAttribute('data-direction', '');
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
