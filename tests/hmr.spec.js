import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

test('portfolio hot reload passes through the arcade proxy', async ({ page }) => {
  const stylesheet = new URL('../apps/portfolio/src/menu.css', import.meta.url);
  const original = await readFile(stylesheet);
  const connected = new Promise(resolve => page.on('websocket', socket => {
    if (new URL(socket.url()).pathname === '/portfolio/__hmr') {
      socket.on('framereceived', event => {
        if (JSON.parse(event.payload).type === 'connected') resolve(socket.url());
      });
    }
  }));
  await page.goto('/portfolio/');
  expect(new URL(await connected).port).toBe('4173');
  await expect(page.getByRole('link', { name: 'Start', exact: true })).toBeVisible();
  try {
    await writeFile(stylesheet, Buffer.concat([original, Buffer.from('\n.container { --workspace-hmr: verified; }\n')]));
    await expect.poll(() => page.locator('.container').evaluate(element => getComputedStyle(element).getPropertyValue('--workspace-hmr').trim())).toBe('verified');
  } finally {
    await writeFile(stylesheet, original);
  }
});
