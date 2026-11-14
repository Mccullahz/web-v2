// The café room, as baked in Blender (src/three/data/cafe.blend → scripts/blender/bake_cafe.py).
// room.glb carries the static room with a second UV set for the lightmap, the glass and the
// street backdrop, and named markers for everything the code positions. Lighting is baked:
// the room's materials are unlit and get their light from the lightmap alone. Only things
// that change at runtime stay live here: the board faces (project names), the chalk menu,
// and whatever glows.
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { BOARD, PALETTE as C, PROJECTS } from "./data";
import { ROOM_URL, useCafeMarkers } from "./markers";

export const LIGHTMAP_URL = "/models/cafe/room-lightmap-night.webp";
// must match SCALE in scripts/blender/bake_cafe.py (the lightmap stores light / SCALE)
const LIGHTMAP_SCALE = 4;

// A board's underside reads correctly only in a reflection, so its text is printed mirrored.
const MIRROR_BOARD_TEXT = true;

function useFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    Promise.all(["700 150px 'Reddit Mono'", "400 64px 'DM Mono'", "500 64px 'DM Mono'"].map((f) => document.fonts.load(f)))
      .catch(() => undefined)
      .finally(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, []);
  return ready;
}

function boardTexture(title: string, line: string) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1024; // square, so the face can turn to match the camera
  const x = c.getContext("2d")!;
  x.fillStyle = "#16120e";
  x.fillRect(0, 0, c.width, c.height);
  if (MIRROR_BOARD_TEXT) {
    x.translate(c.width, 0);
    x.scale(-1, 1);
  }
  x.textAlign = "center";
  x.fillStyle = C.acc2;
  // shrink long names so they stay inside the coffee
  let size = 150;
  do {
    x.font = `700 ${size}px 'Reddit Mono', ui-monospace, monospace`;
    size -= 6;
  } while (x.measureText(title).width > 760 && size > 60);
  x.fillText(title, c.width / 2, 500);
  x.fillStyle = C.ink;
  x.globalAlpha = 1;
  size = 64;
  do {
    x.font = `400 ${size}px 'DM Mono', ui-monospace, monospace`;
    size -= 4;
  } while (x.measureText(line).width > 860 && size > 30);
  x.fillText(line, c.width / 2, 610);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function menuTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const x = c.getContext("2d")!;
  x.fillStyle = "#141a14";
  x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = C.acc;
  x.font = "500 64px 'DM Mono', ui-monospace, monospace";
  x.fillText("~/menu", 64, 110);
  x.fillStyle = "#d9d2c8";
  x.font = "400 46px 'DM Mono', ui-monospace, monospace";
  ["espresso ......... 3", "cortado .......... 4", "flat white ....... 4", "pour over ........ 5"].forEach((l, i) => x.fillText(l, 64, 210 + i * 72));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Swap the glTF's lit materials for unlit ones: base colour × lightmap for the baked room,
 * flat bright colour for anything emissive (so bloom picks it up), and leave the glass
 * see-through. Materials are shared between meshes, so each is converted once.
 */
function bakeMaterials(scene: THREE.Object3D, lightMap: THREE.Texture) {
  const done = { lit: new Map<THREE.Material, THREE.Material>(), plain: new Map<THREE.Material, THREE.Material>() };
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const hasLightmapUv = Boolean(mesh.geometry.getAttribute("uv1"));
    const cache = hasLightmapUv ? done.lit : done.plain;
    const convert = (m: THREE.Material) => {
      const cached = cache.get(m);
      if (cached) return cached;
      const src = m as THREE.MeshStandardMaterial;
      const glow = src.emissive && src.emissiveIntensity * Math.max(src.emissive.r, src.emissive.g, src.emissive.b) > 0.05;
      let out: THREE.MeshBasicMaterial;
      if (glow) {
        out = new THREE.MeshBasicMaterial({ color: src.emissive.clone().multiplyScalar(src.emissiveIntensity), toneMapped: false });
      } else {
        out = new THREE.MeshBasicMaterial({ color: src.color.clone(), transparent: src.transparent, opacity: src.opacity, depthWrite: !src.transparent });
        if (hasLightmapUv) {
          out.lightMap = lightMap;
          // MeshBasicMaterial divides the lightmap by π; the bake stored light / SCALE
          out.lightMapIntensity = LIGHTMAP_SCALE * Math.PI;
        }
      }
      out.name = src.name;
      cache.set(m, out);
      return out;
    };
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(convert) : convert(mesh.material);
    mesh.castShadow = mesh.receiveShadow = false;
    mesh.userData.skipRay = true;
  });
}

