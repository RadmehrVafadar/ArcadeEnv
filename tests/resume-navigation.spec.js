import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('resume preserves the portfolio menu and its state', async ({ page, context, request }, testInfo) => {
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
