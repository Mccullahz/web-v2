// "Set your cup down": the night café.
// Drag to orbit, right-drag / two fingers to pan, scroll to zoom (the opening view is
// the furthest out). Click a coffee ring (or press 1–5): the cup lifts and lands there
// while the camera swings in, the coffee ripples, and you end up looking straight down
// into it, at the board hanging face-down above, with that spot's order ticket lying on
// the table beside it. Esc or a click outside steps back out.
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import { PALETTE as C, PROJECTS, RINGS } from "./data";
import { BEAM_LAYER, Room } from "./Room";
import { useCafeMarkers } from "./markers";
import { SceneReady } from "../sceneReady";
import { RECEIPT, Receipts, ringAxes, type ReceiptAction } from "./Receipts";

type Phase = "overview" | "carry" | "dive" | "reading" | "rise" | "bottom";

// cup.glb measurements (metres): coffee surface height, radius, inner floor
const COFFEE_Y = 0.0533;
const COFFEE_R = 0.034;
const COFFEE_DROP = 0.0055; // per project read
const CUP_FLOOR_Y = 0.016;
// the mug is shown without its saucer and spoon, a little bigger than the exported prop
const CUP_SCALE = 1.3;
const SAUCER_H = 0.0077; // what the mug stood on, in the file's units
const DROP_PARTS = new Set(["cup-saucer-00", "cup-saucer-02", "cup-saucer-04", "cup-saucer-05"]); // saucer, baked coffee, spoon
/** cup-local height (coffee surface, floor) → height above the table */
const above = (y: number) => (y - SAUCER_H) * CUP_SCALE;

const OVERVIEW = { target: new THREE.Vector3(2.9, 1.15, 2.4), dir: new THREE.Vector3(1, 0.86, 1).normalize(), dist: 27, fov: 19 };
const ROOM_BOUNDS = new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(6, 2.4, 5));
// reading view: straight down from this high, framing the saucer and the ticket beside it
const READ = { height: 0.36, fov: 34 };
const T_CARRY = 0.9; // the mug's flight
const T_SWOOP = 2.0; // the camera's single move into the cup (lands as the mug settles)
const T_SETTLE = 1.2; // into a mug that's already there
const T_RISE = 1.1;
const RIPPLE_LIFE = 4.5; // seconds one ripple keeps the coffee moving
const MAX_RIPPLES = 4;
const MIRROR_NEAR = 5; // metres: closer than this the coffee reflects the room live

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

interface Pose {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  fov: number;
}

// Shared, mutable animation state read every frame (kept out of React state on purpose).
interface Anim {
  cupFrom: THREE.Vector3;
  cupTo: THREE.Vector3;
  cupT: number; // 0..1, 1 = arrived
  camFrom: Pose | null;
  camTo: Pose | null;
  camPath: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3] | null; // optional curve for the position
  camT: number;
  camDur: number;
  ripples: { x: number; y: number; t: number }[]; // live ripples: origin on the coffee (in radii) and age
  coffeeY: number;
}

const pose = (pos: THREE.Vector3, look: THREE.Vector3, up: THREE.Vector3, fov: number): Pose => {
  const m = new THREE.Matrix4().lookAt(pos, look, up);
  return { pos: pos.clone(), quat: new THREE.Quaternion().setFromRotationMatrix(m), fov };
};

const overviewDist = (aspect: number) => OVERVIEW.dist * Math.max(1, 1.45 / aspect);

function readingFrame(cup: THREE.Vector3, up: THREE.Vector3) {
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, -1, 0), up).normalize();
  const ticket = cup.clone().addScaledVector(right, RECEIPT.gap);
  const centre = cup.clone().addScaledVector(right, RECEIPT.gap / 2);
  return { right, ticket, centre };
}

