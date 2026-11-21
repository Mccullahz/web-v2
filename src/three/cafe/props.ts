// Interactive props: the things in the room (other than the mug) that react when clicked.
//
// A prop is anything tagged in cafe.blend with a `cafe_prop` custom property (on the object
// or any parent). The bake gives each tag its own mesh in room.glb, named `prop_<id>`, with
// its origin at the bottom centre of its bounds, so it can turn, hop or wobble in place and
// keep its baked lighting. Tagging something new: add the property in Blender, re-run
// scripts/blender/bake_cafe.py, then add its id to PropId.
//
// A prop does nothing until it has an entry in PROP_REACTIONS: no cursor, no clicks. An entry
// can name one prop or a family with a trailing "*" ("stool-*" covers stool-1 … stool-7).
// Besides the baked props, Room.tsx adds the chalk menu ("menu-board").
import * as THREE from "three";
import type { SfxId } from "./sfx";
import { puffSteam } from "./steamBus";

export type PropId =
  | "pos"
  | "pos-head"
  | "grinder"
  | "espresso"
  | "espresso-group"
  | "portafilter-1"
  | "portafilter-2"
  | "steam-wand"
  | "pastry-case"
  | "bag-stock"
  | "bags-back"
  | "bags-bar"
  | "menu-board"
  | `stool-${number}`
  | `chair-${number}`;

/** The pose a prop rests in; an animation offsets from it and it's restored afterwards. */
export interface RestPose {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
}

/**
 * For props with several states: the state this run starts in and the one it ends in.
 * `seed` is a fresh random 0–1 per run, so a gesture can vary (direction, size, phase).
 */
export interface PropStep {
  from: number;
  to: number;
  seed: number;
}

export interface PropAnimation {
  /** seconds */
  duration: number;
  /**
   * Called every frame while running with t going 0 → 1. Set the object's transform from
   * `rest` (don't accumulate onto the current pose).
   */
  apply: (obj: THREE.Object3D, t: number, rest: RestPose, step: PropStep) => void;
  /**
   * false (default): a gesture, the rest pose is restored at the end, and it's skipped for
   * visitors who prefer reduced motion. true: a change of state, the prop stays where t = 1
   * leaves it (with reduced motion it jumps straight there).
   */
  settle?: boolean;
}

/**
 * Something that runs until switched off (the grinder): a click turns it on, the next click
 * (or `maxSeconds`) turns it off. `level` ramps 0 → 1 as it starts and back down as it stops,
 * so the motion can spin up and wind down; the rest pose is restored once it's at 0.
 */
export interface PropLoop {
  maxSeconds: number;
  rampUp?: number; // seconds, default 0.25
  rampDown?: number; // seconds, default 0.5
  /** set the transform from `rest` for this moment; `time` counts up from switching on */
  apply: (obj: THREE.Object3D, time: number, level: number, rest: RestPose, seed: number) => void;
  /** a sound to loop while it runs (fades with `level`) */
  sound?: SfxId;
}

export interface PropReaction {
  /** shown as the hover tooltip / aria label */
  label?: string;
  /**
   * a click here acts on other prop(s) instead (the POS base turns the POS head; a grouphead
   * wiggles both portafilters). Followed once per click: the targets run their own reaction.
   */
  target?: PropId | PropId[];
  /** how many states the prop cycles through, one per click (default 1: a one-off gesture) */
  states?: number;
  sound?: SfxId;
  /** play the sound at a random rate in this range, so repeats don't sound identical */
  soundRate?: [number, number];
  animation?: PropAnimation;
  /** runs until clicked off or timed out, instead of a one-off animation; `sound` plays on each switch */
  loop?: PropLoop;
  /** metres of invisible padding around the prop to catch clicks: for small or thin things */
  hitPad?: number;
  /** when the prop listens: just the room view (default), or also while reading a cup */
  when?: "overview" | "always";
  /** for reactions that need the scene, e.g. the POS opening something later */
  onClick?: (id: PropId) => void;
}

const UP = new THREE.Vector3(0, 1, 0);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Turn about the prop's own vertical axis, `angle` radians per state. */
export const swivel = (angle: number, duration = 0.9): PropAnimation => ({
  duration,
  settle: true,
  apply: (o, t, rest, { from, to }) => {
    const yaw = (from + (to - from) * easeInOut(t)) * angle;
    o.quaternion.setFromAxisAngle(UP, yaw).multiply(rest.quaternion);
  },
});

/**
 * A little scoot: a nudge in a random direction (a centimetre or so) with a slight twist and
 * a rattle, then back to where it stands (its baked shadow stays put, so it always returns).
 */
export const scoot = (dist = 0.014, duration = 0.55): PropAnimation => ({
  duration,
  apply: (o, t, rest, { seed }) => {
    const a = seed * Math.PI * 2;
    const out = Math.sin(Math.PI * t) * (1 - 0.3 * t); // there and back
    const rattle = Math.sin(t * Math.PI * 7) * (1 - t) * 0.25;
    const k = dist * (out + rattle * 0.4);
    o.position.copy(rest.position);
    o.position.x += Math.cos(a) * k;
    o.position.z += Math.sin(a) * k;
    o.position.y += Math.abs(Math.sin(t * Math.PI * 5)) * 0.002 * (1 - t); // legs knocking the floor
    o.quaternion.setFromAxisAngle(UP, (seed - 0.5) * 0.16 * out).multiply(rest.quaternion);
  },
});

