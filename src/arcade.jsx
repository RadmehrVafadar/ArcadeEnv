import { useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import React from "react";
import { Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Mobile detection utility
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
};

// Fullscreen invisible mesh component for mobile clicks
function MobileClickHandler({ isMobileDevice, onMobileClick }) {
  if (!isMobileDevice) return null;

  return (
    <mesh
      position={[0, 0, 0]}
      onClick={onMobileClick}
      onPointerDown={onMobileClick}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

export default function Arcade() {
  const [hovered, setHovered] = useState(false);
  const isMobileDevice = useMemo(() => isMobile(), []);
  const cameraTarget = useMemo(() => new THREE.Vector3(0, 3, 3), []);
  const arcade = useGLTF(import.meta.env.BASE_URL + "model9.glb");
  const iframeSrc = String(
    import.meta.env.VITE_IFRAME_URL || "https://portfolio-website-omega-flame.vercel.app/",
  );

  const handleMobileClick = () => {
    if (isMobileDevice) {
      setHovered(true);
    }
  };

  useFrame((state) => {
    state.camera.lookAt(0, 1, 1);

    if (hovered) {
      state.camera.position.lerp(cameraTarget, 0.05);
    }
  });

  useEffect(() => {
    arcade.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [arcade.scene]);

  return (
    <>
      <MobileClickHandler isMobileDevice={isMobileDevice} onMobileClick={handleMobileClick} />

      <primitive
        object={arcade.scene}
        position-y={-2}
        onPointerOver={() => !isMobileDevice && setHovered(true)}
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
          <iframe
            src={iframeSrc}
            title="Embedded portfolio"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </Html>
      </primitive>
    </>
  );
}

useGLTF.preload(import.meta.env.BASE_URL + "model9.glb");
