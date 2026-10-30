import type { CabinetInput } from '../cabinet-navigation';
export type Direction = 'up' | 'down' | 'left' | 'right';
export const directionKeys: Record<string, Direction> = {
  w: 'up', arrowup: 'up', s: 'down', arrowdown: 'down',
  a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right',
};
export class HeldInput {
  private held = new Map<string, Direction>();
  press(source: string, direction: Direction) { if (this.held.get(source) !== direction) { this.held.delete(source); this.held.set(source, direction); } }
  release(source: string) { this.held.delete(source); }
  clear(prefix = '') { for (const source of this.held.keys()) if (source.startsWith(prefix)) this.held.delete(source); }
  get direction(): Direction | undefined { const values = [...this.held.values()]; return values[values.length - 1]; }
}
export function bindInput(root: HTMLElement, input: HeldInput, action: (open: boolean) => void, exit: () => void, connection: (connected: boolean) => void, resume: () => void) {
  const controller = new AbortController();
  const options = { signal: controller.signal };
  let connected = false;
  const adapter: CabinetInput = {
    connect() { connected = true; root.classList.add('cabinet-connected'); connection(true); },
    disconnect() { adapter.reset(); connected = false; root.classList.remove('cabinet-connected'); connection(false); },
    reset() { input.clear('cabinet:'); },
    setDirection(source, direction) {
      if (!connected) return;
      resume();
      const key = `cabinet:${source}`;
      if (direction && ['up', 'down', 'left', 'right'].includes(direction)) input.press(key, direction as Direction);
      else input.release(key);
    },
    action(value) { if (connected) { resume(); if (value === 'menu') exit(); else if (value === 'read' || value === 'open') action(value === 'open'); } },
    setDisplayScale(scale) {
      if (!(scale > 0)) return;
      root.style.setProperty('--cabinet-font-size', `${Math.min(48, Math.max(18, 12 / scale))}px`);
      const frame = window.frameElement?.getBoundingClientRect();
      const projection = frame?.width ? window.innerWidth / frame.width : 0;
      root.style.setProperty('--cabinet-inset-left', `${frame ? Math.max(0, -frame.left) * projection : 0}px`);
      root.style.setProperty('--cabinet-inset-right', `${frame ? Math.max(0, frame.right - window.parent.innerWidth) * projection : 0}px`);
    },
  };
  document.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    if (directionKeys[key]) { event.preventDefault(); input.press(`key:${key}`, directionKeys[key]); }
    if (key === 'z' || key === 'x') { event.preventDefault(); if (!event.repeat) action(key === 'x'); }
    if (key === 'q' && !event.repeat) exit();
  }, options);
  document.addEventListener('keyup', event => input.release(`key:${event.key.toLowerCase()}`), options);
  window.addEventListener('blur', () => queueMicrotask(() => {
    try { if (window.parent.document.hasFocus()) return; } catch { /* Cross-origin pages cannot inspect parent focus. */ }
    input.clear();
  }), options);
  document.addEventListener('visibilitychange', () => { if (document.hidden) input.clear(); }, options);
  window.arcadeControls = adapter;
  window.dispatchEvent(new Event('arcade-controls-ready'));
  return () => { input.clear(); adapter.disconnect(); controller.abort(); if (window.arcadeControls === adapter) delete window.arcadeControls; };
}