/** Twist back and forth about the prop's vertical axis, dying away (a portafilter in its grouphead). */
export const wiggle = (angle = 0.1, duration = 0.7, turns = 2.5): PropAnimation => ({
  duration,
  apply: (o, t, rest, { seed }) => {
    const amp = angle * (0.8 + 0.4 * seed) * Math.pow(1 - t, 1.6);
    const yaw = amp * Math.sin(t * Math.PI * 2 * turns + seed * 0.8);
    o.quaternion.setFromAxisAngle(UP, yaw).multiply(rest.quaternion);
  },
});

/**
 * A motor's buzz: a fine, fast jitter (well under a millimetre, a fraction of a degree) with a
 * slow wobble in its strength, scaled by `level` as it spins up and down.
 */
export const buzz = (mm = 0.5, deg = 0.35, maxSeconds = 30): PropLoop => ({
  maxSeconds,
  rampUp: 0.3,
  rampDown: 0.6,
  apply: (o, time, level, rest, seed) => {
    const surge = 0.8 + 0.2 * Math.sin(time * 5.3 + seed * 6); // the load on the burrs comes and goes
    const k = level * surge;
    const j = (f: number, p: number) => Math.sin(time * f + p) * 0.6 + (Math.random() - 0.5) * 0.8;
    o.position.copy(rest.position);
    o.position.x += j(97, 1.3) * mm * 0.001 * k;
    o.position.z += j(113, 4.1) * mm * 0.001 * k;
    o.position.y += Math.abs(j(131, 2.2)) * mm * 0.0005 * k;
    o.quaternion.setFromAxisAngle(UP, j(89, 0.7) * THREE.MathUtils.degToRad(deg) * k).multiply(rest.quaternion);
  },
});

export const PROP_REACTIONS: Partial<Record<PropId | `${string}*`, PropReaction>> = {
  // the grinder: click on, click off (or 30 s): it buzzes while it runs
  grinder: { label: "grinder", sound: "grinder-switch", loop: { ...buzz(), sound: "grinder" } },

  // the POS rests facing the bar staff; a click swivels it round to the customer, and back
  "pos-head": { label: "pos", states: 2, animation: swivel(Math.PI) },
  pos: { target: "pos-head" },

  // seating: a nudge and a scrape
  "stool-*": { label: "stool", sound: "stool-scoot", soundRate: [0.9, 1.12], animation: scoot(0.012) },
  "chair-*": { label: "chair", sound: "chair-scoot", soundRate: [0.9, 1.1], animation: scoot(0.016, 0.6) },

  // the espresso machine: the grouphead side rattles the portafilters, the wand purges
  // (a click on either portafilter or a grouphead moves both; redirects are followed once)
  "espresso-group": { label: "portafilters", target: ["portafilter-1", "portafilter-2"] },
  "portafilter-1": { label: "portafilter", target: ["portafilter-1", "portafilter-2"], hitPad: 0.015, sound: "portafilter", soundRate: [0.95, 1.05], animation: wiggle() },
  "portafilter-2": { label: "portafilter", target: ["portafilter-1", "portafilter-2"], hitPad: 0.015, animation: wiggle() }, // one sound for the pair
  "steam-wand": { label: "steam wand", hitPad: 0.035, sound: "steam-purge", onClick: () => puffSteam() },

  // the chalk menu: a sound, no animation yet
  "menu-board": { label: "menu", sound: "menu-board" },

  // Example, once there's something to play:
  // grinder: {
  //   label: "grinder",
  //   sound: "grind",
  //   animation: {
  //     duration: 0.6,
  //     apply: (o, t, rest) => {
  //       o.position.copy(rest.position);
  //       o.position.y += Math.sin(t * Math.PI) * 0.01 * Math.sin(t * 60); // a buzz
  //     },
  //   },
  // },
};

/**
 * Lets the scene move a prop to a state itself (with its usual animation), e.g. the POS
 * turning back to the staff when you `exit` the terminal. Props.tsx fills this in while
 * the room is mounted; until then it does nothing.
 */
export const propDriver: { set: (id: PropId, state: number) => void } = { set: () => {} };

/** The reaction for a prop: its own entry, else its family's ("stool-3" → "stool-*"). */
export function reactionOf(id: PropId): PropReaction | undefined {
  const own = PROP_REACTIONS[id];
  if (own) return own;
  const dash = id.lastIndexOf("-");
  return dash > 0 ? PROP_REACTIONS[`${id.slice(0, dash)}-*`] : undefined;
}

export const propIdOf = (name: string): PropId | null => (name.startsWith("prop_") ? (name.slice(5) as PropId) : null);
