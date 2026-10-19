import { useState } from 'react';
import { Float, useTexture } from '@react-three/drei';

const positions = [[-2, 3, 2], [2.5, 2, 2]];

export default function Box() {
  const texture = useTexture(new URL('../media/cube.png', import.meta.url).href);
  const [rotations] = useState(() => positions.map(() => Math.random() * 0.6 + 0.1));

  return (
    <>
      {positions.map((position, index) => (
        <Float key={position[0]} speed={6} rotationIntensity={0}>
          <mesh position={position} rotation-y={rotations[index]}>
            <meshStandardMaterial map={texture} />
            <boxGeometry args={[1, 1, 1]} />
          </mesh>
        </Float>
      ))}
    </>
  );
}
