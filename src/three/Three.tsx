// this file will be used to render the Three.js scene, and be the main entry point for the Three.js application. Our gui page will be rendered here, and Gui.tsx will simply call this file 

// current state should be doing nothing yet, just getting the background colors in blender properly mapped 

import React from "react";
import { Canvas } from "@react-three/fiber";
//import { PointerLockControls } from "@react-three/drei";
import { Environment } from "@react-three/drei";
import { PlayerControls } from "./components/PlayerControls";

export const ThreeScene: React.FC = () => {
  return (
    <div
      className="relative h-screen w-full bg-[#D2DBDD]"
      style={{
        backgroundImage: "url('/src/three/data/init.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 2.6, 5.5], fov: 100 }}
        className="absolute inset-0"
      >
        <Environment preset="city" />
        <PlayerControls />

      </Canvas>
    </div>
  );
};

