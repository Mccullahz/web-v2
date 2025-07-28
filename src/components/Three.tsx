// this file will be used to render the Three.js scene, and be the main entry point for the Three.js application. Our gui page will be rendered here, and Gui.tsx will simply call this file 

import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
//import * as THREE from "three";

const Mug: React.FC<{ position: [number, number, number] }> = ({ position }) => (
  <mesh position={position}>
    <cylinderGeometry args={[0.3, 0.3, 0.5, 32]} />
    <meshStandardMaterial color="#c49e6e" />
  </mesh>
);

const Table: React.FC = () => (
  <mesh rotation={[Math.PI / 1, 0, 0]}>
    <cylinderGeometry args={[2, 2, 0.1, 64]} />
    <meshStandardMaterial color="#4b3b2a" />
  </mesh>
);

const Ticket: React.FC<{ position: [number, number, number] }> = ({ position }) => (
  <mesh position={position}>
    <boxGeometry args={[0.6, 0.1, 0.5]} />
    <meshStandardMaterial color="white" />
  </mesh>
);

const Lights = () => (
  <>
    <ambientLight intensity={0.3} />
    <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
  </>
);

export const ThreeScene: React.FC = () => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 2, 5], fov: 50 }}
      style={{ width: "100%", height: "100vh" }}
    >
      <Lights />
      <Environment preset="city" />
      <OrbitControls enablePan={false} />
      <Table />
      {/*everything on the table here*/}
      <Mug position={[1, 0.3, 0]} />
      <Ticket position={[1.6, 0.01, 0]} />
      <Mug position={[-1, 0.3, 0]} />
      <Ticket position={[-1.6, 0.01, 0]} />
      <Mug position={[0, 0.3, 1]} />
      <Ticket position={[0, 0.01, 1.6]} />
      <Mug position={[0, 0.3, -1]} />
      <Ticket position={[0, 0.01, -1.6]} />
    </Canvas>
  );
};

