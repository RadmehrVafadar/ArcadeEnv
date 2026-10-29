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
  const buttons = new Set();
  const samples = [];
  let frame = 0;
  const tick = () => {
    if (!window.EJS_emulator.paused) {
      frame++;
      samples.push([...buttons].sort((a, b) => a - b));
    }
    requestAnimationFrame(tick);
  };
  window.EJS_emulator = {
    events, samples, canvas, paused: false,
    on() {},
    gameManager: {
      getFrameNum: () => frame,
      // Match the NES joypad API. Raw canvas key events do not control a joypad.
      simulateInput(player, button, pressed) {
        events.push({ player, button, pressed });
        if (pressed) buttons.add(button);
        else buttons.delete(button);
      },
    },
    pause() { this.paused = true; },
    play() { this.paused = false; },
    Module: { AL: { currentCtx: { audioCtx: { state: 'suspended', resume() { this.state = 'running'; return Promise.resolve(); }, close() { this.state = 'closed'; return Promise.resolve(); } } } } },
  };
  requestAnimationFrame(tick);
  window.EJS_ready?.();
  setTimeout(() => window.EJS_onGameStart?.(), window.fixtureDelay || 0);
})();
