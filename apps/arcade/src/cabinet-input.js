export const cabinetButtons = [
  { node: 'Cylinder006', action: 'read', label: 'A: Space Read' },
  { node: 'Cylinder007', action: 'open', label: 'B: E Open' },
  { node: 'CabinetQuit', action: 'menu', label: 'Exit: Q Menu' },
];

export function joystickDirection(dx, dy, deadZone = 8) {
  if (Math.hypot(dx, dy) < deadZone) return null;
  return Math.abs(dx) > Math.abs(dy)
    ? (dx > 0 ? 'right' : 'left')
    : (dy > 0 ? 'down' : 'up');
}
