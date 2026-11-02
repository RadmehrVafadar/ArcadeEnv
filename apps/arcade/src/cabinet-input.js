export const cabinetButtons = [
  { node: 'Cylinder006', action: 'read', label: 'Z Read' },
  { node: 'Cylinder007', action: 'open', label: 'X Open' },
  { node: 'CabinetQuit', action: 'menu', label: 'Start: C Menu' },
];

export const cabinetKeyDirections = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' };
export const cabinetKeyActions = { z: 'read', x: 'open', c: 'menu' };

export function joystickDirection(dx, dy, deadZone = 8) {
  if (Math.hypot(dx, dy) < deadZone) return null;
  return Math.abs(dx) > Math.abs(dy)
    ? (dx > 0 ? 'right' : 'left')
    : (dy > 0 ? 'down' : 'up');
}
