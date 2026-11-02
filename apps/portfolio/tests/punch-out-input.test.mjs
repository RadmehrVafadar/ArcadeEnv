import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPunchOutInput } from '../src/punch-out/input.ts';

function fixture() {
  let time = 0, next = 0, exits = 0;
  const timers = new Map(), events = [];
  const clock = {
    now: () => time,
    setTimeout(callback, delay) { timers.set(++next, { at: time + delay, callback }); return next; },
    clearTimeout(id) { timers.delete(id); },
  };
  const input = createPunchOutInput({ send: (button, pressed) => events.push([button, pressed]), exit: () => exits++ }, clock);
  return { input, events, timers, exits: () => exits,
    tick(ms) {
      const end = time + ms;
      while (timers.size) {
        const pending = [...timers].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!pending) break;
        const [id, timer] = pending;
        time = timer.at;
        timers.delete(id);
        timer.callback();
      }
      time = end;
    },
  };
}

test('held directions and punches share source ownership and emit only transitions', () => {
  const f = fixture();
  f.input.setDirection('keyboard:w', 'up');
  f.input.setDirection('pointer:1', 'up');
  f.input.setButton('keyboard:z', 'read', true);
  f.input.setButton('keyboard:z', 'read', true);
  f.tick(59);
  assert.deepEqual(f.events, [['up', true]]);
  f.tick(1);
  f.input.setButton('pointer:2', 'read', true);
  f.input.setButton('keyboard:z', 'read', false);
  f.input.setDirection('pointer:1', null);
  assert.deepEqual(f.events, [['up', true], ['b', true]]);
  f.tick(32);
  f.input.setDirection('keyboard:w', null);
  f.input.setButton('pointer:2', 'read', false);
  assert.deepEqual(f.events.slice(-2), [['up', false], ['b', false]]);
});

test('Z/X chord at 59ms sends Select and suppresses punches until both release', () => {
  const f = fixture();
  f.input.setButton('z', 'read', true);
  f.tick(59);
  f.input.setButton('x', 'open', true);
  f.tick(500);
  assert.deepEqual(f.events, [['select', true]]);
  f.input.setButton('z', 'read', false);
  f.input.setButton('z', 'read', true);
  f.tick(100);
  assert.deepEqual(f.events, [['select', true]]);
  f.input.setButton('x', 'open', false);
  f.input.setButton('z', 'read', false);
  assert.deepEqual(f.events, [['select', true], ['select', false]]);
});

test('outside the chord window both punches remain independently held', () => {
  const f = fixture();
  f.input.setButton('z', 'read', true);
  f.tick(61);
  f.input.setButton('x', 'open', true);
  f.tick(60);
  assert.deepEqual(f.events, [['b', true], ['a', true]]);
  f.tick(32);
  f.input.setButton('z', 'read', false);
  f.input.setButton('x', 'open', false);
  assert.deepEqual(f.events.slice(-2), [['b', false], ['a', false]]);
});

test('short taps and rapid alternating punches survive the recognition delay', () => {
  const f = fixture();
  for (const action of ['read', 'open', 'read', 'open']) {
    f.input.setButton('finger', action, true);
    f.tick(10);
    f.input.setButton('finger', action, false);
    f.tick(40);
  }
  assert.deepEqual(f.events, [['b', true], ['b', false], ['a', true], ['a', false], ['b', true], ['b', false], ['a', true], ['a', false]]);
});

test('Start sends a tap only on release and exits exactly at two seconds', () => {
  const f = fixture();
  f.input.setButton('c', 'menu', true);
  f.tick(1999);
  assert.equal(f.exits(), 0);
  assert.deepEqual(f.events, []);
  f.input.setButton('c', 'menu', false);
  f.tick(40);
  assert.deepEqual(f.events, [['start', true], ['start', false]]);
  f.events.length = 0;
  f.input.setButton('reset', 'menu', true);
  f.tick(1999);
  assert.equal(f.exits(), 0);
  f.tick(1);
  assert.equal(f.exits(), 1);
  f.input.setButton('reset', 'menu', false);
  f.tick(100);
  assert.deepEqual(f.events, []);
});

test('Enter/Shift hold Start/Select without repeats and coexist with Reset/chord', () => {
  const f = fixture();
  f.input.setButton('enter', 'start', true);
  f.input.setButton('enter', 'start', true);
  f.input.setButton('shift', 'select', true);
  f.input.setButton('reset', 'menu', true);
  f.input.setButton('reset', 'menu', false);
  f.tick(40);
  assert.deepEqual(f.events, [['start', true], ['select', true]]);
  f.input.setButton('enter', 'start', false);
  f.input.setButton('shift', 'select', false);
  assert.deepEqual(f.events.slice(-2), [['start', false], ['select', false]]);
});

test('a punch released just after its delay and direct Start/Select taps last a NES frame', () => {
  const f = fixture();
  f.input.setButton('z', 'read', true);
  f.tick(60);
  f.input.setButton('z', 'read', false);
  f.input.setButton('enter', 'start', true);
  f.input.setButton('enter', 'start', false);
  f.input.setButton('shift', 'select', true);
  f.input.setButton('shift', 'select', false);
  f.tick(31);
  assert.deepEqual(f.events, [['b', true], ['start', true], ['select', true]]);
  f.tick(1);
  assert.deepEqual(f.events.slice(-3), [['b', false], ['start', false], ['select', false]]);
});

test('cancellation clears directions, chord timers, Reset holds, and pending tap releases', () => {
  for (const cancel of [input => input.reset(), input => input.setButton('z', 'read', false, true)]) {
    const f = fixture();
    f.input.setDirection('stick', 'left');
    f.input.setButton('z', 'read', true);
    f.input.setButton('c', 'menu', true);
    cancel(f.input);
    f.tick(4000);
    assert.deepEqual(f.events, [['left', true], ['left', false]]);
    assert.equal(f.exits(), 0);
    assert.equal(f.timers.size, 0);
  }
});
