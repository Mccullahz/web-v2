// 3D coffee bar model
import React from "react";

export const Bar: React.FC = () => {
  return (
    <mesh position={[0, 1, -5]} castShadow>
      <boxGeometry args={[6, 1, 2]} /> {/* width, height, depth */}
      <meshStandardMaterial color="#4b2e2e" />
    </mesh>
  );
};

