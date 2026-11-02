import type { CabinetInput } from '../cabinet-navigation'
import { createPunchOutInput } from './input'
import type { RuntimeWindow } from './runtime'

const status = document.querySelector<HTMLElement>('#status')!
const pauseButton = document.querySelector<HTMLButtonElement>('#pause-button')!
const pauseLabel = pauseButton.querySelector<HTMLElement>('span')!
let state = 'loading'
let connected = false
let frame: HTMLIFrameElement | undefined
let timeout: number | undefined
let session = 0
const current = () => (frame?.contentWindow as RuntimeWindow | undefined)?.punchOutRuntime
const setState = (value: string, message = '') => {
  state = value
  document.body.dataset.state = value
  status.textContent = message
  pauseButton.hidden = value !== 'playing' && value !== 'paused'
  pauseLabel.textContent = value === 'paused' ? 'Resume' : 'Pause'
  pauseButton.setAttribute('aria-label', `${pauseLabel.textContent} game`)
}
const clearSession = () => {
  session++
  clearTimeout(timeout)
  current()?.stop()
  // Replacing the realm cancels loader/core requests and destroys WASM, audio, listeners and timers.
  if (frame) { frame.src = 'about:blank'; frame.remove(); frame = undefined }
}
const exit = () => {
  resetControls()
  clearSession()
  window.location.href = import.meta.env.BASE_URL + 'src/portfolio-game/game.html'
}
const controller = createPunchOutInput({
  send(button, pressed) {
    if (state === 'paused' && button === 'start' && pressed) { togglePause(); return }
    if (state === 'ready' && button === 'start' && pressed) { setState('playing'); current()?.resume() }
    if (state === 'playing') current()?.send(button, pressed)
  },
  exit,
})
const resetControls = () => { controller.reset(); current()?.reset() }
const togglePause = () => {
  if (document.hidden || (state !== 'playing' && state !== 'paused')) return
  resetControls()
  if (state === 'playing') {
    setState('paused', 'Paused')
    current()?.pause()
  } else {
    setState('playing')
    current()?.resume()
  }
}
pauseButton.addEventListener('click', togglePause)
for (const type of ['keydown', 'keyup']) pauseButton.addEventListener(type, event => {
  // Preserve native button activation instead of routing Enter/Space to the NES or cabinet.
  if (['Enter', ' '].includes((event as KeyboardEvent).key)) event.stopPropagation()
})
const start = () => {
  resetControls()
  clearSession()
  const attempt = session
  setState('loading', 'Loading the ring... Hold Start/Q for 3 seconds to return')
  const fail = () => {
    if (attempt !== session) return
    resetControls()
    clearSession()
    setState('error', 'The ring could not load. Z: retry / Hold Start/Q for 3 seconds to return')
  }
  timeout = window.setTimeout(fail, 45000)
  frame = document.createElement('iframe')
  frame.id = 'emulator-frame'
  frame.title = 'Punch-Out game'
  frame.allow = 'autoplay'
  frame.tabIndex = -1
  frame.src = import.meta.env.BASE_URL + 'src/punch-out/runtime.html'
  frame.onload = () => {
    if (attempt !== session) return
    const emulator = current()
    if (!emulator) { fail(); return }
    emulator.start(() => {
      if (attempt !== session) return
      clearTimeout(timeout)
      setState('ready', 'Press Start')
      emulator.pause()
    }, fail)
  }
  frame.onerror = fail
  document.querySelector('#viewport')!.append(frame)
}
const input: CabinetInput = {
  connect() { connected = true },
  disconnect() { connected = false; resetControls() },
  reset() { resetControls() },
  setDisplayScale(scale) {
    if (!(scale > 0)) return
    // Keep the full NES viewport inside the visible CRT when the original camera crops its edges.
    const width = Math.max(1, Math.min(innerWidth, (window.parent.innerWidth - 16) / scale))
    const height = Math.max(1, Math.min(innerHeight, (window.parent.innerHeight - 16) / scale))
    document.documentElement.style.setProperty('--game-width', `${width}px`)
    document.documentElement.style.setProperty('--game-height', `${height}px`)
    document.documentElement.style.setProperty('--display-scale', String(scale))
  },
  setDirection(source, direction) { if (state === 'playing' && !document.hidden) controller.setDirection(source, direction) },
  setButton(source, action, pressed, cancelled = false) {
    if (cancelled) { resetControls(); return }
    if (document.hidden) return
    current()?.unlock()
    if (action === 'pause') {
      if (pressed) togglePause()
      return
    }
    if (action === 'menu' || (state === 'paused' && action === 'start')) {
      controller.setButton(source, action, pressed)
      return
    }
    if (state !== 'playing') {
      if (state === 'error' && action === 'read' && pressed) start()
      else if (state === 'ready' && pressed && ['read', 'open', 'start'].includes(action)) {
        setState('playing')
        current()?.resume()
        if (action === 'start') controller.setButton(source, action, true)
      }
      return
    }
    controller.setButton(source, action, pressed)
  },
  action(action) {
    input.setButton!('activation', action, true)
    input.setButton!('activation', action, false)
  },
}
const directions: Record<string, string> = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' }
const actions: Record<string, string> = { z: 'read', x: 'open', q: 'menu', p: 'pause', Enter: 'start', Shift: 'select' }
for (const type of ['keydown', 'keyup']) document.addEventListener(type, event => {
  if (connected) return
  const keyEvent = event as KeyboardEvent
  const key = keyEvent.key.length === 1 ? keyEvent.key.toLowerCase() : keyEvent.key
  if (!directions[key] && !actions[key]) return
  event.preventDefault()
  if (keyEvent.repeat) return
  const source = 'keyboard:' + (keyEvent.code || key)
  if (directions[key]) input.setDirection(source, type === 'keydown' ? directions[key] : null)
  if (actions[key]) input.setButton!(source, actions[key], type === 'keydown')
})
window.addEventListener('blur', () => queueMicrotask(() => { if (!window.parent.document.hasFocus()) input.reset() }))
document.addEventListener('visibilitychange', () => {
  input.reset()
  if (document.hidden) { if (state === 'ready' || state === 'playing') current()?.pause() }
  else if (state === 'playing') current()?.resume()
})
window.addEventListener('pagehide', () => { input.reset(); clearSession() })
window.addEventListener('pageshow', event => { if (event.persisted) start() })
window.arcadeControls = input
window.dispatchEvent(new Event('arcade-controls-ready'))
start()
