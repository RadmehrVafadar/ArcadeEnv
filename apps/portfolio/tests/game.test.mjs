import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { loadWorld, nearRect, nearbyExhibit } from '../src/portfolio-game/model.ts';
import { exhibits } from '../src/portfolio-game/content.ts';
import { HeldInput } from '../src/portfolio-game/input.ts';
const map = JSON.parse(await readFile(new URL('../src/portfolio-game/world/museum.tmj', import.meta.url), 'utf8'));

test('authored map has a valid spawn, exit, and only the LinkedIn exhibit', () => {
  const world = loadWorld(map, exhibits);
  assert.equal(world.width, 208);
  assert.equal(world.height, 640);
  assert.equal(world.spawn.x, world.width / 2);
  assert.deepEqual(world.objects.filter(o => o.exhibit).map(o => o.exhibit.id), ['linkedin']);
  assert.equal(nearRect(world.spawn.x, world.spawn.y, world.exit), false);
});

test('moving a Tiled exhibit moves its artwork, footprint, and interaction together', () => {
  const original = loadWorld(map, exhibits).objects.find(o => o.exhibit);
  const moved = structuredClone(map);
  moved.layers.find(l => l.name === 'objects').objects.find(o => o.id === 1).x += 48;
  const world = loadWorld(moved, exhibits);
  const mirror = world.objects.find(o => o.exhibit);
  assert.equal(mirror.x, original.x + 48);
  assert.equal(mirror.bodies[0].x, original.bodies[0].x + 48);
  assert.equal(nearbyExhibit(original.bodies[0].x - 8, 148, world.objects), undefined);
  assert.equal(nearbyExhibit(mirror.bodies[0].x + mirror.bodies[0].width + 8, 148, world.objects).exhibit.id, 'linkedin');
});

test('map validation rejects missing references, duplicate IDs, absent markers, and unsupported geometry', () => {
  const invalid = [
    m => { m.layers.find(l => l.name === 'objects').objects[0].properties[0].value = 'missing'; },
    m => { m.layers.find(l => l.name === 'objects').objects[1].id = 1; },
    m => { m.layers.find(l => l.name === 'objects').objects = m.layers.find(l => l.name === 'objects').objects.filter(o => o.type !== 'spawn'); },
    m => { m.layers.find(l => l.name === 'objects').objects = m.layers.find(l => l.name === 'objects').objects.filter(o => o.type !== 'exit'); },
    m => { m.tilesets[1].tiles[0].objectgroup.objects[0].ellipse = true; },
    m => { m.tilesets[1].tiles[0].objectgroup.objects[0].rotation = 30; },
    m => { m.layers[0].data.pop(); },
    m => { m.layers.find(l => l.name === 'objects').objects[0].x = -10; },
  ];
  for (const mutate of invalid) { const copy = structuredClone(map); mutate(copy); assert.throws(() => loadWorld(copy, exhibits), /Museum map:/); }
  assert.throws(() => loadWorld(map, [...exhibits, exhibits[0]]), /duplicate exhibit/);
});

test('interaction uses the footprint and deterministic nearest selection', () => {
  const world = loadWorld(map, exhibits);
  assert.equal(nearbyExhibit(68, 148, world.objects).exhibit.id, 'linkedin');
  assert.equal(nearbyExhibit(80, 110, world.objects), undefined);
  assert.equal(nearbyExhibit(192, 200, world.objects), undefined);
  const mirror = world.objects.find(o => o.exhibit);
  assert.equal(nearbyExhibit(68, 148, [{ ...mirror, id: 20 }, mirror]).id, mirror.id);
});

test('input preserves aliases and most recent direction across keyboard and pointer sources', () => {
  const input = new HeldInput();
  input.press('w', 'up'); input.press('arrowup', 'up'); input.press('a', 'left');
  input.press('w', 'up'); // key repeat must not steal priority
  assert.equal(input.direction, 'left');
  input.release('a'); input.release('w');
  assert.equal(input.direction, 'up');
  input.press('pointer:1', 'down');
  assert.equal(input.direction, 'down');
  input.release('pointer:1');
  assert.equal(input.direction, 'up');
  input.clear();
  assert.equal(input.direction, undefined);
});
