const melody = [76, 79, 83, 79, 74, 78, 81, 78, 72, 76, 79, 76, 74, 78, 81, 86,
  76, 79, 83, 86, 81, 78, 74, 78, 79, 76, 72, 76, 74, 71, 74, 78];
const bass = [40, 38, 36, 38];
const frequency = note => 440 * 2 ** ((note - 69) / 12);

export function createArcadeAudio(host = globalThis) {
  let context;
  let effectsBus;
  let musicBus;
  let timer;
  let nextBeat = 0;
  let step = 0;
  let disposed = false;
  let settings = { effects: true, music: false };
  try {
    const saved = JSON.parse(host.localStorage?.getItem('arcade-audio'));
    for (const key of Object.keys(settings)) {
      if (typeof saved?.[key] === 'boolean') settings[key] = saved[key];
    }
  } catch { /* Storage can be unavailable in private or embedded browsers. */ }

  function tone(bus, type, start, from, to, duration, volume) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(bus);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(start);
    oscillator.stop(start + duration + 0.01);
  }

  function schedule() {
    if (!settings.music || context?.state !== 'running' || host.document?.hidden) return;
    // Look ahead on the audio clock so timer jitter doesn't change the rhythm.
    nextBeat = Math.max(nextBeat, context.currentTime);
    while (nextBeat < context.currentTime + 0.12) {
      const note = frequency(melody[step % melody.length]);
      tone(musicBus, 'square', nextBeat, note, note, 0.14, 0.025);
      if (step % 2 === 0) {
        const low = frequency(bass[Math.floor(step / 8) % bass.length]);
        tone(musicBus, 'triangle', nextBeat, low, low, 0.28, 0.07);
      }
      if (step % 4 === 0) tone(musicBus, 'sine', nextBeat, 130, 45, 0.09, 0.07);
      step++;
      nextBeat += 60 / 112 / 2;
    }
  }

  function stopTimer() {
    host.clearInterval(timer);
    timer = undefined;
  }

  function sync() {
    if (!context) return;
    effectsBus.gain.setValueAtTime(settings.effects ? 0.65 : 0, context.currentTime);
    musicBus.gain.setValueAtTime(settings.music ? 0.65 : 0, context.currentTime);
    if (context.state === 'running' && settings.music && !host.document?.hidden) {
      if (timer === undefined) {
        nextBeat = context.currentTime + 0.02;
        schedule();
        timer = host.setInterval(schedule, 50);
      }
    } else {
      stopTimer();
    }
  }

  function unlock() {
    if (disposed || host.document?.hidden || (!settings.effects && !settings.music)) return;
    try {
      if (!context) {
        const AudioContext = host.AudioContext || host.webkitAudioContext;
        if (!AudioContext) return;
        // iOS otherwise uses ambient audio, which the Ring/Silent switch mutes.
        try {
          if (host.navigator?.audioSession) host.navigator.audioSession.type = 'playback';
        } catch { /* Older browsers and embedded views may reject session changes. */ }
        context = new AudioContext();
        effectsBus = context.createGain();
        musicBus = context.createGain();
        effectsBus.connect(context.destination);
        musicBus.connect(context.destination);
        context.onstatechange = sync;
        sync();
      }
      if (context.state === 'suspended' || context.state === 'interrupted') {
        context.resume().catch(() => {});
      }
    } catch { /* Audio support must never prevent cabinet input. */ }
  }

  function play(kind) {
    unlock();
    if (!settings.effects || !context || context.state === 'closed' || host.document?.hidden) return;
    const start = context.currentTime;
    if (kind === 'joystick') {
      tone(effectsBus, 'triangle', start, 620, 310, 0.045, 0.16);
    } else {
      const pitch = { read: 880, open: 1175, menu: 587 }[kind] || 880;
      tone(effectsBus, 'square', start, pitch, pitch / 2, 0.085, 0.075);
    }
  }

  function set(key, value) {
    settings = { ...settings, [key]: value };
    try { host.localStorage?.setItem('arcade-audio', JSON.stringify(settings)); } catch { /* Optional persistence. */ }
    unlock();
    sync();
  }

  function pause() {
    stopTimer();
    if (context && context.state !== 'closed') context.suspend().catch(() => {});
  }

  return {
    play, unlock, set, pause,
    listen(target) {
      // Touch activation is granted on release; capture runs before navigation.
      const events = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'];
      for (const event of events) target.addEventListener(event, unlock, true);
      return () => {
        for (const event of events) target.removeEventListener(event, unlock, true);
      };
    },
    resume() { if (context) unlock(); },
    getSettings: () => ({ ...settings }),
    dispose() {
      disposed = true;
      stopTimer();
      if (context) {
        context.onstatechange = null;
        context.close().catch(() => {});
      }
    },
  };
}

export const arcadeAudio = createArcadeAudio();
