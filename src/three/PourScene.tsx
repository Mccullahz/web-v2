// "Tip & pour" portfolio scene.
// The mug falls FORWARD (beans spill out), then keels over sideways onto its
// left handle. Coffee spills forward as a spreading puddle that shoves the
// beans out of its way. Camera cranes from a 3/4 hero into a near top-down so
// nothing hides behind the (wide) mug. Hover a bean to reveal the project.
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { Html, ContactShadows, Environment } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";
import { projects } from "./data/projects";
import mugUrl from "./data/mug.obj?url";

type Vec3 = [number, number, number];

// --- Tunables --------------------------------------------------------------
const MUG_HEIGHT = 1.3;
// Spin the loaded OBJ so the handle sits on the LEFT (nudge the Y value if the
// handle isn't quite on the left — it's in radians).
const MUG_ORIENT: Vec3 = [0, 1.3* Math.PI, 0];

// Camera crane: 3/4 hero on the mug, then up-and-over into a near top-down.
const CAMERA_START_POS: Vec3 = [0, 5.5, 5];
const CAMERA_START_LOOK: Vec3 = [0, 0.45, -0.2];
const CAMERA_END_POS: Vec3 = [0, 13, 4];
const CAMERA_END_LOOK: Vec3 = [0, 0, -2.2];
const CAM_MOVE_START = 0.3;
const CAM_MOVE_END = 2.0;
const CAMERA_FOV = 40;

// Beans launch from the lip and settle in a fan out front.
const EMIT: Vec3 = [0, 1.05, -0.4];
const LANDING: Vec3[] = [
  [-1.25, 0.12, -2.05], // YSA — pulled in so it rides the coffee
  [-0.7, 0.12, -2.45],
  [0.1, 0.12, -2.75],
  [0.9, 0.12, -2.4],
  [1.3, 0.12, -2.0], // GGJ — pulled in so it rides the coffee
];
const ARC_HEIGHT = 0.8;
const BEAN_SIZE = 0.17;
const BEAN_LAUNCH = 0.5;
const BEAN_STAGGER = 0.13;
const BEAN_TRAVEL = 1.0;

// Two-beat mug motion. PITCH = fall forward (rotation.x); ROLL = keel over onto
// the handle afterward (rotation.z). Beans spill during the pitch beat.
const MUG_PITCH_KEYS: [number, number][] = [
  [0, 0],
  [0.28, 0.06],
  [0.7, -0.62],
  [0.95, -0.74],
  [1.25, -0.66],
];
const MUG_ROLL_KEYS: [number, number][] = [
  [0, 0],
  [1.1, 0],
  [1.5, 0.16],
  [1.9, 0.24],
  [2.2, 0.22],
];
const MUG_PITCH_REST = -0.66; // used to gate the steam

// Coffee: a fill inside the mug that drains as it pours, a stream that pours
// off the mug's lip, and a puddle at the base that spreads forward into beans.
// Puddle sits well OUT FRONT and is elongated along the pour line, so the
// coffee streams outward away from the mug rather than hugging the rim.
const PUDDLE_CENTER: Vec3 = [0, 0.02, -3.05];
const PUDDLE_MAX_X = 1.4; // wider spill (volume) without changing the reach
const PUDDLE_MAX_Z = 1.3;
const PUDDLE_START = 0.6;
const PUDDLE_FULL = 2.0;
const COFFEE_LEVEL = MUG_HEIGHT * 0.78; // fill height inside the mug

// --- Theme-aware scene palette ---------------------------------------------
type Palette = {
  bg: string;
  table: string;
  mug: string;
  coffee: string;
  bean: string;
  beanHover: string;
  key: string;
  fill: string;
  skyHemi: string;
  groundHemi: string;
};

const PALETTES: Record<"light" | "dark", Palette> = {
  dark: {
    bg: "#0c0a08",
    table: "#1a140f",
    mug: "#e7ddcf",
    coffee: "#2c1a0e",
    bean: "#5a3a1e",
    beanHover: "#a06a3a",
    key: "#ffe9d0",
    fill: "#d3a99f",
    skyHemi: "#fff3e6",
    groundHemi: "#241a12",
  },
  light: {
    bg: "#dfdbd9",
    table: "#cdc6bf",
    mug: "#f4efe8",
    coffee: "#3a2413",
    bean: "#6b4423",
    beanHover: "#9a6a3a",
    key: "#fff6ea",
    fill: "#a8705f",
    skyHemi: "#ffffff",
    groundHemi: "#d8d0c6",
  },
};

