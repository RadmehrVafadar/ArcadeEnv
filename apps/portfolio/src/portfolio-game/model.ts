import type { Exhibit } from './content.ts';

export interface Rect { x: number; y: number; width: number; height: number }
interface Property { name: string; value: string | number | boolean }
interface MapObject extends Rect {
  id: number; name: string; type?: string; gid?: number; rotation?: number;
  point?: boolean; ellipse?: boolean; polygon?: unknown; polyline?: unknown;
  properties?: Property[];
}
interface Tile {
  id: number; image?: string; imagewidth?: number; imageheight?: number;
  properties?: Property[]; objectgroup?: { objects: MapObject[] };
}
export interface MuseumMap {
  orientation: string; infinite: boolean; width: number; height: number;
  tilewidth: number; tileheight: number;
  layers: { name: string; type: string; data?: number[]; objects?: MapObject[] }[];
  tilesets: { firstgid: number; name: string; tiles?: Tile[]; source?: string }[];
}
export interface PlacedObject extends Rect {
  id: number; texture: string; bodies: Rect[]; exhibit?: Exhibit; padding: number; decoration: boolean; opacity: number;
}
export const property = (properties: Property[] | undefined, name: string) => properties?.find(p => p.name === name)?.value;
const fail = (message: string): never => { throw new Error(`Museum map: ${message}`); };

function rectangle(object: MapObject) {
  if (object.ellipse || object.polygon || object.polyline || object.point || object.rotation) fail('only unrotated rectangular collision shapes are supported');
  if (![object.x, object.y, object.width, object.height].every(Number.isFinite) || object.width <= 0 || object.height <= 0) fail('invalid rectangle');
  return { x: object.x, y: object.y, width: object.width, height: object.height };
}

