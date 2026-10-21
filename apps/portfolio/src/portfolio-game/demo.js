import mapSource from './scene/showcase.tmj?raw';
import tilesetSource from './scene/exhibits.tsj?raw';
import { loadScene, movePlayer, playerBounds, nearbyExhibit, relocateExhibit, cameraTransform, overlaps } from './scene.js';

const map = JSON.parse(mapSource), tileset = JSON.parse(tilesetSource);
let scene;
try {
  scene = loadScene(map, tileset);
} catch (error) {
  document.querySelector('.demo-status').textContent = error.message;
  throw error;
}
const assets = import.meta.glob('./scene/assets/*.png', { eager: true, query: '?url', import: 'default' });
const assetURL = path => {
  const url = assets[`./scene/${path}`];
  if (!url) throw new Error(`Missing scene asset: ${path}`);
  return url;
};
const world = document.querySelector('.demo-world');
const camera = document.querySelector('.demo-camera');
const character = document.querySelector('.demo-player');
const geometry = document.querySelector('.demo-geometry');
const status = document.querySelector('.demo-status');
const message = document.querySelector('.demo-message');
const instructions = document.querySelector('.demo-instructions');
const normalInstructions = instructions.textContent;
const room = document.createElement('img');
room.className = 'demo-room';
room.alt = '';
room.draggable = false;
room.src = assetURL(scene.room);
world.prepend(room);
world.style.width = `${scene.width}px`;
world.style.height = `${scene.height}px`;
let player = { ...scene.spawn }, editing = false, debug = false, drag = null, lastFrame = null, previousNearby = null;
let transform;
const held = new Map();
const keys = { ArrowUp: 'up', KeyW: 'up', ArrowLeft: 'left', KeyA: 'left', ArrowDown: 'down', KeyS: 'down', ArrowRight: 'right', KeyD: 'right' };
const vectors = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const originalPositions = scene.exhibits.map(({ x, y }) => ({ x, y }));

