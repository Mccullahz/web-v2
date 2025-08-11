// this file will be used to render the Three.js scene, and be the main entry point for the Three.js application. Our gui page will be rendered here, and Gui.tsx will simply call this file 
import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Text } from "@react-three/drei";
import {useGLTF} from '@react-three/drei'

const Mug: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const { scene } = useGLTF("/models/mug.glb");

  const [x, , z] = position;
  const angle = Math.atan2(z, x);

  return (
    <primitive
      object={scene}
      position={position}
      rotation={[0, angle, 0]}
      scale={[1, 1, 1]}
      //meshStandardMaterial={{ color: "white", roughness: 0.5, metalness: 0.1 }}
    />
  );
};

// preloading to stop the weird refreshing of the model when the page loads
useGLTF.preload("/models/mug.glb");

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

  const shouldFlip = angle > Math.PI / 2 || angle < -Math.PI / 2;
  const rotationY = shouldFlip ? angle + Math.PI : angle;

  return (
    <group position={position} rotation={[0, rotationY, 0]} onClick={onClick}>
      <mesh>
        <boxGeometry args={[0.6, 0.1, 0.5]} />
        <meshStandardMaterial color="white" />
      </mesh>

      <group rotation={[-Math.PI / 2, 0, -Math.PI / 2]} position={[0, 0.055, 0]}>
        {/* Title */}
        <Text
          position={[0, 0.16, 0]}
          fontSize={0.05}
          color="black"
          anchorX="center"
          anchorY="middle"
        >
          {title}
        </Text>

        {/* Category */}
        <Text
          position={[0, 0, 0]}
          fontSize={0.04}
          color="gray"
          anchorX="center"
          anchorY="middle"
        >
          {category}
        </Text>

        {/* Tech */}
        <Text
          position={[0, -0.16, 0]}
          fontSize={0.035}
          color="darkslategray"
          anchorX="center"
          anchorY="middle"
        >
          {tech}
        </Text>
      </group>
    </group>
  );
};

const Lights = () => (
  <>
    <ambientLight intensity={0.3} />
    <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
  </>
);

// function to zoom in on the ticket when clicked, this is 1.) not working and 2.) not implemented yet
const clickZoom = () => {
	console.log("Ticket clicked nerd!");
}

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
      <axesHelper />
      <Table />
      {/*everything on the table here*/}
      <Mug position={[1, 0.3, 0]} />
      <Ticket position={[1.6, 0.01, 0]}
	title="YouTube Short Automation"
	category="Linux Application"
	tech="Python + Youtube API + Davinci 3.5"
	onClick={() => clickZoom()}
      />

      <Mug position={[-1, 0.3, 0]} />
      <Ticket position={[-1.6, 0.01, 0]} 
      	title="Flacer"
	category="Cross Platform High Resolution Audio Player"
	tech=" Using Go + Wails React + TypeScript"
	onClick={() => clickZoom()}
      />

      <Mug position={[0, 0.3, 1]} />
      <Ticket position={[0, 0.01, 1.6]}
      	title="Process Management Simulator"
	category="Cross Platform Application"
	tech="Using Go + BubbleTea + Lipgloss"
	onClick={() => clickZoom()}
      />

      <Mug position={[0, 0.3, -1]} />
      <Ticket position={[0, 0.01, -1.6]}
      	title="Library Management System"
	category="Windows Application"
	tech="Using Java + JavaFX"
	onClick={() => clickZoom()}
      />
    </Canvas>
  );
};

