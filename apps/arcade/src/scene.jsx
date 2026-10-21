import './style.css';
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { SpotLight } from '@react-three/drei';
import { Object3D } from 'three';
import Arcade from './arcade.jsx';

const spotlightTarget = new Object3D();
spotlightTarget.position.set(0, -2, 0);

createRoot(document.querySelector('#root')).render(
  <Canvas
    camera={{
      fov: 50,
      near: 0.1,
      far: 2000,
      position: [0, 3, 8],
    }}
  >
    <Arcade />
    <primitive object={spotlightTarget} />
    <SpotLight
      target={spotlightTarget}
      position={[0, 8, 3]}
      color="#fff0d6"
      angle={0.26}
      penumbra={0.35}
      decay={0}
      intensity={4.5}
      distance={14}
      radiusTop={0.08}
      radiusBottom={3.7}
      opacity={0.32}
      attenuation={14}
      anglePower={4}
      castShadow={false}
    />
    <spotLight
      position={[0, 20, 10]}
      angle={0.15}
      penumbra={1}
      decay={0}
      intensity={1.5}
    />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
      <planeGeometry args={[50, 20]} />
      <meshStandardMaterial
        color="#60646a"
        transparent
        opacity={0.16}
        roughness={0.95}
        metalness={0}
      />
    </mesh>
  </Canvas>,
);
