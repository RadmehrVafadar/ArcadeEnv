import { expect } from '@playwright/test';
export const gamePath = '/portfolio/src/portfolio-game/game.html';
export const player = page => page.locator('canvas[data-ready="true"]');
export async function position(page) {
  return player(page).evaluate(element => ({ x: Number(element.dataset.playerX), y: Number(element.dataset.playerY) }));
}
export async function ready(page) { await expect(player(page)).toBeVisible(); }
export async function moveTo(page, direction, axis, target) {
  // Release in the page's animation frame, avoiding driver round trips that overshoot
  // small footprints when the software-rendered cabinet tests occupy the other worker.
  await page.evaluate(({ axis, target, direction }) => new Promise((resolve, reject) => {
    const canvas = document.querySelector('canvas[data-ready]');
    const start = performance.now();
    let held = '';
    const release = () => { if (held) document.dispatchEvent(new KeyboardEvent('keyup', { key: held, bubbles: true })); held = ''; };
    const step = () => {
      const value = Number(canvas.dataset[axis === 'x' ? 'playerX' : 'playerY']);
      if (Math.abs(value - target) <= 2) { release(); resolve(); return; }
      if (performance.now() - start > 8000) { release(); reject(new Error(`Could not reach ${direction} ${axis}=${target}; at ${value}`)); return; }
      const next = axis === 'x' ? (value < target ? 'ArrowRight' : 'ArrowLeft') : (value < target ? 'ArrowDown' : 'ArrowUp');
      if (next !== held) { release(); held = next; document.dispatchEvent(new KeyboardEvent('keydown', { key: next, bubbles: true })); }
      requestAnimationFrame(step);
    };
    step();
  }), { axis, target, direction });
  await expect(player(page)).toHaveAttribute('data-walking', 'false');
}
export async function approachMirror(page) {
  await moveTo(page, 'down', 'y', 148);
  await moveTo(page, 'left', 'x', 68);
  await expect(page.locator('.actionPrompt')).toContainText('looking glass');
}
