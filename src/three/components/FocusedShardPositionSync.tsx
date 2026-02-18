// track the position of the currently focused shard in the 3D scene and call onUpdate callback with the shard's project and screen coordinates whenever it changes. needed useFrame loop for pos allows for double click shard logic
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { shardNameToProject } from "../shardMapping";
import type { CardPayload } from "../shardMapping";

interface FocusedShardPositionSyncProps {
  onUpdate: (payload: CardPayload | null) => void;
}

export function FocusedShardPositionSync({ onUpdate }: FocusedShardPositionSyncProps) {
  const { camera, size } = useThree();
  const pos = useRef(new THREE.Vector3());
  const lastPixel = useRef({ x: -1e9, y: -1e9 });

  useFrame(() => {
    const shard = (window as any).__activeShard as THREE.Mesh | undefined;
    if (!shard) {
      lastPixel.current = { x: -1e9, y: -1e9 }; // if a gigapixel, -1 billion pixels, isnt offscreen.. nothing is
      return;
    }
    const project = shardNameToProject(shard.name);
    if (!project) return;

    shard.getWorldPosition(pos.current);
    const ndc = pos.current.clone().project(camera);
    const x = Math.round((ndc.x + 1) * 0.5 * size.width);
    const y = Math.round((1 - (ndc.y + 1) * 0.5) * size.height);

    if (x === lastPixel.current.x && y === lastPixel.current.y) return;
    lastPixel.current = { x, y };
    onUpdate({ project, x, y });
  });

  return null;
}
