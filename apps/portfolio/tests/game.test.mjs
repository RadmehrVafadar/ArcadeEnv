import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const source = (await readFile(new URL('../src/portfolio-game/game.js', import.meta.url), 'utf8'))
  .replaceAll('import.meta.env.BASE_URL', JSON.stringify('/portfolio/'));

test('game markup contains no fallback directional or action buttons', async () => {
  const html = await readFile(new URL('../src/portfolio-game/game.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /gameControls|dpad|action-read|action-open|<button\b/);
});

function loadGame({ mobile = false } = {}) {
  const elements = new Map();
  const listeners = new Map();
  const document = {
    documentElement: { style: { setProperty(name, value) { this[name] = value; } } },
    body: { addEventListener() {} },
    querySelector(selector) {
      if (!elements.has(selector)) {
        elements.set(selector, {
          clientWidth: 390, clientHeight: 600, offsetWidth: 390, offsetHeight: 1020,
          style: { setProperty(name, value) { this[name] = value; } }, attributes: {}, listeners: new Map(), classList: { add() {}, remove() {}, toggle() {} },
          setAttribute(name, value) { this.attributes[name] = value; },
          addEventListener(name, handler) { this.listeners.set(name, handler); },
        });
      }
      return elements.get(selector);
    },
    addEventListener(name, handler) { listeners.set(name, handler); },
  };
  const game = {
    document,
    getComputedStyle: () => ({ getPropertyValue: name => document.documentElement.style[name] || '3.5px' }),
    window: { matchMedia: () => ({ matches: mobile }), requestAnimationFrame() {}, addEventListener() {}, location: { href: '' } },
  };
  runInNewContext(source, game);
  return { game, elements, listeners };
}

test('desktop starts with movement and exit instructions, then hides them on movement', () => {
  const { game, elements, listeners } = loadGame();
  assert.equal(elements.get('.dialogueBox').innerHTML, '<span class="startupWelcome">Welcome to my project showcase!</span><span class="startupControl">Move: WASD or ← ↑ ↓→</span><span class="startupControl startupActions">Z: read / X: open / Q: exit</span>');
  listeners.get('keydown')({ which: 39, key: 'ArrowRight' });
  runInNewContext('placeCharacter()', game);
  assert.equal(game.x, 102);
  assert.equal(elements.get('.dialogueBox').style.display, 'none');
  listeners.get('keyup')({ which: 39, key: 'ArrowRight' });
  runInNewContext('placeCharacter()', game);
  assert.equal(game.x, 102);
});

test('mobile standalone instructions describe keyboard controls', () => {
  const { elements } = loadGame({ mobile: true });
  assert.equal(elements.get('.dialogueBox').innerHTML, 'Welcome to my portfolio showcase game! Keyboard: arrows or WASD. Z: read / X: open / Q: exit.');
});

test('cabinet connection switches between joystick and standalone keyboard instructions', () => {
  const { game, elements } = loadGame({ mobile: true });
  const controls = game.window.arcadeControls;
  assert.ok(controls, 'Game must expose cabinet controls');
  controls.connect();
  runInNewContext('placeCharacter()', game);
  assert.match(elements.get('.dialogueBox').innerHTML, /joystick/i);
  assert.match(elements.get('.dialogueBox').innerHTML, /Z: read/);
  assert.match(elements.get('.dialogueBox').innerHTML, /X: open/);
  assert.match(elements.get('.dialogueBox').innerHTML, /Reset: menu/);
  controls.disconnect();
  runInNewContext('placeCharacter()', game);
  assert.match(elements.get('.dialogueBox').innerHTML, /Keyboard: arrows or WASD/);
});

test('PC cabinet connection preserves the original keyboard instructions', () => {
  const { game, elements } = loadGame();
  const original = elements.get('.dialogueBox').innerHTML;
  game.window.arcadeControls.connect();
  runInNewContext('placeCharacter()', game);
  assert.equal(elements.get('.dialogueBox').innerHTML, original);
});

test('cabinet input ownership survives another source releasing and resets independently', () => {
  const { game, listeners } = loadGame();
  const controls = game.window.arcadeControls;
  assert.ok(controls, 'Game must expose cabinet controls');
  controls.connect();
  listeners.get('keydown')({ which: 39, key: 'ArrowRight' });
  controls.setDirection('joystick', 'right');
  controls.setDirection('button', 'right');
  controls.setDirection('joystick', null);
  controls.reset();
  runInNewContext('placeCharacter()', game);
  assert.equal(game.x, 102, 'Keyboard remains held after cabinet reset');
  listeners.get('keyup')({ which: 39 });
  controls.setDirection('joystick', 'down');
  controls.setDirection('button', 'left');
  controls.setDirection('button', null);
  runInNewContext('placeCharacter()', game);
  assert.equal(game.y, 122, 'Joystick remains held after button release');
  controls.disconnect();
  runInNewContext('placeCharacter()', game);
  assert.equal(game.y, 122);
  controls.setDirection('joystick', 'down');
  runInNewContext('placeCharacter()', game);
  assert.equal(game.y, 122, 'Disconnected inputs are ignored');
});

test('cabinet quick actions reuse reading, opening and menu navigation', () => {
  const { game, elements } = loadGame();
  const controls = game.window.arcadeControls;
  assert.ok(controls, 'Game must expose cabinet controls');
  controls.connect();
  game.x = 40;
  game.y = 130;
  game.hasPlayerMoved = true;
  const opened = [];
  game.window.open = (...args) => opened.push(args);
  controls.action('read');
  assert.match(elements.get('.dialogueBox').innerHTML, /mirror/);
  controls.action('open');
  assert.equal(opened.length, 1);
  controls.action('menu');
  assert.equal(game.window.location.href, '/portfolio/');
});

test('hidden game clears all holds and cabinet text follows the projected screen scale', () => {
  const { game, elements, listeners } = loadGame();
  const controls = game.window.arcadeControls;
  controls.connect();
  controls.setDisplayScale(0.25);
  assert.equal(elements.get('.frame').style['--cabinet-font-size'], '48px');
  controls.setDisplayScale(0.001);
  assert.equal(elements.get('.frame').style['--cabinet-font-size'], '48px');
  controls.setDirection('joystick', 'down');
  listeners.get('keydown')({ which: 39 });
  game.document.hidden = true;
  listeners.get('visibilitychange')();
  runInNewContext('placeCharacter()', game);
  assert.equal(game.x, 100);
  assert.equal(game.y, 120);
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
  for (const key of ['z', 'x']) {
    const { game, listeners } = loadGame();
    game.y = 94;
    listeners.get('keydown')({ key });
    assert.equal(game.window.location.href, '/portfolio/');
  }
});

test('every showcase opens on the first X press after a popup receives the key release', () => {
  const { game, listeners } = loadGame();
  const opened = [];
  game.window.open = (...args) => opened.push(args);
  for (const statue of game.statues) {
    game.x = Math.min(statue.rect.x1, statue.rect.x2) === 0
      ? Math.max(statue.rect.x1, statue.rect.x2) + 2
      : Math.min(statue.rect.x1, statue.rect.x2) - 2;
    game.y = (statue.rect.y1 + statue.rect.y2) / 2;
    listeners.get('keydown')({ key: 'x', repeat: false });
    assert.deepEqual(opened.at(-1), [statue.url, '_blank', 'noopener'], statue.id);
    assert.equal(opened.length, game.statues.indexOf(statue) + 1, statue.id);
    // Opening the new tab takes focus; its keyup never reaches the game.
    listeners.get('keydown')({ key: 'x', repeat: true });
    assert.equal(opened.length, game.statues.indexOf(statue) + 1, `${statue.id} held X`);
  }
});

test('X opens once per press and Z only reads the exhibit', () => {
  const { game, elements, listeners } = loadGame();
  const opened = [];
  game.window.open = (...args) => opened.push(args);
  game.x = 40;
  game.y = 130;
  game.hasPlayerMoved = true;
  listeners.get('keydown')({ key: 'z' });
  runInNewContext('placeCharacter()', game);
  assert.match(elements.get('.dialogueBox').innerHTML, /mirror/);
  assert.equal(opened.length, 0);
  listeners.get('keyup')({ key: 'z' });
  for (const key of ['x', 'X']) {
    listeners.get('keydown')({ key, repeat: false });
    listeners.get('keydown')({ key, repeat: true });
    listeners.get('keyup')({ key });
  }
  assert.equal(opened.length, 2);
});

test('mobile artwork and movement share their fractional scale and world bounds', () => {
  const { game, elements } = loadGame({ mobile: true });
  assert.equal(game.getCurrentPixelSize(), 1.875);
  assert.equal(elements.get('.character').style.transform, 'translate3d( 187.5px, 225px, 0 )');
  game.x = 999;
  game.y = 999;
  runInNewContext('placeCharacter()', game);
  assert.equal(game.x, 176);
  assert.equal(game.y, 496);
  assert.equal(elements.get('.map').style.transform, 'translate3d( 0px, -420px, 0 )');
  assert.equal(game.isCollidingWithAnyStatue(140, 100), true);
  assert.equal(game.isCollidingWithAnyStatue(136, 100), false);
});

test('mobile cabinet actions can read and open every exhibit within world limits', () => {
  const { game, elements } = loadGame({ mobile: true });
  game.window.top = { location: { href: '' } };
  game.window.arcadeControls.connect();
  game.window.open = () => assert.fail('Mobile links must not depend on popup support');
  game.hasPlayerMoved = true;
  for (const statue of game.statues) {
    game.x = Math.min(statue.rect.x1, statue.rect.x2) === 0
      ? Math.max(statue.rect.x1, statue.rect.x2) + 10 - 16
      : Math.min(statue.rect.x1, statue.rect.x2) - 10 - 16;
    game.y = Math.min(496, (statue.rect.y1 + statue.rect.y2) / 2 - 28);
    game.window.arcadeControls.action('read');
    assert.equal(elements.get('.dialogueBox').innerHTML, statue.text, statue.id);
    const previousUrl = game.window.top.location.href;
    assert.notEqual(previousUrl, statue.url);
    game.window.arcadeControls.action('open');
    assert.equal(game.window.top.location.href, statue.url, statue.id);
  }
});

test('mobile keyboard X navigates the top window once per press without popups', () => {
  const { game, listeners } = loadGame({ mobile: true });
  game.window.top = { location: { href: '' } };
  game.window.open = () => assert.fail('Popup support is unavailable');
  game.x = 24;
  listeners.get('keydown')({ key: 'z', repeat: false });
  assert.equal(game.window.top.location.href, '');
  listeners.get('keydown')({ key: 'x', repeat: true });
  assert.equal(game.window.top.location.href, '');
  listeners.get('keydown')({ key: 'x', repeat: false });
  assert.equal(game.window.top.location.href, game.statues[0].url);
});
