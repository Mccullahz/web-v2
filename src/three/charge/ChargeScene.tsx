// "The charge" — one continuous scroll-driven flight down a roastery hall. Scroll is distance: the camera runs the approved sway path past one station per project, gets swallowed by the roast drum mid-flight, and lands on the mug lineup. Layout comes from charge-set.glb (see charge/README.md for the Blender loop); this file owns the ride and the DOM around it.
import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ScrollControls, useScroll } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { CHARGE_PROJECTS } from "./projects";
import {
  CARD_WINDOW,
  FOV,
  defaultPlan,
  frameAt,
  nearest,
  offsetForZ,
  pagesFor,
  planFromTargets,
  type FlightPlan,
} from "./layout";
import { qualityTier, useChargeTheme } from "./theme";
import { ChargeSet, type SetAnchors } from "./ChargeSet";
import { FinaleMugs } from "./FinaleMugs";

interface Fix {
  index: number;
  at: boolean;
  finale: boolean;
}

interface RigProps {
  plan: FlightPlan;
  onFix: (f: Fix) => void;
  onEl: (el: HTMLDivElement) => void;
  metresRef: React.RefObject<HTMLSpanElement | null>;
}

// The only thing scroll touches is the camera. Position, aim, and a banked
// roll into each curve all derive from the damped scroll offset, so reversing
// scroll rewinds the flight exactly.
function Rig({ plan, onFix, onEl, metresRef }: RigProps) {
  const scroll = useScroll();
  const camera = useThree((s) => s.camera);
  const pos = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  const last = useRef<Fix>({ index: -1, at: false, finale: false });

  useMemo(() => {
    // let keyboard scrolling work as soon as the scene has been clicked
    scroll.el.tabIndex = 0;
    scroll.el.style.outline = "none";
    onEl(scroll.el);
  }, [scroll.el, onEl]);

  useFrame(() => {
    const u = scroll.offset;
    const roll = frameAt(plan, u, pos.current, look.current);
    camera.position.copy(pos.current);
    camera.lookAt(look.current);
    camera.rotateZ(roll);

    const fix = nearest(plan, pos.current.z);
    const finale = pos.current.z > plan.waypoints[plan.waypoints.length - 1] + CARD_WINDOW;
    if (fix.index !== last.current.index || fix.at !== last.current.at || finale !== last.current.finale) {
      last.current = { index: fix.index, at: fix.at && !finale, finale };
      onFix(last.current);
    }
    if (metresRef.current) metresRef.current.textContent = String(fix.metres).padStart(3, "0");
  });

  return null;
}

