import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import { Vector3 } from 'three';

const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

export default function Arcade() {
  const [hovered, setHovered] = useState(false);
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
    }
  };

  useFrame(({ camera }, delta) => {
    camera.lookAt(0, 1, 1);
    const autoZoom = mobile && revealedAt.current !== null && performance.now() - revealedAt.current >= 5000;
    if (hovered || autoZoom) camera.position.lerp(target, 1 - Math.pow(0.95, delta * 60));
    if (!sceneRendered.current) {
      sceneRendered.current = true;
      // The renderer completes this frame before the browser paints the revealed scene.
      revealArcade();
    }
  });

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
      <primitive
        object={arcade.scene}
        position-y={-2}
        onPointerOver={() => setHovered(true)}
        castShadow
        receiveShadow
      >
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
              src={iframeSrc}
              title="Radmehr Vafadar portfolio"
              onLoad={() => {
                portfolioLoaded.current = true;
                revealArcade();
              }}
            />
          </div>
        </Html>
      </primitive>
    </>
  );
}
