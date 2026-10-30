import type { Exhibit } from './content.ts';
export class MuseumUI {
  private dialogue = document.querySelector<HTMLElement>('.dialogueBox')!;
  private prompt = document.querySelector<HTMLElement>('.actionPrompt')!;
  private current = '';
  private moved = false;
  private connected = false;
  setConnected(connected: boolean) { this.connected = connected; if (!this.moved) this.welcome(); }
  private welcome() {
    this.dialogue.textContent = this.connected && window.matchMedia('(pointer: coarse)').matches
      ? 'Joystick: move   Z: read   X: open   Start: menu'
      : 'Welcome to my museum. Move: WASD or arrow keys. Z: read / X: open / Q: exit.';
  }
  ready() { document.querySelector<HTMLElement>('.loading')!.hidden = true; this.welcome(); this.dialogue.hidden = false; }
  update(moved: boolean, exhibit?: Exhibit, atExit = false) {
    if (moved && !this.moved) { this.moved = true; this.dialogue.hidden = true; }
    const next = atExit ? 'exit' : exhibit?.id ?? '';
    if (next !== this.current && this.moved) this.dialogue.hidden = true;
    this.current = next;
    const message = atExit ? 'Z or X to exit' : exhibit ? `${exhibit.title} · Z to read · X to open` : '';
    if (this.prompt.textContent !== message) this.prompt.textContent = message;
    this.prompt.hidden = !message;
  }
  show(exhibit: Exhibit) { this.dialogue.textContent = `${exhibit.title}. ${exhibit.description}`; this.dialogue.hidden = false; }
}
export function showError(error: unknown) {
  console.error(error);
  const loading = document.querySelector<HTMLElement>('.loading')!;
  loading.hidden = false;
  loading.textContent = 'The museum could not load. Reload to try again, or return to the menu.';
}
