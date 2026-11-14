// Scroll timeline for "the sculpture". Everything on screen is a pure
// function of the damped scroll offset u ∈ [0,1] — no clocks, no fired-once
// events — so reversing scroll re-assembles the arm exactly.
//
// The ride: a slow orbital descent around the figure (the klimtwine-style
// opening pan), a close-up as the arm lets go, the fall, and the shatter.
import * as THREE from "three";

export const FOV = 45;
/** scroll height: the whole piece is one long scrub */
export const PAGES = 6;

// Phase boundaries in scroll offset. The camera keyframes below are tuned
// around these; move them together.
export const CRACK_START = 0.42;
export const FALL_START = 0.56;
export const FALL_END = 0.74;
export const SHATTER_END = 0.97;

/** rail stops: label + the offset that frames that beat */
export const STOPS = [
  { label: "the portrait", u: 0 },
  { label: "the round", u: 0.4 },
  { label: "the break", u: 0.52 },
  { label: "the ruin", u: 1 },
];

// Camera keyframes: theta is orbit position in turns (one continuous
// clockwise sweep, ~1.1 revolutions end to end), r/h are orbit radius and
// height, lookY a point on the statue's axis, w how much the gaze blends
// toward the falling fragment instead.
interface Key {
  u: number;
  theta: number;
  r: number;
  h: number;
  lookY: number;
  w: number;
}

const KEYS: Key[] = [
  { u: 0.0, theta: 0.06, r: 3.4, h: 3.9, lookY: 4.0, w: 0 }, // face level, close
  { u: 0.2, theta: -0.3, r: 5.0, h: 3.2, lookY: 3.2, w: 0 },
  { u: 0.4, theta: -0.58, r: 6.8, h: 2.5, lookY: 2.4, w: 0 }, // full figure
  { u: 0.5, theta: -0.72, r: 4.0, h: 3.6, lookY: 3.7, w: 1 }, // shoulder close-up
  { u: 0.65, theta: -0.78, r: 4.8, h: 2.6, lookY: 3.0, w: 1 }, // tracking the fall
  { u: 0.78, theta: -0.84, r: 5.4, h: 1.5, lookY: 0.6, w: 1 }, // impact, low
  { u: 1.0, theta: -1.04, r: 8.8, h: 2.8, lookY: 2.3, w: 0.25 }, // final wide
];

const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const clamp01 = (v: number) => THREE.MathUtils.clamp(v, 0, 1);

// Ease-in-out between neighbouring keys: the camera glides, settles at each
// beat, then moves on — deliberate shots rather than one continuous drift.
function sample(u: number): Key {
  const uu = clamp01(u);
  let a = KEYS[0];
  let b = KEYS[KEYS.length - 1];
  for (let i = 0; i < KEYS.length - 1; i++) {
    if (uu >= KEYS[i].u && uu <= KEYS[i + 1].u) {
      a = KEYS[i];
      b = KEYS[i + 1];
      break;
    }
  }
  const t = a === b ? 0 : smootherstep((uu - a.u) / (b.u - a.u));
  const mix = (ka: number, kb: number) => ka + (kb - ka) * t;
  return {
    u: uu,
    theta: mix(a.theta, b.theta),
    r: mix(a.r, b.r),
    h: mix(a.h, b.h),
    lookY: mix(a.lookY, b.lookY),
    w: mix(a.w, b.w),
  };
}

/** degrees swept since the start — the orbit telemetry readout */
export function orbitDeg(u: number) {
  return Math.round(Math.abs(sample(u).theta - KEYS[0].theta) * 360);
}

export interface BreakAnchors {
  /** world position of the Fragment's origin in its attached pose */
  start: THREE.Vector3;
  /** centroid of the authored shard rest positions, at floor level */
  impact: THREE.Vector3;
}

export interface BreakState {
  /** 0..1 — the arm working loose */
  crack: number;
  /** 0..1 — the drop; 1 means it has hit */
  fall: number;
  /** 0..1 — shards flying out to their rest poses */
  shatter: number;
  freed: boolean;
}

export function breakState(u: number): BreakState {
  const crack = smootherstep(clamp01((u - CRACK_START) / (FALL_START - CRACK_START)));
  const fall = clamp01((u - FALL_START) / (FALL_END - FALL_START));
  const shatter = smootherstep(clamp01((u - FALL_END) / (SHATTER_END - FALL_END)));
  return { crack, fall, shatter, freed: fall >= 1 };
}

/**
 * Where the fragment's origin is at scroll u: sagging outward while cracking,
 * then a gravity drop (y goes with f²) drifting toward the impact point.
 * Shared by the camera's gaze and the mesh itself so they can never disagree.
 */
export function fragmentCenter(
  u: number,
  a: BreakAnchors,
  out: THREE.Vector3
): THREE.Vector3 {
  const st = breakState(u);
  const sx = a.start.x + st.crack * 0.07;
  const sy = a.start.y - st.crack * 0.04;
  const f = st.fall;
  const fh = f * f; // horizontal drift arrives late, like a real drop
  out.set(
    sx + (a.impact.x - sx) * fh,
    sy + (a.impact.y + 0.12 - sy) * f * f,
    a.start.z + (a.impact.z - a.start.z) * fh
  );
  return out;
}

/**
 * One camera frame. Orbit position comes from the keyframes; the gaze blends
 * from the statue's axis onto the fragment (or, once shattered, the debris
 * field) by the keyframed weight. Returns the impact camera-shake roll.
 */
export function frameAt(
  u: number,
  anchors: BreakAnchors | null,
  pos: THREE.Vector3,
  look: THREE.Vector3,
  shake: boolean
): number {
  const k = sample(u);
  const a = k.theta * Math.PI * 2;
  pos.set(Math.sin(a) * k.r, k.h, Math.cos(a) * k.r);
  look.set(0, k.lookY, 0);

  if (anchors && k.w > 0) {
    const st = breakState(u);
    const dyn = st.freed
      ? _dyn.copy(anchors.impact)
      : fragmentCenter(u, anchors, _dyn);
    look.lerp(dyn, k.w);
  }

  if (!shake) return 0;
  // a short deterministic thud around the moment of impact
  const g = Math.exp(-(((u - FALL_END) / 0.012) ** 2));
  pos.y += Math.sin(u * 1400) * 0.05 * g;
  return Math.sin(u * 900) * 0.035 * g;
}

const _dyn = new THREE.Vector3();

/** current placard beat: 0 portrait, 1 the flaw, 2 the fall, 3 the ruin */
export function phaseAt(u: number) {
  if (u < CRACK_START) return 0;
  if (u < FALL_START) return 1;
  if (u < FALL_END) return 2;
  return 3;
}
