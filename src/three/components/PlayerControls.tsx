import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { shardNameToProject } from "../shardMapping";
import type { CardPayload } from "../shardMapping";

interface PlayerControlsProps {
  onActiveShardChange?: (payload: CardPayload | null) => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  onActiveShardChange,
}) => {
  const indexRef = useRef(0);
  const { camera, size } = useThree();
  const cameraRef = useRef(camera);
  const sizeRef = useRef(size);
  cameraRef.current = camera;
  sizeRef.current = size;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const shards: THREE.Mesh[] = (window as any).__shards;
      if (!shards || shards.length === 0) return;

      let next = indexRef.current;

      switch (e.key) {
        // vim bindings
        case "j":
        case "ArrowRight":
          next++;
          break;

        case "k":
        case "ArrowLeft":
          next--;
          break;

        // WASD equivalents
        case "d":
          next++;
          break;

        case "a":
          next--;
          break;

        default:
          return;
      }

      next = (next + shards.length) % shards.length;
      indexRef.current = next;

      const shard = shards[next];
      const pos = new THREE.Vector3();
      shard.getWorldPosition(pos);

      (window as any).__cameraAPI?.focusOn(pos);
      (window as any).__activeShard = shard;

      if (onActiveShardChange) {
        const project = shardNameToProject(shard.name);
        if (project) {
          const cam = cameraRef.current;
          const sz = sizeRef.current;
          const ndc = pos.clone().project(cam);
          const x = (ndc.x + 1) * 0.5 * sz.width;
          const y = (1 - (ndc.y + 1) * 0.5) * sz.height;
          onActiveShardChange({ project, x, y });
        }
      }

      console.log("Active shard:", shard.name);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onActiveShardChange]);

  return null;
};
