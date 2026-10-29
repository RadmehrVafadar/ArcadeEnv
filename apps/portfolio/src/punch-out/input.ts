export type NESButton = 'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'start' | 'select'
type Clock = { now(): number; setTimeout(callback: () => void, delay: number): number; clearTimeout(id: number): void }
const punches = { read: 'b', open: 'a' } as const
const directions = new Set(['up', 'down', 'left', 'right'])

export function createPunchOutInput(
  adapter: { send(button: NESButton, pressed: boolean): void; exit(): void },
  clock: Clock = { now: Date.now, setTimeout: (callback, delay) => window.setTimeout(callback, delay), clearTimeout: id => window.clearTimeout(id) },
) {
  const sources = new Map<string, string>()
  const movement = new Map<string, NESButton>()
  const outputs = new Map<NESButton, Set<string>>()
  const timers = new Set<number>()
  const pending = new Map<string, { at: number; timer: number }>()
  const presses = new Map<string, { at: number; timer?: number }>()
  let chord = false
  let resetTimer: number | undefined
  let pulseId = 0
  const held = (action: string) => [...sources.values()].includes(action)
  const schedule = (callback: () => void, delay: number) => {
    const id = clock.setTimeout(() => { timers.delete(id); callback() }, delay)
    timers.add(id)
    return id
  }
  const cancel = (id: number | undefined) => {
    if (id === undefined) return
    clock.clearTimeout(id)
    timers.delete(id)
  }
  const output = (button: NESButton, source: string, pressed: boolean) => {
    const owners = outputs.get(button) || new Set<string>()
    const before = owners.size > 0
    if (pressed) owners.add(source)
    else owners.delete(source)
    outputs.set(button, owners)
    if (before !== (owners.size > 0)) adapter.send(button, owners.size > 0)
  }
  const pulse = (button: NESButton) => {
    const source = 'tap:' + pulseId++
    output(button, source, true)
    // Even a tap shorter than one NES frame must reach the core.
    schedule(() => output(button, source, false), 32)
  }
  const hold = (button: NESButton, source: string, pressed: boolean) => {
    const press = presses.get(source)
    cancel(press?.timer)
    if (pressed) {
      presses.set(source, { at: press?.at ?? clock.now() })
      output(button, source, true)
    } else if (press) {
      const release = () => { presses.delete(source); output(button, source, false) }
      const remaining = 32 - (clock.now() - press.at)
      if (remaining > 0) press.timer = schedule(release, remaining)
      else release()
    }
  }
  const reset = () => {
    timers.forEach(id => clock.clearTimeout(id))
    timers.clear()
    pending.clear()
    presses.clear()
    sources.clear()
    movement.clear()
    chord = false
    resetTimer = undefined
    for (const [button, owners] of outputs) if (owners.size) adapter.send(button, false)
    outputs.clear()
  }
  return {
    reset,
    setDirection(source: string, direction: string | null) {
      if (direction && !directions.has(direction)) return
      const previous = movement.get(source)
      if (previous === direction) return
      if (previous) output(previous, 'direction:' + source, false)
      movement.delete(source)
      if (direction) {
        movement.set(source, direction as NESButton)
        output(direction as NESButton, 'direction:' + source, true)
      }
    },
    setButton(source: string, action: string, pressed: boolean, cancelled = false) {
      if (cancelled) { reset(); return }
      if (!['read', 'open', 'menu', 'start', 'select'].includes(action)) return
      if (pressed === (sources.get(source) === action)) return
      const wasHeld = held(action)
      if (pressed) sources.set(source, action)
      else sources.delete(source)
      if (wasHeld === held(action)) return
      if (action === 'start' || action === 'select') {
        hold(action, 'direct:' + action, pressed)
      } else if (action === 'menu') {
        if (pressed) {
          resetTimer = schedule(() => { reset(); adapter.exit() }, 600)
        } else {
          cancel(resetTimer)
          resetTimer = undefined
          pulse('start')
        }
      } else {
        const button = punches[action as keyof typeof punches]
        if (chord) {
          if (!held('read') && !held('open')) { chord = false; hold('select', 'chord', false) }
          return
        }
        if (pressed) {
          const other = pending.get(action === 'read' ? 'open' : 'read')
          if (other && clock.now() - other.at <= 60) {
            pending.forEach(value => cancel(value.timer))
            pending.clear()
            chord = true
            hold('select', 'chord', true)
          } else {
            pending.set(action, { at: clock.now(), timer: schedule(() => {
              pending.delete(action)
              hold(button, 'punch:' + action, true)
            }, 60) })
          }
        } else if (pending.has(action)) {
          cancel(pending.get(action)!.timer)
          pending.delete(action)
          pulse(button)
        } else {
          hold(button, 'punch:' + action, false)
        }
      }
    },
  }
}
