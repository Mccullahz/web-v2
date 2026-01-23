// camera component to make the camera position and lookat more manageable in the scene

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export function Camera() {
  const { camera } = useThree();

  useEffect(() => {
    // pos: slightly above and behind the init mug (x, y, z)
    camera.position.set(0, 30, 5);

    // angle: slight downward toward where the mug will drop
    camera.lookAt(new THREE.Vector3(0, 1.2, 0));

    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}

