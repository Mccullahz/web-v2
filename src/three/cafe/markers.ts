import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { RINGS } from "./data";

export const ROOM_URL = "/models/cafe/room.glb";

export interface CafeMarkers {
  rings: THREE.Vector3[];
  cupHome: THREE.Vector3;
  boards: THREE.Vector3[];
}

/** Ring, cup and board positions, read from the named empties in room.glb. */
export function useCafeMarkers(): CafeMarkers {
  const { scene } = useGLTF(ROOM_URL);
  return useMemo(() => {
    scene.updateMatrixWorld(true);
    const at = (name: string) => {
      const o = scene.getObjectByName(name);
      if (!o) throw new Error(`room.glb is missing the marker "${name}"`);
      return o.getWorldPosition(new THREE.Vector3());
    };
    return {
      rings: RINGS.map((_, i) => at(`ring_${i + 1}`)),
      cupHome: at("cup_home"),
      boards: RINGS.map((_, i) => at(`board_${i + 1}`)),
    };
  }, [scene]);
}
