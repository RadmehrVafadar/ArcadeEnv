import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import { Vector3 } from 'three';
import CabinetControls from './cabinet-controls.jsx';

const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

export default function Arcade() {
  const [zoomComplete, setZoomComplete] = useState(false);
  const [ready, setReady] = useState(false);
  const [gameInput, setGameInput] = useState(null);
  const iframe = useRef(null);
  const invalidate = useThree(state => state.invalidate);
  const zoomStartedAt = useRef(null);
  const startZoom = useCallback(() => {
    zoomStartedAt.current ??= performance.now();
    invalidate();
  }, [invalidate]);
  const portfolioLoaded = useRef(false);
  const sceneRendered = useRef(false);
  const revealedAt = useRef(null);
  const target = useMemo(() => new Vector3(0, 3, 3), []);
  const arcade = useGLTF(import.meta.env.BASE_URL + 'model9.glb');
  const iframeSrc = import.meta.env.VITE_IFRAME_URL ||
    '/portfolio/';

  const revealArcade = () => {
    if (portfolioLoaded.current && sceneRendered.current && revealedAt.current === null) {
      document.querySelector('#arcade-loading')?.remove();
      revealedAt.current = performance.now();
      setReady(true);
    }
  };

  useFrame(({ camera }, delta) => {
    if (zoomStartedAt.current !== null && camera.position.distanceToSquared(target) > 0.000001) {
      // The first frame after idle must not count idle time as animation time.
      const zoomDelta = Math.min(delta, (performance.now() - zoomStartedAt.current) / 1000);
      camera.position.lerp(target, 1 - Math.pow(0.95, zoomDelta * 60));
      if (!zoomComplete && camera.position.distanceToSquared(target) < 0.0025) setZoomComplete(true);
      invalidate();
    }
    camera.lookAt(0, 1, 1);
    camera.updateMatrixWorld();
    if (gameInput && iframe.current) {
      const frame = iframe.current;
      // Read the projected size after Html applies this frame's CSS transform.
      requestAnimationFrame(() => gameInput.setDisplayScale(frame.getBoundingClientRect().width / 624));
    }
    sceneRendered.current = true;
    // Html's separate React root must mount before its transform can be rendered.
    revealArcade();
  }, -1);

  useEffect(() => {
    if (!mobile || !ready) return;
    const timer = setTimeout(startZoom, 5000);
    return () => clearTimeout(timer);
  }, [ready, startZoom]);

  useEffect(() => {
    if (!gameInput) return;
    const frameWindow = iframe.current.contentWindow;
    const disconnect = () => setGameInput(null);
    const keys = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' };
    const keydown = event => {
      if (event.target.closest?.('.cabinet-control') && [' ', 'Enter'].includes(event.key)) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const action = { q: 'menu', e: 'open', ' ': 'read' }[key];
      if (keys[key] || action) event.preventDefault();
      if (keys[key]) gameInput.setDirection('keyboard:' + event.code, keys[key]);
      if (action && !event.repeat) gameInput.action(action);
    };
    const keyup = event => gameInput.setDirection('keyboard:' + event.code, null);
    frameWindow.addEventListener('pagehide', disconnect);
    document.addEventListener('keydown', keydown);
    document.addEventListener('keyup', keyup);
    return () => {
      gameInput.disconnect();
      frameWindow.removeEventListener('pagehide', disconnect);
      document.removeEventListener('keydown', keydown);
      document.removeEventListener('keyup', keyup);
    };
  }, [gameInput]);

  useEffect(() => {
    arcade.scene.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [arcade.scene]);

  return (
    <>
      {!zoomComplete && (
        <Html center position={[0, 3.6, -1]} zIndexRange={[2, 0]}>
          <button className="neon-play-sign" onClick={startZoom}>
            <span>PRESS TO PLAY</span>
          </button>
        </Html>
      )}
      <primitive
        object={arcade.scene}
        position-y={-2}
        onPointerOver={startZoom}
        onClick={startZoom}
        castShadow
        receiveShadow
      >
        {gameInput && <CabinetControls scene={arcade.scene} input={gameInput} />}
        <Html
          occlude
          wrapperClass="arcade"
          position={[0, 2.83, 0.7]}
          transform
          distanceFactor={1.12}
          rotation-x={-0.75}
        >
          <div className="crt-screen">
            <iframe
              ref={element => { iframe.current = element; if (element) invalidate(); }}
              src={iframeSrc}
              title="Radmehr Vafadar portfolio"
              onLoad={() => {
                portfolioLoaded.current = true;
                let input = null;
                try {
                  input = iframe.current.contentWindow.arcadeControls || null;
                  if (input && !['connect', 'disconnect', 'setDirection', 'action', 'reset', 'setDisplayScale']
                    .every(method => typeof input[method] === 'function')) input = null;
                } catch (error) {
                  if (error.name !== 'SecurityError') throw error;
                }
                input?.connect();
                setGameInput(input);
                invalidate();
              }}
            />
          </div>
        </Html>
      </primitive>
    </>
  );
}
