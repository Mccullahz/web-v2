// this file will be used to render the Three.js scene, and be the main entry point for the Three.js application. Our gui page will be rendered here, and Gui.tsx will simply call this file 
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { SeedScene } from "./components/SeedScene";
import { CameraController } from "./components/CameraController";
import { PlayerControls } from "./components/PlayerControls";
import { useState } from "react";
import * as THREE from "three";

export const ThreeScene: React.FC = () => {
  const [zoomedIn, setZoomedIn] = useState(false);
  const [focusTarget, setFocusTarget] = useState<THREE.Vector3 | null>(null);

  const cameraPosition = zoomedIn
    ? new THREE.Vector3(0, 20, 8)
    : new THREE.Vector3(0, 40, 5);

  return (
    <Canvas camera={{ fov: 75 }} style={{ width: "100%", height: "100vh" }}>
      <color attach="background" args={["#d2dbdd"]} />
      <Environment preset="city" />

      <CameraController
        positionTarget={cameraPosition}
        lookAtTarget={focusTarget}
      />

      <PlayerControls />

      <SeedScene
        onAnimationFinished={() => setZoomedIn(true)}
        onShardSelected={(pos) => setFocusTarget(pos)}
      />
    </Canvas>
  );
};

