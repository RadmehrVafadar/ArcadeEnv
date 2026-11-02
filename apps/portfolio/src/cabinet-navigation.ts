export interface CabinetInput {
  connect(): void
  disconnect(): void
  reset(): void
  setDirection(source: string, direction: string | null): void
  action(action: string): void
  setButton?(source: string, action: string, pressed: boolean, cancelled?: boolean): void
  setDisplayScale(scale: number): void
}

declare global {
  interface Window { arcadeControls?: CabinetInput }
}

export function installCabinetNavigation(root: HTMLElement, home: string) {
  const document = root.ownerDocument
  const page = document.defaultView!
  const held = new Map<string, string>()
  const article = root.querySelector<HTMLElement>('[data-cabinet-scroll]')
  let scrollFrame: number | undefined
  let previousTime: number | undefined
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
  const scroll = (time: number) => {
    // Cap elapsed time so a delayed frame cannot jump past the reading position.
    const distance = Math.min(time - (previousTime ?? time - 16), 50) * 0.3
    previousTime = time
    const directions = [...held.values()]
    const x = Number(directions.includes('right')) - Number(directions.includes('left'))
    const y = Number(directions.includes('down')) - Number(directions.includes('up'))
    if (x) {
      const overflow = Array.from(article!.querySelectorAll<HTMLElement>('pre, .table-scroll')).find(element => {
        const bounds = element.getBoundingClientRect()
        return element.scrollWidth > element.clientWidth && bounds.bottom > 0 && bounds.top < page.innerHeight
      })
      // Wide code and tables scroll independently of the reading column.
      const target = overflow || page
      target.scrollBy({ left: x * distance, behavior: 'instant' })
    }
    if (y) page.scrollBy({ top: y * distance, behavior: 'instant' })
    scrollFrame = page.requestAnimationFrame(scroll)
  }
  // Focus can briefly report false while moving from the iframe to cabinet hardware.
  const blur = () => queueMicrotask(() => { if (!page.parent.document.hasFocus()) input.reset() })
  const visibility = () => { if (document.hidden) input.reset() }
  const keydown = (event: KeyboardEvent) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
    const direction = { ArrowDown: 'down', s: 'down', ArrowUp: 'up', w: 'up', ArrowRight: 'right', d: 'right', ArrowLeft: 'left', a: 'left' }[key]
    if (direction) {
      event.preventDefault()
      input.setDirection('keyboard:' + event.code, direction)
    } else if (['z', 'Z', 'x', 'X', 'c', 'C'].includes(event.key)) {
      event.preventDefault()
      if (!event.repeat) input.action(({ z: 'read', x: 'open', c: 'menu' })[event.key.toLowerCase() as 'z' | 'x' | 'c'])
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
      const first = root.querySelector<HTMLAnchorElement>('[data-cabinet-default] a[href]')
      select(first ? links().indexOf(first) : 0)
      document.addEventListener('keydown', keydown)
      document.addEventListener('keyup', keyup)
      root.addEventListener('focusin', focusin)
      page.addEventListener('blur', blur)
      document.addEventListener('visibilitychange', visibility)
    },
    disconnect() {
      if (!connected) return
      connected = false
      input.reset()
      links().forEach(link => link.removeAttribute('data-cabinet-selected'))
      document.removeEventListener('keydown', keydown)
      document.removeEventListener('keyup', keyup)
      root.removeEventListener('focusin', focusin)
      page.removeEventListener('blur', blur)
      document.removeEventListener('visibilitychange', visibility)
    },
    reset() {
      held.clear()
      if (scrollFrame !== undefined) page.cancelAnimationFrame(scrollFrame)
      scrollFrame = undefined
      previousTime = undefined
    },
    setDirection(source, direction) {
      if (!connected) return
      if (!direction) {
        held.delete(source)
        if (article && !held.size) input.reset()
        return
      }
      if (held.get(source) === direction) return
      held.set(source, direction)
      if (article) {
        if (scrollFrame === undefined) scrollFrame = page.requestAnimationFrame(scroll)
        return
      }
      select(selected + (['down', 'right'].includes(direction) ? 1 : -1))
    },
    action(action) {
      if (!connected) return
      if (action === 'menu') {
        input.reset()
        page.location.href = home
      } else if (action === 'read' || action === 'open') {
        // Keep native link activation synchronous, including Resume's new tab.
        const link = action === 'open' ? root.querySelector<HTMLAnchorElement>('[data-cabinet-back]') : links()[selected]
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
