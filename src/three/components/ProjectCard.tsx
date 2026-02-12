import React, { useRef, useState } from "react";
import { Text, Float } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Project } from "../data/projects";

interface ProjectCardProps {
  project: Project;
  index: number;
  position: [number, number, number];
  isSelected: boolean;
  onSelect: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  position,
  isSelected,
  onSelect,
}) => {
  const cardRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // make card face camera
  useFrame(({ camera }) => {
    if (cardRef.current) {
      cardRef.current.lookAt(camera.position);
    }
  });

  const scale = isSelected ? 1.3 : hovered ? 1.15 : 1.0;
  const glowIntensity = isSelected ? 0.8 : hovered ? 0.5 : 0.2;

  return (
    <Float
      speed={1.5}
      rotationIntensity={0.2}
      floatIntensity={0.3}
    >
      <group
        ref={cardRef}
        position={position}
        scale={scale}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={onSelect}
      >
        {/* bg */}
        <mesh>
          <planeGeometry args={[1.2, 1.6]} />
          <meshStandardMaterial
            color={isSelected ? "#2a1a0a" : "#1a1a1a"}
            emissive={isSelected ? "#8b4513" : "#4a2a0a"}
            emissiveIntensity={glowIntensity}
            transparent
            opacity={0.9}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* border */}
        <mesh>
          <ringGeometry args={[0.6, 0.65, 32]} />
          <meshStandardMaterial
            color="#FFFF00"
            emissive="#FFFF00"
            emissiveIntensity={glowIntensity}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* title */}
        <Text
          position={[0, 0.5, 0.01]}
          fontSize={0.15}
          color={isSelected ? "#00c2e0" : "#00a0b0"}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {project.title}
        </Text>

        {/* category */}
        <Text
          position={[0, 0.1, 0.01]}
          fontSize={0.08}
          color="#cccccc"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.0}
        >
          {project.category}
        </Text>

        {/* stack */}
        <Text
          position={[0, -0.3, 0.01]}
          fontSize={0.07}
          color="#888888"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.0}
        >
          {project.tech}
        </Text>

      </group>
    </Float>
  );
};
