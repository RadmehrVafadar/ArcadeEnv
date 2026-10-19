import { test, expect } from '@playwright/test';

test('retains an explicit external iframe override', async ({ page }) => {
  await page.route('https://external-portfolio.test/**', route => route.fulfill({
    contentType: 'text/html', body: '<h1>External portfolio</h1>',
  }));
  await page.goto('/');
  await expect(page.locator('iframe')).toHaveAttribute('src', 'https://external-portfolio.test/', { timeout: 30000 });
  await expect(page.frameLocator('iframe').getByRole('heading')).toHaveText('External portfolio');
});
