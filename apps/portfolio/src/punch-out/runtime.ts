import type { NESButton } from './input'
import { createSampledInput } from './sampled-input'

const dataPath = 'https://cdn.emulatorjs.org/4.2.3/data/'
const rom = "Mike Tyson's Punch-Out!! (U) (PRG1) [!].nes"
export const romURL = 'https://nesninja.com/downloadsnes/' + encodeURIComponent(rom).replace(/[!'()*]/g, value => '%' + value.charCodeAt(0).toString(16).toUpperCase())
const keys: Record<NESButton, [string, string, number]> = {
  b: ['z', 'KeyZ', 90], a: ['x', 'KeyX', 88], start: ['Enter', 'Enter', 13], select: ['Shift', 'ShiftRight', 16],
  up: ['ArrowUp', 'ArrowUp', 38], down: ['ArrowDown', 'ArrowDown', 40], left: ['ArrowLeft', 'ArrowLeft', 37], right: ['ArrowRight', 'ArrowRight', 39],
}
const coreEvents = new WeakSet<Event>()
type Emulator = {
  on(event: string, callback: () => void): void
  gameManager?: { getFrameNum(): number }
  canvas: HTMLCanvasElement
  pause(): void
  play(): void
  Module?: { pauseMainLoop?(): void; AL?: { currentCtx?: { audioCtx?: AudioContext } } }
}
const host = window as Window & { EJS_emulator?: Emulator }
const audio = () => host.EJS_emulator?.Module?.AL?.currentCtx?.audioCtx
const sampled = createSampledInput({
  getFrame: () => host.EJS_emulator?.gameManager?.getFrameNum() ?? 0,
  requestFrame: callback => requestAnimationFrame(callback),
  cancelFrame: id => cancelAnimationFrame(id),
  send(button, pressed) {
    // 4.2.3 legacy NES cores reliably accept their direct keyboard interface.
    if (pressed) document.querySelector<HTMLElement>('#emulator')!.focus({ preventScroll: true })
    const [key, code, keyCode] = keys[button]
    const event = new KeyboardEvent(pressed ? 'keydown' : 'keyup', { key, code, keyCode, which: keyCode, bubbles: true })
    coreEvents.add(event)
    host.EJS_emulator?.canvas.dispatchEvent(event)
  },
})

export const runtime = {
  start(ready: () => void, fail: () => void) {
    Object.assign(window, {
      EJS_player: '#emulator',
      EJS_core: 'nes',
      EJS_gameName: "Mike Tyson's Punch-Out!!",
      EJS_gameUrl: romURL,
      EJS_pathtodata: dataPath,
      EJS_startOnLoaded: true,
      EJS_noAutoFocus: true,
      EJS_Buttons: Object.fromEntries(['playPause', 'restart', 'mute', 'settings', 'fullscreen', 'saveState', 'loadState', 'screenRecord', 'gamepad', 'cheat', 'volumeSlider', 'saveSavFiles', 'loadSavFiles', 'quickSave', 'quickLoad', 'screenshot', 'cacheManager', 'exitEmulation', 'netplay', 'diskButton', 'contextMenu'].map(button => [button, false])),
      EJS_defaultControls: { 0: {}, 1: {}, 2: {}, 3: {} },
      EJS_defaultOptions: { 'virtual-gamepad': 'disabled', keyboardInput: 'enabled' },
      EJS_disableDatabases: true,
      EJS_disableLocalStorage: true,
      EJS_CacheLimit: 0,
      EJS_language: 'en-US',
      EJS_disableAutoLang: false,
      EJS_ready: () => host.EJS_emulator?.on('exit', fail),
      EJS_onGameStart: () => { runtime.unlock(); ready() },
    })
    const script = document.createElement('script')
    script.src = dataPath + 'loader.js'
    script.onerror = fail
    window.addEventListener('error', fail)
    document.head.append(script)
  },
  send(button: NESButton, pressed: boolean) {
    sampled.send(button, pressed)
  },
  reset() { sampled.reset() },
  unlock() {
    const context = audio()
    if (context?.state === 'suspended') context.resume().catch(() => {})
  },
  pause() { sampled.reset(); host.EJS_emulator?.pause() },
  resume() { host.EJS_emulator?.play(); runtime.unlock() },
  stop() {
    sampled.reset()
    host.EJS_emulator?.Module?.pauseMainLoop?.()
    const context = audio()
    if (context && context.state !== 'closed') context.close().catch(() => {})
  },
}

Object.assign(window, { punchOutRuntime: runtime })
for (const type of ['keydown', 'keyup']) document.addEventListener(type, event => {
  if (window.parent === window || coreEvents.has(event)) return
  const key = event as KeyboardEvent
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'z', 'x', 'q', 'Enter', 'Shift', ' '].includes(key.key.length === 1 ? key.key.toLowerCase() : key.key)) return
  key.preventDefault()
  key.stopImmediatePropagation()
  // Keep native user activation while routing runtime focus through the same adapter and cabinet feedback.
  window.parent.document.dispatchEvent(new KeyboardEvent(type, { key: key.key, code: key.code, repeat: key.repeat, bubbles: true }))
}, true)
export type RuntimeWindow = Window & { punchOutRuntime: typeof runtime }
