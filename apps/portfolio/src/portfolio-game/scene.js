// All simulation coordinates are native artwork pixels, independent of viewport or input.
const requireValue = (condition, message) => {
  if (!condition) throw new Error(`Showcase map: ${message}`);
};
const finite = value => typeof value === 'number' && Number.isFinite(value);
const rectangle = rect => rect && [rect.x, rect.y, rect.width, rect.height].every(finite) && rect.width > 0 && rect.height > 0;
const supportedObject = object => !object.rotation && !object.polygon && !object.polyline && !object.ellipse && !object.template && object.visible !== false;
export const overlaps = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
const contains = (outer, inner) => inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;
export const playerBounds = player => ({ x: player.x - 9, y: player.y - 10, width: 18, height: 10 });

export function loadScene(map, tileset) {
  requireValue(map.type === 'map' && map.orientation === 'orthogonal' && !map.infinite, 'use a finite orthogonal map');
  const width = map.width * map.tilewidth, height = map.height * map.tileheight;
  requireValue(finite(width) && finite(height) && width > 0 && height > 0, 'invalid map dimensions');
  requireValue(map.tilesets?.length === 1 && map.tilesets[0].source === 'exhibits.tsj' && map.tilesets[0].firstgid === 1, 'use the exhibits.tsj tileset at firstgid 1');
  requireValue(tileset.objectalignment === 'topleft' && !tileset.tileoffset, 'tiles must have top-left alignment and no drawing offset');
  requireValue(map.layers?.length === 3 && map.layers.every(layer => !layer.x && !layer.y && !layer.offsetx && !layer.offsety && layer.visible !== false && (layer.opacity ?? 1) === 1 && (layer.parallaxx ?? 1) === 1 && (layer.parallaxy ?? 1) === 1), 'use three visible, untransformed layers');
  const room = map.layers.find(layer => layer.type === 'imagelayer');
  const world = map.layers.find(layer => layer.name === 'World' && layer.type === 'objectgroup');
  const placed = map.layers.find(layer => layer.name === 'Exhibits' && layer.type === 'objectgroup');
  requireValue(room && world && placed && !room.repeatx && !room.repeaty, 'Room, World, and Exhibits layers are required');
  requireValue(world.objects?.length === 3 && world.objects.every(supportedObject), 'World needs an unrotated Walkable rectangle, Spawn point, and Exit rectangle');
  const walkable = world.objects.find(object => object.type === 'Walkable');
  const spawn = world.objects.find(object => object.type === 'Spawn');
  const exit = world.objects.find(object => object.type === 'Exit');
  requireValue(rectangle(walkable) && rectangle(exit) && spawn?.point && finite(spawn.x) && finite(spawn.y), 'invalid world objects');
  requireValue(contains({ x: 0, y: 0, width, height }, walkable), 'floor extends outside map');
  const exhibits = placed.objects.map(object => {
    const tile = tileset.tiles.find(tile => tile.id === object.gid - 1);
    requireValue(tile && supportedObject(object) && !object.properties?.length && object.width === tile.imagewidth && object.height === tile.imageheight && finite(object.x) && finite(object.y), `unsupported tile transform or instance override on ${object.name}`);
    const properties = Object.fromEntries((tile.properties ?? []).map(property => [property.name, property.value]));
    requireValue(tile.objectgroup?.objects.length === 1 && !tile.objectgroup.offsetx && !tile.objectgroup.offsety && !tile.objectgroup.x && !tile.objectgroup.y, `${object.name} needs one untransformed footprint`);
    const footprint = tile.objectgroup.objects[0];
    requireValue(rectangle(footprint) && supportedObject(footprint) && contains({ x: 0, y: 0, width: tile.imagewidth, height: tile.imageheight }, footprint), `${object.name} footprint must fit its sprite`);
    requireValue(typeof properties.id === 'string' && typeof properties.text === 'string' && /^https:\/\//.test(properties.url) && finite(properties.interactionPadding) && properties.interactionPadding > 0, `${object.name} needs id, text, HTTPS url, and positive interactionPadding`);
    return {
      id: properties.id, text: properties.text, url: properties.url,
      image: tile.image, width: tile.imagewidth, height: tile.imageheight,
      x: object.x, y: object.y, footprint, padding: properties.interactionPadding,
      get collider() { return { x: this.x + footprint.x, y: this.y + footprint.y, width: footprint.width, height: footprint.height }; },
      get interaction() {
        const rect = this.collider, padding = this.padding;
        return { x: rect.x - padding, y: rect.y - padding, width: rect.width + 2 * padding, height: rect.height + 2 * padding };
      },
    };
  });
  requireValue(new Set(exhibits.map(exhibit => exhibit.id)).size === exhibits.length, 'duplicate exhibit ids');
  requireValue(exhibits.every(exhibit => contains(walkable, exhibit.collider)), 'exhibit footprint extends outside the floor');
  requireValue(exhibits.every((exhibit, index) => exhibits.slice(index + 1).every(other => !overlaps(exhibit.collider, other.collider))), 'exhibit footprints overlap');
  requireValue(contains(walkable, playerBounds(spawn)) && exhibits.every(exhibit => !overlaps(playerBounds(spawn), exhibit.collider)), 'spawn is blocked');
  requireValue(overlaps(walkable, exit), 'exit must touch the walkable floor');
  return { width, height, room: room.image, walkable, spawn: { x: spawn.x, y: spawn.y }, exit, exhibits };
}

export function movePlayer(scene, player, dx, dy) {
  requireValue([dx, dy, player.x, player.y].every(finite), 'invalid movement');
  const result = { ...player };
  // Small simulation steps prevent tunneling even when a rendered frame is delayed.
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 4));
  for (let i = 0; i < steps; i++) {
    for (const [axis, delta, minimum, maximum] of [
      ['x', dx / steps, scene.walkable.x + 9, scene.walkable.x + scene.walkable.width - 9],
      ['y', dy / steps, scene.walkable.y + 10, scene.walkable.y + scene.walkable.height],
    ]) {
      const next = { ...result, [axis]: Math.min(maximum, Math.max(minimum, result[axis] + delta)) };
      if (scene.exhibits.every(exhibit => !overlaps(playerBounds(next), exhibit.collider))) result[axis] = next[axis];
    }
  }
  return result;
}

export function nearbyExhibit(scene, player) {
  return scene.exhibits.filter(exhibit => overlaps(playerBounds(player), exhibit.interaction))
    .sort((a, b) => {
      const distance = exhibit => Math.hypot(player.x - exhibit.collider.x - exhibit.collider.width / 2, player.y - exhibit.collider.y - exhibit.collider.height / 2);
      return distance(a) - distance(b) || a.id.localeCompare(b.id);
    })[0] ?? null;
}

export function relocateExhibit(scene, exhibit, x, y, player) {
  if (![x, y].every(finite)) return false;
  const collider = { ...exhibit.collider, x: x + exhibit.footprint.x, y: y + exhibit.footprint.y };
  if (!contains(scene.walkable, collider) || overlaps(playerBounds(player), collider) ||
      scene.exhibits.some(other => other !== exhibit && overlaps(other.collider, collider))) return false;
  exhibit.x = x;
  exhibit.y = y;
  return true;
}

export function cameraTransform(scene, width, height, player) {
  const scale = Math.min(width / scene.width, height / 300);
  const viewHeight = height / scale;
  return {
    scale, x: (width - scene.width * scale) / 2,
    y: scene.height < viewHeight ? (height - scene.height * scale) / 2 : -Math.max(0, Math.min(scene.height - viewHeight, player.y - viewHeight / 2)) * scale,
  };
}
