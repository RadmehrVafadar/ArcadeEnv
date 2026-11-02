import { useEffect, useState } from 'react';
import { arcadeAudio } from './arcade-audio.js';

export default function AudioControls() {
  const [settings, setSettings] = useState(arcadeAudio.getSettings);
  useEffect(() => {
    const visibility = () => {
      if (document.hidden) arcadeAudio.pause();
      else arcadeAudio.resume();
    };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', arcadeAudio.pause);
    window.addEventListener('pageshow', visibility);
    const removeUnlock = arcadeAudio.listen(document);
    return () => {
      arcadeAudio.pause();
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', arcadeAudio.pause);
      window.removeEventListener('pageshow', visibility);
      removeUnlock();
    };
  }, []);

  function toggle(key) {
    arcadeAudio.set(key, !settings[key]);
    setSettings(arcadeAudio.getSettings());
  }

  return (
    <div className="audio-controls" role="group" aria-label="Arcade audio">
      <button type="button" aria-pressed={settings.effects} onClick={() => toggle('effects')}>
        Sound FX: {settings.effects ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}
