import type { Exhibit } from './content.ts';
export class MuseumUI {
  private dialogue = document.querySelector<HTMLElement>('.dialogueBox')!;
  private current = '';
  private moved = false;
  private connected = false;
  setConnected(connected: boolean) { this.connected = connected; if (!this.moved) this.welcome(); }
  private welcome() {
    this.current = '';
    const cabinet = this.connected && window.matchMedia('(pointer: coarse)').matches;
    const lines = cabinet
      ? [['startupControl', 'Joystick: move'], ['startupControl', 'X: open'], ['startupControl startupActions', 'Start: menu']]
      : [['startupWelcome', 'Welcome to my project showcase!'], ['startupControl', 'Move: WASD or arrow keys'], ['startupControl startupActions', 'X: open / Q: exit']];
    this.dialogue.classList.add('startupInstructions');
    this.dialogue.replaceChildren(...lines.map(([className, text]) => {
      const line = document.createElement('span'); line.className = className; line.textContent = text; return line;
    }));
  }
  ready() { document.querySelector<HTMLElement>('.loading')!.hidden = true; this.welcome(); this.dialogue.hidden = false; }
  update(moved: boolean, exhibit?: Exhibit, atExit = false) {
    this.moved ||= moved;
    if (atExit) this.describe('exit', 'The entrance. Return to the portfolio menu.', 'X to exit');
    else if (exhibit) this.show(exhibit);
    else {
      this.current = '';
      if (this.moved && !this.dialogue.hidden) this.dialogue.hidden = true;
    }
  }
  show(exhibit: Exhibit) {
    this.describe(exhibit.id, `${exhibit.title}. ${exhibit.description}`, 'X to open');
  }
  private describe(id: string, text: string, action: string) {
    if (this.current !== id) {
      this.current = id;
      this.dialogue.classList.remove('startupInstructions');
      const hint = document.createElement('span');
      hint.className = 'exhibitActions'; hint.textContent = action;
      this.dialogue.replaceChildren(document.createTextNode(text), hint);
    }
    if (this.dialogue.hidden) this.dialogue.hidden = false;
  }
}
export function showError(error: unknown) {
  console.error(error);
  const loading = document.querySelector<HTMLElement>('.loading')!;
  loading.hidden = false;
  loading.textContent = 'The museum could not load. Reload to try again, or return to the menu.';
}
