import { test, expect } from '@playwright/test';

test('arcade loading screen covers deferred scene and model loading @webgl', async ({ page, isMobile }, testInfo) => {
  test.skip(isMobile, 'Mobile redirects straight to the portfolio.');
  test.setTimeout(60000);
  let releaseScene;
  let releaseModel;
  let releasePortfolio;
  const sceneHeld = new Promise(resolve => { releaseScene = resolve; });
  const modelHeld = new Promise(resolve => { releaseModel = resolve; });
  const portfolioHeld = new Promise(resolve => { releasePortfolio = resolve; });
  await page.route(/\/(?:src\/scene\.jsx|assets\/scene-[^/]+\.js)(?:\?.*)?$/, async route => {
    await sceneHeld;
    await route.continue();
  });
  await page.route('**/model9.glb', async route => {
    await modelHeld;
    await route.continue();
  });
  await page.route('**/portfolio/', async route => {
    await portfolioHeld;
    await route.continue();
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loading = page.getByRole('status');
    await expect(loading).toContainText('Loading arcade');
    await expect(loading).toBeVisible();
    await expect(page.locator('.loading-dots')).toHaveCSS('animation-name', 'none');
    await expect(page.getByRole('link', { name: 'Open portfolio' })).toHaveAttribute('href', '/portfolio/');
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: testInfo.outputPath('arcade-loading.png') });
    releaseScene();
    await expect(page.locator('canvas')).toBeVisible();
    await expect(loading).toBeVisible();
    releaseModel();
    await expect(page.locator('iframe')).toBeAttached({ timeout: 30000 });
    await expect(loading).toBeVisible();
    expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2)
      .closest('#arcade-loading') !== null)).toBe(true);
    releasePortfolio();
    await expect(loading).toHaveCount(0, { timeout: 30000 });
    await expect(page.frameLocator('iframe').getByRole('link', { name: 'Start', exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('arcade-ready.png') });
  } finally {
    releaseScene();
    releaseModel();
    releasePortfolio();
    await page.unrouteAll({ behavior: 'wait' });
  }
});

test('mobile opens the portfolio without loading the arcade', async ({ page, isMobile }, testInfo) => {
  test.skip(!isMobile, 'Mobile redirect only.');
  const sceneRequests = [];
  page.on('request', request => {
    if (/model9\.glb|\/src\/scene\.jsx|\/assets\/scene-[^/]+\.js/.test(request.url())) sceneRequests.push(request.url());
  });
  await page.goto('/');
  await expect(page).toHaveURL(/\/portfolio\/$/);
  await expect(page.getByRole('link', { name: 'Start', exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toHaveCount(0);
  expect(sceneRequests).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('mobile-portfolio.png') });
});
