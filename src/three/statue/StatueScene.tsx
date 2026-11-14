// "The sculpture" — one scroll-scrubbed shot: an orbital descent around a
// classical self-portrait, the arm cracks off, falls, and shatters. Scroll is
// time; scrolling back up restores the arm. Layout and debris come from
// statue-set.glb (see statue/README.md for the Blender loop); this file owns
// the ride and the DOM around it.
import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ScrollControls, useScroll } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import {
  FOV,
  PAGES,
  STOPS,
  frameAt,
  orbitDeg,
  phaseAt,
  type BreakAnchors,
} from "./timeline";
import { qualityTier, useStatueTheme } from "./theme";
import { StatueSet } from "./StatueSet";

const PLACARD = [
  { numeral: "I", title: "digital marble", sub: "self portrait · circa 2026" },
  { numeral: "II", title: "the flaw", sub: "every marble carries one" },
  { numeral: "III", title: "the fall", sub: "gravity, uncommissioned" },
  { numeral: "IV", title: "the ruin", sub: "authentically ancient at last" },
];

interface RigProps {
  anchors: BreakAnchors | null;
  shake: boolean;
  onPhase: (p: number) => void;
  onEl: (el: HTMLDivElement) => void;
  degRef: React.RefObject<HTMLSpanElement | null>;
}

// The only thing scroll touches is the camera (and, in StatueSet, the break).
// Position, gaze and the impact shake all derive from the damped scroll
// offset, so reversing scroll rewinds the shot exactly.
function Rig({ anchors, shake, onPhase, onEl, degRef }: RigProps) {
  const scroll = useScroll();
  const camera = useThree((s) => s.camera);
  const pos = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  const lastPhase = useRef(-1);

  useMemo(() => {
    // let keyboard scrolling work as soon as the scene has been clicked
    scroll.el.tabIndex = 0;
    scroll.el.style.outline = "none";
    onEl(scroll.el);
  }, [scroll.el, onEl]);

  useFrame(() => {
    const u = scroll.offset;
    const roll = frameAt(u, anchors, pos.current, look.current, shake);
    camera.position.copy(pos.current);
    camera.lookAt(look.current);
    camera.rotateZ(roll);

    const phase = phaseAt(u);
    if (phase !== lastPhase.current) {
      lastPhase.current = phase;
      onPhase(phase);
    }
    if (degRef.current) degRef.current.textContent = String(orbitDeg(u)).padStart(3, "0");
  });

  return null;
}

export const StatueScene: React.FC = () => {
  const palette = useStatueTheme();
  const quality = useMemo(qualityTier, []);
  const reduced = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const [anchors, setAnchors] = useState<BreakAnchors | null>(null);
  const [phase, setPhase] = useState(0);
  const degRef = useRef<HTMLSpanElement>(null);
  const scrollEl = useRef<HTMLDivElement | null>(null);
  const captureEl = useCallback((el: HTMLDivElement) => {
    scrollEl.current = el;
  }, []);

  const flyTo = useCallback(
    (u: number) => {
      const el = scrollEl.current;
      if (!el) return;
      el.scrollTo({
        top: u * (el.scrollHeight - el.clientHeight),
        behavior: reduced ? "auto" : "smooth",
      });
    },
    [reduced]
  );

  const card = PLACARD[phase];
  const ruined = phase === 3;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-bg">
      <Canvas
        dpr={quality.dpr}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        camera={{ fov: FOV, near: 0.3, far: 140, position: [1.26, 3.9, 3.16] }}
      >
        <color attach="background" args={[palette.bg]} />
        <fog attach="fog" args={[palette.bg, 14, 58]} />

        <Suspense fallback={null}>
          <Environment files="/hdri/lebombo_1k.hdr" environmentIntensity={0.35} />
        </Suspense>

        <hemisphereLight args={[palette.skyHemi, palette.groundHemi, 0.35]} />
        <directionalLight position={[3, 14, 5]} intensity={1.3} color={palette.key} />
        <directionalLight position={[-8, 4, -6]} intensity={0.4} color={palette.fill} />

        <ScrollControls pages={PAGES} damping={reduced ? 0.02 : 0.18}>
          <Rig
            anchors={anchors}
            shake={!reduced}
            onPhase={setPhase}
            onEl={captureEl}
            degRef={degRef}
          />
          <Suspense fallback={null}>
            <StatueSet
              palette={palette}
              quality={quality}
              ambient={!reduced}
              onAnchors={setAnchors}
            />
          </Suspense>
        </ScrollControls>

        {quality.post && (
          <EffectComposer>
            <Bloom mipmapBlur luminanceThreshold={1} intensity={0.65} />
            <Vignette offset={0.28} darkness={0.55} />
          </EffectComposer>
        )}
      </Canvas>

      {/* ---- DOM layer: everything readable lives out here, over the canvas ---- */}
      <div className="pointer-events-none absolute inset-0 z-30">
        {/* skip ahead / rewind */}
        <button
          type="button"
          onClick={() => flyTo(ruined ? 0 : 1)}
          className="pointer-events-auto absolute bottom-6 right-6 rounded-md border border-line bg-surf/80 px-3 py-1.5 font-mono text-xs text-mut backdrop-blur transition-colors hover:border-acc hover:text-acc focus-visible:border-acc focus-visible:outline-none"
        >
          {ruined ? "↩ restore the arm" : "skip to the ruin ⇥"}
        </button>

        {/* orbit telemetry + hint */}
        <div className="absolute bottom-6 left-6 font-mono text-xs text-faint">
          <span ref={degRef} className="tabular-nums text-acc">
            000
          </span>
          {"° · scroll to circle"}
        </div>

        {/* progress rail: one tick per beat of the piece */}
        <div className="pointer-events-auto absolute right-6 top-1/2 flex -translate-y-1/2 flex-col items-end gap-3">
          {STOPS.map((s, i) => (
            <button
              key={s.label}
              type="button"
              aria-label={`Jump to ${s.label}`}
              onClick={() => flyTo(s.u)}
              className={`h-1 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-acc ${
                phase === i ? "w-8 bg-acc" : "w-4 bg-line hover:bg-mut"
              }`}
            />
          ))}
        </div>

        {/* museum placard — retitles itself as the piece comes apart */}
        <div className="absolute bottom-16 left-1/2 w-[min(92vw,22rem)] -translate-x-1/2 sm:bottom-8">
          <div className="rounded-lg border border-line bg-surf/90 p-3 text-center shadow-xl backdrop-blur">
            <div className="font-mono text-[10px] uppercase tracking-widest text-acc">
              gallery · {card.numeral}/IV
            </div>
            <div className="font-poppins text-sm font-bold text-ink">{card.title}</div>
            <div className="font-mono text-[10px] text-mut">
              {card.sub}
              {ruined && (
                <>
                  {" — "}
                  <span className="text-acc">scroll up to restore</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
