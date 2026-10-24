import assert from 'node:assert/strict';
import test from 'node:test';
import { createArcadeAudio } from '../apps/arcade/src/arcade-audio.js';

function fixture(saved) {
  const notes = [];
  const buses = [];
  const timers = new Set();
  let context;
  const parameter = () => ({ value: 0, setValueAtTime(value) { this.value = value; }, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const host = {
    document: { hidden: false },
    localStorage: { getItem: () => saved, setItem: (_, value) => { saved = value; } },
    setInterval(fn) { timers.add(fn); return fn; },
    clearInterval(fn) { timers.delete(fn); },
    AudioContext: class {
      constructor() { context = this; this.state = 'suspended'; this.currentTime = 0; }
      createGain() {
        const node = { gain: parameter(), connect() {}, disconnect() {} };
        buses.push(node);
        return node;
      }
      createOscillator() {
        const node = { frequency: parameter(), connect() {}, disconnect() {}, start(time) { this.startTime = time; }, stop(time) { this.stopTime = time; } };
        notes.push(node);
        return node;
      }
      async resume() { this.state = 'running'; this.onstatechange?.(); }
      async suspend() { this.state = 'suspended'; this.onstatechange?.(); }
      async close() { this.state = 'closed'; }
    },
  };
  return { audio: createArcadeAudio(host), host, notes, buses, timers, context: () => context };
}

test('audio is lazy, effects have distinct timbres and pitches, and nodes stop', () => {
  const f = fixture();
  f.audio.resume();
  assert.equal(f.context(), undefined);
  f.audio.play('joystick');
  f.audio.play('read');
  f.audio.play('open');
  f.audio.play('menu');
  assert.deepEqual(f.notes.map(n => n.type), ['triangle', 'square', 'square', 'square']);
  assert.equal(new Set(f.notes.map(n => n.frequency.value)).size, 4);
  assert.ok(f.notes.every(n => n.stopTime > n.startTime && n.stopTime < 0.2));
  assert.equal(f.timers.size, 0);
});

test('preferences mute existing effects and persist without enabling music', () => {
  const f = fixture();
  f.audio.play('read');
  f.audio.set('effects', false);
  f.audio.play('open');
  assert.equal(f.notes.length, 1);
  assert.equal(f.buses[0].gain.value, 0);
  assert.deepEqual(createArcadeAudio(f.host).getSettings(), { effects: false, music: false });
});

test('music uses one timer, pauses while hidden, resumes, and cleans up', async () => {
  const f = fixture();
  f.audio.set('music', true);
  assert.equal(f.timers.size, 1);
  assert.equal(f.notes.length, 3);
  f.audio.unlock();
  assert.equal(f.timers.size, 1);
  assert.equal(f.notes.length, 3);
  f.context().currentTime = 30;
  for (const tick of f.timers) tick();
  assert.ok(f.notes.length <= 6, 'a delayed timer must not replay missed beats');
  f.host.document.hidden = true;
  f.audio.pause();
  assert.equal(f.timers.size, 0);
  assert.equal(f.context().state, 'suspended');
  f.audio.unlock();
  assert.equal(f.context().state, 'suspended');
  f.host.document.hidden = false;
  f.audio.unlock();
  assert.equal(f.timers.size, 1);
  f.audio.set('music', false);
  assert.equal(f.timers.size, 0);
  assert.equal(f.buses[1].gain.value, 0);
  f.audio.dispose();
  await Promise.resolve();
  assert.equal(f.context().state, 'closed');
});

test('missing audio and inaccessible or malformed storage are harmless', () => {
  const f = fixture('not json');
  assert.deepEqual(f.audio.getSettings(), { effects: true, music: false });
  const audio = createArcadeAudio({ get localStorage() { throw Error('denied'); } });
  assert.doesNotThrow(() => { audio.play('read'); audio.set('effects', false); });
});

test('first interaction requests iPhone playback audio instead of the muted ambient session', () => {
  const f = fixture();
  f.host.navigator = { audioSession: { type: 'auto' } };
  assert.equal(f.context(), undefined);
  f.audio.play('read');
  assert.equal(f.host.navigator.audioSession.type, 'playback');
  assert.equal(f.notes.length, 1);
});

test('a browser refusing audio session configuration can still play effects', () => {
  const f = fixture();
  f.host.navigator = { audioSession: { set type(_) { throw new Error('Unsupported session type'); } } };
  assert.doesNotThrow(() => f.audio.play('read'));
  assert.equal(f.notes.length, 1);
});
