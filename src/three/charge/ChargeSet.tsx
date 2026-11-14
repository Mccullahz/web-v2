// The greybox set, loaded from public/models/charge-set.glb (regenerate with
// `npm run charge:set`, or edit in Blender — node/material names are the
// contract). This component owns everything read out of the GLB: theme
// re-tinting, station anchors, the spinning drum, screenshot panels, lamp
// lights and the ember cloud.
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { CHARGE_PROJECTS } from "./projects";
import type { ChargePalette, QualityTier } from "./theme";

export interface StationAnchor {
  index: number;
  isDrum: boolean;
  position: THREE.Vector3;
}

export interface SetAnchors {
  stations: StationAnchor[];
  lamps: THREE.Vector3[];
  mugSpots: THREE.Vector3[];
  drumCenter: THREE.Vector3 | null;
}

const SET_URL = "/models/charge-set.glb";

function collectAnchors(scene: THREE.Object3D): SetAnchors {
  scene.updateMatrixWorld(true);
  const stations: StationAnchor[] = [];
  const lamps: THREE.Vector3[] = [];
  const mugSpots: { n: number; p: THREE.Vector3 }[] = [];
  let drumCenter: THREE.Vector3 | null = null;

  scene.traverse((o) => {
    const st = /^(Station|Drum)_(\d+)$/.exec(o.name);
    if (st) {
      const isDrum = st[1] === "Drum";
      const position = o.getWorldPosition(new THREE.Vector3());
      stations.push({ index: Number(st[2]) - 1, isDrum, position });
      if (isDrum) drumCenter = position;
      return;
    }
    if (/^LampGlow_\d+$/.test(o.name)) lamps.push(o.getWorldPosition(new THREE.Vector3()));
    const mug = /^MugSpot_(\d+)$/.exec(o.name);
    if (mug) mugSpots.push({ n: Number(mug[1]), p: o.getWorldPosition(new THREE.Vector3()) });
  });

  stations.sort((a, b) => a.index - b.index);
  mugSpots.sort((a, b) => a.n - b.n);
  return { stations, lamps, mugSpots: mugSpots.map((m) => m.p), drumCenter };
}

// Placeholder GLB materials → theme palette, keyed by material name so a
// Blender re-export keeps working as long as the names survive.
function retint(scene: THREE.Object3D, pal: ChargePalette) {
  const colors: Record<string, string> = {
    M_Floor: pal.floor,
    M_Walk: pal.walk,
    M_Structure: pal.structure,
    M_Plinth: pal.plinth,
    M_Copper: pal.copper,
    M_CopperDark: pal.copperDark,
    M_Accent: pal.accent,
    M_Counter: pal.counter,
  };
  scene.traverse((o) => {
    if (!(o as THREE.Mesh).isMesh) return;
    const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial;
    if (colors[m.name]) m.color.set(colors[m.name]);
    else if (m.name === "M_Lamp") {
      m.color.set(pal.lamp);
      m.emissive.set(pal.lamp);
      m.emissiveIntensity = 2.6;
    } else if (m.name.startsWith("M_Panel_") && !m.map) {
      m.color.set(pal.panel);
    }
  });
}

// Project screenshots onto the station frames. The panels keep a faint
// emissive copy of their own image so they read like lit signage in the dark.
function usePanelShots(scene: THREE.Object3D) {
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const textures: THREE.Texture[] = [];
    CHARGE_PROJECTS.forEach((p, i) => {
      if (p.kind === "drum") return;
      const mesh = scene.getObjectByName(`Panel_${String(i + 1).padStart(2, "0")}`) as
        | THREE.Mesh
        | undefined;
      if (!mesh) return;
      loader.load(p.shot, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.flipY = false; // glTF UV convention
        textures.push(tex);
        const m = mesh.material as THREE.MeshStandardMaterial;
        m.map = tex;
        m.emissiveMap = tex;
        m.color.set("#ffffff");
        m.emissive.set("#ffffff");
        m.emissiveIntensity = 0.32;
        m.needsUpdate = true;
      });
    });
    return () => textures.forEach((t) => t.dispose());
  }, [scene]);
}

