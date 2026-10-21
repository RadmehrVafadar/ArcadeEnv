import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { loadScene, movePlayer, playerBounds, nearbyExhibit, relocateExhibit, cameraTransform, overlaps } from '../src/portfolio-game/scene.js';

const map = JSON.parse(await readFile(new URL('../src/portfolio-game/scene/showcase.tmj', import.meta.url)));
const tileset = JSON.parse(await readFile(new URL('../src/portfolio-game/scene/exhibits.tsj', import.meta.url)));
const fresh = () => loadScene(structuredClone(map), structuredClone(tileset));

test('lower computer footprint blocks approaches from all four sides', () => {
  const scene = fresh();
  const computer = scene.exhibits.find(exhibit => exhibit.id === 'Distributed-Video-Player');
  const rect = computer.collider;
  for (const [player, dx, dy] of [
    [{ x: rect.x - 30, y: rect.y + rect.height / 2 }, 80, 0],
    [{ x: rect.x + rect.width + 30, y: rect.y + rect.height / 2 }, -80, 0],
    [{ x: rect.x + rect.width / 2, y: rect.y - 30 }, 0, 80],
    [{ x: rect.x + rect.width / 2, y: rect.y + rect.height + 30 }, 0, -80],
  ]) {
    const moved = movePlayer(scene, player, dx, dy);
    const bounds = playerBounds(moved);
    assert.ok(bounds.x + bounds.width <= rect.x || bounds.x >= rect.x + rect.width ||
      bounds.y + bounds.height <= rect.y || bounds.y >= rect.y + rect.height);
    assert.notDeepEqual(moved, { x: player.x + dx, y: player.y + dy });
  }
});

test('relocating an exhibit moves artwork, collider, and interaction together', () => {
  const scene = fresh();
  const exhibit = scene.exhibits[0];
  const old = structuredClone(exhibit);
  const delta = { x: 80, y: 100 };
  assert.equal(relocateExhibit(scene, exhibit, old.x + delta.x, old.y + delta.y, scene.spawn), true);
  assert.equal(exhibit.x, old.x + delta.x);
  assert.equal(exhibit.collider.x, old.collider.x + delta.x);
  assert.equal(exhibit.collider.y, old.collider.y + delta.y);
  assert.equal(exhibit.interaction.x, old.interaction.x + delta.x);
  assert.equal(exhibit.interaction.y, old.interaction.y + delta.y);
  const feet = { x: exhibit.collider.x + exhibit.collider.width + 12, y: exhibit.collider.y + exhibit.collider.height / 2 };
  assert.equal(nearbyExhibit(scene, feet).id, exhibit.id);
  assert.equal(nearbyExhibit(scene, { x: old.collider.x + old.collider.width + 12, y: old.collider.y }), null);
});

test('every exhibit and the door are reachable from spawn through collision-aware movement', () => {
  const scene = fresh(), reached = new Set(), queue = [scene.spawn], visited = new Set();
  let door = false;
  for (let index = 0; index < queue.length && (reached.size < scene.exhibits.length || !door); index++) {
    const player = queue[index];
    const nearby = nearbyExhibit(scene, player);
    if (nearby) reached.add(nearby.id);
    door ||= overlaps(playerBounds(player), scene.exit);
    for (const [dx, dy] of [[8, 0], [-8, 0], [0, 8], [0, -8]]) {
      const next = movePlayer(scene, player, dx, dy), key = `${next.x},${next.y}`;
      if (next.x !== player.x + dx || next.y !== player.y + dy || visited.has(key)) continue;
      visited.add(key);
      queue.push(next);
    }
  }
  assert.deepEqual([...reached].sort(), scene.exhibits.map(exhibit => exhibit.id).sort());
  assert.equal(door, true);
});

test('camera changes never change physics and movement speed is independent of refresh rate', () => {
  const scene = fresh();
  for (const hz of [30, 60, 120]) {
    let player = { ...scene.spawn };
    for (let i = 0; i < hz; i++) player = movePlayer(scene, player, 0, 240 / hz);
    assert.ok(Math.abs(player.y - 540) < 1e-8);
    for (const [width, height] of [[320, 280], [412, 600], [751, 337], [760, 620], [768, 800]]) {
      const before = structuredClone(player);
      const view = cameraTransform(scene, width, height, player);
      assert.ok(Number.isFinite(view.scale) && view.scale > 0);
      assert.deepEqual(player, before);
    }
  }
});

test('player footprints stay within authored floor bounds at all four edges', () => {
  const scene = fresh();
  for (const [dx, dy] of [[0, -2000], [0, 2000], [-2000, 0], [2000, 0]]) {
    const bounds = playerBounds(movePlayer(scene, scene.spawn, dx, dy));
    assert.ok(bounds.x >= scene.walkable.x && bounds.y >= scene.walkable.y);
    assert.ok(bounds.x + bounds.width <= scene.walkable.x + scene.walkable.width);
    assert.ok(bounds.y + bounds.height <= scene.walkable.y + scene.walkable.height);
  }
});

test('invalid placements cannot overlap the player, another exhibit, or the floor boundary', () => {
  const scene = fresh(), exhibit = scene.exhibits[0], initial = { x: exhibit.x, y: exhibit.y };
  for (const target of [
    { x: -100, y: -100 },
    { x: scene.spawn.x - exhibit.footprint.x, y: scene.spawn.y - 5 - exhibit.footprint.y },
    { x: scene.exhibits[1].collider.x - exhibit.footprint.x, y: scene.exhibits[1].collider.y - exhibit.footprint.y },
  ]) {
    assert.equal(relocateExhibit(scene, exhibit, target.x, target.y, scene.spawn), false);
    assert.deepEqual({ x: exhibit.x, y: exhibit.y }, initial);
  }
});

test('Tiled placement is the only source of object world positions', () => {
  const edited = structuredClone(map);
  edited.layers.find(layer => layer.name === 'Exhibits').objects[0].y += 100;
  const before = fresh().exhibits[0], after = loadScene(edited, tileset).exhibits[0];
  assert.equal(after.y, before.y + 100);
  assert.equal(after.collider.y, before.collider.y + 100);
  assert.equal(after.interaction.y, before.interaction.y + 100);
});

test('current Tiled JSON saves object classes as type, so editor saves preserve world roles', () => {
  const saved = structuredClone(map);
  for (const object of saved.layers.find(layer => layer.name === 'World').objects) {
    object.type = object.type ?? object.class;
    delete object.class;
  }
  assert.equal(loadScene(saved, tileset).spawn.y, 300);
});

test('unsupported editor transforms fail explicitly instead of silently misaligning geometry', () => {
  for (const mutate of [
    map => { map.layers[2].objects[0].rotation = 90; },
    map => { map.layers[2].objects[0].gid = 0x80000001; },
    map => { map.layers[2].objects[0].width *= 2; },
    map => { map.layers[2].offsety = 10; },
    map => { map.layers[2].objects[0].x = -100; },
    map => { map.layers[1].objects[1].y = -100; },
  ]) {
    const edited = structuredClone(map);
    mutate(edited);
    assert.throws(() => loadScene(edited, tileset), /Showcase map:/);
  }
});

test('map, tileset and PNG dimensions agree', async () => {
  const scene = fresh();
  for (const [file, width, height] of [[scene.room, scene.width, scene.height], ...tileset.tiles.map(tile => [tile.image, tile.imagewidth, tile.imageheight])]) {
    const data = await readFile(new URL(`../src/portfolio-game/scene/${file}`, import.meta.url));
    assert.equal(data.readUInt32BE(16), width, file);
    assert.equal(data.readUInt32BE(20), height, file);
  }
});
