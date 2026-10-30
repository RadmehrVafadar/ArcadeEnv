import { expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { loadWorld } from '../apps/portfolio/src/portfolio-game/model.ts';
import { exhibits } from '../apps/portfolio/src/portfolio-game/content.ts';
const world = loadWorld(JSON.parse(await readFile(new URL('../apps/portfolio/src/portfolio-game/world/museum.tmj', import.meta.url), 'utf8')), exhibits);
export const gamePath = '/portfolio/src/portfolio-game/game.html';
export const player = page => page.locator('canvas[data-ready="true"]');
export async function position(page) {
  return player(page).evaluate(element => ({ x: Number(element.dataset.playerX), y: Number(element.dataset.playerY) }));
}
export async function ready(page) { await expect(player(page)).toBeVisible({ timeout: 15000 }); }
export async function moveTo(page, direction, axis, target, crossingTolerance = 12) {
  // Observe published coordinates directly so throttled animation callbacks cannot delay release.
  await player(page).evaluate((canvas, { axis, target, direction, crossingTolerance }) => new Promise((resolve, reject) => {
    const increasing = Number(canvas.dataset[axis === 'x' ? 'playerX' : 'playerY']) < target;
    let crossed = false;
    let held = '';
    const release = () => { if (held) document.dispatchEvent(new KeyboardEvent('keyup', { key: held, bubbles: true })); held = ''; };
    const cleanup = () => { release(); observer.disconnect(); clearTimeout(timeout); };
    const step = () => {
      const value = Number(canvas.dataset[axis === 'x' ? 'playerX' : 'playerY']);
      // Allow half a 5 FPS movement step, but correct larger stalls back toward the target.
      crossed ||= increasing ? value >= target : value <= target;
      if (Math.abs(value - target) <= (crossed ? crossingTolerance : 2)) { cleanup(); resolve(); return; }
      const next = axis === 'x' ? (value < target ? 'ArrowRight' : 'ArrowLeft') : (value < target ? 'ArrowDown' : 'ArrowUp');
      if (next !== held) { release(); held = next; document.dispatchEvent(new KeyboardEvent('keydown', { key: next, bubbles: true })); }
    };
    const observer = new MutationObserver(step);
    observer.observe(canvas, { attributes: true, attributeFilter: [`data-player-${axis}`] });
    const timeout = setTimeout(() => {
      const value = Number(canvas.dataset[axis === 'x' ? 'playerX' : 'playerY']);
      cleanup(); reject(new Error(`Could not reach ${direction} ${axis}=${target}; at ${value}`));
    }, 8000);
    step();
  }), { axis, target, direction, crossingTolerance });
  await expect(player(page)).toHaveAttribute('data-walking', 'false');
}
export async function approachMirror(page) {
  await approachExhibit(page, 'linkedin');
}
export async function approachExhibit(page, id) {
  const object = world.objects.find(object => object.exhibit?.id === id);
  if (!object) throw new Error(`Unknown exhibit ${id}`);
  const body = object.bodies[0];
  const left = body.x < world.width / 2;
  // Aim at the feet-body contact edge so bounded overshoot stays inside the interaction range.
  const x = left ? body.x + body.width + 6 : body.x - 6;
  const y = body.y + body.height / 2;
  await moveTo(page, 'right', 'x', world.width / 2);
  await moveTo(page, 'down', 'y', y);
  await moveTo(page, left ? 'left' : 'right', 'x', x);
  await expect(page.locator('.dialogueBox')).toBeVisible();
  await expect(page.locator('.dialogueBox')).toContainText(object.exhibit.title);
}