// Slow orbital drift inside the drum barrel; additive sparks that bloom picks
// up on desktop and that stay cheap enough for phones.
function Embers({
  center,
  count,
  color,
}: {
  center: THREE.Vector3;
  count: number;
  color: string;
}) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count]);

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        angle: Math.random() * Math.PI * 2,
        radius: 0.6 + Math.random() * 4.1,
        z: (Math.random() - 0.5) * 24,
        spin: 0.08 + Math.random() * 0.22,
        bob: Math.random() * Math.PI * 2,
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
        Math.sin(a) * s.radius * 0.9 + Math.sin(t * 0.6 + s.bob) * 0.25,
        s.z + Math.sin(t * 0.3 + s.bob) * 0.8
      );
    }
    pos.needsUpdate = true;
  });

  return (
    <points geometry={geom} position={center}>
      <pointsMaterial
        color={color}
        size={0.13}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

interface ChargeSetProps {
  palette: ChargePalette;
  quality: QualityTier;
  /** false under prefers-reduced-motion: no drum spin, embers or lamp pulse */
  ambient: boolean;
  onAnchors: (a: SetAnchors) => void;
}

export function ChargeSet({ palette, quality, ambient, onAnchors }: ChargeSetProps) {
  const { scene } = useGLTF(SET_URL);
  const spinner = useMemo(() => scene.getObjectByName("DrumSpinner"), [scene]);
  const walkway = useMemo(
    () => scene.getObjectByName("Walkway") as THREE.Mesh | undefined,
    [scene]
  );
  const anchors = useMemo(() => collectAnchors(scene), [scene]);
  const lampMat = useRef<THREE.MeshStandardMaterial | null>(null);

  useEffect(() => onAnchors(anchors), [anchors, onAnchors]);
  useEffect(() => {
    retint(scene, palette);
    scene.traverse((o) => {
      const m = (o as THREE.Mesh).isMesh
        ? ((o as THREE.Mesh).material as THREE.MeshStandardMaterial)
        : null;
      if (m?.name === "M_Lamp") lampMat.current = m;
    });
  }, [scene, palette]);
  usePanelShots(scene);

  // the real walkway mesh yields to the reflector copy on desktop
  useEffect(() => {
    if (walkway) walkway.visible = !quality.reflections;
  }, [walkway, quality.reflections]);

  useFrame((_, delta) => {
    if (!ambient) return;
    if (spinner) spinner.rotation.z += delta * 0.24;
    if (lampMat.current)
      lampMat.current.emissiveIntensity = 2.6 + Math.sin(performance.now() / 530) * 0.35;
  });

  return (
    <group>
      <primitive object={scene} />

      {quality.reflections && walkway && (
        <mesh geometry={walkway.geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <MeshReflectorMaterial
            color={palette.walk}
            blur={[300, 80]}
            resolution={1024}
            mixBlur={0.9}
            mixStrength={1.5}
            mirror={0.55}
            roughness={0.6}
            metalness={0.2}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
          />
        </mesh>
      )}

      {anchors.lamps.map((p, i) => (
        <pointLight
          key={i}
          position={[p.x, p.y - 0.35, p.z]}
          color={palette.lamp}
          intensity={30}
          distance={18}
          decay={2}
        />
      ))}

      {anchors.drumCenter && (
        <>
          <pointLight
            position={[anchors.drumCenter.x, anchors.drumCenter.y, anchors.drumCenter.z - 7]}
            color={palette.ember}
            intensity={70}
            distance={28}
            decay={2}
          />
          <pointLight
            position={[anchors.drumCenter.x, anchors.drumCenter.y, anchors.drumCenter.z + 7]}
            color={palette.ember}
            intensity={70}
            distance={28}
            decay={2}
          />
          {ambient && (
            <Embers center={anchors.drumCenter} count={quality.embers} color={palette.ember} />
          )}
        </>
      )}

      {anchors.mugSpots.length > 0 && (
        <pointLight
          position={[
            anchors.mugSpots[Math.floor(anchors.mugSpots.length / 2)].x,
            anchors.mugSpots[0].y + 3.4,
            anchors.mugSpots[0].z + 3,
          ]}
          color={palette.key}
          intensity={55}
          distance={24}
          decay={2}
        />
      )}
    </group>
  );
}

useGLTF.preload(SET_URL);
