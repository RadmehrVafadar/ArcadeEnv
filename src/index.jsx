import "./style.css";
import React from "react";
import ReactDom from "react-dom/client"
import { Canvas } from "@react-three/fiber";
import Arcade from "./arcade.jsx";
import Box from './box.jsx'



const root = ReactDom.createRoot(document.querySelector("#root"));

root.render(
      <Canvas
    camera={{
      fov: 70,
      near: 0.1,
      far: 2000,
      position: [0, 3, 8],
    }}
  >
    <Box />
    <Arcade />

    <spotLight position={[0, 20, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
  </Canvas>

);