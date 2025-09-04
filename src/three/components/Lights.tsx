import React from "react";

export const Lights: React.FC = () => {
  return (
    <>
      {/* ambient light for general fill */}
      <ambientLight intensity={0.4} />

      {/* main light (like ceiling spotlights) */}
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* warm point light (like a lamp) */}
      <pointLight position={[0, 3, 0]} intensity={0.6} color={"#ffddaa"} />
    </>
  );
};

