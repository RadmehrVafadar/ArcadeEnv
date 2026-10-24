export interface CabinetInput {
  connect(): void
  disconnect(): void
  reset(): void
  setDirection(source: string, direction: string | null): void
  action(action: string): void
  setDisplayScale(scale: number): void
}

declare global {
  interface Window { arcadeControls?: CabinetInput }
}

export function installCabinetNavigation(root: HTMLElement, home: string) {
  const document = root.ownerDocument
  const page = document.defaultView!
  const held = new Map<string, string>()
  let connected = false
  let selected = 0
  const links = () => Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href]'))
  const select = (index: number, focus = true) => {
    const items = links()
    if (!items.length) return
    selected = (index + items.length) % items.length
    items.forEach((link, i) => link.toggleAttribute('data-cabinet-selected', i === selected))
    if (focus) items[selected].focus({ preventScroll: true })
  }
  const keydown = (event: KeyboardEvent) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
    const direction = { ArrowDown: 'down', s: 'down', ArrowUp: 'up', w: 'up', ArrowRight: 'right', d: 'right', ArrowLeft: 'left', a: 'left' }[key]
    if (direction) {
      event.preventDefault()
      input.setDirection('keyboard:' + event.code, direction)
    } else if (['z', 'Z', 'x', 'X', 'q', 'Q'].includes(event.key)) {
      event.preventDefault()
      if (!event.repeat) input.action(({ z: 'read', x: 'open', q: 'menu' })[event.key.toLowerCase() as 'z' | 'x' | 'q'])
    }
  }
  const keyup = (event: KeyboardEvent) => input.setDirection('keyboard:' + event.code, null)
  const focusin = (event: FocusEvent) => {
    const index = links().indexOf(event.target as HTMLAnchorElement)
    if (index >= 0) select(index, false)
  }
  const input: CabinetInput = {
    connect() {
      if (connected) return
      connected = true
      select(0)
      document.addEventListener('keydown', keydown)
      document.addEventListener('keyup', keyup)
      root.addEventListener('focusin', focusin)
    },
    disconnect() {
      if (!connected) return
      connected = false
      input.reset()
      links().forEach(link => link.removeAttribute('data-cabinet-selected'))
      document.removeEventListener('keydown', keydown)
      document.removeEventListener('keyup', keyup)
      root.removeEventListener('focusin', focusin)
    },
    reset() { held.clear() },
    setDirection(source, direction) {
      if (!connected) return
      if (!direction) { held.delete(source); return }
      if (held.get(source) === direction) return
      held.set(source, direction)
      select(selected + (['down', 'right'].includes(direction) ? 1 : -1))
    },
    action(action) {
      if (!connected) return
      if (action === 'menu') {
        input.reset()
        page.location.href = home
      } else if (action === 'read' || action === 'open') {
        // Keep native link activation synchronous, including Resume's new tab.
        const back = action === 'open' ? root.querySelector<HTMLAnchorElement>('[data-cabinet-back]') : null
        const link = back || links()[selected]
        link?.click()
      }
    },
    setDisplayScale() {},
  }
  page.arcadeControls = input
  page.dispatchEvent(new Event('arcade-controls-ready'))
  return () => {
    input.disconnect()
    if (page.arcadeControls === input) delete page.arcadeControls
  }
}