const box = (kind, label) => {
  const element = document.createElement('div');
  element.className = `geometry-box ${kind}`;
  if (label) element.dataset.collider = label;
  geometry.append(element);
  return element;
};
const placeBox = (element, rect) => {
  element.style.left = `${rect.x}px`;
  element.style.top = `${rect.y}px`;
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;
  for (const key of ['x', 'y', 'width', 'height']) element.dataset[key] = rect[key];
};
placeBox(box('floor'), scene.walkable);
placeBox(box('exit'), scene.exit);
const feet = box('feet');
const exhibits = scene.exhibits.map(exhibit => {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = 'demo-exhibit';
  element.dataset.exhibit = exhibit.id;
  element.setAttribute('aria-label', `Move ${exhibit.id}`);
  element.tabIndex = -1;
  const image = document.createElement('img');
  image.src = assetURL(exhibit.image);
  image.alt = exhibit.id;
  image.draggable = false;
  element.append(image);
  world.append(element);
  const solid = box('solid', exhibit.id), interaction = box('interaction');
  element.addEventListener('pointerdown', event => {
    if (!editing || drag || event.button !== 0) return;
    event.preventDefault();
    stopMovement();
    element.focus({ preventScroll: true });
    element.setPointerCapture(event.pointerId);
    drag = { exhibit, pointer: event.pointerId, startX: event.clientX, startY: event.clientY, x: exhibit.x, y: exhibit.y };
  });
  element.addEventListener('pointermove', event => {
    if (!drag || drag.exhibit !== exhibit || drag.pointer !== event.pointerId) return;
    relocateExhibit(scene, exhibit, Math.round(drag.x + (event.clientX - drag.startX) / transform.scale), Math.round(drag.y + (event.clientY - drag.startY) / transform.scale), player);
    render();
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    element.addEventListener(type, event => { if (drag?.pointer === event.pointerId) drag = null; });
  }
  element.addEventListener('keydown', event => {
    if (!editing || !keys[event.code]) return;
    event.preventDefault();
    event.stopPropagation();
    const [dx, dy] = vectors[keys[event.code]];
    relocateExhibit(scene, exhibit, exhibit.x + dx * 8, exhibit.y + dy * 8, player);
    render();
  });
  return { exhibit, element, solid, interaction };
});

function render() {
  transform = cameraTransform(scene, camera.clientWidth, camera.clientHeight, player);
  world.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`;
  character.style.transform = `translate(${player.x - 32}px, ${player.y - 64}px)`;
  character.style.zIndex = Math.round(player.y);
  character.dataset.x = player.x;
  character.dataset.y = player.y;
  placeBox(feet, playerBounds(player));
  for (const { exhibit, element, solid, interaction } of exhibits) {
    Object.assign(element.style, { left: `${exhibit.x}px`, top: `${exhibit.y}px`, width: `${exhibit.width}px`, height: `${exhibit.height}px`, zIndex: Math.round(exhibit.collider.y + exhibit.collider.height) });
    element.tabIndex = editing ? 0 : -1;
    element.style.pointerEvents = editing ? 'auto' : 'none';
    placeBox(solid, exhibit.collider);
    placeBox(interaction, exhibit.interaction);
  }
  const nearby = nearbyExhibit(scene, player);
  const exit = overlaps(playerBounds(player), scene.exit);
  const text = editing ? 'Drag an exhibit, or focus it and use arrows / WASD. Escape returns to walking.'
    : exit ? 'Door - Space or E to exit' : nearby ? `${nearby.id} - Space to read / E to open` : 'Explore the room. Walk up to an exhibit to interact.';
  if (status.textContent !== text) status.textContent = text;
  if (nearby !== previousNearby) message.hidden = true;
  previousNearby = nearby;
  world.dataset.edit = editing;
  world.dataset.debug = debug;
}

function interact(open) {
  if (editing) return;
  if (overlaps(playerBounds(player), scene.exit)) { window.location.href = import.meta.env.BASE_URL; return; }
  const nearby = nearbyExhibit(scene, player);
  if (!nearby) return;
  if (open) { stopMovement(); window.open(nearby.url, '_blank', 'noopener'); }
  else { message.querySelector('p').textContent = nearby.text; message.hidden = false; }
}

function stopMovement() {
  held.clear();
  for (const button of document.querySelectorAll('[data-direction]')) button.classList.remove('pressed');
  character.setAttribute('walking', 'false');
}

document.addEventListener('keydown', event => {
  if (event.code === 'Escape') {
    message.hidden = true;
    if (editing) document.querySelector('#edit').click();
  }
  if (keys[event.code] && !editing) { event.preventDefault(); held.set(event.code, keys[event.code]); }
  // Space keeps its native activation when an interface control has keyboard focus.
  if (event.code === 'Space' && event.target.closest('button, a')) return;
  if ((event.code === 'Space' || event.code === 'KeyE') && !event.repeat) { event.preventDefault(); interact(event.code === 'KeyE'); }
});
document.addEventListener('keyup', event => held.delete(event.code));
for (const button of document.querySelectorAll('[data-direction]')) {
  const id = `pointer-${button.dataset.direction}`;
  button.addEventListener('pointerdown', event => {
    if (editing || event.button !== 0) return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    held.set(id, button.dataset.direction);
    button.classList.add('pressed');
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, () => { held.delete(id); button.classList.remove('pressed'); });
}
window.addEventListener('blur', () => { stopMovement(); drag = null; lastFrame = null; });
document.addEventListener('visibilitychange', () => { if (document.hidden) { stopMovement(); drag = null; lastFrame = null; } });
document.querySelector('#read').addEventListener('click', () => interact(false));
document.querySelector('#open').addEventListener('click', () => interact(true));
message.querySelector('button').addEventListener('click', () => { message.hidden = true; });
document.querySelector('#geometry').addEventListener('click', event => {
  debug = !debug;
  event.currentTarget.setAttribute('aria-pressed', debug);
  document.querySelector('.demo-legend').hidden = !debug;
  render();
});
document.querySelector('#edit').addEventListener('click', event => {
  editing = !editing;
  event.currentTarget.setAttribute('aria-pressed', editing);
  stopMovement();
  drag = null;
  message.hidden = true;
  instructions.textContent = editing ? 'Move an exhibit with its geometry. Changes are temporary; Reset scene restores the Tiled map.' : normalInstructions;
  render();
});
document.querySelector('#reset').addEventListener('click', () => {
  stopMovement();
  drag = null;
  player = { ...scene.spawn };
  scene.exhibits.forEach((exhibit, index) => Object.assign(exhibit, originalPositions[index]));
  message.hidden = true;
  render();
});
new ResizeObserver(render).observe(camera);
function step(timestamp) {
  const elapsed = lastFrame === null ? 0 : Math.min((timestamp - lastFrame) / 1000, 0.05);
  lastFrame = timestamp;
  const direction = Array.from(held.values()).at(-1);
  if (direction && !editing) {
    const [dx, dy] = vectors[direction];
    player = movePlayer(scene, player, dx * 240 * elapsed, dy * 240 * elapsed);
    character.setAttribute('facing', direction);
  }
  character.setAttribute('walking', Boolean(direction && !editing));
  render();
  requestAnimationFrame(step);
}
render();
requestAnimationFrame(step);
