// outline effect on active shard, currently borked
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { EffectComposer, Outline } from "@react-three/postprocessing";
import * as THREE from "three";

export function ShardHighlight() {
  const selection = useRef<THREE.Object3D[]>([]);

  useFrame(() => {
    const shard = (window as any).__activeShard as THREE.Mesh | undefined;
    selection.current = shard ? [shard] : [];
    console.log("Highlighting shard:", shard ? shard.name : "none");
  });

  return (
    <EffectComposer autoClear={true}>
      <Outline
        selection={selection.current}
        edgeStrength={3}
        pulseSpeed={0.8}
        visibleEdgeColor={0xffffff}
        hiddenEdgeColor={0x88ccff}
      />
    </EffectComposer>
  );
}

