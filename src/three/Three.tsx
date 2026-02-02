// this file will be used to render the Three.js scene, and be the main entry point for the Three.js application. Our gui page will be rendered here, and Gui.tsx will simply call this file 
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { SeedScene } from "./components/SeedScene";
import { CameraController } from "./components/CameraController";
import { PlayerControls } from "./components/PlayerControls";

export const ThreeScene: React.FC = () => {
  return (
    <Canvas camera={{ fov: 75 }}>
      <Environment preset="city" />

      <CameraController />
      <SeedScene />
      <PlayerControls />
    </Canvas>
  );
};

