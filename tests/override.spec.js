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

test('mobile entry retains the explicit external portfolio override @webgl', async ({ browser, baseURL }) => {
  test.setTimeout(60000);
  const context = await browser.newContext({
    baseURL,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36',
    isMobile: true,
    hasTouch: true,
    viewport: { width: 393, height: 851 },
  });
  try {
    const page = await context.newPage();
    await page.route('https://external-portfolio.test/**', route => route.fulfill({
      contentType: 'text/html', body: '<h1>External portfolio</h1>',
    }));
    await page.goto('/');
    await expect(page.locator('iframe')).toHaveAttribute('src', 'https://external-portfolio.test/', { timeout: 30000 });
    await expect(page.frameLocator('iframe').getByRole('heading')).toHaveText('External portfolio');
    expect(new URL(page.url()).pathname).toBe('/');
  } finally {
    await context.close();
  }
});