function readingPose(cup: THREE.Vector3, up: THREE.Vector3, coffeeY: number): Pose {
  // straight above the coffee, so the mirror looks straight up at the board; tilted a
  // little toward the ticket so both are in frame
  const { centre } = readingFrame(cup, up);
  const coffee = cup.clone().setY(cup.y + above(coffeeY));
  return pose(coffee.clone().add(new THREE.Vector3(0, READ.height, 0)), centre.setY(cup.y), up, READ.fov);
}

function CameraRig({ anim }: { anim: React.MutableRefObject<Anim> }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const good = useRef<{ pos: THREE.Vector3; quat: THREE.Quaternion } | null>(null);
  // runs after the controls each frame: keep the last valid pose and fall back to it if anything goes NaN
  useFrame(() => {
    const ok = Number.isFinite(camera.position.x + camera.position.y + camera.position.z + camera.quaternion.x + camera.quaternion.y + camera.quaternion.z + camera.quaternion.w);
    if (ok) good.current = { pos: camera.position.clone(), quat: camera.quaternion.clone() };
    else if (good.current) {
      camera.position.copy(good.current.pos);
      camera.quaternion.copy(good.current.quat);
      camera.updateMatrixWorld();
    }
  }); // priority 0: after OrbitControls (-1), before the composer renders (1)
  useFrame((_, dt) => {
    const a = anim.current;
    if (!a.camFrom || !a.camTo || a.camT >= 1) return;
    a.camT = Math.min(1, a.camT + dt / a.camDur);
    const e = ease(a.camT);
    if (a.camPath) {
      // cubic Bézier: one continuous swoop instead of separate moves
      const [p0, p1, p2, p3] = a.camPath, u = 1 - e;
      camera.position.set(0, 0, 0)
        .addScaledVector(p0, u * u * u)
        .addScaledVector(p1, 3 * u * u * e)
        .addScaledVector(p2, 3 * u * e * e)
        .addScaledVector(p3, e * e * e);
    } else camera.position.lerpVectors(a.camFrom.pos, a.camTo.pos, e);
    camera.quaternion.slerpQuaternions(a.camFrom.quat, a.camTo.quat, e);
    camera.fov = THREE.MathUtils.lerp(a.camFrom.fov, a.camTo.fov, e);
    camera.updateProjectionMatrix();
  });
  return null;
}

// Checkpoints: a raised glowing collar on the surface, a soft column of light rising from it
// and a pulse that ripples outward now and then, so each spot reads from the default zoom.
const BEAM_SHADER = {
  uniforms: { uColor: { value: new THREE.Color(C.acc) }, uAlpha: { value: 0.5 } },
  vertexShader: /* glsl */ `
    varying float vH;
    void main() {
      vH = uv.y;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    uniform float uAlpha;
    varying float vH;
    void main() {
      // clamped: interpolation can push vH a hair past 1, and pow(negative) is NaN, which bloom smears over the whole frame
      float a = pow(clamp(1.0 - vH, 0.0, 1.0), 2.2) * uAlpha;
      gl_FragColor = vec4(uColor * 1.25, a);
    }`,
};
const RING_R = 0.09;

