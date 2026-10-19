import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('embedded portfolio navigates, loads the game, exits, and downloads the resume', async ({ page, context, request, isMobile }, testInfo) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  const screen = page.locator('iframe');
  await expect(screen).toBeVisible({ timeout: 30000 });
  const portfolio = page.frameLocator('iframe');
  const start = portfolio.getByRole('link', { name: 'Start', exact: true });
  await expect(start).toHaveAttribute('href', '/portfolio/src/portfolio-game/game.html');
  const frame = page.frames().find(frame => new URL(frame.url()).pathname === '/portfolio/');
  const initialWidth = (await screen.boundingBox()).width;
  const viewport = page.viewportSize();
  if (isMobile) {
    await page.touchscreen.tap(viewport.width * 0.1, viewport.height * 0.9);
  } else {
    await page.mouse.move(viewport.width / 2, viewport.height * 0.82);
  }
  await expect.poll(async () => (await screen.boundingBox()).width, { timeout: 15000 }).toBeGreaterThan(initialWidth * 1.5);
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
  expect(new URL(page.url()).pathname).toBe('/');
  await portfolio.getByRole('link', { name: 'Blog', exact: true }).click();
  await expect.poll(() => frame.url()).toMatch(/\/portfolio\/src\/blog-website\/blog.html$/);
  await frame.goto(new URL('/portfolio/', page.url()).href);
  const resume = portfolio.getByRole('link', { name: 'Resume', exact: true });
  await expect(resume).toHaveAttribute('href', '/portfolio/RVafadar_Resume.pdf');
  const downloadPromise = new Promise(resolve => {
    page.once('download', resolve);
    context.once('page', popup => popup.once('download', resolve));
  });
  await resume.click();
  const download = await downloadPromise;
  expect(download.url()).toContain('/portfolio/RVafadar_Resume.pdf');
  expect(await readFile(await download.path())).toEqual(await readFile(new URL('../apps/portfolio/public/RVafadar_Resume.pdf', import.meta.url)));
  const pdf = await request.get('/portfolio/RVafadar_Resume.pdf');
  expect(pdf.headers()['content-type']).toContain('application/pdf');
  expect(await pdf.body()).toEqual(await readFile(new URL('../apps/portfolio/public/RVafadar_Resume.pdf', import.meta.url)));
  await page.screenshot({ path: testInfo.outputPath('embedded-portfolio.png') });
  expect(errors).toEqual([]);
});
