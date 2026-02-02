import { useEffect, useRef } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Group, LoopOnce } from "three";
import * as THREE from "three";

export function SeedScene() {
  const group = useRef<Group>(null!);

  const { scene, animations } = useGLTF("/src/three/data/seed.glb");
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
      onPointerDown={(e) => {
        e.stopPropagation();

        const obj = e.object as THREE.Mesh;

        if (obj.userData.isShard) {
          const pos = new THREE.Vector3();
	  obj.getWorldPosition(pos);

	  (window as any).__cameraAPI?.focusOn(pos);

	  console.log("Active Shard:", obj.name);
        }
      }}
    >
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/src/three/data/seed.glb");