function Checkpoint({ p, i, visited, hot, enabled, onPick, setHover }: { p: THREE.Vector3; i: number; visited: boolean; hot: boolean; enabled: boolean; onPick: (i: number) => void; setHover: (i: number) => void }) {
  const collar = useRef<THREE.Mesh>(null!);
  const pulse = useRef<THREE.Mesh>(null!);
  const beam = useMemo(() => new THREE.ShaderMaterial({ ...BEAM_SHADER, uniforms: THREE.UniformsUtils.clone(BEAM_SHADER.uniforms), transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.NormalBlending, toneMapped: false }), []);
  useEffect(() => () => beam.dispose(), [beam]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + i * 0.7;
    const breathe = 0.5 + 0.5 * Math.sin(t * 2.2);
    const base = visited ? 0.35 : 1;
    collar.current.position.y = 0.012 + Math.sin(t * 1.6) * 0.004; // a gentle bob
    collar.current.rotation.z = t * 0.6;
    (collar.current.material as THREE.MeshStandardMaterial).emissiveIntensity = (hot ? 3.2 : 1.4 + breathe * 0.9) * base;
    beam.uniforms.uAlpha.value = (hot ? 0.85 : 0.45 + breathe * 0.2) * base;
    const k = (t % 2.4) / 2.4; // outward pulse every couple of seconds
    pulse.current.scale.setScalar(1 + k * 1.1);
    (pulse.current.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.8 * base;
  });
  return (
    <group position={[p.x, p.y, p.z]}>
      {visited && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
          <circleGeometry args={[RING_R * 0.85, 24]} />
          <meshBasicMaterial color="#3a2414" transparent opacity={0.55} />
        </mesh>
      )}
      {/* the raised collar */}
      <mesh ref={collar} rotation={[-Math.PI / 2, 0, 0]} scale={hot ? 1.15 : 1}>
        <torusGeometry args={[RING_R, 0.012, 10, 48]} />
        <meshStandardMaterial color={C.acc} emissive={C.acc} toneMapped={false} />
      </mesh>
      {/* light rising from it */}
      <mesh position={[0, 0.3, 0]} material={beam}>
        <cylinderGeometry args={[RING_R, RING_R * 0.9, 0.6, 32, 1, true]} />
      </mesh>
      {/* the outward pulse */}
      <mesh ref={pulse} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <ringGeometry args={[RING_R * 0.9, RING_R * 1.1, 48]} />
        <meshBasicMaterial color={C.acc2} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* generous invisible hit target, so spots are easy to tap from the overview */}
      <mesh
        position={[0, 0.15, 0]}
        visible={false}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(i);
        }}
        onPointerOut={() => setHover(-1)}
        onClick={(e) => {
          e.stopPropagation();
          if (enabled && e.delta < 6) onPick(i); // a drag that ends on a spot isn't a click
        }}
      >
        <cylinderGeometry args={[0.22, 0.22, 0.4, 12]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}

function Rings({ spots, cupAt, visited, onPick, enabled }: { spots: THREE.Vector3[]; cupAt: number; visited: Set<number>; onPick: (i: number) => void; enabled: boolean }) {
  const [hover, setHover] = useState(-1);
  useEffect(() => {
    document.body.style.cursor = hover >= 0 && enabled ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hover, enabled]);
  return (
    <group>
      {spots.slice(0, RINGS.length).map((p, i) =>
        i === cupAt ? null : <Checkpoint key={i} p={p} i={i} visited={visited.has(i)} hot={hover === i && enabled} enabled={enabled} onPick={onPick} setHover={setHover} />,
      )}
    </group>
  );
}

function makerMark() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const x = c.getContext("2d")!;
  x.fillStyle = "#ece5de"; // the mug's glaze
  x.fillRect(0, 0, 512, 512);
  x.strokeStyle = "#80503f";
  x.globalAlpha = 0.55;
  x.lineWidth = 6;
  x.beginPath();
  x.arc(256, 256, 200, 0, Math.PI * 2);
  x.stroke();
  x.globalAlpha = 0.85;
  x.fillStyle = "#80503f"; // site accent, the darker light-theme shade so it reads on cream
  x.textAlign = "center";
  x.font = "700 46px 'Reddit Mono', monospace";
  x.fillText("zylar mccullah", 256, 236);
  x.font = "400 26px 'DM Mono', monospace";
  x.fillText("résumé · say hi", 256, 290);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// The coffee: Reflector's mirror, re-shaded as a liquid. Ripples bend the reflection
