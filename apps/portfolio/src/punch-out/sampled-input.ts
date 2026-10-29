import type { NESButton } from './input'

export function createSampledInput(adapter: {
  send(button: NESButton, pressed: boolean): void
  getFrame(): number
  requestFrame(callback: () => void): number
  cancelFrame(id: number): void
}) {
  const states = new Map<NESButton, { pressed: boolean; at: number; queue: boolean[] }>()
  let request: number | undefined
  const flush = () => {
    request = undefined
    const frame = adapter.getFrame()
    for (const [button, state] of states) {
      // A press must reach a NES poll; a release must be sampled before the next press.
      if (state.queue.length && frame - state.at >= (state.pressed ? 2 : 1)) {
        state.pressed = state.queue.shift()!
        state.at = frame
        adapter.send(button, state.pressed)
      }
    }
    if ([...states.values()].some(state => state.queue.length)) request = adapter.requestFrame(flush)
  }
  return {
    send(button: NESButton, pressed: boolean) {
      const state = states.get(button) || { pressed: false, at: -Infinity, queue: [] }
      if ((state.queue[state.queue.length - 1] ?? state.pressed) === pressed) return
      state.queue.push(pressed)
      states.set(button, state)
      if (request !== undefined) adapter.cancelFrame(request)
      flush()
    },
    reset() {
      if (request !== undefined) adapter.cancelFrame(request)
      request = undefined
      for (const [button, state] of states) if (state.pressed) adapter.send(button, false)
      states.clear()
    },
  }
}
