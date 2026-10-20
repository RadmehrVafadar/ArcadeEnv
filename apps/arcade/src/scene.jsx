import './style.css';
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import Arcade from './arcade.jsx';

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
    <spotLight
      position={[0, 20, 10]}
      angle={0.15}
      penumbra={1}
      decay={0}
      intensity={Math.PI}
      castShadow
      shadow-mapSize={[1024, 1024]}
      shadow-camera-far={50}
      shadow-camera-left={-10}
      shadow-camera-right={10}
      shadow-camera-top={10}
      shadow-camera-bottom={-10}
    />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
      <planeGeometry args={[50, 20]} />
      <meshStandardMaterial
        color="#051821"
        transparent
        opacity={0.1}
        roughness={0.7}
        metalness={10}
      />
    </mesh>
  </Canvas>,
);
