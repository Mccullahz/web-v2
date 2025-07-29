// this file will be used to render the Three.js scene, and be the main entry point for the Three.js application. Our gui page will be rendered here, and Gui.tsx will simply call this file 

import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Text } from "@react-three/drei";
//import * as THREE from "three";

const Mug: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const [x,  , z] = position;
  const angle = Math.atan2(z, x);
return (
  <mesh position={position} rotation={[0, angle, 0]}>
    <cylinderGeometry args={[0.3, 0.3, 0.5, 32]} />
    <meshStandardMaterial color="#c49e6e" />
  </mesh>
)
};

const Table: React.FC = () => (
  <mesh rotation={[Math.PI / 1, 0, 0]}>
    <cylinderGeometry args={[2, 2, 0.1, 64]} />
    <meshStandardMaterial color="#4b3b2a" />
  </mesh>
);

interface TicketProps {
  position: [number, number, number];
  title?: string;
  category?: string;
  tech?: string;
  onClick?: () => void;
}

const Ticket: React.FC<TicketProps> = ({ position, title, category, tech, onClick }) => {
  const [x, , z] = position;
  const angle = Math.atan2(z, x);

  return (
    <group position={position} rotation={[0, angle, 0]} onClick={onClick}>
      {/* ticket mesh */}
      <mesh>
        <boxGeometry args={[0.6, 0.1, 0.5]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* text for ticket description, title desc, tech etc I hate doing it this way but i do not know of a more resuable manner, will adjust colors to better fit theme once poc is done */}
      <Text
        position={[0, 0.06, 0.1]}
        fontSize={0.05}
        color="black"
        maxWidth={0.5}
        anchorX="center"
        anchorY="middle"
      >
        {title}
      </Text>
      <Text
        position={[0, 0.06, 0]}
        fontSize={0.04}
        color="gray"
        maxWidth={0.5}
        anchorX="center"
        anchorY="middle"
      >
        {category}
      </Text>
      <Text
        position={[0, 0.06, -0.1]}
        fontSize={0.035}
        color="darkslategray"
        maxWidth={0.5}
        anchorX="center"
        anchorY="middle"
      >
        {tech}
      </Text>
    </group>
  );
};

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
      <Ticket position={[1.6, 0.01, 0]} 
	title="Proof of Concept"
	category="Frontend Web Development"
	tech="React, TypeScript"
	onClick={() => console.log("Ticket clicked!")}
      />

      <Mug position={[-1, 0.3, 0]} />
      <Ticket position={[-1.6, 0.01, 0]} />

      <Mug position={[0, 0.3, 1]} />
      <Ticket position={[0, 0.01, 1.6]} />

      <Mug position={[0, 0.3, -1]} />
      <Ticket position={[0, 0.01, -1.6]} />
    </Canvas>
  );
};

