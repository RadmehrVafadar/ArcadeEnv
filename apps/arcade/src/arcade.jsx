import { useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import { Vector3 } from 'three';

function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    navigator.maxTouchPoints > 1;
}

function MobileClickHandler({ onMobileClick }) {
  if (!isMobile()) return null;

  return (
    <mesh onPointerDown={onMobileClick}>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

export default function Arcade() {
  const [hovered, setHovered] = useState(false);
  const target = useMemo(() => new Vector3(0, 3, 3), []);
  const arcade = useGLTF(import.meta.env.BASE_URL + 'model9.glb');
  const iframeSrc = import.meta.env.VITE_IFRAME_URL ||
    '/portfolio/';

  useFrame(({ camera }) => {
    camera.lookAt(0, 1, 1);
    if (hovered) camera.position.lerp(target, 0.05);
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
      <MobileClickHandler onMobileClick={() => setHovered(true)} />
      <primitive
        object={arcade.scene}
        position-y={-2}
        onPointerOver={() => !isMobile() && setHovered(true)}
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
          <iframe src={iframeSrc} title="Radmehr Vafadar portfolio" />
        </Html>
      </primitive>
    </>
  );
}