export const ChargeScene: React.FC = () => {
  const navigate = useNavigate();
  const palette = useChargeTheme();
  const quality = useMemo(qualityTier, []);
  const reduced = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const [anchors, setAnchors] = useState<SetAnchors | null>(null);
  const [fix, setFix] = useState<Fix>({ index: 0, at: false, finale: false });
  const metresRef = useRef<HTMLSpanElement>(null);
  const scrollEl = useRef<HTMLDivElement | null>(null);
  const captureEl = useCallback((el: HTMLDivElement) => {
    scrollEl.current = el;
  }, []);

  const plan = useMemo(() => {
    if (!anchors || anchors.stations.length === 0) return defaultPlan();
    return planFromTargets(
      anchors.stations.map((s) => ({
        x: s.position.x,
        y: s.position.y,
        z: s.position.z,
        drum: s.isDrum,
      }))
    );
  }, [anchors]);

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

  const project = CHARGE_PROJECTS[fix.index % CHARGE_PROJECTS.length];
  const cardUp = fix.at && !fix.finale;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-bg">
      <Canvas
        dpr={quality.dpr}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        camera={{ fov: FOV, near: 0.3, far: 340, position: [0, 3.1, plan.start] }}
      >
        <color attach="background" args={[palette.bg]} />
        <fog attach="fog" args={[palette.bg, 16, 118]} />

        <Suspense fallback={null}>
          <Environment files="/hdri/lebombo_1k.hdr" environmentIntensity={0.35} />
        </Suspense>

        <hemisphereLight args={[palette.skyHemi, palette.groundHemi, 0.3]} />
        <directionalLight position={[6, 14, -8]} intensity={1.1} color={palette.key} />
        <directionalLight position={[-8, 6, 10]} intensity={0.5} color={palette.fill} />

        <ScrollControls pages={pagesFor(CHARGE_PROJECTS.length)} damping={reduced ? 0.02 : 0.16}>
          <Rig plan={plan} onFix={setFix} onEl={captureEl} metresRef={metresRef} />
          <Suspense fallback={null}>
            <ChargeSet
              palette={palette}
              quality={quality}
              ambient={!reduced}
              onAnchors={setAnchors}
            />
            {anchors && anchors.mugSpots.length > 0 && (
              <FinaleMugs spots={anchors.mugSpots} palette={palette} />
            )}
          </Suspense>
        </ScrollControls>

        {quality.post && (
          <EffectComposer>
            <Bloom mipmapBlur luminanceThreshold={1} intensity={0.7} />
            <Vignette offset={0.28} darkness={0.55} />
          </EffectComposer>
        )}
      </Canvas>

      {/* ---- DOM layer: everything readable lives out here, over the canvas ---- */}
      <div className="pointer-events-none absolute inset-0 z-30">
        {/* skip ahead / rewind */}
        <button
          type="button"
          onClick={() => flyTo(fix.finale ? 0 : 1)}
          className="pointer-events-auto absolute bottom-6 right-6 rounded-md border border-line bg-surf/80 px-3 py-1.5 font-mono text-xs text-mut backdrop-blur transition-colors hover:border-acc hover:text-acc focus-visible:border-acc focus-visible:outline-none"
        >
          {fix.finale ? "↩ back to the start" : "skip to the lineup ⇥"}
        </button>

        {/* flight telemetry + hint */}
        <div className="absolute bottom-6 left-6 font-mono text-xs text-faint">
          <span ref={metresRef} className="tabular-nums text-acc">
            000
          </span>
          {" m · scroll to fly"}
        </div>

        {/* progress rail: one tick per station, one for the lineup */}
        <div className="pointer-events-auto absolute right-6 top-1/2 flex -translate-y-1/2 flex-col items-end gap-3">
          {CHARGE_PROJECTS.map((p, i) => (
            <button
              key={p.slug}
              type="button"
              aria-label={`Fly to ${p.title}`}
              onClick={() => flyTo(offsetForZ(plan, plan.waypoints[i] ?? 0))}
              className={`h-1 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-acc ${
                !fix.finale && fix.index === i ? "w-8 bg-acc" : "w-4 bg-line hover:bg-mut"
              }`}
            />
          ))}
          <button
            type="button"
            aria-label="Fly to the mug lineup"
            onClick={() => flyTo(1)}
            className={`h-2.5 w-2.5 rounded-full border transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-acc ${
              fix.finale ? "border-acc bg-acc" : "border-line bg-transparent hover:border-mut"
            }`}
          />
        </div>

        {/* station card — slides up inside the ±11 m window around a station */}
        <div
          className={`absolute bottom-16 left-1/2 w-[min(92vw,26rem)] -translate-x-1/2 transition-all duration-300 sm:bottom-8 ${
            cardUp ? "pointer-events-auto translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
          aria-hidden={!cardUp}
        >
          <div className="flex items-center gap-3 rounded-lg border border-line bg-surf/90 p-3 shadow-xl backdrop-blur">
            <img
              src={project.shot}
              alt=""
              className="h-16 w-24 shrink-0 rounded border border-line object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[10px] uppercase tracking-widest text-acc">
                station {String(fix.index + 1).padStart(2, "0")}/
                {String(CHARGE_PROJECTS.length).padStart(2, "0")} · {project.category}
              </div>
              <div className="truncate font-poppins text-sm font-bold text-ink">{project.title}</div>
              <div className="truncate font-mono text-[10px] text-mut">{project.tech}</div>
            </div>
            <button
              type="button"
              onClick={() => navigate(project.path)}
              tabIndex={cardUp ? 0 : -1}
              className="shrink-0 rounded-md border border-line px-3 py-2 font-mono text-xs text-ink transition-colors hover:border-acc hover:text-acc focus-visible:border-acc focus-visible:outline-none"
            >
              view →
            </button>
          </div>
        </div>

        {/* finale caption */}
        <div
          className={`absolute bottom-16 left-1/2 -translate-x-1/2 text-center font-mono text-xs text-mut transition-opacity duration-500 sm:bottom-8 ${
            fix.finale ? "opacity-100" : "opacity-0"
          }`}
        >
          the lineup — <span className="text-acc">hover a mug</span>, click to visit
        </div>
      </div>
    </div>
  );
};
