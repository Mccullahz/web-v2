// /src/three/components/Ticket.tsx
import React from "react";
import { Text } from "@react-three/drei";

export interface TicketProps {
  position: [number, number, number];
  title: string;
  category: string;
  tech: string;
  onClick?: () => void;
}

export const Ticket: React.FC<TicketProps> = ({ position, title, category, tech, onClick }) => {
  return (
    <group position={position} onClick={onClick}>
      <mesh>
        <boxGeometry args={[0.6, 0.1, 0.5]} />
        <meshStandardMaterial color="white" />
      </mesh>

      <group rotation={[-Math.PI / 2, 0, -Math.PI / 2]} position={[0, 0.055, 0]}>
        <Text position={[0, 0.16, 0]} fontSize={0.05} color="black" anchorX="center" anchorY="middle">
          {title}
        </Text>
        <Text position={[0, 0, 0]} fontSize={0.04} color="gray" anchorX="center" anchorY="middle">
          {category}
        </Text>
        <Text position={[0, -0.16, 0]} fontSize={0.035} color="darkslategray" anchorX="center" anchorY="middle">
          {tech}
        </Text>
      </group>
    </group>
  );
};

