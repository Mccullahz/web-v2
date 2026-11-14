// Flight math for "the charge". The sway/dip formula is the approved camera
// path from the design artifact — change it and the whole ride changes.
//
// The GLB is the layout source of truth: FlightPlan is normally built from the
// Station_XX / Drum_XX anchor positions read out of charge-set.glb, so moving
// a station in Blender moves its beat of the flight. defaultPlan() only covers
// the frames before the GLB resolves.
import * as THREE from "three";
import { CHARGE_PROJECTS } from "./projects";

export const SPACING = 46;
export const LEAD = 34;
export const TAIL = 40;
/** distance (m) either side of a station in which its card is up */
export const CARD_WINDOW = 11;

export const LOOK_AHEAD = 0.035;
export const ROLL_GAIN = -0.055;
export const FOV = 62;

// Station dwell: scroll-per-metre drops inside a Gaussian window around each
// station, so the flight briefly pauses there while the camera leans in
// toward the framed piece. PULL < 1 keeps z monotonic in scroll.
const DWELL_WIDTH = 10;
const DWELL_PULL = 0.75;
/** how far the camera drifts from the path toward a station while dwelling */
const APPROACH = 0.45;
/** panel centre height above a station's origin (matches the exporter) */
const PANEL_Y = 2.05;

export interface FlightTarget {
  x: number;
  y: number;
  z: number;
  drum: boolean;
}

export interface FlightPlan {
  targets: FlightTarget[];
  /** z of each project's station, in flight order (kept for rail/nearest) */
  waypoints: number[];
  drumZ: number;
  start: number;
  end: number;
}

export function planFromTargets(targets: FlightTarget[]): FlightPlan {
  const waypoints = targets.map((t) => t.z);
  return {
    targets,
    waypoints,
    drumZ: targets.find((t) => t.drum)?.z ?? waypoints[0],
    start: waypoints[0] - LEAD,
    end: waypoints[waypoints.length - 1] + TAIL,
  };
}

export function defaultPlan(): FlightPlan {
  return planFromTargets(
    CHARGE_PROJECTS.map((p, i) => ({
      x: pathX(i * SPACING) + (i % 2 === 0 ? -7.2 : 7.2),
      y: 0,
      z: i * SPACING,
      drum: p.kind === "drum",
    }))
  );
}

export const pathX = (z: number) => Math.sin(z * 0.035) * 4.2 + Math.sin(z * 0.011) * 2.2;

/** scroll → distance, with the dwell plateau folded in */
export function flightZ(plan: FlightPlan, u: number) {
  const zl = plan.start + (plan.end - plan.start) * u;
  let z = zl;
  for (const w of plan.waypoints) {
    z -= (zl - w) * DWELL_PULL * Math.exp(-(((zl - w) / DWELL_WIDTH) ** 2));
  }
  return z;
}

function pathPoint(plan: FlightPlan, z: number, out: THREE.Vector3) {
  const dip = Math.exp(-(((z - plan.drumZ) / 16) ** 2)) * 1.4;
  out.set(pathX(z), 3.1 + Math.sin(z * 0.021) * 0.9 - dip, z);
  return out;
}

export function pathAt(plan: FlightPlan, u: number, out: THREE.Vector3) {
  return pathPoint(plan, flightZ(plan, u), out);
}

/**
 * One camera frame: position, aim and roll for a scroll offset. On the open
 * path the camera flies the sway line looking down-trail; inside a station's
 * dwell window it eases toward the plinth and settles its gaze on the panel
 * (the drum keeps the plain fly-through). Returns the banked roll, already
 * faded out while dwelling so the pause reads level.
 */
export function frameAt(plan: FlightPlan, u: number, pos: THREE.Vector3, look: THREE.Vector3) {
  pathPoint(plan, flightZ(plan, u), pos);
  pathPoint(plan, flightZ(plan, u + LOOK_AHEAD), look);
  const roll0 = (look.x - pos.x) * ROLL_GAIN;

  let t: FlightTarget | null = null;
  let best = Infinity;
  for (const c of plan.targets) {
    const d = Math.abs(pos.z - c.z);
    if (d < best) {
      best = d;
      t = c;
    }
  }
  if (!t || t.drum) return roll0;

  const g = Math.exp(-((best / DWELL_WIDTH) ** 2));
  pos.x += (t.x - pos.x) * APPROACH * g;
  pos.y += (t.y + PANEL_Y + 0.5 - pos.y) * 0.5 * g;
  look.x += (t.x - look.x) * 0.85 * g;
  look.y += (t.y + PANEL_Y - look.y) * 0.85 * g;
  look.z += (t.z - look.z) * 0.85 * g;
  return roll0 * (1 - g);
}

export interface Fix {
  index: number;
  /** inside the card window of that station */
  at: boolean;
  metres: number;
}

export function nearest(plan: FlightPlan, z: number): Fix {
  let index = 0;
  let best = Infinity;
  for (let i = 0; i < plan.waypoints.length; i++) {
    const d = Math.abs(z - plan.waypoints[i]);
    if (d < best) {
      best = d;
      index = i;
    }
  }
  return { index, at: best < CARD_WINDOW, metres: Math.max(0, Math.round(z - plan.start)) };
}

/** scroll height mapping approved in the spec: 100vh + 64vh per project */
export const pagesFor = (n: number) => (100 + n * 64) / 100;

/** scroll offset (0..1) that parks the camera on a given z */
export const offsetForZ = (plan: FlightPlan, z: number) =>
  THREE.MathUtils.clamp((z - plan.start) / (plan.end - plan.start), 0, 1);
