import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const source = (await readFile(new URL('../src/portfolio-game/game.js', import.meta.url), 'utf8'))
  .replaceAll('import.meta.env.BASE_URL', JSON.stringify('/portfolio/'));

function loadGame() {
  const elements = new Map();
  const listeners = new Map();
  const document = {
    documentElement: {},
    body: { addEventListener() {} },
    querySelector(selector) {
      if (!elements.has(selector)) {
        elements.set(selector, { style: {}, setAttribute() {}, addEventListener() {} });
      }
      return elements.get(selector);
    },
    addEventListener(name, handler) { listeners.set(name, handler); },
  };
  const game = {
    document,
    getComputedStyle: () => ({ getPropertyValue: () => '3.5px' }),
    window: { requestAnimationFrame() {}, addEventListener() {}, location: { href: '' } },
  };
  runInNewContext(source, game);
  return { game, elements, listeners };
}

test('game starts, displays its welcome message, and moves on arrow input', () => {
  const { game, elements, listeners } = loadGame();
  assert.match(elements.get('.dialogueBox').innerHTML, /Welcome/);
  listeners.get('keydown')({ which: 39, key: 'ArrowRight' });
  runInNewContext('placeCharacter()', game);
  assert.equal(game.x, 102);
  assert.equal(elements.get('.dialogueBox').style.display, 'none');
  listeners.get('keyup')({ which: 39, key: 'ArrowRight' });
  runInNewContext('placeCharacter()', game);
  assert.equal(game.x, 102);
});

test('statue collisions and interaction padding support reversed coordinates', () => {
  const { game } = loadGame();
  assert.equal(game.isCollidingWithAnyStatue(180, 130), true);
  assert.equal(game.isCollidingWithAnyStatue(100, 120), false);
  assert.equal(game.getNearbyStatue(150, 130).id, 'Boids-Algorithm');
  assert.equal(game.getNearbyStatue(100, 120), null);
});

test('door returns to the portfolio landing page for both interaction keys', () => {
  for (const key of [' ', 'e']) {
    const { game, listeners } = loadGame();
    game.y = 94;
    listeners.get('keydown')({ key });
    assert.equal(game.window.location.href, '/portfolio/');
  }
});
