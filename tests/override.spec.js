import { test, expect } from '@playwright/test';

test('retains an explicit external iframe override', { tag: '@webgl' }, async ({ page }) => {
  test.setTimeout(60000);
  await page.route('https://external-portfolio.test/**', route => route.fulfill({
    contentType: 'text/html', body: '<h1>External portfolio</h1>',
  }));
  await page.goto('/');
  await expect(page.locator('iframe')).toHaveAttribute('src', 'https://external-portfolio.test/', { timeout: 30000 });
  await expect(page.frameLocator('iframe').getByRole('heading')).toHaveText('External portfolio');
});

test('mobile entry retains the explicit external portfolio override', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36',
    isMobile: true,
    hasTouch: true,
    viewport: { width: 393, height: 851 },
  });
  try {
    const requests = [];
    const page = await context.newPage();
    page.on('request', request => requests.push(request.url()));
    await page.route('https://external-portfolio.test/**', route => route.fulfill({
      contentType: 'text/html', body: '<h1>External portfolio</h1>',
    }));
    await page.goto('/');
    await expect(page).toHaveURL('https://external-portfolio.test/');
    await expect(page.getByRole('heading')).toHaveText('External portfolio');
    expect(requests.filter(url => /scene[.-]|model9\.glb|cube\.png|three|drei|fiber/i.test(url))).toEqual([]);
  } finally {
    await context.close();
  }
});