export function loadWorld(map: MuseumMap, content: Exhibit[]) {
  if (map.orientation !== 'orthogonal' || map.infinite || map.tilewidth !== 16 || map.tileheight !== 16) fail('expected a finite orthogonal 16px map');
  if (![map.width, map.height].every(n => Number.isInteger(n) && n > 0)) fail('invalid map dimensions');
  const ids = new Set<string>();
  for (const entry of content) {
    if (ids.has(entry.id)) fail(`duplicate exhibit ID ${entry.id}`);
    ids.add(entry.id);
    if (!entry.title || !entry.description || !(entry.internal ? /^src\/[a-z0-9/-]+\.html$/.test(entry.url) : /^https:\/\//.test(entry.url))) fail(`invalid exhibit ${entry.id}`);
  }
  for (const name of ['floor', 'walls', 'decoration', 'foreground', 'objects']) {
    if (map.layers.filter(layer => layer.name === name).length !== 1) fail(`expected one ${name} layer`);
  }
  const width = map.width * map.tilewidth, height = map.height * map.tileheight;
  const inside = (rect: Rect) => rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= width && rect.y + rect.height <= height;
  const tiles = new Map<number, Tile>();
  for (const tileset of map.tilesets) {
    if (tileset.source) fail('embed tilesets before saving');
    for (const tile of tileset.tiles ?? []) tiles.set(tileset.firstgid + tile.id, tile);
  }
  for (const layer of map.layers.filter(layer => layer.type === 'tilelayer')) {
    if (layer.data?.length !== map.width * map.height) fail(`invalid ${layer.name} tile data`);
    for (const gid of layer.data ?? []) if (gid && !tiles.has(gid)) fail(`unknown tile ${gid}`);
  }
  const all = map.layers.flatMap(layer => layer.objects ?? []);
  if (new Set(all.map(object => object.id)).size !== all.length) fail('duplicate object IDs');
  const spawns = all.filter(object => object.type === 'spawn');
  const exits = all.filter(object => object.type === 'exit');
  if (spawns.length !== 1 || exits.length !== 1) fail('expected exactly one spawn and exit');
  const spawn = { x: spawns[0].x, y: spawns[0].y };
  const exit = rectangle(exits[0]);
  if (!inside({ ...spawn, width: 1, height: 1 }) || !inside(exit)) fail('spawn or exit outside world');
  const placedIds = new Set<string>();
  const objects: PlacedObject[] = all.filter(object => object.gid !== undefined).map(object => {
    const tile = tiles.get(object.gid!);
    if (!tile?.image || !tile.imagewidth || !tile.imageheight || object.rotation) return fail(`unsupported object ${object.name}`);
    const rect = rectangle(object);
    rect.y -= rect.height; // Tiled tile objects use a bottom-left anchor.
    if (!inside(rect)) fail(`object ${object.name} outside world`);
    const sx = rect.width / tile.imagewidth, sy = rect.height / tile.imageheight;
    const bodies = (tile.objectgroup?.objects ?? []).map(shape => {
      const body = rectangle(shape);
      return { x: rect.x + body.x * sx, y: rect.y + body.y * sy, width: body.width * sx, height: body.height * sy };
    });
    const exhibitId = property(object.properties, 'exhibitId');
    const exhibit = content.find(entry => entry.id === exhibitId);
    if (exhibitId !== undefined && !exhibit) fail(`unknown exhibit ${exhibitId}`);
    if (exhibit) {
      if (placedIds.has(exhibit.id)) fail(`duplicate placed exhibit ${exhibit.id}`);
      placedIds.add(exhibit.id);
      if (bodies.length !== 1) fail('exhibits require one footprint');
    }
    const padding = Number(property(tile.properties, 'interactionPadding') ?? 18);
    if (!Number.isFinite(padding) || padding < 0) fail('invalid interaction padding');
    const decoration = map.layers.find(layer => layer.objects?.includes(object))!.name === 'decoration';
    const opacity = Number(property(object.properties, 'opacity') ?? 1);
    if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) fail('invalid object opacity');
    return { ...rect, id: object.id, texture: tile.image.replace('.png', ''), bodies, exhibit, padding, decoration, opacity };
  });
  if (content.some(entry => !placedIds.has(entry.id))) fail('unplaced exhibit content');
  const solids = map.layers.filter(layer => layer.type === 'tilelayer').flatMap(layer => (layer.data ?? []).flatMap((gid, index) =>
    property(tiles.get(gid)?.properties, 'collides') === true
      ? [{ x: index % map.width * map.tilewidth, y: Math.floor(index / map.width) * map.tileheight, width: map.tilewidth, height: map.tileheight }] : []));
  solids.push(...objects.flatMap(object => object.bodies));
  return { width, height, tileSize: map.tilewidth, spawn, exit, objects, solids };
}

// The same 12-by-8 feet body used by Arcade Physics, including after returning from Punch-Out.
export function canStandAt(x: number, y: number, world: ReturnType<typeof loadWorld>) {
  return Number.isFinite(x) && Number.isFinite(y) && x >= 6 && y >= 4 && x <= world.width - 6 && y <= world.height - 4
    && !world.solids.some(body => x + 6 > body.x && x - 6 < body.x + body.width && y + 4 > body.y && y - 4 < body.y + body.height);
}

export function nearRect(x: number, y: number, rect: Rect, padding = 0) {
  return Math.hypot(Math.max(rect.x - x, 0, x - rect.x - rect.width), Math.max(rect.y - y, 0, y - rect.y - rect.height)) <= padding;
}

export function nearbyExhibit(x: number, y: number, objects: PlacedObject[]) {
  return objects.filter(object => object.exhibit && nearRect(x, y, object.bodies[0], object.padding))
    .sort((a, b) => Math.hypot(x - a.bodies[0].x - a.bodies[0].width / 2, y - a.bodies[0].y - a.bodies[0].height / 2)
      - Math.hypot(x - b.bodies[0].x - b.bodies[0].width / 2, y - b.bodies[0].y - b.bodies[0].height / 2) || a.id - b.id)[0];
}
