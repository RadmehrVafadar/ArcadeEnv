import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('production portfolio serves the assembled build', async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== 'production-desktop', 'Check the production HTTP server once.');
  for (const file of ['index.html', 'src/portfolio-game/game.html', 'src/blog-website/blog.html']) {
    const response = await request.get(`/portfolio/${file}`);
    expect(response.ok()).toBe(true);
    expect(await response.body()).toEqual(await readFile(new URL(`../dist/portfolio/${file}`, import.meta.url)));
  }
});

test('directional buttons move toward their arrows with mouse or touch', async ({ page, isMobile }, testInfo) => {
  const touch = isMobile ? await page.context().newCDPSession(page) : null;
  for (const [direction, axis, sign] of [['up', 'y', -1], ['down', 'y', 1], ['left', 'x', -1], ['right', 'x', 1]]) {
    await page.goto('/portfolio/src/portfolio-game/game.html');
    const character = page.locator('.character');
    await expect(page.locator('.dialogueBox')).toContainText('Welcome');
    if (!isMobile) {
      // Desktop retains its original welcome overlay and layout.
      await page.keyboard.down('s');
      await expect(page.locator('.dialogueBox')).toBeHidden();
      await page.keyboard.up('s');
    }
    const position = () => character.evaluate((element, axis) => {
      const transform = new DOMMatrixReadOnly(getComputedStyle(element).transform);
      return axis === 'x' ? transform.m41 : transform.m42;
    }, axis);
    const initial = await position();
    const button = page.locator(`.dpad-${direction}`);
    if (isMobile) {
      const bounds = await button.boundingBox();
      await touch.send('Input.dispatchTouchEvent', {
        type: 'touchStart', touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }],
      });
    } else {
      await button.hover();
      await page.mouse.down();
    }
    try {
      await expect.poll(async () => ((await position()) - initial) * sign).toBeGreaterThan(0);
      await expect(character).toHaveAttribute('facing', direction);
      await expect(button).toHaveClass(/pressed/);
    } finally {
      if (isMobile) await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      else await page.mouse.up();
    }
    await expect(character).toHaveAttribute('walking', 'false');
  }
  await page.screenshot({ path: testInfo.outputPath('directional-controls.png') });
});

test('game supports WASD movement and stops on key release', async ({ page }) => {
  const position = () => page.locator('.character').evaluate(element => {
    const transform = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return { x: transform.m41, y: transform.m42 };
  });
  for (const [key, axis, sign] of [['w', 'y', -1], ['a', 'x', -1], ['s', 'y', 1], ['d', 'x', 1]]) {
    await page.goto('/portfolio/src/portfolio-game/game.html');
    const character = page.locator('.character');
    await expect(character).toBeVisible();
    await expect(page.locator('.dialogueBox')).toContainText('WASD');
    const initial = (await position())[axis];
    await page.keyboard.down(key);
    try {
      await expect.poll(async () => ((await position())[axis] - initial) * sign).toBeGreaterThan(0);
    } finally {
      await page.keyboard.up(key);
    }
    await expect(character).toHaveAttribute('walking', 'false');
    const stopped = await position();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    expect(await position()).toEqual(stopped);
  }
});

test('portfolio menu buttons have no underlines', async ({ page, isMobile }, testInfo) => {
  await page.goto('/portfolio/');
  await page.screenshot({ path: testInfo.outputPath('portfolio-menu.png') });
  for (const name of ['Start', 'Blog', 'Resume']) {
    const link = page.getByRole('link', { name, exact: true });
    await expect(link).toHaveCSS('text-decoration-line', 'none');
    await link.focus();
    await expect(link).toBeFocused();
    await expect(link).toHaveCSS('text-decoration-line', 'none');
    if (!isMobile) {
      await link.hover();
      await expect(link).toHaveCSS('text-decoration-line', 'none');
    }
  }
});

