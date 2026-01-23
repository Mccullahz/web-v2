import { useEffect, useRef } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Group, LoopOnce } from "three";

export function SeedScene() {
  const group = useRef<Group>(null!);

  const { scene, animations } = useGLTF("/src/three/data/seed.glb");
  const { actions, mixer } = useAnimations(animations, group);
  animations.map(a => a.name)
// ["Drop", "Break"]


  useEffect(() => {
    if (!actions || animations.length === 0) return;

    const clips = animations.map(a => actions[a.name]).filter(Boolean);

    // Configure all clips to play once
    clips.forEach(action => {
      action!
        .reset()
        .setLoop(LoopOnce, 1)
        .clampWhenFinished = true;
    });

    // Play them sequentially
    let index = 0;

    const playNext = () => {
      const action = clips[index];
      if (!action) return;

      action.play();

      mixer.addEventListener("finished", () => {
        index++;
        if (index < clips.length) {
          playNext();
        }
      });
    };

    playNext();

    return () => {
      mixer.stopAllAction();
    };
  }, [actions, animations, mixer]);

  console.log(
  animations.map(a => ({
    name: a.name,
    duration: a.duration,
  }))
);


  return <primitive ref={group} object={scene} />;
}

useGLTF.preload("/src/three/data/seed.glb");

