import { Float, useTexture } from "@react-three/drei";
import React from "react";

const boxes = [
  { x: -2, y: 3, rotationY: 0.24 },
  { x: 2.5, y: 2, rotationY: 0.58 },
];

export default function Box() {
  const texture = useTexture(new URL("../media/cube.png", import.meta.url).href);

  return (
    <>
      {boxes.map(({ x, y, rotationY }) => (
        <Float key={`${x}-${y}`} speed={6} rotationIntensity={0}>
          <mesh position={[x, y, 2]} rotation-y={rotationY}>
            <meshStandardMaterial map={texture} />
            <boxGeometry args={[1, 1, 1]} />
          </mesh>
        </Float>
      ))}
    </>
  );
}
