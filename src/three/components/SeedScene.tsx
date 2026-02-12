import { useEffect, useRef } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Group, LoopOnce } from "three";
import * as THREE from "three";
import { shardNameToProject } from "../shardMapping";
import type { CardPayload } from "../shardMapping";

export { shardNameToProject };
export type { CardPayload };

export type SeedSceneHoverPayload = CardPayload;

interface SeedSceneProps {
  onShardHover?: (payload: SeedSceneHoverPayload | null) => void;
  onActiveShardChange?: (payload: CardPayload) => void;
  onNavigateToProject?: (path: string) => void;
}

export function SeedScene({ onShardHover, onActiveShardChange, onNavigateToProject }: SeedSceneProps) {
  const group = useRef<Group>(null!);

  const { scene, animations } = useGLTF("/models/seed.glb");
  const { actions, mixer } = useAnimations(animations, group);

  // animation playback (essentially unchanged from what gippity wrote)
  useEffect(() => {
	  if (!actions || animations.length === 0) return;

	  const clips = animations.map(a => actions[a.name]).filter(Boolean);

	  clips.forEach(action => {
		  action!.reset().setLoop(LoopOnce, 1).play();
		  action!.clampWhenFinished = true;
	  });
	  
	  const onFinished = () => {
		  (window as any).__cameraAPI?.zoomIn();
	  };
	  
	  mixer.addEventListener("finished", onFinished);
	  
	  return () => {
		  mixer.removeEventListener("finished", onFinished);
		  mixer.stopAllAction();
	  };
  }, []);

  // mark shards for interaction, we are getting the individual mesh objects by name prefix successfully
  const shardMeshes = useRef<THREE.Mesh[]>([]);
  useEffect(() => {
    shardMeshes.current = [];

    scene.traverse(obj => {
	    if (obj instanceof THREE.Mesh && obj.name.startsWith("shard_")) {
		    obj.userData.isShard = true;
		    obj.castShadow = true;
		    obj.receiveShadow = true;
		    shardMeshes.current.push(obj);
	    }
    });
  }, [scene]);

  // expose shard meshes globally
useEffect(() => {
  shardMeshes.current = [];

  scene.traverse(obj => {
    if (obj instanceof THREE.Mesh && obj.name.startsWith("shard_")) {
      shardMeshes.current.push(obj);
    }
  });

  (window as any).__shards = shardMeshes.current;
}, [scene]);


  return (
    <group
      ref={group}
      onPointerOver={(e) => {
        e.stopPropagation();
        const obj = e.object as THREE.Mesh;
        if (obj.userData.isShard && onShardHover) {
          const project = shardNameToProject(obj.name);
          if (project) {
            const { clientX, clientY } = e.nativeEvent;
            onShardHover({ project, x: clientX, y: clientY });
          }
        }
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        const obj = e.object as THREE.Mesh;
        if (obj.userData.isShard && onShardHover) {
          onShardHover(null);
        }
      }}
      onPointerDown={(e) => {
        e.stopPropagation();

        const obj = e.object as THREE.Mesh;

        if (obj.userData.isShard) {
          const alreadyActive = obj === (window as any).__activeShard;
          if (alreadyActive) {
            const project = shardNameToProject(obj.name);
            if (project?.path && onNavigateToProject) {
              onNavigateToProject(project.path);
              return;
            }
          }

          const pos = new THREE.Vector3();
          obj.getWorldPosition(pos);

          (window as any).__cameraAPI?.focusOn(pos);
          (window as any).__activeShard = obj;

          const project = shardNameToProject(obj.name);
          if (project && onActiveShardChange) {
            const { clientX, clientY } = e.nativeEvent;
            onActiveShardChange({ project, x: clientX, y: clientY });
          }
          console.log("Active Shard:", obj.name);
        }
      }}
    >
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/src/three/data/seed.glb");

