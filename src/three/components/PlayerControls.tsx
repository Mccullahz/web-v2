import { PointerLockControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useThree } from "@react-three/fiber";
import React, { useEffect, useRef} from "react";
import * as THREE from "three";

export const PlayerControls: React.FC = () => {
  const { camera } = useThree();
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const direction = new THREE.Vector3();
  const speed = 0.05;

  const keys = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => (keys.current[e.code] = true);
    const handleKeyUp = (e: KeyboardEvent) => (keys.current[e.code] = false);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useFrame(() => {
    velocity.current.set(0, 0, 0);

    if (keys.current["KeyW"]) velocity.current.z += speed;
    if (keys.current["KeyS"]) velocity.current.z -= speed;
    if (keys.current["KeyA"]) velocity.current.x += speed;
    if (keys.current["KeyD"]) velocity.current.x -= speed;

    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(camera.up, direction).normalize();

    camera.position.addScaledVector(direction, velocity.current.z);
    camera.position.addScaledVector(right, velocity.current.x);
  });

  return <PointerLockControls />;
};

