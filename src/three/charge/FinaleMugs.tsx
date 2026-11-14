// End-of-flight lineup: one mug per project on the finale counter, cloned from
// the repo's mug.glb onto the MugSpot anchors baked into the set. Hover lifts
// a mug and raises its card; click navigates to the project.
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFrame } from "@react-three/fiber";
import { Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { CHARGE_PROJECTS } from "./projects";
import type { ChargePalette } from "./theme";

const MUG_URL = "/models/mug.glb";
const MUG_HEIGHT = 0.82;
const COFFEE = "#2c1a0e";

function buildMug(source: THREE.Object3D, pal: ChargePalette) {
  const mug = source.clone(true);
  // the .glb still carries its Blender fluid-sim domain — never render it
  mug.getObjectByName("Liquid_Domain")?.removeFromParent();
  mug.getObjectByName("Liquid Domain")?.removeFromParent();

  const ceramic = new THREE.MeshPhysicalMaterial({
    color: pal.mug,
    roughness: 0.42,
    clearcoat: 0.6,
    clearcoatRoughness: 0.3,
  });
  const coffee = new THREE.MeshStandardMaterial({ color: COFFEE, roughness: 0.15 });
  mug.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const isCoffee = (mesh.material as THREE.Material)?.name?.includes("Liquid");
    mesh.material = isCoffee ? coffee : ceramic;
  });

  const box = new THREE.Box3().setFromObject(mug);
  const size = new THREE.Vector3();
  box.getSize(size);
  const s = MUG_HEIGHT / (size.y || 1);
  mug.scale.multiplyScalar(s);
  const scaled = new THREE.Box3().setFromObject(mug);
  mug.position.y = -scaled.min.y;
  return { mug, ceramic };
}

interface FinaleMugsProps {
  spots: THREE.Vector3[];
  palette: ChargePalette;
}

export function FinaleMugs({ spots, palette }: FinaleMugsProps) {
  const navigate = useNavigate();
  const { scene } = useGLTF(MUG_URL);
  const [hovered, setHovered] = useState<number | null>(null);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const lift = useRef<number[]>(spots.map(() => 0));

  const mugs = useMemo(
    () => spots.map(() => buildMug(scene, palette)),
    [scene, palette, spots]
  );

  useFrame((_, delta) => {
    for (let i = 0; i < spots.length; i++) {
      const g = groups.current[i];
      if (!g) continue;
      lift.current[i] = THREE.MathUtils.damp(lift.current[i], hovered === i ? 1 : 0, 10, delta);
      const l = lift.current[i];
      g.position.y = spots[i].y + l * 0.16;
      g.scale.setScalar(1 + l * 0.1);
      mugs[i].ceramic.emissive.set(palette.accent);
      mugs[i].ceramic.emissiveIntensity = l * 0.35;
    }
  });

  const hoveredProject = hovered !== null ? CHARGE_PROJECTS[hovered % CHARGE_PROJECTS.length] : null;

  return (
    <group>
      {spots.map((p, i) => (
        <group
          key={i}
          ref={(el) => {
            groups.current[i] = el;
          }}
          position={p}
          rotation={[0, Math.PI + (i - (spots.length - 1) / 2) * 0.35, 0]}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(i);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHovered(null);
            document.body.style.cursor = "auto";
          }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(CHARGE_PROJECTS[i % CHARGE_PROJECTS.length].path);
          }}
        >
          <primitive object={mugs[i].mug} />
        </group>
      ))}

      {hoveredProject && hovered !== null && (
        <Html
          position={[spots[hovered].x, spots[hovered].y + 1.5, spots[hovered].z]}
          center
          style={{ pointerEvents: "none" }}
          zIndexRange={[30, 0]}
        >
          <div className="w-44 rounded-md border border-line bg-surf/95 px-2.5 py-1.5 shadow-lg backdrop-blur">
            <div className="font-mono text-[9px] uppercase tracking-widest text-acc">
              {hoveredProject.category}
            </div>
            <div className="font-poppins text-xs font-bold leading-tight text-ink">
              {hoveredProject.title}
            </div>
            <div className="mt-0.5 font-mono text-[9px] text-mut">{hoveredProject.tech}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

useGLTF.preload(MUG_URL);
