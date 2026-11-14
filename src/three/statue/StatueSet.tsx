// The set, assembled from two GLBs whose node and material names are the
// contract: statue-set.glb is the room — floor, pedestal, rotunda, debris
// (`npm run statue:set`) — and statue-figure.glb is the sculpture itself,
// baked out of src/three/assets-test/sculpt-v2.blend (`npm run statue:figure`).
// The figure is mounted into the room's empty `Statue` node here, which is why
// the two can be re-exported independently. This component owns everything
// read out of them: theme re-tinting, the break animation (fragment drop +
// shard scatter, both pure functions of scroll), the reflective floor, lights
// and dust.
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial, useGLTF, useScroll } from "@react-three/drei";
import * as THREE from "three";
import { breakState, fragmentCenter, type BreakAnchors } from "./timeline";
import type { StatuePalette, QualityTier } from "./theme";

const SET_URL = "/models/statue-set.glb";
const FIGURE_URL = "/models/statue-figure.glb";

interface ShardRest {
  obj: THREE.Object3D;
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
}

interface SetParts {
  fragment: THREE.Object3D | null;
  fragBasePos: THREE.Vector3;
  fragBaseRot: THREE.Euler;
  shards: ShardRest[];
  anchors: BreakAnchors;
  floorTop: THREE.Mesh | undefined;
}

// useGLTF hands back a shared, cached scene, so rest transforms are captured
// once into userData — a remount must not mistake an animated pose for the
// authored one.
function collect(scene: THREE.Object3D): SetParts {
  scene.updateMatrixWorld(true);
  const fragment = scene.getObjectByName("Fragment") ?? null;
  if (fragment && !fragment.userData.base) {
    fragment.userData.base = {
      pos: fragment.position.clone(),
      rot: fragment.rotation.clone(),
      world: fragment.getWorldPosition(new THREE.Vector3()),
    };
  }

  const shards: ShardRest[] = [];
  scene.traverse((o) => {
    if (!/^Shard_\d+$/.test(o.name)) return;
    if (!o.userData.rest) {
      o.userData.rest = { pos: o.position.clone(), quat: o.quaternion.clone() };
    }
    shards.push({ obj: o, pos: o.userData.rest.pos, quat: o.userData.rest.quat });
  });
  shards.sort((a, b) => a.obj.name.localeCompare(b.obj.name));

  const impact = new THREE.Vector3();
  for (const s of shards) impact.add(s.pos);
  if (shards.length) impact.divideScalar(shards.length);
  impact.y = 0.15;

  const base = fragment?.userData.base;
  return {
    fragment,
    fragBasePos: base?.pos ?? new THREE.Vector3(),
    fragBaseRot: base?.rot ?? new THREE.Euler(),
    shards,
    anchors: { start: base?.world ?? new THREE.Vector3(0, 3.6, 0), impact },
    floorTop: scene.getObjectByName("FloorTop") as THREE.Mesh | undefined,
  };
}

// Placeholder GLB materials → theme palette, keyed by material name so a
// Blender re-export keeps working as long as the names survive.
function retint(scene: THREE.Object3D, pal: StatuePalette) {
  const colors: Record<string, string> = {
    M_Floor: pal.floor,
    M_FloorTop: pal.floorTop,
    M_Marble: pal.marble,
    M_Rubble: pal.marble,
    M_Pedestal: pal.pedestal,
    M_Column: pal.column,
    M_Ring: pal.ring,
    M_Accent: pal.accent,
  };
  scene.traverse((o) => {
    if (!(o as THREE.Mesh).isMesh) return;
    const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial;
    if (colors[m.name]) m.color.set(colors[m.name]);
    else if (m.name === "M_Glow") {
      m.color.set(pal.glow);
      m.emissive.set(pal.glow);
      m.emissiveIntensity = 2.4;
    }
  });
}

const easeOut = (t: number) => 1 - (1 - t) ** 3;
const clamp01 = (v: number) => THREE.MathUtils.clamp(v, 0, 1);