function readTheme(): "light" | "dark" {
  const forced = document.documentElement.dataset.theme;
  if (forced === "light" || forced === "dark") return forced;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Pull the page's real background token so the scene bg + table match the
// landing page exactly (and switch with the header's theme toggle).
function computeScenePalette(): Palette {
  const base = PALETTES[readTheme()];
  const bg = getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim();
  return bg ? { ...base, bg, table: bg } : base;
}

function useSceneTheme(): Palette {
  const [pal, setPal] = useState<Palette>(computeScenePalette);
  useEffect(() => {
    const update = () => setPal(computeScenePalette());
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", update);
    return () => {
      mo.disconnect();
      mq.removeEventListener("change", update);
    };
  }, []);
  return pal;
}

// --- Math helpers -----------------------------------------------------------
function smoother(t: number) {
  t = Math.min(1, Math.max(0, t));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function keyframe(keys: [number, number][], t: number) {
  if (t <= keys[0][0]) return keys[0][1];
  const last = keys[keys.length - 1];
  if (t >= last[0]) return last[1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (t >= t0 && t <= t1) return v0 + (v1 - v0) * smoother((t - t0) / (t1 - t0));
  }
  return last[1];
}

function qbezier(p0: Vec3, p1: Vec3, p2: Vec3, t: number, out: THREE.Vector3) {
  const u = 1 - t;
  out.set(
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    u * u * p0[2] + 2 * u * t * p1[2] + t * t * p2[2]
  );
  return out;
}

function lerpTuple(a: Vec3, b: Vec3, t: number, out: THREE.Vector3) {
  out.set(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
  return out;
}

function puddleProgress(t: number) {
  return smoother((t - PUDDLE_START) / (PUDDLE_FULL - PUDDLE_START));
}

interface Timeline {
  t: number;
  playing: boolean;
}

// Scripted crane camera, damped so it always feels smooth.
function CameraRig({ timeline }: { timeline: React.MutableRefObject<Timeline> }) {
  const { camera } = useThree();
  const curLook = useRef(new THREE.Vector3(...CAMERA_START_LOOK));
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());

  useEffect(() => {
    camera.position.set(...CAMERA_START_POS);
    curLook.current.set(...CAMERA_START_LOOK);
    camera.lookAt(curLook.current);
  }, [camera]);

  useFrame((_, delta) => {
    const t = timeline.current.t;
    const p = smoother((t - CAM_MOVE_START) / (CAM_MOVE_END - CAM_MOVE_START));
    lerpTuple(CAMERA_START_POS, CAMERA_END_POS, p, targetPos.current);
    lerpTuple(CAMERA_START_LOOK, CAMERA_END_LOOK, p, targetLook.current);
    const k = 1 - Math.exp(-delta * 6);
    camera.position.lerp(targetPos.current, k);
    curLook.current.lerp(targetLook.current, k);
    camera.lookAt(curLook.current);
  });

  return null;
}

// Loads + normalizes the repo mug and nests two pivots: an outer PITCH pivot at
// the far bottom edge (fall forward) and an inner ROLL pivot at the left bottom
// edge (keel over onto the handle).
function Mug({
  pitchRef,
  rollRef,
  fillRef,
  lipRef,
  palette,
}: {
  pitchRef: React.RefObject<THREE.Group | null>;
  rollRef: React.RefObject<THREE.Group | null>;
  fillRef: React.RefObject<THREE.Mesh | null>;
  lipRef: React.RefObject<THREE.Object3D | null>;
  palette: Palette;
}) {
  const obj = useLoader(OBJLoader, mugUrl);

  const { model, halfDepth, halfWidth } = useMemo(() => {
    const o = obj.clone(true);
    const mat = new THREE.MeshPhysicalMaterial({
      color: palette.mug,
      roughness: 0.5,
      metalness: 0,
      clearcoat: 0.6,
      clearcoatRoughness: 0.35,
      envMapIntensity: 0.8,
    });
    o.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.material = mat;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    const box = new THREE.Box3().setFromObject(o);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const s = MUG_HEIGHT / (size.y || 1);
    o.scale.setScalar(s);
    o.position.set(-center.x * s, -box.min.y * s, -center.z * s);

    return { model: o, halfDepth: (size.z * s) / 2, halfWidth: (size.x * s) / 2 };
  }, [obj, palette.mug]);

  return (
    <group ref={pitchRef} position={[0, 0, -halfDepth]}>
      <group position={[0, 0, halfDepth]}>
        {/* marker at the top of the front rim — tracks the pouring lip */}
        <object3D ref={lipRef} position={[0, MUG_HEIGHT, -halfDepth * 0.72]} />
        <group ref={rollRef} position={[-halfWidth, 0, 0]}>
          <group position={[halfWidth, 0, 0]} rotation={MUG_ORIENT}>
            <primitive object={model} />
            {/* coffee surface inside the mug (drained by PourRig as it pours) */}
            <mesh ref={fillRef} position={[0, COFFEE_LEVEL, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[Math.max(0.1, halfDepth * 0.82), 40]} />
              <meshStandardMaterial color={palette.coffee} roughness={0.2} metalness={0} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

// Soft radial-gradient sprite texture for steam puffs (generated, no asset).
function makeSteamTexture() {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.5, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

// An irregular teardrop blob (in the XY plane) for the coffee puddle — bulges
// along +Y, which maps to the pour direction once the mesh is laid flat.
function makeBlobGeometry() {
  const N = 80;
  const p1 = Math.random() * 6.28;
  const p2 = Math.random() * 6.28;
  const p3 = Math.random() * 6.28;
  const shape = new THREE.Shape();
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const forward = Math.max(0, Math.sin(a)); // bulge toward the pour direction
    const r =
      1 +
      0.3 * forward +
      0.13 * Math.sin(a * 3 + p1) +
      0.08 * Math.sin(a * 6 + p2) +
      0.05 * Math.sin(a * 9 + p3);
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  return new THREE.ShapeGeometry(shape, 16);
}

const STEAM_COUNT = 14;

function Steam({ timeline, palette }: { timeline: React.MutableRefObject<Timeline>; palette: Palette }) {
  const sprites = useRef<(THREE.Sprite | null)[]>([]);
  const tex = useMemo(makeSteamTexture, []);
  const seeds = useMemo(
    () =>
      Array.from({ length: STEAM_COUNT }, () => ({
        phase: Math.random(),
        x: (Math.random() - 0.5) * 0.22,
        z: (Math.random() - 0.5) * 0.22,
        speed: 0.16 + Math.random() * 0.12,
        sway: 0.08 + Math.random() * 0.12,
      })),
    []
  );

  useFrame((state) => {
    const angle = keyframe(MUG_PITCH_KEYS, timeline.current.t);
    const amount = Math.min(1, Math.max(0, 1 - Math.abs(angle) / Math.abs(MUG_PITCH_REST) / 0.4));
    const time = state.clock.elapsedTime;
    for (let i = 0; i < STEAM_COUNT; i++) {
      const sp = sprites.current[i];
      if (!sp) continue;
      const seed = seeds[i];
      const life = (time * seed.speed + seed.phase) % 1;
      const sway = Math.sin(life * Math.PI * 2 + seed.phase * 6.28) * seed.sway;
      sp.position.set(seed.x + sway, MUG_HEIGHT * 0.9 + life * 1.5, seed.z + Math.cos(life * 4 + seed.phase * 6.28) * seed.sway * 0.5);
      sp.scale.setScalar(0.22 + life * 0.55);
      (sp.material as THREE.SpriteMaterial).opacity = Math.sin(life * Math.PI) * 0.16 * amount;
    }
  });

  return (
    <group>
      {seeds.map((_, i) => (
        <sprite
          key={i}
          ref={(el) => {
            sprites.current[i] = el;
          }}
        >
          <spriteMaterial map={tex} color={palette.key} transparent opacity={0} depthWrite={false} />
        </sprite>
      ))}
    </group>
  );
}

// Stylized coffee: a single continuous stream that flows off the mug's lip
// (tracked via lipRef) into a spreading puddle. The stream extends as it falls
// and drains from the top as the mug empties. (Not a real fluid sim.)
function Coffee({
  timeline,
  lipRef,
  palette,
}: {
  timeline: React.MutableRefObject<Timeline>;
  lipRef: React.RefObject<THREE.Object3D | null>;
  palette: Palette;
}) {
  const puddleRef = useRef<THREE.Mesh>(null);
  const streamRef = useRef<THREE.Mesh>(null);
  const lipPos = useRef(new THREE.Vector3()).current;
  const blobGeom = useMemo(makeBlobGeometry, []);
  const curve = useMemo(
    () => new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()),
    []
  );
  const samples = useMemo(() => Array.from({ length: 20 }, () => new THREE.Vector3()), []);
  // where the stream meets the ground (near edge of the puddle)
  const landing = useMemo(() => new THREE.Vector3(PUDDLE_CENTER[0], 0.05, PUDDLE_CENTER[2] + 0.6), []);
  const streamMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: palette.coffee, roughness: 0.15, metalness: 0 }),
    [palette.coffee]
  );

  useFrame(() => {
    const t = timeline.current.t;

    // puddle
    const prog = puddleProgress(t);
    if (puddleRef.current) {
      const s = Math.max(0.0001, prog);
      puddleRef.current.scale.set(PUDDLE_MAX_X * s, PUDDLE_MAX_Z * s, 1);
      puddleRef.current.visible = prog > 0.002;
    }

    // stream: leading edge falls (headU), then the top drains away (tailU)
    const stream = streamRef.current;
    if (!stream) return;
    const headU = Math.min(1, Math.max(0, (t - 0.45) / 0.32));
    const tailU = Math.min(1, Math.max(0, (t - 1.35) / 0.5));
    if (t < 0.45 || headU - tailU < 0.03 || !lipRef.current) {
      stream.visible = false;
      return;
    }
    stream.visible = true;

    lipRef.current.updateWorldMatrix(true, false);
    lipRef.current.getWorldPosition(lipPos);

    // arc from the lip up-and-over into the landing point, with a little wobble
    const wob = Math.sin(t * 22) * 0.03;
    curve.v0.copy(lipPos);
    curve.v2.copy(landing);
    curve.v1.set(
      (lipPos.x + landing.x) / 2 + wob,
      Math.max(lipPos.y, landing.y) + 0.22,
      (lipPos.z + landing.z) / 2
    );

    // sample the visible portion [tailU, headU] of the arc
    const n = samples.length;
    for (let i = 0; i < n; i++) {
      const u = tailU + (headU - tailU) * (i / (n - 1));
      curve.getPoint(u, samples[i]);
    }
    const path = new THREE.CatmullRomCurve3(samples);
    const radius = 0.07 * (1 - 0.4 * tailU); // thins as it drains
    const geo = new THREE.TubeGeometry(path, 24, radius, 8, false);
    const old = stream.geometry;
    stream.geometry = geo;
    old.dispose();
  });

  return (
    <group>
      <mesh
        ref={puddleRef}
        geometry={blobGeom}
        position={PUDDLE_CENTER}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
        receiveShadow
      >
        <meshStandardMaterial color={palette.coffee} roughness={0.18} metalness={0} />
      </mesh>
      <mesh ref={streamRef} material={streamMat} visible={false}>
        <bufferGeometry />
      </mesh>
    </group>
  );
}

interface RigProps {
  timeline: React.MutableRefObject<Timeline>;
  hovered: number | null;
  onHover: (i: number | null) => void;
  onSelect: (path: string) => void;
  lipRef: React.RefObject<THREE.Object3D | null>;
  palette: Palette;
}

function PourRig({ timeline, hovered, onHover, onSelect, lipRef, palette }: RigProps) {
  const pitchRef = useRef<THREE.Group>(null);
  const rollRef = useRef<THREE.Group>(null);
  const fillRef = useRef<THREE.Mesh>(null);
  const beanRefs = useRef<(THREE.Mesh | null)[]>([]);
  const tmp = useRef(new THREE.Vector3()).current;
  const hoverPop = useRef<number[]>(LANDING.map(() => 1));
  // per-bean scatter for where it parks along the coffee's leading edge
  const frontJitter = useMemo(() => LANDING.map(() => ({ z: Math.random() * 0.5 - 0.15, x: Math.random() * 2 - 1 })), []);

  useFrame((_, delta) => {
    const tl = timeline.current;
    if (tl.playing) {
      tl.t += delta;
      if (tl.t > 3.4) tl.playing = false;
    }
    const t = tl.t;

    // beat one: fall forward (+ a small settle wobble); beat two: roll onto handle
    if (pitchRef.current) {
      let pitch = keyframe(MUG_PITCH_KEYS, t);
      if (t > 1.0) pitch += Math.exp(-(t - 1.0) * 5) * Math.sin((t - 1.0) * 22) * 0.02;
      pitchRef.current.rotation.x = pitch;
    }
    if (rollRef.current) rollRef.current.rotation.z = keyframe(MUG_ROLL_KEYS, t);

    // drain the coffee inside the mug as it pours out
    if (fillRef.current) {
      const drain = smoother((t - 0.35) / 0.6);
      const s = Math.max(0, 1 - drain);
      fillRef.current.scale.set(s, s, 1);
      fillRef.current.position.y = COFFEE_LEVEL - drain * 0.35;
      fillRef.current.visible = s > 0.02;
    }

    const prog = puddleProgress(t);

    for (let i = 0; i < LANDING.length; i++) {
      const mesh = beanRefs.current[i];
      if (!mesh) continue;

      hoverPop.current[i] = THREE.MathUtils.damp(hoverPop.current[i], hovered === i ? 1.25 : 1, 12, delta);

      const start = BEAN_LAUNCH + i * BEAN_STAGGER;
      const p = (t - start) / BEAN_TRAVEL;
      if (p <= 0) {
        mesh.scale.setScalar(0);
        continue;
      }
      const e = smoother(Math.min(p, 1));
      const land = LANDING[i];
      const ctrl: Vec3 = [(EMIT[0] + land[0]) / 2, Math.max(EMIT[1], land[1]) + ARC_HEIGHT, (EMIT[2] + land[2]) / 2];
      qbezier(EMIT, ctrl, land, Math.min(p, 1), tmp);

      if (p >= 1) {
        // landing bounce
        const tl2 = t - (start + BEAN_TRAVEL);
        tmp.y = land[1] + Math.max(0, Math.sin(tl2 * 12)) * Math.exp(-tl2 * 5) * 0.09;

        // the advancing coffee front carries in-path beans out to its leading edge
        const frontZ = PUDDLE_CENTER[2] - PUDDLE_MAX_Z * prog;
        const halfW = PUDDLE_MAX_X * prog * 1.35;
        if (tmp.z > frontZ && Math.abs(tmp.x - PUDDLE_CENTER[0]) < halfW) {
          const jit = frontJitter[i];
          tmp.z = Math.min(tmp.z, frontZ + 0.12 + jit.z); // ride just inside the front, jittered
          tmp.x += jit.x * prog * 0.12; // slight sideways drift
        }
      }
      mesh.position.copy(tmp);
      mesh.rotation.x = e * Math.PI * 2.4;
      mesh.rotation.z = e * Math.PI * 1.6;

      const grow = Math.min(1, (t - start) / 0.12);
      const s = BEAN_SIZE * grow * hoverPop.current[i];
      mesh.scale.set(s, s * 0.7, s * 0.6);
    }
  });

  return (
    <group>
      <Suspense fallback={null}>
        <Mug pitchRef={pitchRef} rollRef={rollRef} fillRef={fillRef} lipRef={lipRef} palette={palette} />
      </Suspense>
      {LANDING.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            beanRefs.current[i] = el;
          }}
          scale={0}
          castShadow
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover(i);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            onHover(null);
            document.body.style.cursor = "auto";
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(projects[i % projects.length].path);
          }}
        >
          <sphereGeometry args={[1, 20, 16]} />
          <meshStandardMaterial
            color={hovered === i ? palette.beanHover : palette.bean}
            roughness={0.5}
            emissive={palette.beanHover}
            emissiveIntensity={hovered === i ? 0.35 : 0}
          />
        </mesh>
      ))}
    </group>
  );
}

