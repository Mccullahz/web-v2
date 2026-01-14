import React, { useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface InteractiveMugProps {
  position: [number, number, number];
  selectedProject: number | null;
  onProjectSelect: (index: number | null) => void;
}

export const InteractiveMug: React.FC<InteractiveMugProps> = ({
  position,
  selectedProject,
  onProjectSelect,
}) => {
  const { scene } = useGLTF("/models/mug.glb");
  const mugRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const mug = React.useMemo(() => scene.clone(), [scene]);

  // Animate mug rotation and scale on hover
  useFrame((state) => {
    if (mugRef.current) {
      // Gentle floating animation
      mugRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      
      // Rotate slowly
      mugRef.current.rotation.y += 0.005;
      
      // Scale on hover
      const targetScale = hovered ? 1.1 : 1.0;
      mugRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  // Add glow effect to mug
  React.useEffect(() => {
    if (mug) {
      mug.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Add emissive glow when hovered or selected
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.emissive = new THREE.Color(
              hovered || selectedProject !== null ? 0x442200 : 0x000000
            );
            child.material.emissiveIntensity = hovered || selectedProject !== null ? 0.3 : 0;
          }
        }
      });
    }
  }, [mug, hovered, selectedProject]);

  return (
    <group
      ref={mugRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => onProjectSelect(null)}
    >
      <primitive
        object={mug}
        scale={[1.2, 1.2, 1.2]}
      />
      
      {/* Glow ring around mug when hovered */}
      {hovered && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <ringGeometry args={[0.8, 1.0, 32]} />
          <meshStandardMaterial
            color="#8b4513"
            emissive="#8b4513"
            emissiveIntensity={0.5}
            transparent
            opacity={0.4}
          />
        </mesh>
      )}
    </group>
  );
};

useGLTF.preload("/models/mug.glb");