// (rather than being drawn on top), a soft blur keeps it from reading as glass, and the
// colour runs from a dim, warm-tinted mirror in the middle to darker coffee and a crema
// ring at the rim.
const COFFEE_SHADER = {
  name: "CoffeeShader",
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    uTime: { value: 0 },
    uRipples: { value: Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector4()) }, // xy origin, z age, w on
    uTexel: { value: new THREE.Vector2(1 / 1024, 1 / 1024) },
    uRadius: { value: COFFEE_R },
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec2 vLocal;
    #include <common>
    #include <logdepthbuf_pars_vertex>
    void main() {
      vUv = textureMatrix * vec4(position, 1.0);
      vLocal = position.xy;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      #include <logdepthbuf_vertex>
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec4 uRipples[${MAX_RIPPLES}];
    uniform vec2 uTexel;
    uniform float uRadius;
    varying vec4 vUv;
    varying vec2 vLocal;
    #include <logdepthbuf_pars_fragment>
    void main() {
      #include <logdepthbuf_fragment>
      vec2 p = vLocal / uRadius;
      float r = length(p);
      vec2 dir = r > 1e-4 ? p / r : vec2(0.0);

      // idle: the faintest movement, so it never looks frozen
      vec2 bend = vec2(sin(uTime * 1.3 + p.y * 6.0), cos(uTime * 1.1 + p.x * 5.0)) * 0.0012;
      float slope = 0.0;
      // every live ripple adds its own ring train, so a new one stacks on top of the last
      for (int i = 0; i < ${MAX_RIPPLES}; i++) {
        vec4 R = uRipples[i];
        if (R.w < 0.5) continue;
        vec2 d = p - R.xy;
        float rr = length(d);
        vec2 rd = rr > 1e-4 ? d / rr : vec2(0.0);
        float t = R.z;
        float front = 0.15 + t * 0.55;                       // how far out the rings have travelled (in radii)
        float amp = 0.010 * exp(-t * 0.9);                    // dies away
        float behind = smoothstep(front + 0.05, front - 0.35, rr);
        float phase = rr * 34.0 - t * 11.0;
        float w = amp * behind * (0.35 + 0.65 * (1.0 - min(rr, 1.0))) * (1.0 - smoothstep(0.85, 1.0, r) * 0.6);
        bend += rd * w * sin(phase);
        slope += w * cos(phase);
      }

      vec4 uv = vUv;
      uv.xy += bend * uv.w;
      vec2 o = uTexel * 1.8 * uv.w;
      vec3 c = texture2DProj(tDiffuse, uv).rgb * 0.36;
      c += texture2DProj(tDiffuse, uv + vec4(o.x, 0.0, 0.0, 0.0)).rgb * 0.16;
      c += texture2DProj(tDiffuse, uv - vec4(o.x, 0.0, 0.0, 0.0)).rgb * 0.16;
      c += texture2DProj(tDiffuse, uv + vec4(0.0, o.y, 0.0, 0.0)).rgb * 0.16;
      c += texture2DProj(tDiffuse, uv - vec4(0.0, o.y, 0.0, 0.0)).rgb * 0.16;

      vec3 coffee = vec3(0.022, 0.012, 0.006);
      float rimDark = smoothstep(0.55, 1.0, r);
      vec3 col = coffee + c * c * color * (1.1 - 0.5 * rimDark); // squared: darks sink to coffee, the board stays bright
      col = mix(col, vec3(0.15, 0.08, 0.035), smoothstep(0.88, 1.0, r) * 0.75);   // crema at the rim
      col *= 1.0 + slope * 6.0;                                                 // the surface tilting toward / away from the light
      gl_FragColor = vec4(max(col, vec3(0.0)), 1.0); // never negative: bloom would spread it
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

function Cup({ anim, close, drained, up, onClick, clickable }: { anim: React.MutableRefObject<Anim>; close: boolean; drained: boolean; up: THREE.Vector3; onClick: (at: THREE.Vector2 | null) => void; clickable: boolean }) {
  const [hover, setHover] = useState(false);
  useEffect(() => {
    if (!hover || !clickable) return;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hover, clickable]);
  const scene = useGLTF("/models/cafe/cup-saucer.glb").scene;
  const cup = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && DROP_PARTS.has(m.name)) m.visible = false; // the live coffee below replaces the exported disc
    });
    return c;
  }, [scene]);
  const group = useRef<THREE.Group>(null!);
  const coffee = useRef<THREE.Mesh>(null!);
  const mark = useMemo(makerMark, []);
  const { size, viewport, camera } = useThree();
  const worldPos = useMemo(() => new THREE.Vector3(), []);
  // a real planar mirror for the coffee, rendered at screen resolution so the board reads
  // cleanly; tinted dark so it reads as coffee, not chrome
  // capped and rounded to steps of 256 so resizing doesn't reallocate a render target every frame
  const step = (n: number) => Math.max(256, Math.min(1536, Math.round(n / 256) * 256));
  const tw = step(size.width * Math.min(viewport.dpr, 1.5));
  const th = step(size.height * Math.min(viewport.dpr, 1.5));
  const mirror = useMemo(() => {
    const r = new Reflector(new THREE.CircleGeometry(COFFEE_R, 48), { textureWidth: tw, textureHeight: th, color: 0xd9c4b4, clipBias: 0.003, shader: COFFEE_SHADER, multisample: 0 });
    r.rotation.x = -Math.PI / 2;
    const u = (r.material as THREE.ShaderMaterial).uniforms;
    u.uTexel.value.set(1 / tw, 1 / th);
    u.uRadius.value = COFFEE_R;
    u.uRipples.value = Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector4()); // own copies, not the template's
    r.camera.layers.enable(BEAM_LAYER); // the beams overhead show up in the coffee
    return r;
  }, [tw, th]);
  useEffect(() => () => mirror.dispose(), [mirror]);

  useFrame((_, dt) => {
    const a = anim.current;
    if (a.cupT < 1) a.cupT = Math.min(1, a.cupT + dt / T_CARRY);
    const e = ease(a.cupT);
    group.current.position.lerpVectors(a.cupFrom, a.cupTo, e);
    group.current.position.y += Math.sin(Math.PI * e) * 0.22; // lifted, not dragged
    if (coffee.current) coffee.current.position.y = a.coffeeY;
    mirror.position.y = a.coffeeY + 0.0002;
    // reflect live whenever the mug is close enough to see (a mirror for a few distant pixels isn't worth a render pass)
    group.current.getWorldPosition(worldPos);
    mirror.visible = !drained && (close || camera.position.distanceTo(worldPos) < MIRROR_NEAR);
    // the surface: a faint idle wobble, plus every ripple still running
    a.ripples = a.ripples.map((r) => ({ ...r, t: r.t + dt })).filter((r) => r.t < RIPPLE_LIFE);
    const u = (mirror.material as THREE.ShaderMaterial).uniforms;
    u.uTime.value += dt;
    (u.uRipples.value as THREE.Vector4[]).forEach((v, i) => {
      const r = a.ripples[i];
      if (r) v.set(r.x, r.y, r.t, 1);
      else v.set(0, 0, 0, 0);
    });
  });

  return (
    <group
      ref={group}
      onPointerOver={(e) => (e.stopPropagation(), setHover(true))}
      onPointerOut={() => setHover(false)}
      onClick={(e) => {
        e.stopPropagation(); // a click on the mug is not a click "outside"
        if (!clickable || e.delta >= 6) return;
        // clicked on the coffee itself: the ripple starts where you touched it
        const onCoffee = e.object === mirror || e.object === coffee.current;
        const local = onCoffee ? e.object.worldToLocal(e.point.clone()) : null;
        onClick(local ? new THREE.Vector2(local.x / COFFEE_R, local.y / COFFEE_R) : null);
      }}
    >
      <group scale={CUP_SCALE} position={[0, -SAUCER_H * CUP_SCALE, 0]}>
      <primitive object={cup} />
      {!drained && (
        <mesh ref={coffee} rotation={[-Math.PI / 2, 0, 0]} position={[0, COFFEE_Y, 0]}>
          <circleGeometry args={[COFFEE_R, 48]} />
          <meshStandardMaterial color="#120a05" roughness={0.1} />
        </mesh>
      )}
      <primitive object={mirror} />
      {drained && (
        <mesh rotation={[-Math.PI / 2, 0, Math.atan2(-up.x, -up.z)]} position={[0, CUP_FLOOR_Y + 0.0005, 0]}>
          <circleGeometry args={[0.024, 32]} />
          <meshStandardMaterial map={mark} roughness={0.35} />
        </mesh>
      )}
      </group>
    </group>
  );
}

