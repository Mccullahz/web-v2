import { useEffect, useRef } from "react";
import * as THREE from "three";

export const PlayerControls: React.FC = () => {
  const indexRef = useRef(0);

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

      console.log("Active shard:", shard.name);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
};
