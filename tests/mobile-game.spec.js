import { test, expect } from '@playwright/test';

const gamePath = '/portfolio/src/portfolio-game/game.html';

async function position(page) {
  return page.locator('.character').evaluate(element => {
    const scale = document.querySelector('.map').getBoundingClientRect().width / 208;
    const transform = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return { x: Math.round(transform.m41 / scale), y: Math.round(transform.m42 / scale) };
  });
}

async function holdDirection(page, direction) {
  const key = 'Arrow' + direction[0].toUpperCase() + direction.slice(1);
  await page.keyboard.down(key);
  return () => page.keyboard.up(key);
}

async function moveTo(page, direction, axis, target) {
  const release = await holdDirection(page, direction);
  try {
    await expect.poll(async () => (await position(page))[axis], { intervals: [16] })[
      direction === 'up' || direction === 'left' ? 'toBeLessThanOrEqual' : 'toBeGreaterThanOrEqual'
    ](target);
  } finally {
    await release();
  }
}

test.beforeEach(async ({ isMobile }) => {
  test.skip(!isMobile, 'Mobile-only layout and input checks');
});

test('mobile game fills portrait, landscape, and tablet viewports without fallback controls', async ({ page }, testInfo) => {
  for (const viewport of [{ width: 320, height: 568 }, { width: 412, height: 915 }, { width: 915, height: 412 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(viewport);
    await page.goto(gamePath);
    const layout = await page.evaluate(() => ({
      width: innerWidth, height: innerHeight,
      scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight,
      frame: document.querySelector('.frame').getBoundingClientRect().toJSON(),
      camera: document.querySelector('.camera').getBoundingClientRect().toJSON(),
    }));
    expect(layout.width).toBe(viewport.width);
    expect(layout.scrollWidth).toBe(viewport.width);
    expect(layout.scrollHeight).toBe(viewport.height);
    expect(layout.frame.width).toBeGreaterThanOrEqual(viewport.width - 16);
    expect(layout.frame.height).toBeGreaterThanOrEqual(viewport.height - 16);
    expect(layout.camera.width * layout.camera.height).toBeGreaterThan(viewport.width * viewport.height * 0.95);
    await expect(page.locator('.gameControls, .dpad, .actionButtons, button')).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath(`mobile-${viewport.width}x${viewport.height}.png`) });
  }
});

test('mobile keyboard Z and X read, open exhibits, and exit', async ({ page, context }) => {
  await context.route('https://www.linkedin.com/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Showcase fixture</title>' }));
  await page.goto(gamePath);
  await moveTo(page, 'left', 'x', 24);
  await page.keyboard.down('z');
  await expect(page.locator('.dialogueBox')).toContainText('mirror');
  await page.keyboard.up('z');
  // Reading a message must not block subsequent actions.
  await page.keyboard.press('x');
  await expect(page).toHaveURL('https://www.linkedin.com/in/radmehrv/');
  await page.goto(gamePath);
  await moveTo(page, 'up', 'y', 98);
  await expect(page.locator('.actionPrompt')).toContainText('exit');
  await page.keyboard.press('z');
  await expect(page).toHaveURL(/\/portfolio\/$/);
  await page.goto(gamePath);
  await moveTo(page, 'up', 'y', 98);
  await page.keyboard.press('x');
  await expect(page).toHaveURL(/\/portfolio\/$/);
});

test('mobile X opens projects outside the iframe when in-app popups are blocked', async ({ page, context }) => {
  await context.addInitScript(() => { window.open = () => null; });
  await context.route('https://www.linkedin.com/**', route => route.fulfill({
    contentType: 'text/html', body: '<title>Project fixture</title>',
  }));
  await page.route('**/embedded-game-test', route => route.fulfill({
    contentType: 'text/html',
    body: `<iframe title="Game" src="${gamePath}" style="position:fixed;inset:0;width:100%;height:100%;border:0"></iframe>`,
  }));
  await page.goto('/embedded-game-test');
  const game = page.frameLocator('iframe');
  await game.locator('.character').click();
  await page.keyboard.press('z');
  await page.keyboard.down('ArrowLeft');
  try {
    await expect(game.locator('.actionPrompt')).toContainText('Press X to open');
  } finally {
    await page.keyboard.up('ArrowLeft');
  }
  await page.keyboard.press('x');
  await expect(page).toHaveURL('https://www.linkedin.com/in/radmehrv/');
  expect(context.pages()).toHaveLength(1);
});

test('mobile world stays aligned and contains the character at its edges', async ({ page }, testInfo) => {
  await page.goto(gamePath);
  await moveTo(page, 'up', 'y', 90);
  await expect(page.locator('.character')).toHaveAttribute('walking', 'false');
  const checkWorld = async () => {
    const bounds = await page.evaluate(() => Object.fromEntries(['camera', 'map', 'character'].map(name => [name, document.querySelector(`.${name}`).getBoundingClientRect().toJSON()])));
    expect(bounds.map.left).toBeLessThanOrEqual(bounds.camera.left + 1);
    expect(bounds.map.top).toBeLessThanOrEqual(bounds.camera.top + 1);
    expect(bounds.map.right).toBeGreaterThanOrEqual(bounds.camera.right - 1);
    expect(bounds.map.bottom).toBeGreaterThanOrEqual(bounds.camera.bottom - 1);
    expect(bounds.character.left).toBeGreaterThanOrEqual(bounds.map.left - 1);
    expect(bounds.character.right).toBeLessThanOrEqual(bounds.map.right + 1);
    expect(bounds.character.bottom).toBeLessThanOrEqual(bounds.map.bottom + 1);
  };
  await checkWorld();
  await moveTo(page, 'down', 'y', 200);
  await moveTo(page, 'left', 'x', 0);
  await checkWorld();
  await moveTo(page, 'right', 'x', 176);
  await checkWorld();
  await moveTo(page, 'left', 'x', 100);
  await moveTo(page, 'down', 'y', 496);
  const release = await holdDirection(page, 'down');
  await expect(page.locator('.character')).toHaveAttribute('walking', 'true');
  await page.evaluate(() => new Promise(resolve => {
    let frames = 0;
    const step = () => ++frames === 4 ? resolve() : requestAnimationFrame(step);
    requestAnimationFrame(step);
  }));
  await release();
  await checkWorld();
  expect((await position(page)).y).toBe(496);
  await page.screenshot({ path: testInfo.outputPath('mobile-world-bottom.png') });
  // Lower exhibits must remain reachable within the corrected world bounds.
  await moveTo(page, 'left', 'x', 48);
  await page.keyboard.down('z');
  await expect(page.locator('.dialogueBox')).toContainText('distributed video player');
  await page.keyboard.up('z');
});
