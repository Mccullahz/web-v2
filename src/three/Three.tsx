// this file will be used to render the Three.js scene, and be the main entry point for the Three.js application. Our gui page will be rendered here, and Gui.tsx will simply call this file 

// current state should be doing nothing yet, just getting the background colors in blender properly mapped 

import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { SeedScene } from "./components/SeedScene";
import { Camera } from "./components/Camera";

export const ThreeScene: React.FC = () => {
  return (
    <Canvas
      camera={{ fov: 75 }}
      style={{ width: "100%", height: "100vh" }}
    >
      <color attach="background" args={["#d2dbdd"]} />

      <Environment preset="city" />

      <Camera />
      <SeedScene />
    </Canvas>
  );
};

