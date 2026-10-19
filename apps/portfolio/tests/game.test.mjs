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
        elements.set(selector, { style: {}, attributes: {}, classList: { add() {}, remove() {} }, setAttribute(name, value) { this.attributes[name] = value; }, addEventListener() {} });
      }
      return elements.get(selector);
    },
    addEventListener(name, handler) { listeners.set(name, handler); },
    querySelectorAll() {
      return [...elements].filter(([name]) => name.startsWith('.dpad-')).map(([, element]) => element);
    },
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

test('WASD and arrow keys move in every direction and stop on release', () => {
  for (const [key, which, axis, delta] of [
    ['w', 87, 'y', -2], ['a', 65, 'x', -2],
    ['s', 83, 'y', 2], ['d', 68, 'x', 2],
    ['W', 87, 'y', -2], ['A', 65, 'x', -2],
    ['S', 83, 'y', 2], ['D', 68, 'x', 2],
    ['ArrowUp', 38, 'y', -2], ['ArrowLeft', 37, 'x', -2],
    ['ArrowDown', 40, 'y', 2], ['ArrowRight', 39, 'x', 2],
  ]) {
    const { game, listeners } = loadGame();
    const initial = game[axis];
    listeners.get('keydown')({ which, key });
    runInNewContext('placeCharacter()', game);
    assert.equal(game[axis], initial + delta, key);
    listeners.get('keyup')({ which, key });
    runInNewContext('placeCharacter()', game);
    assert.equal(game[axis], initial + delta, `${key} release`);
  }
});

test('directional buttons move and face the character toward their arrows', () => {
  for (const [direction, axis, delta] of [['up', 'y', -2], ['down', 'y', 2], ['left', 'x', -2], ['right', 'x', 2]]) {
    const { game, elements } = loadGame();
    const initial = game[axis];
    runInNewContext(`handleDpadPress('${direction}', true); placeCharacter()`, game);
    assert.equal(game[axis], initial + delta, direction);
    assert.equal(elements.get('.character').attributes.facing, direction);
  }
});

test('releasing one movement alias keeps the other held key moving', () => {
  for (const releaseFirst of [87, 38]) {
    const { game, listeners } = loadGame();
    listeners.get('keydown')({ which: 87, key: 'w' });
    listeners.get('keydown')({ which: 38, key: 'ArrowUp' });
    listeners.get('keydown')({ which: 87, key: 'w', repeat: true });
    listeners.get('keyup')({ which: releaseFirst });
    runInNewContext('placeCharacter()', game);
    assert.equal(game.y, 118);
    listeners.get('keyup')({ which: releaseFirst === 87 ? 38 : 87 });
    runInNewContext('placeCharacter()', game);
    assert.equal(game.y, 118);
  }
});

test('door returns to the portfolio landing page for both interaction keys', () => {
  for (const key of [' ', 'e']) {
    const { game, listeners } = loadGame();
    game.y = 94;
    listeners.get('keydown')({ key });
    assert.equal(game.window.location.href, '/portfolio/');
  }
});
