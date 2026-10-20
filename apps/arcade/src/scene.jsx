import './style.css';
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import Arcade from './arcade.jsx';

function Room() {
  const room = useGLTF(import.meta.env.BASE_URL + 'arcade-room.glb');
  return <primitive object={room.scene} position-y={-2} />;
}

createRoot(document.querySelector('#root')).render(
  <Canvas
    dpr={[1, 1.5]}
    camera={{
      fov: 50,
      near: 0.1,
      far: 2000,
      position: [0, 3, 8],
    }}
  >
    <color attach="background" args={['#080d17']} />
    <ambientLight intensity={0.3} color="#a8c6e8" />
    <directionalLight position={[0, 6, 5]} intensity={0.6} color="#d6e7ff" />
    <pointLight position={[-4, 1, 0]} intensity={1.5} distance={9} color="#16cfee" />
    <pointLight position={[4, 1, 0]} intensity={1.5} distance={9} color="#ff285d" />
    <Room />
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
  </Canvas>,
);