// deterministic per-shard scatter, stable across mounts
const srand = (i: number, salt: number) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// Slow motes drifting in the oculus light shaft — the room breathing.
function Motes({ count, color }: { count: number; color: string }) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count]);

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        angle: srand(i, 1) * Math.PI * 2,
        radius: 0.4 + srand(i, 2) * 2.4,
        y: 1.5 + srand(i, 3) * 9.5,
        spin: 0.02 + srand(i, 4) * 0.05,
        bob: srand(i, 5) * Math.PI * 2,
      })),
    [count]
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pos = geom.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const a = s.angle + t * s.spin;
      pos.setXYZ(
        i,
        Math.cos(a) * s.radius,
        s.y + Math.sin(t * 0.25 + s.bob) * 0.4,
        Math.sin(a) * s.radius
      );
    }
    pos.needsUpdate = true;
  });

  return (
    <points geometry={geom}>
      <pointsMaterial
        color={color}
        size={0.045}
        sizeAttenuation
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// The impact puff: a radial ring of dust scrubbed by the shatter progress,
// so it billows on the way down and inhales on the way back up.
function DustBurst({
  center,
  count,
  color,
}: {
  center: THREE.Vector3;
  count: number;
  color: string;
}) {
  const mat = useRef<THREE.PointsMaterial>(null);
  const scroll = useScroll();
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count]);

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        angle: srand(i, 11) * Math.PI * 2,
        reach: 0.6 + srand(i, 12) * 2.0,
        rise: 0.2 + srand(i, 13) * 1.1,
      })),
    [count]
  );

  useFrame(() => {
    const s = breakState(scroll.offset).shatter;
    const pos = geom.attributes.position as THREE.BufferAttribute;
    const e = easeOut(s);
    for (let i = 0; i < count; i++) {
      const sd = seeds[i];
      pos.setXYZ(
        i,
        center.x + Math.cos(sd.angle) * sd.reach * e,
        center.y + sd.rise * e * (1 - s * 0.6),
        center.z + Math.sin(sd.angle) * sd.reach * e
      );
    }
    pos.needsUpdate = true;
    if (mat.current) mat.current.opacity = s <= 0 ? 0 : (1 - s) * 0.7;
  });

  return (
    <points geometry={geom}>
      <pointsMaterial
        ref={mat}
        color={color}
        size={0.09}
        sizeAttenuation
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

interface StatueSetProps {
  palette: StatuePalette;
  quality: QualityTier;
  /** false under prefers-reduced-motion: no tremble, motes or glow pulse */
  ambient: boolean;
  onAnchors: (a: BreakAnchors) => void;
}

export function StatueSet({ palette, quality, ambient, onAnchors }: StatueSetProps) {
  const { scene: room } = useGLTF(SET_URL);
  const { scene: figure } = useGLTF(FIGURE_URL);
  const scroll = useScroll();

  // The sculpture stands on the room's `Statue` node, which the set exports
  // empty. Both scenes are useGLTF's shared cached objects, so the mount is
  // idempotent — a remount must not stack a second figure on the pedestal.
  const scene = useMemo(() => {
    const mount = room.getObjectByName("Statue");
    if (mount && figure.parent !== mount) mount.add(figure);
    return room;
  }, [room, figure]);

  // `figure` is a dep because mounting it mutates `scene` in place rather than
  // producing a new object — Fragment and the marble only exist once it lands.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const parts = useMemo(() => collect(scene), [scene, figure]);
  const glowMat = useRef<THREE.MeshStandardMaterial | null>(null);
  const tmp = useRef(new THREE.Vector3());
  const qa = useRef(new THREE.Quaternion());

  // where each shard starts its flight: clustered at the impact, tumbled
  const scatter = useMemo(
    () =>
      parts.shards.map((_, i) => ({
        offset: new THREE.Vector3(
          (srand(i, 21) - 0.5) * 0.5,
          srand(i, 22) * 0.25,
          (srand(i, 23) - 0.5) * 0.5
        ),
        tumble: new THREE.Quaternion().setFromEuler(
          new THREE.Euler(srand(i, 24) * Math.PI * 2, srand(i, 25) * Math.PI * 2, srand(i, 26) * Math.PI * 2)
        ),
        hop: 0.25 + srand(i, 27) * 0.4,
      })),
    [parts.shards]
  );

  useEffect(() => onAnchors(parts.anchors), [parts, onAnchors]);
  useEffect(() => {
    retint(scene, palette);
    scene.traverse((o) => {
      const m = (o as THREE.Mesh).isMesh
        ? ((o as THREE.Mesh).material as THREE.MeshStandardMaterial)
        : null;
      if (m?.name === "M_Glow") glowMat.current = m;
    });
  }, [scene, figure, palette]);

  // the real floor circle yields to the reflector copy on desktop
  useEffect(() => {
    if (parts.floorTop) parts.floorTop.visible = !quality.reflections;
  }, [parts, quality.reflections]);

  useFrame(() => {
    const u = scroll.offset;
    const st = breakState(u);
    const { fragment, fragBasePos, fragBaseRot, anchors } = parts;

    if (fragment) {
      fragment.visible = !st.freed;
      if (fragment.visible) {
        // deterministic in u, so scrubbing back replays the tremble in reverse
        const tremble = ambient ? Math.sin(u * 820) * 0.012 * st.crack * (1 - st.fall) : 0;
        fragmentCenter(u, anchors, tmp.current);
        fragment.position.set(
          fragBasePos.x + (tmp.current.x - anchors.start.x),
          fragBasePos.y + (tmp.current.y - anchors.start.y) + tremble * 0.5,
          fragBasePos.z + (tmp.current.z - anchors.start.z)
        );
        fragment.rotation.set(
          fragBaseRot.x + st.fall * 0.8,
          fragBaseRot.y + st.fall * 1.6,
          fragBaseRot.z - st.crack * 0.14 - st.fall * 2.4 + tremble
        );
      }
    }

    parts.shards.forEach((s, i) => {
      s.obj.visible = st.freed;
      if (!s.obj.visible) return;
      const sc = scatter[i];
      // small per-shard delay so the debris blooms outward, not as one sheet
      const si = easeOut(clamp01(st.shatter * 1.1 - i * 0.02));
      const hop = Math.sin(Math.PI * Math.min(si, 1)) * sc.hop;
      s.obj.position.set(
        anchors.impact.x + sc.offset.x + (s.pos.x - anchors.impact.x - sc.offset.x) * si,
        Math.max(anchors.impact.y + sc.offset.y, 0.06) * (1 - si) + s.pos.y * si + hop,
        anchors.impact.z + sc.offset.z + (s.pos.z - anchors.impact.z - sc.offset.z) * si
      );
      s.obj.quaternion.slerpQuaternions(qa.current.copy(sc.tumble), s.quat, si);
    });

    if (ambient && glowMat.current) {
      glowMat.current.emissiveIntensity = 2.4 + Math.sin(performance.now() / 730) * 0.25;
    }
  });

  return (
    <group>
      <primitive object={scene} />

      {quality.reflections && parts.floorTop && (
        <mesh
          geometry={parts.floorTop.geometry}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.02, 0]}
        >
          <MeshReflectorMaterial
            color={palette.floorTop}
            blur={[280, 70]}
            resolution={1024}
            mixBlur={0.85}
            mixStrength={1.4}
            mirror={0.5}
            roughness={0.5}
            metalness={0.15}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
          />
        </mesh>
      )}

      {/* the oculus shaft: warm pool from above, cool rim from behind */}
      <pointLight position={[0, 11.5, 0]} color={palette.glow} intensity={140} distance={26} decay={2} />
      <pointLight position={[0, 5, -4.5]} color={palette.rim} intensity={40} distance={14} decay={2} />
      {/* keeps the debris field readable in the closing shot */}
      <pointLight
        position={[parts.anchors.impact.x, 1.6, parts.anchors.impact.z]}
        color={palette.accent}
        intensity={16}
        distance={7}
        decay={2}
      />

      {ambient && <Motes count={quality.motes} color={palette.dust} />}
      <DustBurst center={parts.anchors.impact} count={quality.burst} color={palette.dust} />
    </group>
  );
}

useGLTF.preload(SET_URL);
useGLTF.preload(FIGURE_URL);
