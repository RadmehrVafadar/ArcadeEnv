import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSampledInput } from '../src/punch-out/sampled-input.ts';

function fixture() {
  let frame = 0, callback, id = 0;
  const events = [];
  const input = createSampledInput({
    send: (button, pressed) => events.push([button, pressed]),
    getFrame: () => frame,
    requestFrame: fn => { callback = fn; return ++id; },
    cancelFrame: () => { callback = undefined; },
  });
  return { input, events, tick(advance = 1) { frame += advance; const next = callback; callback = undefined; next?.(); } };
}

test('a short Start tap waits for actual NES frames even on a slow renderer', () => {
  const f = fixture();
  f.input.send('start', true);
  f.input.send('start', false);
  f.tick(0);
  assert.deepEqual(f.events, [['start', true]]);
  f.tick();
  assert.deepEqual(f.events, [['start', true]]);
  f.tick();
  assert.deepEqual(f.events, [['start', true], ['start', false]]);
});

test('rapid punches retain separate press and release samples without blocking movement', () => {
  const f = fixture();
  f.input.send('left', true);
  f.input.send('b', true);
  f.input.send('b', false);
  f.input.send('b', true);
  f.input.send('a', true);
  f.tick(2);
  assert.deepEqual(f.events, [['left', true], ['b', true], ['a', true], ['b', false]]);
  f.tick();
  assert.deepEqual(f.events.at(-1), ['b', true]);
});

test('reset releases immediately and discards every queued transition', () => {
  const f = fixture();
  f.input.send('b', true);
  f.input.send('b', false);
  f.input.send('b', true);
  f.input.reset();
  f.tick(10);
  assert.deepEqual(f.events, [['b', true], ['b', false]]);
});
