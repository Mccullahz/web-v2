import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { create } from "zustand";

/**
 * Shared "is the current portfolio scene actually on screen yet" flag.
 * Scenes flip it via <SceneReady />; the loading screen reads it; Gui resets it
 * whenever a scene (re)mounts.
 */
interface SceneReadyState {
  ready: boolean;
  setReady: () => void;
  reset: () => void;
}

export const useSceneReady = create<SceneReadyState>((set) => ({
  ready: false,
  setReady: () => set({ ready: true }),
  reset: () => set({ ready: false }),
}));

/**
 * Mount inside a scene's <Suspense> (after its contents) so it only appears once
 * every asset has resolved. Compiles shaders up front, then reports ready after
 * the second rendered frame, i.e. once a real frame has hit the screen.
 */
export function SceneReady() {
  const { gl, scene, camera } = useThree();
  const frames = useRef(0);

  useEffect(() => {
    gl.compile(scene, camera);
  }, [gl, scene, camera]);

  useFrame(() => {
    if (++frames.current === 2) useSceneReady.getState().setReady();
  });

  return null;
}