export const PourScene: React.FC = () => {
  const navigate = useNavigate();
  const palette = useSceneTheme();
  const [hovered, setHovered] = useState<number | null>(null);
  const timeline = useRef<Timeline>({ t: 0, playing: false });
  const lipRef = useRef<THREE.Object3D>(null);
  const reduced = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  const tip = () => {
    timeline.current = reduced ? { t: 5, playing: false } : { t: 0, playing: true };
  };

  const hoveredProject = hovered !== null ? projects[hovered % projects.length] : null;
  const tipPos = hovered !== null ? LANDING[hovered] : null;

  return (
    <div className="relative h-screen w-screen bg-bg">
      <Canvas
        shadows="soft"
        dpr={[1, 2]}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        camera={{ position: CAMERA_START_POS, fov: CAMERA_FOV }}
      >
        <color attach="background" args={[palette.bg]} />
        <fog attach="fog" args={[palette.bg, 15, 34]} />

        <Suspense fallback={null}>
          <Environment preset="apartment" environmentIntensity={0.55} />
        </Suspense>

        <hemisphereLight args={[palette.skyHemi, palette.groundHemi, 0.25]} />
        <directionalLight
          position={[3.5, 8, 3]}
          intensity={1.5}
          color={palette.key}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
          shadow-camera-near={0.5}
          shadow-camera-far={30}
        />
        <directionalLight position={[-2, 4, -6]} intensity={0.9} color={palette.fill} />
        <directionalLight position={[-5, 3, 2]} intensity={0.35} color={palette.key} />

        <CameraRig timeline={timeline} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color={palette.table} roughness={0.92} metalness={0} />
        </mesh>
        <ContactShadows position={[0, 0.012, -0.9]} scale={11} blur={2.8} opacity={0.35} far={4} />

        {/* PourRig first so the mug's rotation is set before Coffee reads the lip */}
        <PourRig timeline={timeline} hovered={hovered} onHover={setHovered} onSelect={navigate} lipRef={lipRef} palette={palette} />
        <Coffee timeline={timeline} lipRef={lipRef} palette={palette} />
        {!reduced && <Steam timeline={timeline} palette={palette} />}

        {hoveredProject && tipPos && (
          <Html position={[tipPos[0], tipPos[1] + 0.45, tipPos[2]]} center style={{ pointerEvents: "none" }} zIndexRange={[10, 0]}>
            <div className="w-40 -translate-y-2 rounded-md border border-line bg-surf/95 px-2.5 py-1.5 shadow-lg backdrop-blur">
              <div className="font-mono text-[9px] uppercase tracking-widest text-acc">{hoveredProject.category}</div>
              <div className="font-poppins text-xs font-bold leading-tight text-ink">{hoveredProject.title}</div>
              <div className="mt-0.5 font-mono text-[9px] text-mut">{hoveredProject.tech}</div>
            </div>
          </Html>
        )}
      </Canvas>

      {/* DOM overlay: controls + always-visible fallback list */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          <button
            onClick={tip}
            className="pointer-events-auto self-start rounded-lg border border-line bg-surf px-4 py-2 font-mono text-sm text-ink transition-colors hover:border-acc hover:text-acc"
          >
            ▸ tip the mug
          </button>
          <ul className="pointer-events-auto flex flex-wrap gap-2">
            {projects.map((p, i) => (
              <li key={p.path}>
                <button
                  onClick={() => navigate(p.path)}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  className="rounded-md border border-line bg-surf/70 px-3 py-1.5 font-mono text-xs text-mut transition-colors hover:border-acc hover:text-acc"
                >
                  {p.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="pointer-events-none absolute left-6 top-24 font-mono text-xs text-faint">
        portfolio · tip &amp; pour <span className="text-acc">(greybox)</span>
      </div>
    </div>
  );
};
