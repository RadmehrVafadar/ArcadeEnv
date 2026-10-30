import Phaser from 'phaser';
import { MuseumScene } from './scene.ts';
import { showError } from './ui.ts';
import './game.css';

document.querySelector<HTMLAnchorElement>('.menu-link')!.href = import.meta.env.BASE_URL;
try {
  const host = document.querySelector<HTMLElement>('.camera')!;
  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    parent: host,
    backgroundColor: '#211916',
    pixelArt: true,
    roundPixels: true,
    // Arcade Physics accumulates real elapsed time; startup smoothing would slow low-FPS devices.
    fps: { smoothStep: false },
    scale: { mode: Phaser.Scale.RESIZE, width: host.clientWidth, height: host.clientHeight },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, fixedStep: true, fps: 60 } },
    scene: MuseumScene,
    audio: { noAudio: true },
  });
  const observer = new ResizeObserver(() => game.scale.resize(host.clientWidth, host.clientHeight));
  observer.observe(host);
  window.addEventListener('pagehide', event => {
    if (!event.persisted) { observer.disconnect(); game.destroy(true); }
  });
} catch (error) { showError(error); }
