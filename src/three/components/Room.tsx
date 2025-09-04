// room to throw objects into
import React from "react";

export const Room: React.FC = () => {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#8b5a2b" />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#f5f5f5" side={2} /> {/* double sided */}
      </mesh>

      {/* Walls */}
      <mesh position={[0, 2.5, -10]}>
        <planeGeometry args={[20, 5]} />
        <meshStandardMaterial color="#e0dfdb" side={2} />
      </mesh>

      <mesh rotation={[0, Math.PI / 2, 0]} position={[-10, 2.5, 0]}>
        <planeGeometry args={[20, 5]} />
        <meshStandardMaterial color="#dcdcdc" side={2} />
      </mesh>

      <mesh rotation={[0, -Math.PI / 2, 0]} position={[10, 2.5, 0]}>
        <planeGeometry args={[20, 5]} />
        <meshStandardMaterial color="#dcdcdc" side={2} />
      </mesh>

      <mesh rotation={[0, Math.PI, 0]} position={[0, 2.5, 10]}>
        <planeGeometry args={[20, 5]} />
        <meshStandardMaterial color="#e0dfdb" side={2} />
      </mesh>
    </group>
  );
};

