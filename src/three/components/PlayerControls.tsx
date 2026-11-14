import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { shardNameToProject } from "../shardMapping";
import type { CardPayload } from "../shardMapping";

interface PlayerControlsProps {
  /** active only when moving selection with j/k, arrows, or a/d — drives the keyboard shard card. makes it so that on hover we dont have sticky cards. */
  onKeyboardShardChange?: (payload: CardPayload | null) => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  onKeyboardShardChange,
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

      if (onKeyboardShardChange) {
        const project = shardNameToProject(shard.name);
        if (project) {
          const cam = cameraRef.current;
          const sz = sizeRef.current;
          const ndc = pos.clone().project(cam);
          const x = (ndc.x + 1) * 0.5 * sz.width;
          const y = (1 - (ndc.y + 1) * 0.5) * sz.height;
          onKeyboardShardChange({ project, x, y });
        }
      }

      console.log("Active shard:", shard.name);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyboardShardChange]);

  useEffect(() => {
    const syncIndex = (ev: Event) => {
      const e = ev as CustomEvent<{ index: number }>;
      if (typeof e.detail?.index === "number") {
        indexRef.current = e.detail.index;
      }
    };
    window.addEventListener("three-shard-index", syncIndex);
    return () => window.removeEventListener("three-shard-index", syncIndex);
  }, []);

  return null;
};
