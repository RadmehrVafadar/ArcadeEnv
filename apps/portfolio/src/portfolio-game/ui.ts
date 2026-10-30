import type { Exhibit } from './content.ts';
export class MuseumUI {
  private dialogue = document.querySelector<HTMLElement>('.dialogueBox')!;
  private prompt = document.querySelector<HTMLElement>('.actionPrompt')!;
  private current = '';
  private moved = false;
  private connected = false;
  setConnected(connected: boolean) { this.connected = connected; if (!this.moved) this.welcome(); }
  private welcome() {
    const cabinet = this.connected && window.matchMedia('(pointer: coarse)').matches;
    const lines = cabinet
      ? [['startupControl', 'Joystick: move'], ['startupControl', 'Z: read / X: open'], ['startupControl startupActions', 'Start: menu']]
      : [['startupWelcome', 'Welcome to my project showcase!'], ['startupControl', 'Move: WASD or arrow keys'], ['startupControl startupActions', 'Z: read / X: open / Q: exit']];
    this.dialogue.classList.add('startupInstructions');
    this.dialogue.replaceChildren(...lines.map(([className, text]) => {
      const line = document.createElement('span'); line.className = className; line.textContent = text; return line;
    }));
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
  show(exhibit: Exhibit) {
    this.dialogue.classList.remove('startupInstructions');
    this.dialogue.textContent = `${exhibit.title}. ${exhibit.description}`;
    this.dialogue.hidden = false;
  }
}
export function showError(error: unknown) {
  console.error(error);
  const loading = document.querySelector<HTMLElement>('.loading')!;
  loading.hidden = false;
  loading.textContent = 'The museum could not load. Reload to try again, or return to the menu.';
}