test('portfolio entry navigates, loads the game, exits, and opens the resume', { tag: '@webgl' }, async ({ page, context, request, isMobile }, testInfo) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  const screen = page.locator('iframe');
  if (!isMobile) await expect(screen).toBeVisible({ timeout: 30000 });
  const portfolio = isMobile ? page : page.frameLocator('iframe');
  const start = portfolio.getByRole('link', { name: 'Start', exact: true });
  await expect(start).toHaveAttribute('href', '/portfolio/src/portfolio-game/game.html');
  const frame = isMobile ? page.mainFrame() : page.frames().find(frame => new URL(frame.url()).pathname === '/portfolio/');
  if (!isMobile) {
    const initialWidth = (await screen.boundingBox()).width;
    const viewport = page.viewportSize();
    await page.mouse.move(viewport.width / 2, viewport.height * 0.82);
    await expect.poll(async () => (await screen.boundingBox()).width, { timeout: 15000 }).toBeGreaterThan(initialWidth * 1.5);
  }
  await start.click();
  await expect(portfolio.locator('.character')).toBeVisible();
  await expect(portfolio.locator('.dialogueBox')).toContainText('Welcome');
  await page.screenshot({ path: testInfo.outputPath('embedded-game.png') });
  // Exercise the real keyboard handler and game loop inside the iframe.
  await page.keyboard.down('ArrowUp');
  await expect(portfolio.locator('.actionPrompt')).toContainText('exit', { timeout: 10000 });
  await page.keyboard.up('ArrowUp');
  await page.keyboard.press('e');
  await expect(start).toBeVisible();
  expect(frame.url()).toMatch(/\/portfolio\/$/);
  expect(new URL(page.url()).pathname).toBe(isMobile ? '/portfolio/' : '/');
  await portfolio.getByRole('link', { name: 'Blog', exact: true }).click();
  await expect(portfolio.getByRole('heading', { name: "rad's blog" })).toBeVisible();
  expect(frame.url()).toMatch(/\/portfolio\/src\/blog-website\/blog.html$/);
  expect(context.pages()).toHaveLength(1);
  expect(new URL(page.url()).pathname).toBe(isMobile ? '/portfolio/src/blog-website/blog.html' : '/');
  if (isMobile) {
    // A top-level navigation can destroy an evaluate call's execution context.
    await page.goBack();
  } else {
    // Iframe history does not trigger the top-level load event goBack waits for.
    await page.evaluate(() => history.back());
  }
  await expect(start).toBeVisible();
  expect(frame.url()).toMatch(/\/portfolio\/$/);
  expect(new URL(page.url()).pathname).toBe(isMobile ? '/portfolio/' : '/');
  const resume = portfolio.getByRole('link', { name: 'Resume', exact: true });
  await expect(resume).toHaveAttribute('href', '/portfolio/RVafadar_Resume.pdf');
  await expect(resume).toHaveAttribute('target', '_blank');
  await expect(resume).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(resume).toHaveAccessibleDescription('Opens in a new tab');
  const resumeResponse = context.waitForEvent('response', response => response.url().endsWith('/portfolio/RVafadar_Resume.pdf'));
  await resume.click();
  await resumeResponse;
  // Headless Chromium can download PDFs instead of opening a viewer tab.
  for (const opened of context.pages()) {
    if (opened !== page) await opened.close();
  }
  await expect(start).toBeVisible();
  expect(frame.url()).toMatch(/\/portfolio\/$/);
  expect(new URL(page.url()).pathname).toBe(isMobile ? '/portfolio/' : '/');
  await portfolio.locator('.sphear').click();
  const background = await portfolio.locator('.app-container').getAttribute('class');
  await portfolio.locator('.sphear').click();
  await expect(portfolio.locator('.app-container')).not.toHaveAttribute('class', background);
  const pdf = await request.get('/portfolio/RVafadar_Resume.pdf');
  expect(pdf.headers()['content-type']).toContain('application/pdf');
  expect(await pdf.body()).toEqual(await readFile(new URL('../apps/portfolio/public/RVafadar_Resume.pdf', import.meta.url)));
  await page.screenshot({ path: testInfo.outputPath('embedded-portfolio.png') });
  expect(errors).toEqual([]);
});
