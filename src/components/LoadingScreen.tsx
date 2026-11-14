import React, { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import { useSceneReady } from "../three/sceneReady";

/**
 * Stays up until BOTH the minimum duration has passed AND the scene reports
 * ready (assets loaded, shaders compiled, first frame drawn). Gives up after
 * `timeout` ms so a failed asset can't trap the page behind it.
 */
export const LoadingScreen: React.FC<{ duration?: number; timeout?: number }> = ({
  duration = 2000,
  timeout = 15000,
}) => {
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const start = performance.now();
    let shown = 0;
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      const ready = useSceneReady.getState().ready;
      // three's loading manager; 0 while the scene's JS chunk is still downloading
      const real = useProgress.getState().progress / 100;

      // hold at 95% until the scene has actually drawn, never fill faster than
      // `duration`, and never move backwards (total grows as new loads queue up)
      const target = ready ? 1 : Math.min(real, 0.95);
      shown = Math.max(shown, Math.min(target, elapsed / duration));
      setProgress(shown);

      if (shown >= 1) {
        setFading(true);
      } else if (elapsed > timeout) {
        console.warn("portfolio: scene not ready after timeout, hiding loader anyway");
        setFading(true);
      } else {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, timeout]);

  useEffect(() => {
    if (!fading) return;
    const t = setTimeout(() => setGone(true), 500);
    return () => clearTimeout(t);
  }, [fading]);

  if (gone) return null;

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-bg transition-opacity duration-500"
      style={{ opacity: fading ? 0 : 1, pointerEvents: fading ? "none" : "auto" }}
    >
      <div className="flex w-56 flex-col items-center gap-3 font-mono text-xs text-faint">
        <span className="font-display text-2xl font-bold text-ink">
          mccullah<span className="text-acc">.</span>z
        </span>
        <div className="h-px w-full bg-line">
          <div className="h-px bg-acc" style={{ width: `${progress * 100}%` }} />
        </div>
        <span>loading portfolio… {Math.round(progress * 100)}%</span>
      </div>
    </div>
  );
};