// the board face is square and smaller than the board, so it can turn in 90° steps
// to read upright from whichever side the camera dives in
const FACE = 0.3;

function LiveSurfaces({ boards, faceYaw }: { boards: THREE.Vector3[]; faceYaw: React.MutableRefObject<number[]> }) {
  const faces = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => faces.current.forEach((g, i) => g && (g.rotation.y = faceYaw.current[i] ?? 0)));
  const ready = useFontsReady();
  // redrawn once the web fonts have loaded
  const tex = useMemo(() => (ready ? PROJECTS : PROJECTS).map((p) => boardTexture(p.title, p.line)), [ready]);
  const menu = useMemo(() => (ready ? menuTexture() : menuTexture()), [ready]);
  return (
    <group>
      {boards.map((b, i) => (
        // the face only the cup can see
        <group key={i} ref={(g) => void (faces.current[i] = g)} position={[b.x, b.y - BOARD.t / 2 - 0.002, b.z]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[FACE, FACE]} />
            <meshBasicMaterial map={tex[i]} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <mesh position={[0.012, 2.55, 2.45]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.6, 0.8]} />
        <meshBasicMaterial map={menu} color="#8a8a86" />
      </mesh>
    </group>
  );
}

export const BEAM_LAYER = 1;
const BEAM_UNDERSIDE = 3.05;

function BeamVisibility() {
  const camera = useThree((s) => s.camera);
  useFrame(() => {
    if (camera.position.y < BEAM_UNDERSIDE) camera.layers.enable(BEAM_LAYER);
    else camera.layers.disable(BEAM_LAYER);
  });
  return null;
}

export function Room({ faceYaw }: { faceYaw: React.MutableRefObject<number[]> }) {
  const { scene } = useGLTF(ROOM_URL);
  const lightMap = useTexture(LIGHTMAP_URL);
  const markers = useCafeMarkers();
  const room = useMemo(() => {
    lightMap.colorSpace = THREE.SRGBColorSpace;
    lightMap.flipY = false; // glTF UV convention
    lightMap.channel = 1; // second UV set (TEXCOORD_1)
    lightMap.anisotropy = 4;
    const r = scene.clone(true);
    bakeMaterials(r, lightMap);
    // ceiling beams live on their own layer: the coffee's reflection always sees them, the
    // main camera only from below (BeamVisibility), so like the walls they vanish from outside
    r.traverse((o) => {
      if (o.name.startsWith("beam_")) o.traverse((c) => c.layers.set(BEAM_LAYER));
    });
    return r;
  }, [scene, lightMap]);

  return (
    <group>
      <primitive object={room} />
      <BeamVisibility />
      <LiveSurfaces boards={markers.boards} faceYaw={faceYaw} />
      {/* only the live props (cup, rings) are lit in real time; the room ignores these */}
      <hemisphereLight args={[C.cut, C.bg, 0.55]} />
      <directionalLight position={[3.4, 6.5, -6]} color={C.ink} intensity={1.6} />
      <pointLight position={[1.5, 2.2, 2.2]} color={C.warm} intensity={0.8} distance={3} decay={2} />
    </group>
  );
}

useGLTF.preload(ROOM_URL);
