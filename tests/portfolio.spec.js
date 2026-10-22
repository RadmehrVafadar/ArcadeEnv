import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { player, position, ready } from './game-helpers.js';

test('game startup instructions fit and disappear on movement', async ({ page }, testInfo) => {
  await page.goto('/portfolio/src/portfolio-game/game.html');
  await ready(page);
  const dialogue = page.locator('.dialogueBox');
  await expect(dialogue).toContainText('Move: WASD');
  await expect(dialogue).toContainText('Exit: Q');
  const bounds = await dialogue.boundingBox();
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(page.viewportSize().height);
  await page.screenshot({ path: testInfo.outputPath('game-startup-instructions.png') });
  await page.keyboard.down('s');
  await expect(dialogue).toBeHidden();
  await page.keyboard.up('s');
});

test('production portfolio serves the assembled build', async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== 'production-desktop', 'Check the production HTTP server once.');
  for (const file of ['index.html', 'src/portfolio-game/game.html', 'src/blog-website/blog.html']) {
    const response = await request.get(`/portfolio/${file}`);
    expect(response.ok()).toBe(true);
    expect(await response.body()).toEqual(await readFile(new URL(`../dist/portfolio/${file}`, import.meta.url)));
  }
});

test('mobile directional buttons move toward their arrows', async ({ page, isMobile }, testInfo) => {
  test.skip(!isMobile, 'Directional buttons are exclusive to mobile.');
  const touch = isMobile ? await page.context().newCDPSession(page) : null;
  for (const [direction, axis, sign] of [['up', 'y', -1], ['down', 'y', 1], ['left', 'x', -1], ['right', 'x', 1]]) {
    await page.goto('/portfolio/src/portfolio-game/game.html');
    const character = player(page);
    await expect(page.locator('.dialogueBox')).toContainText(isMobile ? 'Welcome' : 'Move: WASD');
    if (!isMobile) {
      // Dismiss the desktop instructions before clicking the D-pad.
      await page.keyboard.down('s');
      await expect(page.locator('.dialogueBox')).toBeHidden();
      await page.keyboard.up('s');
    }
    const readAxis = async () => (await position(page))[axis];
    const initial = await readAxis();
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
      await expect.poll(async () => ((await readAxis()) - initial) * sign).toBeGreaterThan(0);
      await expect(character).toHaveAttribute('data-facing', direction);
      await expect(button).toHaveClass(/pressed/);
    } finally {
      if (isMobile) await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      else await page.mouse.up();
    }
    await expect(character).toHaveAttribute('data-walking', 'false');
  }
  await page.screenshot({ path: testInfo.outputPath('directional-controls.png') });
});

test('game supports WASD movement and stops on key release', async ({ page }) => {
  for (const [key, axis, sign] of [['w', 'y', -1], ['a', 'x', -1], ['s', 'y', 1], ['d', 'x', 1]]) {
    await page.goto('/portfolio/src/portfolio-game/game.html');
    const character = player(page);
    await expect(character).toBeVisible();
    await expect(page.locator('.dialogueBox')).toContainText('WASD');
    const initial = (await position(page))[axis];
    await page.keyboard.down(key);
    try {
      await expect.poll(async () => ((await position(page))[axis] - initial) * sign).toBeGreaterThan(0);
    } finally {
      await page.keyboard.up(key);
    }
    await expect(character).toHaveAttribute('data-walking', 'false');
    const stopped = await position(page);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    expect(await position(page)).toEqual(stopped);
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

test('portfolio entry navigates, loads the game, exits, and opens the resume', { tag: ['@webgl', '@smoke'] }, async ({ page, context, request, isMobile }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  const screen = page.locator('iframe');
  await expect(screen).toBeVisible({ timeout: 30000 });
  await expect(page.locator('#arcade-loading')).toHaveCount(0, { timeout: 30000 });
  const portfolio = page.frameLocator('iframe');
  const start = portfolio.getByRole('link', { name: 'Start', exact: true });
  await expect(start).toHaveAttribute('href', '/portfolio/src/portfolio-game/game.html');
  const frame = page.frames().find(frame => new URL(frame.url()).pathname === '/portfolio/');
  const initialWidth = (await screen.boundingBox()).width;
  if (!isMobile) {
    const viewport = page.viewportSize();
    await page.mouse.move(viewport.width / 2, viewport.height * 0.82);
  }
  const zoomedWidth = isMobile ? page.viewportSize().width : initialWidth * 1.5;
  await expect.poll(async () => (await screen.boundingBox()).width, { timeout: 15000 }).toBeGreaterThan(zoomedWidth);
  await start.click();
  await expect(player(portfolio)).toBeVisible({ timeout: 15000 });
  await expect(portfolio.locator('.dialogueBox')).toContainText(isMobile ? 'Welcome' : 'Move: WASD');
  if (!isMobile) {
    await test.step('Q exits only the cabinet iframe from spawn', async () => {
      await page.keyboard.press('q');
      await expect(start).toBeVisible();
      expect(new URL(page.url()).pathname).toBe('/');
      expect(frame.url()).toMatch(/\/portfolio\/$/);
      await start.click();
      await expect(player(portfolio)).toBeVisible({ timeout: 15000 });
    });
  }
  await expect(portfolio.locator('.dialogueBox')).toContainText(isMobile ? 'Welcome' : 'Move: WASD');
  // Exercise the real keyboard handler and game loop inside the iframe.
  await page.keyboard.down('ArrowUp');
  await expect(portfolio.locator('.actionPrompt')).toContainText('exit', { timeout: 10000 });
  await page.keyboard.up('ArrowUp');
  await page.keyboard.press('e');
  await expect(start).toBeVisible();
  expect(frame.url()).toMatch(/\/portfolio\/$/);
  expect(new URL(page.url()).pathname).toBe('/');
  await portfolio.getByRole('link', { name: 'Blog', exact: true }).click();
  await expect(portfolio.getByRole('heading', { name: "rad's blog" })).toBeVisible();
  expect(frame.url()).toMatch(/\/portfolio\/src\/blog-website\/blog.html$/);
  expect(context.pages()).toHaveLength(1);
  expect(new URL(page.url()).pathname).toBe('/');
  // Iframe history does not trigger the top-level load event goBack waits for.
  await page.evaluate(() => history.back());
  await expect(start).toBeVisible();
  expect(frame.url()).toMatch(/\/portfolio\/$/);
  expect(new URL(page.url()).pathname).toBe('/');
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
  expect(new URL(page.url()).pathname).toBe('/');
  await portfolio.locator('.sphear').click();
  const background = await portfolio.locator('.app-container').getAttribute('class');
  await portfolio.locator('.sphear').click();
  await expect(portfolio.locator('.app-container')).not.toHaveAttribute('class', background);
  const pdf = await request.get('/portfolio/RVafadar_Resume.pdf');
  expect(pdf.headers()['content-type']).toContain('application/pdf');
  expect(await pdf.body()).toEqual(await readFile(new URL('../apps/portfolio/public/RVafadar_Resume.pdf', import.meta.url)));
  expect(errors).toEqual([]);
});
