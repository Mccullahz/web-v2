import React from "react";
import { useGLTF } from "@react-three/drei";

export const Mug: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const { scene } = useGLTF("/models/mug.glb");
  const mug = React.useMemo(() => scene.clone(), [scene]);

  return (
    <primitive
      object={mug}
      position={position}
      rotation={[0, 0, 0]} // no circular math
      scale={[1, 1, 1]}
    />
  );
};

useGLTF.preload("/models/mug.glb");

