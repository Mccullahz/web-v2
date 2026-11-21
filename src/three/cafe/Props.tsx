// Renders the interactive props split out of room.glb and wires up the ones that have a
// reaction (props.ts, by id or family): hover cursor, click → sound + animation + callback.
// Inert props render exactly like the rest of the room and never catch the pointer.
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { propDriver, reactionOf, type PropId, type PropStep, type RestPose } from "./props";
import { loopSfx, playSfx, preloadSfx, type SfxLoop } from "./sfx";

/**
 * Lets the scene take over a click before the prop reacts on its own, given the prop's
 * current state (after any `target` redirect). Return true when handled: the prop then
 * neither changes state nor animates. E.g. the POS, once facing the customer, opens the
 * terminal instead of swivelling back.
 */
export type OnProp = (id: PropId, state: number) => boolean;

export interface PropNode {
  id: PropId;
  obj: THREE.Object3D;
}

/** An invisible box around a prop's own bounds (in its local space), padded, to catch clicks. */
function hitBox(obj: THREE.Object3D, pad: number) {
  obj.updateWorldMatrix(true, true);
  const inv = new THREE.Matrix4().copy(obj.matrixWorld).invert();
  const box = new THREE.Box3();
  const v = new THREE.Vector3();
  obj.traverse((o) => {
    const g = (o as THREE.Mesh).geometry;
    const pos = g?.getAttribute("position");
    if (!pos) return;
    const toLocal = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
    for (let k = 0; k < pos.count; k++) box.expandByPoint(v.fromBufferAttribute(pos, k).applyMatrix4(toLocal));
  });
  box.expandByScalar(pad);
  const m = new THREE.Mesh(new THREE.BoxGeometry(...box.getSize(new THREE.Vector3()).toArray()), new THREE.MeshBasicMaterial());
  m.position.copy(box.getCenter(new THREE.Vector3()));
  m.visible = false; // still hit by the raycaster
  m.name = `${obj.name}_hit`;
  return m;
}

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function Props({ nodes, mode, onProp }: { nodes: PropNode[]; mode: "overview" | "reading" | "busy"; onProp?: OnProp }) {
  // the pose each prop rests in, taken once
  const rest = useMemo(
    () => new Map(nodes.map(({ id, obj }) => [id, { position: obj.position.clone(), quaternion: obj.quaternion.clone(), scale: obj.scale.clone() } as RestPose])),
    [nodes],
  );
  // generous click targets for small props (removed again if the nodes change)
  useEffect(() => {
    const added = nodes.flatMap(({ id, obj }) => {
      const pad = reactionOf(id)?.hitPad;
      if (!pad) return [];
      const h = hitBox(obj, pad);
      obj.add(h);
      return [h];
    });
    return () =>
      added.forEach((h) => {
        h.removeFromParent();
        h.geometry.dispose();
        (h.material as THREE.Material).dispose();
      });
  }, [nodes]);
  const running = useRef(new Map<PropId, { el: number; step: PropStep }>()); // id → elapsed seconds, states
  const state = useRef(new Map<PropId, number>()); // current state of multi-state props (0 = as baked)
  // props that run until switched off: elapsed time, how far spun up, where it's heading, its sound
  const loops = useRef(new Map<PropId, { time: number; level: number; on: boolean; seed: number; sound: SfxLoop | null }>());
  useEffect(() => {
    const live = loops.current;
    return () => live.forEach((l) => l.sound?.stop(0.1)); // leaving the café: silence
  }, []);
  const [hot, setHot] = useState<PropId | null>(null);
  useEffect(() => {
    if (!hot) return;
    document.body.style.cursor = "pointer";
    return () => void (document.body.style.cursor = "");
  }, [hot]);

  /** Which prop an object belongs to (walking up to the prop's node), if any. */
  const ownerOf = (o: THREE.Object3D | null): PropId | null => {
    for (; o; o = o.parent) {
      const n = nodes.find((p) => p.obj === o);
      if (n) return n.id;
    }
    return null;
  };
  /**
   * A padded hit box only catches near-misses: if the same ray also lands on the real surface
   * of another prop that's listening, that prop gets the pointer instead (the steam wand's
   * padding mustn't steal clicks meant for the grinder beside it).
   */
  const yields = (id: PropId, e: { object: THREE.Object3D; intersections: { object: THREE.Object3D }[] }) => {
    if (!e.object.name.endsWith("_hit")) return false;
    return e.intersections.some((i) => {
      if (i.object.name.endsWith("_hit")) return false;
      const other = ownerOf(i.object);
      return other !== null && other !== id && listening(other);
    });
  };

  const listening = (id: PropId) => {
    const r = reactionOf(id);
    if (!r) return false;
    return mode === "overview" || (mode === "reading" && r.when === "always");
  };

  const trigger = (id: PropId, redirected = false): void => {
    const r = reactionOf(id);
    if (!r) return;
    // a click on one part can move others; the targets then run their own reaction
    if (r.target && !redirected) return void [r.target].flat().forEach((t) => trigger(t, true));
    const a = r.animation;
    // a state change already under way finishes first; a gesture can restart mid-way
    if (a?.settle && running.current.has(id)) return;
    const from = state.current.get(id) ?? 0;
    if (onProp?.(id, from)) return;
    go(id, (from + 1) % Math.max(1, r.states ?? (r.loop ? 2 : 1)));
    r.onClick?.(id);
  };

  /** Move a prop to `to`: its sound and animation, or straight there with reduced motion. */
  const go = (id: PropId, to: number) => {
    const r = reactionOf(id);
    const a = r?.animation;
    const from = state.current.get(id) ?? 0;
    if (!r || (a?.settle && running.current.has(id))) return;
    state.current.set(id, to);
    if (r.loop) return void (switchLoop(id, to === 1), r.sound && playSfx(r.sound));
    if (r.sound) {
      const [lo, hi] = r.soundRate ?? [1, 1];
      playSfx(r.sound, { rate: lo + Math.random() * (hi - lo) });
    }
    if (!a) return;
    const node = nodes.find((n) => n.id === id);
    const base = rest.get(id);
    const step = { from, to, seed: Math.random() };
    if (reducedMotion()) {
      if (a.settle && node && base) a.apply(node.obj, 1, base, step);
    } else running.current.set(id, { el: 0, step });
  };

  /** Start or stop a looping prop; stopping winds it down, then it's put back at rest. */
  const switchLoop = (id: PropId, on: boolean) => {
    const loop = reactionOf(id)?.loop;
    if (!loop) return;
    const cur = loops.current.get(id);
    if (on) {
      if (cur?.on) return;
      cur?.sound?.stop(0.1);
      loops.current.set(id, { time: 0, level: cur?.level ?? 0, on: true, seed: Math.random(), sound: loop.sound ? loopSfx(loop.sound, { fade: loop.rampUp ?? 0.25 }) : null });
    } else if (cur?.on) {
      cur.on = false;
      cur.sound?.stop(loop.rampDown ?? 0.5);
      cur.sound = null;
    }
  };

  // the scene's handle on the props (see propDriver in props.ts)
  const goRef = useRef(go);
  goRef.current = go;
  useEffect(() => {
    propDriver.set = (id, to) => {
      if ((state.current.get(id) ?? 0) !== to) goRef.current(id, to);
    };
    return () => void (propDriver.set = () => {});
  }, []);

  useFrame((_, dt) => {
    for (const [id, l] of loops.current) {
      const loop = reactionOf(id)?.loop;
      const node = nodes.find((n) => n.id === id);
      const base = rest.get(id);
      if (!loop || !node || !base) {
        loops.current.delete(id);
        continue;
      }
      l.time += dt;
      if (l.on && l.time >= loop.maxSeconds) {
        // ran its course: switch itself off
        l.on = false;
        l.sound?.stop(loop.rampDown ?? 0.5);
        l.sound = null;
        state.current.set(id, 0);
      }
      const ramp = l.on ? loop.rampUp ?? 0.25 : loop.rampDown ?? 0.5;
      l.level = THREE.MathUtils.clamp(l.level + (l.on ? 1 : -1) * (dt / Math.max(0.01, ramp)), 0, 1);
      if (!l.on && l.level <= 0) {
        node.obj.position.copy(base.position);
        node.obj.quaternion.copy(base.quaternion);
        node.obj.scale.copy(base.scale);
        loops.current.delete(id);
        continue;
      }
      if (!reducedMotion()) loop.apply(node.obj, l.time, l.level, base, l.seed);
    }
    if (!running.current.size) return;
    for (const [id, { el, step }] of running.current) {
      const node = nodes.find((n) => n.id === id);
      const anim = reactionOf(id)?.animation;
      const base = rest.get(id);
      if (!node || !anim || !base) {
        running.current.delete(id);
        continue;
      }
      const t = Math.min(1, (el + dt) / anim.duration);
      anim.apply(node.obj, t, base, step);
      if (t >= 1) {
        if (!anim.settle) {
          node.obj.position.copy(base.position);
          node.obj.quaternion.copy(base.quaternion);
          node.obj.scale.copy(base.scale);
        }
        running.current.delete(id);
      } else running.current.set(id, { el: el + dt, step });
    }
  });

  return (
    <group>
      {nodes.map(({ id, obj }) =>
        reactionOf(id) ? (
          <primitive
            key={id}
            object={obj}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
              if (!listening(id) || yields(id, e)) return;
              e.stopPropagation();
              setHot(id);
              const s = reactionOf(id)?.sound;
              if (s) preloadSfx(s);
            }}
            onPointerOut={() => setHot((h) => (h === id ? null : h))}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              if (!listening(id) || yields(id, e)) return;
              e.stopPropagation();
              if (e.delta < 6) trigger(id); // a drag that ends on a prop isn't a click
            }}
          />
        ) : (
          <primitive key={id} object={obj} />
        ),
      )}
    </group>
  );
}
