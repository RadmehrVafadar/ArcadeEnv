export type Direction = 'up' | 'down' | 'left' | 'right';
export const directionKeys: Record<string, Direction> = {
  w: 'up', arrowup: 'up', s: 'down', arrowdown: 'down',
  a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right',
};

export class HeldInput {
  private held = new Map<string, Direction>();
  press(source: string, direction: Direction) { if (!this.held.has(source)) this.held.set(source, direction); }
  release(source: string) { this.held.delete(source); }
  clear() { this.held.clear(); }
  get direction(): Direction | undefined { const values = [...this.held.values()]; return values[values.length - 1]; }
}

export function bindInput(root: HTMLElement, input: HeldInput, action: (open: boolean) => void, exit: () => void) {
  const controller = new AbortController();
  const options = { signal: controller.signal };
  const clear = () => {
    input.clear();
    root.querySelectorAll('.pressed').forEach(button => button.classList.remove('pressed'));
  };
  document.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    // Native focused buttons retain Enter/Space activation without duplicate game actions.
    if ((event.target instanceof HTMLButtonElement || event.target instanceof HTMLAnchorElement) && (key === ' ' || key === 'enter')) return;
    if (directionKeys[key]) { event.preventDefault(); input.press(`key:${key}`, directionKeys[key]); }
    if (key === ' ' || key === 'e') { event.preventDefault(); if (!event.repeat) action(key === 'e'); }
    if (key === 'q' && !event.repeat) exit();
  }, options);
  document.addEventListener('keyup', event => input.release(`key:${event.key.toLowerCase()}`), options);
  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-direction]')) {
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      input.press(`pointer:${event.pointerId}`, button.dataset.direction as Direction);
      button.classList.add('pressed');
    }, options);
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      button.addEventListener(type, event => {
        input.release(`pointer:${(event as PointerEvent).pointerId}`);
        button.classList.remove('pressed');
      }, options);
    }
  }
  root.querySelector('.action-read')!.addEventListener('click', () => action(false), options);
  root.querySelector('.action-open')!.addEventListener('click', () => action(true), options);
  window.addEventListener('blur', clear, options);
  document.addEventListener('visibilitychange', clear, options);
  return () => { clear(); controller.abort(); };
}
