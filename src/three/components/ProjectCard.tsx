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

  // Make card face camera
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
        {/* Holographic card background */}
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

        {/* Border glow */}
        <mesh>
          <ringGeometry args={[0.6, 0.65, 32]} />
          <meshStandardMaterial
            color="#8b4513"
            emissive="#8b4513"
            emissiveIntensity={glowIntensity}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Project title */}
        <Text
          position={[0, 0.5, 0.01]}
          fontSize={0.15}
          color={isSelected ? "#ffd700" : "#ffffff"}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {project.title}
        </Text>

        {/* Category */}
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

        {/* Tech stack */}
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

        {/* Holographic scan lines effect */}
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[1.2, 1.6]} />
          <meshBasicMaterial
            color="#00ffff"
            transparent
            opacity={0.05}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </Float>
  );
};
