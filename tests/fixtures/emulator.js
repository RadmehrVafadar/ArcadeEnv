// Deterministic EmulatorJS adapter. No ROM is requested or included.
(() => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 240;
  const screen = document.createElement('div');
  screen.className = 'ejs_canvas_parent';
  screen.append(canvas);
  document.querySelector(window.EJS_player).tabIndex = -1;
  document.querySelector(window.EJS_player).append(screen);
  for (const name of ['ejs_virtualGamepad_parent', 'ejs_menu_bar']) {
    const controls = document.createElement('div');
    controls.className = name;
    controls.textContent = 'Emulator UI must be hidden';
    document.querySelector(window.EJS_player).append(controls);
  }
  const context = canvas.getContext('2d');
  context.fillStyle = '#12334a';
  context.fillRect(0, 0, 256, 240);
  context.fillStyle = '#fcbd46';
  context.font = '16px monospace';
  context.fillText('EMULATOR FIXTURE', 48, 110);
  const events = [];
  const keys = { KeyZ: 0, ShiftRight: 2, Enter: 3, ArrowUp: 4, ArrowDown: 5, ArrowLeft: 6, ArrowRight: 7, KeyX: 8 };
  for (const type of ['keydown', 'keyup']) canvas.addEventListener(type, event => {
    if (document.hasFocus() && keys[event.code] !== undefined) events.push({ player: 0, button: keys[event.code], pressed: Number(type === 'keydown') });
  });
  window.EJS_emulator = {
    events, canvas, paused: false,
    on() {},
    gameManager: {
      getFrameNum: () => Math.floor(performance.now() / 16),
    },
    pause() { this.paused = true; },
    play() { this.paused = false; },
    Module: { AL: { currentCtx: { audioCtx: { state: 'suspended', resume() { this.state = 'running'; return Promise.resolve(); }, close() { this.state = 'closed'; return Promise.resolve(); } } } } },
  };
  window.EJS_ready?.();
  setTimeout(() => window.EJS_onGameStart?.(), window.fixtureDelay || 0);
})();
