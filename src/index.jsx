import "./style.css";
import React from "react";
import ReactDom from "react-dom/client"
import { Canvas } from "@react-three/fiber";
import Arcade from "./arcade.jsx";

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
    <Arcade />
  </Canvas>

);