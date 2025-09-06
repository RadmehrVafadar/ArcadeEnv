import "./style.css";
import React from "react";
import ReactDom from "react-dom/client"
import { Canvas } from "@react-three/fiber";
import { Clouds, Cloud, Backdrop } from "@react-three/drei";
import * as THREE from 'three';
import Arcade from "./arcade.jsx";
import Box from './box.jsx'

// Cloud configuration - change these values to modify all clouds
const cloudConfig = {
  scale: 2,
  volume: 5,
  color: "magenta",
  fade: 0.5,
  opacity: 0.2,
  yPosition: 4,
  zPosition: -10
};

const root = ReactDom.createRoot(document.querySelector("#root"));

root.render(
      <Canvas
    camera={{
      fov: 50,
      near: 0.1,
      far: 2000,
      position: [0, 3, 8],
    }}
  >

    <Box />
    <Arcade />
    <Clouds material={THREE.MeshBasicMaterial}>
      <Cloud 
      seed={1} 
      scale={cloudConfig.scale} 
      volume={cloudConfig.volume} 
      color={cloudConfig.color} 
      fade={cloudConfig.fade} 
      opacity={cloudConfig.opacity}
      position={[0, cloudConfig.yPosition, cloudConfig.zPosition]}
      />
    </Clouds>


    
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
    
    {/* Ground plane to receive shadows */}
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
  </Canvas>

);