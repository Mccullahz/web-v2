// component to manage camera positions and focus points
import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function CameraController() {
  const { camera } = useThree();

  // targets
  const targetPos = useRef(new THREE.Vector3(0, 40, 5));
  const targetLook = useRef(new THREE.Vector3(0, 1.2, 0));

  // init camera
  useEffect(() => {
    camera.position.copy(targetPos.current);
    camera.lookAt(targetLook.current);
    camera.updateProjectionMatrix();
  }, [camera]);

  // slerpy af
  useFrame((_, delta) => {
    camera.position.lerp(targetPos.current, 1 - Math.exp(-delta * 4));
    camera.lookAt(targetLook.current);
  });

  // expose helpers globally, potentially bad practice? TODO: research this a bit
  useEffect(() => {
    (window as any).__cameraAPI = {
      zoomIn() {
        targetPos.current.set(0, 22, 8);
      },
      focusOn(vec: THREE.Vector3) {
        targetLook.current.copy(vec);
      },
    };
  }, []);

  return null;
}

