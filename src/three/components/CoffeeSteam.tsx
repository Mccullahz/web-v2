import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface CoffeeSteamProps {
  position: [number, number, number];
}

export const CoffeeSteam: React.FC<CoffeeSteamProps> = ({ position }) => {
  const particlesRef = useRef<THREE.Points>(null);
  const velocitiesRef = useRef<Float32Array>(null);
  const particleCount = 50;

  // Create particle system
  const geometry = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Start positions around mug rim
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.3 + Math.random() * 0.2;
      pos[i3] = Math.cos(angle) * radius;
      pos[i3 + 1] = Math.random() * 0.5;
      pos[i3 + 2] = Math.sin(angle) * radius;

      // Random velocities (upward with slight spread)
      vel[i3] = (Math.random() - 0.5) * 0.02;
      vel[i3 + 1] = Math.random() * 0.03 + 0.02;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    velocitiesRef.current = vel;

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geom;
  }, []);

  useFrame((state) => {
    if (particlesRef.current && velocitiesRef.current) {
      const posArray = geometry.attributes.position.array as Float32Array;
      const velArray = velocitiesRef.current;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        // Update positions
        posArray[i3] += velArray[i3];
        posArray[i3 + 1] += velArray[i3 + 1];
        posArray[i3 + 2] += velArray[i3 + 2];

        // Add some turbulence
        posArray[i3] += Math.sin(state.clock.elapsedTime * 2 + i) * 0.001;
        posArray[i3 + 2] += Math.cos(state.clock.elapsedTime * 2 + i) * 0.001;

        // Reset particles that go too high
        if (posArray[i3 + 1] > 2.5) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 0.3 + Math.random() * 0.2;
          posArray[i3] = Math.cos(angle) * radius;
          posArray[i3 + 1] = 0;
          posArray[i3 + 2] = Math.sin(angle) * radius;
        }
      }

      geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef} position={position} geometry={geometry}>
      <pointsMaterial
        size={0.15}
        color="#ffffff"
        transparent
        opacity={0.4}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
