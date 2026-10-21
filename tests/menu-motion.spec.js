import { test, expect } from '@playwright/test';

test('menu labels bop three pixels while link targets stay still', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/portfolio/');
  for (const name of ['Start', 'Blog', 'Resume']) {
    const link = page.getByRole('link', { name, exact: true });
    const label = link.locator('span');
    await expect(label).toBeVisible();
    await expect.poll(() => label.evaluate(element => element.getAnimations().length)).toBe(1);
    const positions = await label.evaluate(element => {
      const animation = element.getAnimations()[0];
      animation.pause();
      return [0, 300, 600].map(time => {
        animation.currentTime = time;
        const bounds = element.parentElement.getBoundingClientRect();
        return {
          y: new DOMMatrixReadOnly(getComputedStyle(element).transform).m42,
          link: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
        };
      });
    });
    expect(positions.map(position => position.y)).toEqual([0, -3, 0]);
    expect(positions[1].link).toEqual(positions[0].link);
    expect(positions[2].link).toEqual(positions[0].link);
    await link.focus();
    await expect(link).toBeFocused();
  }
  await page.screenshot({ path: testInfo.outputPath('menu-bop-rest.png') });
  for (const label of await page.locator('.button span').all()) {
    await label.evaluate(element => { element.getAnimations()[0].currentTime = 300; });
  }
  await page.screenshot({ path: testInfo.outputPath('menu-bop-raised.png') });
});

test('menu labels stay still with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/portfolio/');
  for (const name of ['Start', 'Blog', 'Resume']) {
    const label = page.getByRole('link', { name, exact: true }).locator('span');
    await expect(label).toBeVisible();
    await expect(label).toHaveCSS('animation-name', 'none');
    expect(await label.evaluate(element => element.getAnimations().length)).toBe(0);
  }
});
