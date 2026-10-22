import type { Exhibit } from './content.ts';

export class MuseumUI {
  private dialogue = document.querySelector<HTMLElement>('.dialogueBox')!;
  private prompt = document.querySelector<HTMLElement>('.actionPrompt')!;
  private read = document.querySelector<HTMLButtonElement>('.action-read')!;
  private open = document.querySelector<HTMLButtonElement>('.action-open')!;
  private current = '';
  private moved = false;

  ready() {
    document.querySelector<HTMLElement>('.loading')!.hidden = true;
    this.dialogue.textContent = window.matchMedia('(pointer: coarse)').matches
      ? 'Welcome to my museum. Move: WASD or arrow keys, or use the D-pad. Exit: Q or Menu.'
      : 'Welcome to my museum. Move: WASD or arrow keys. Space to read, E to open. Exit: Q or Menu.';
    this.dialogue.hidden = false;
  }

  update(moved: boolean, exhibit?: Exhibit, atExit = false) {
    if (moved && !this.moved) { this.moved = true; this.dialogue.hidden = true; }
    const next = atExit ? 'exit' : exhibit?.id ?? '';
    if (next !== this.current && this.moved) this.dialogue.hidden = true;
    this.current = next;
    const message = atExit ? 'Space or E to exit' : exhibit ? `${exhibit.title} · Space to read · E to open` : '';
    if (this.prompt.textContent !== message) this.prompt.textContent = message;
    this.prompt.hidden = !message;
    this.read.disabled = this.open.disabled = !next;
  }

  show(exhibit: Exhibit) {
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