interface SceneProps {
  phase: Phase;
  setPhase: (p: Phase) => void;
  cupAt: number;
  setCupAt: (i: number) => void;
  ring: number;
  setRing: (i: number) => void;
  visited: Set<number>;
  setVisited: (s: Set<number>) => void;
  drained: boolean;
  setDrained: (d: boolean) => void;
  anim: React.MutableRefObject<Anim>;
  pickRef: React.MutableRefObject<(i: number) => void>;
  riseRef: React.MutableRefObject<() => void>;
  go: (path: string) => void;
}

function Scene({ phase, setPhase, cupAt, setCupAt, ring, setRing, visited, setVisited, drained, setDrained, anim, pickRef, riseRef, go }: SceneProps) {
  const markers = useCafeMarkers();
  const spots = useMemo(() => [...markers.rings, markers.cupHome], [markers]);
  const { camera, size } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const timers = useRef<number[]>([]);
  const faceYaw = useRef<number[]>(RINGS.map(() => 0));
  const saved = useRef<{ pos: THREE.Vector3; target: THREE.Vector3; fov: number } | null>(null);
  const [up, setUp] = useState(() => new THREE.Vector3(0, 0, 1));
  const reduce = useMemo(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false, []);
  const maxDist = overviewDist(size.width / size.height);

  // cup starts at home
  useEffect(() => {
    const home = spots[RINGS.length];
    anim.current.cupFrom.copy(home);
    anim.current.cupTo.copy(home);
    anim.current.cupT = 1;
  }, [spots, anim]);

  // first frame: the opening view (also the furthest you can zoom out)
  useEffect(() => {
    camera.position.copy(OVERVIEW.target).addScaledVector(OVERVIEW.dir, maxDist);
    camera.lookAt(OVERVIEW.target);
    controls.current?.target.copy(OVERVIEW.target);
    controls.current?.update();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, reduce ? 0 : ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const now = (): Pose => ({ pos: camera.position.clone(), quat: camera.quaternion.clone(), fov: (camera as THREE.PerspectiveCamera).fov });
  const flyTo = (to: Pose, dur: number, curve?: "down" | "up") => {
    const a = anim.current;
    a.camFrom = now();
    a.camTo = to;
    a.camT = 0;
    a.camDur = reduce ? 0.001 : dur;
    a.camPath = null;
    if (curve) {
      const p0 = a.camFrom.pos, p3 = to.pos, d = Math.min(p0.distanceTo(p3), 4);
      a.camPath =
        curve === "down"
          ? // glide toward the spot, then come straight down onto it
            [p0.clone(), p0.clone().lerp(p3, 0.45), p3.clone().add(new THREE.Vector3(0, d * 0.3, 0)), p3.clone()]
          : // lift straight up out of the cup first, then drift back
            [p0.clone(), p0.clone().add(new THREE.Vector3(0, d * 0.3, 0)), p3.clone().lerp(p0, 0.45), p3.clone()];
    }
  };
  const addRipple = (at: THREE.Vector2 | null = null) => {
    const a = anim.current;
    a.ripples = [...a.ripples, { x: at?.x ?? 0, y: at?.y ?? 0, t: 0 }].slice(-MAX_RIPPLES);
  };

  const pick = useCallback(
    (i: number) => {
      if (phase !== "overview" && phase !== "reading") return;
      const a = anim.current;
      const to = spots[i];
      // remember where the visitor was looking, to come back to it
      if (phase === "overview") saved.current = { pos: camera.position.clone(), target: controls.current?.target.clone() ?? OVERVIEW.target.clone(), fov: (camera as THREE.PerspectiveCamera).fov };
      const u = ringAxes(i).up;
      setUp(u);
      faceYaw.current[i] = Math.atan2(u.x, u.z); // turn the board face so it reads upright in the cup
      setRing(i);
      const arrive = () => {
        setPhase("reading");
        if (!visited.has(i)) {
          const v = new Set(visited);
          v.add(i);
          setVisited(v);
          a.coffeeY = Math.max(CUP_FLOOR_Y + 0.008, COFFEE_Y - v.size * COFFEE_DROP);
        }
      };
      if (cupAt === i) {
        // the mug is already there: straight back in, calm coffee
        setPhase("dive");
        flyTo(readingPose(to, u, a.coffeeY), T_SETTLE, "down");
        later(T_SETTLE * 1000, arrive);
        return;
      }
      // one continuous swoop while the mug is carried over; it lands (and ripples) on the way down
      setPhase("carry");
      flyTo(readingPose(to, u, a.coffeeY), T_SWOOP, "down");
      a.cupFrom.copy(a.cupTo);
      a.cupTo.copy(to);
      a.cupT = reduce ? 1 : 0;
      setCupAt(i);
      later(T_CARRY * 1000, () => {
        setPhase("dive");
        addRipple();
      });
      later(T_SWOOP * 1000, arrive);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spots, phase, cupAt, visited, up],
  );

  const rise = useCallback(() => {
    if (phase !== "reading" && phase !== "bottom") return;
    setPhase("rise");
    const s = saved.current ?? { pos: OVERVIEW.target.clone().addScaledVector(OVERVIEW.dir, maxDist), target: OVERVIEW.target.clone(), fov: OVERVIEW.fov };
    flyTo(pose(s.pos, s.target, new THREE.Vector3(0, 1, 0), s.fov), T_RISE, "up");
    later(T_RISE * 1000, () => {
      controls.current?.target.copy(s.target);
      controls.current?.update();
      setPhase("overview");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, maxDist]);

  const drinkUp = () => {
    setDrained(true);
    setPhase("bottom");
    flyTo(readingPose(anim.current.cupTo, up, CUP_FLOOR_Y), 0.9);
  };
  const refill = () => {
    const a = anim.current;
    setDrained(false);
    setVisited(new Set(ring >= 0 ? [ring] : []));
    a.coffeeY = ring >= 0 ? COFFEE_Y - COFFEE_DROP : COFFEE_Y;
    addRipple(); // fresh coffee moves
    setPhase("reading");
    flyTo(readingPose(a.cupTo, up, a.coffeeY), 0.9);
  };
  // 2. clicking the mug: in the room it takes you into it (no wave); looking into it, it swirls the coffee again
  const onMug = (at: THREE.Vector2 | null) => {
    if (phase === "reading") addRipple(at); // adds to whatever is still moving
    else if (phase === "overview" && cupAt >= 0) pick(cupAt);
  };
  const onReceipt = (i: number, action: ReceiptAction) => {
    if (phase === "overview" || (phase === "reading" && i !== ring)) return pick(i);
    if (i !== ring) return;
    const p = PROJECTS[i];
    if (action === "read") go(p.path);
    else if (action === "source") window.open(p.repo, "_blank", "noopener,noreferrer");
    else if (action === "back") rise();
    else if (action === "drink" && phase === "reading") drinkUp();
    else if (action === "resume") window.open("/zylar-mccullah-resume.pdf", "_blank", "noopener");
    else if (action === "hi") go("/#contact");
    else if (action === "refill" && drained) refill();
  };

  pickRef.current = pick;
  riseRef.current = rise;


  return (
    <>
      <OrbitControls
        ref={controls}
        enabled={phase === "overview"}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        zoomSpeed={1.3}
        zoomToCursor
        minDistance={1.2}
        maxDistance={maxDist}
        maxPolarAngle={Math.PI * 0.46}
        screenSpacePanning
        onChange={() => {
          // keep panning inside the room
          const c = controls.current;
          if (!c) return;
          const clamped = c.target.clone().clamp(ROOM_BOUNDS.min, ROOM_BOUNDS.max);
          if (!clamped.equals(c.target)) {
            camera.position.add(clamped.clone().sub(c.target));
            c.target.copy(clamped);
          }
        }}
      />
      <CameraRig anim={anim} />
      <Room faceYaw={faceYaw} />
      <Rings spots={spots} cupAt={cupAt} visited={visited} onPick={pick} enabled={phase === "overview" || phase === "reading"} />
      <Cup anim={anim} close={phase !== "overview" && phase !== "carry"} drained={drained} up={up} onClick={onMug} clickable={(phase === "reading" && !drained) || (phase === "overview" && cupAt >= 0)} />
      <Receipts spots={spots} active={phase === "reading" || phase === "bottom" ? ring : -1} bottom={phase === "bottom"} drained={drained} visited={visited} onAction={onReceipt} />
    </>
  );
}

export default function CafeScene() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("overview");
  const [ring, setRing] = useState(-1);
  const [cupAt, setCupAt] = useState(-1);
  const [visited, setVisited] = useState<Set<number>>(() => new Set());
  const [drained, setDrained] = useState(false);
  const pickRef = useRef<(i: number) => void>(() => {});
  const riseRef = useRef<() => void>(() => {});
  const [glKey, setGlKey] = useState(0);
  const down = useRef<[number, number]>([0, 0]);
  const anim = useRef<Anim>({
    cupFrom: new THREE.Vector3(),
    cupTo: new THREE.Vector3(),
    cupT: 1,
    camFrom: null,
    camTo: null,
    camT: 1,
    camDur: 1,
    camPath: null,
    ripples: [],
    coffeeY: COFFEE_Y,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") riseRef.current();
      const n = Number(e.key);
      if (n >= 1 && n <= RINGS.length) pickRef.current(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="absolute inset-0"
      aria-label="the night café: drag to look around, scroll to zoom, click a coffee ring or press 1 to 5"
      onPointerDown={(e) => (down.current = [e.clientX, e.clientY])}
    >
      <Canvas
        key={glKey}
        onCreated={({ gl }) => {
          const el = gl.domElement;
          el.addEventListener("webglcontextlost", (e) => {
            e.preventDefault(); // allows the browser to hand the context back
            console.warn("café: WebGL context lost, rebuilding");
          });
          el.addEventListener("webglcontextrestored", () => setGlKey((k) => k + 1), { once: true });
        }}
        dpr={[1, 1.5]}
        camera={{ fov: OVERVIEW.fov, near: 0.01, far: 120, position: [20, 18, 20] }}
        gl={{ antialias: true, toneMapping: THREE.AgXToneMapping, toneMappingExposure: 1.0 }}
        onPointerMissed={(e) => {
          // a click on empty space steps back out; the end of a drag doesn't
          const m = e as MouseEvent;
          if (m.button === 0 && Math.hypot(m.clientX - down.current[0], m.clientY - down.current[1]) < 6) riseRef.current();
        }}
      >
        <color attach="background" args={[C.bg]} />
        <Suspense fallback={null}>
          <Scene
            phase={phase}
            setPhase={setPhase}
            cupAt={cupAt}
            setCupAt={setCupAt}
            ring={ring}
            setRing={setRing}
            visited={visited}
            setVisited={setVisited}
            drained={drained}
            setDrained={setDrained}
            anim={anim}
            pickRef={pickRef}
            riseRef={riseRef}
            go={(p) => navigate(p)}
          />
          <EffectComposer>
            <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.85} luminanceSmoothing={0.2} />
          </EffectComposer>
          <SceneReady />
        </Suspense>
      </Canvas>
    </div>
  );
}
