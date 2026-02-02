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
  const SMOOTHNESS = 0.8;
  const currentLook = useRef(new THREE.Vector3(0, 1.2, 0));

  useFrame((_, delta) => {
	  const t = 1 - Math.exp(-delta * SMOOTHNESS);
	  // smooth pos
	  camera.position.lerp(targetPos.current, t);

	  // smooth dir
	  currentLook.current.lerp(targetLook.current, t);
	  camera.lookAt(currentLook.current);
  });

  // expose helpers globally, potentially bad practice? TODO: research this a bit
  useEffect(() => {
	  const api = {
		  zoomIn() {
			  targetPos.current.set(0, 15, 8);
		  },
		  focusOn(vec: THREE.Vector3) {
			  targetLook.current.copy(vec);
		  },
	  };

	  (window as any).__cameraAPI = api;
	  
	return () => {
		delete (window as any).__cameraAPI;
	};
  }, []);
  return null;
}

