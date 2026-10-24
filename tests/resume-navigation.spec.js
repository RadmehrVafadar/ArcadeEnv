import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('mobile resume escapes the cabinet when an in-app browser blocks popups', async ({ page, context, isMobile }) => {
  test.skip(!isMobile, 'Mobile uses the current browser instead of a new tab');
  await page.route('**/embedded-resume-test', route => route.fulfill({
    contentType: 'text/html',
    body: '<iframe title="Portfolio" sandbox="allow-scripts allow-same-origin allow-top-navigation-by-user-activation" src="/portfolio/" style="position:fixed;inset:0;width:100%;height:100%;border:0"></iframe>',
  }));
  // Serve HTML at the PDF URL so navigation is observable without a native PDF viewer.
  await page.route('**/RVafadar_Resume.pdf', route => route.fulfill({
    contentType: 'text/html', body: '<h1>Resume preview</h1>',
  }));
  await page.goto('/embedded-resume-test');
  await page.frameLocator('iframe').getByRole('link', { name: 'Resume', exact: true }).tap();
  await expect(page).toHaveURL(/\/portfolio\/RVafadar_Resume\.pdf$/);
  await expect(page.getByRole('heading', { name: 'Resume preview' })).toBeVisible();
  expect(context.pages()).toHaveLength(1);
});

test('desktop resume preserves the portfolio menu and its state', async ({ page, context, request, isMobile }, testInfo) => {
  test.skip(isMobile, 'Mobile opens the PDF in the current browser');
  await page.goto('/portfolio/');
  const resume = page.getByRole('link', { name: 'Resume', exact: true });
  await expect(resume).toHaveAttribute('target', '_blank');
  await expect(resume).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(resume).toHaveAccessibleDescription('Opens in a new tab');
  await page.locator('.sphear').click();
  const background = await page.locator('.app-container').getAttribute('class');
  const originalURL = page.url();
  const pdfResponse = context.waitForEvent('response', response => response.url().endsWith('/portfolio/RVafadar_Resume.pdf'));
  await resume.click();
  // Chromium may download PDFs instead of displaying a viewer, depending on the platform.
  await pdfResponse;
  for (const opened of context.pages()) {
    if (opened !== page) await opened.close();
  }
  await expect(page).toHaveURL(originalURL);
  await expect(page.locator('.app-container')).toHaveAttribute('class', background);
  await expect(page.getByRole('link', { name: 'Start', exact: true })).toBeVisible();
  await page.locator('.sphear').click();
  await expect(page.locator('.app-container')).not.toHaveAttribute('class', background);
  const pdf = await request.get('/portfolio/RVafadar_Resume.pdf');
  expect(pdf.headers()['content-type']).toContain('application/pdf');
  expect(await pdf.body()).toEqual(await readFile(new URL('../apps/portfolio/public/RVafadar_Resume.pdf', import.meta.url)));
  await page.screenshot({ path: testInfo.outputPath('resume-return-menu.png') });
});
