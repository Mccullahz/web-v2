// this file will be used to render the Three.js scene, and be the main entry point for the Three.js application. Our gui page will be rendered here, and Gui.tsx will simply call this file 
//
import React from "react";
import { Canvas } from "@react-three/fiber";
//import { PointerLockControls } from "@react-three/drei";
import { Environment } from "@react-three/drei";
import { PlayerControls } from "./components/PlayerControls";
import { Bar } from "./components/Bar";
import { Mug } from "./components/Mug";
import { Ticket } from "./components/Ticket";
import { Lights } from "./components/Lights";
import { projects } from "./data/projects";
import type { Project } from "./data/projects";

export const ThreeScene: React.FC = () => {
  return (
    <Canvas
    	shadows
	camera={{ position: [0, 2.6, 5.5], fov: 100 }} // eye-level camera
	style={{ width: "100%", height: "100vh" }}
>

      <Lights />
      <Environment preset="city" />
      <PlayerControls />

      {/* Coffee bar */}
      <Bar />

      {/* Mugs + Tickets */}
      {projects.map((proj, idx) => (
	  <React.Fragment key={idx}>
	    <Mug position={[proj.position[0], 1.7, -4.5]} />  {/* slightly above bar */}
	    <Ticket {...proj} position={[proj.position[0], 1.5, -4.2]} />
	  </React.Fragment>

      ))}
    </Canvas>
  );
};

