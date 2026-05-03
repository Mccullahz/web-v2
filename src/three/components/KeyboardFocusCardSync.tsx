import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { shardNameToProject } from "../shardMapping";
import type { CardPayload } from "../shardMapping";

interface KeyboardFocusCardSyncProps {
  /** if true, project active shard to screen for the kb overlay. */
  active: boolean;
  onUpdate: (payload: CardPayload) => void;
}

export function KeyboardFocusCardSync({ active, onUpdate }: KeyboardFocusCardSyncProps) {
  const { camera, size } = useThree();
  const pos = useRef(new THREE.Vector3());
  const lastPixel = useRef({ x: -1e9, y: -1e9 });

  useFrame(() => {
    if (!active) {
      lastPixel.current = { x: -1e9, y: -1e9 };
      return;
    }

    const shard = (window as any).__activeShard as THREE.Mesh | undefined;
    if (!shard) return;

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
