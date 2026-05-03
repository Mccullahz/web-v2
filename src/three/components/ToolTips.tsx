/* "tool tip" used as a keyboard and mouse animated model. should provide a little more hinting towards what to do in the portfolio page */
import { useEffect, useRef } from "react";
import type { ReactElement } from "react";
import { useGLTF, useAnimations, ScreenSpace } from "@react-three/drei";
import { Group, LoopRepeat } from "three";
import kbmModelUrl from "../data/kbm-lp.glb?url";

export type ToolTipsProps = {
  /** passed to `ScreenSpace`. */
  depth?: number;
  scale?: number;
  position?: [number, number, number];
  /** rotation in radians applied to the model: [x, y, z] // same as three default */
  rotation?: [number, number, number];
};

const defaultPlacement = {
  depth: 12,
  scale: 2,
  position: [10, 3, 3] as [number, number, number],
  rotation: [1.5, 0, 0] as [number, number, number],
};

export function ToolTips(props: ToolTipsProps = {}) {
  const { depth, scale, position, rotation } = { ...defaultPlacement, ...props };
  const group = useRef<Group>(null!);

  const { scene, animations } = useGLTF(kbmModelUrl);
  const { actions, mixer } = useAnimations(animations, group);

  useEffect(() => {
    if (!actions || animations.length === 0) return;

    const clips = animations.map((a) => actions[a.name]).filter(Boolean);
    clips.forEach((action) => {
      action!.reset().setLoop(LoopRepeat, Infinity).play();
    });

    return () => {
      mixer.stopAllAction();
    };
  }, [actions, animations, mixer]);

  return (
    <ScreenSpace depth={depth}>
      <group ref={group} position={position} rotation={rotation} scale={scale}>
        <primitive object={scene} />
      </group>
    </ScreenSpace>
  );
}

/** returns jsx to mount inside <Canvas> // kbm-lp.glb animations. */
export function createToolTips(props?: ToolTipsProps): ReactElement {
  return <ToolTips {...props} />;
}

useGLTF.preload(kbmModelUrl);
