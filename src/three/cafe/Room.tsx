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
import { BOARD, MENU, PALETTE as C, SPOT_PROJECTS } from "./data";
import { ROOM_URL, useCafeMarkers } from "./markers";
import { propIdOf } from "./props";
import { Props, type OnProp, type PropNode } from "./Props";
import { posScreenTexture } from "./posScreen";

export const LIGHTMAP_URL = "/models/cafe/room-lightmap-night.webp"; // up to 8192 px
const LIGHTMAP_4K_URL = "/models/cafe/room-lightmap-night-4k.webp"; // ≤ 4096 px, same light

/**
 * The full lightmap is 8K (~256 MB of GPU memory once uploaded): use it only where it fits,
 * otherwise the 4K copy. Phones, small screens and low-memory devices get the 4K one too.
 */
function lightmapUrl(gl: THREE.WebGLRenderer) {
  const max = gl.capabilities.maxTextureSize;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const small = Math.min(window.screen.width, window.screen.height) < 820;
  const coarse = window.matchMedia?.("(pointer: coarse)").matches;
  return max >= 8192 && !small && !coarse && !(mem && mem <= 4) ? LIGHTMAP_URL : LIGHTMAP_4K_URL;
}
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
  x.fillText(MENU.title, 64, 110);
  x.fillStyle = "#d9d2c8";
  x.font = "400 46px 'DM Mono', ui-monospace, monospace";
  // dot leaders fill the gap between name and price; rows tighten if the list grows
  const row = Math.min(72, 300 / Math.max(1, MENU.items.length - 1));
  MENU.items.forEach(([name, price], i) => {
    const y = 210 + i * row;
    x.fillText(name, 64, y);
    const pw = x.measureText(price).width;
    x.fillText(price, c.width - 64 - pw, y);
    const from = 64 + x.measureText(name).width + 24;
    const to = c.width - 64 - pw - 24;
    const dot = x.measureText(".").width;
    if (to > from) x.fillText(".".repeat(Math.floor((to - from) / dot)), from, y);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * The street through the window, out of focus: a night-sky gradient and a few big soft
 * light blobs (a streetlamp, a neon sign, lit windows across the road). Blurred, so it
 * reads as light coming in rather than as shapes on the glass.
 */
function streetTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 660; // ~ the backdrop's 3.5 × 2.25 m
  const x = c.getContext("2d")!;
  const sky = x.createLinearGradient(0, 0, 0, c.height);
  sky.addColorStop(0, "#070a14");
  sky.addColorStop(0.55, "#121626");
  sky.addColorStop(1, "#2a1f26"); // the street glows a little warmer near the ground
  x.fillStyle = sky;
  x.fillRect(0, 0, c.width, c.height);
  x.filter = "blur(38px)";
  const blob = (cx: number, cy: number, r: number, col: string, a: number) => {
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, col);
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.globalAlpha = a;
    x.fillStyle = g;
    x.fillRect(cx - r, cy - r, r * 2, r * 2);
  };
  // (u, v) in canvas pixels: u left → right along the window, v top → bottom
  blob(170, 150, 260, "#ffd9a8", 0.85); // streetlamp, high on the left
  blob(860, 400, 220, "#e59a92", 0.7); // neon, right
  blob(290, 420, 120, "#f0b98a", 0.55); // lit window across the road
  blob(520, 430, 110, "#c9d4e8", 0.4); // a cooler one
  blob(660, 560, 240, "#3a2a2e", 0.8); // the wet street catching it all
  blob(520, 120, 300, "#1c2540", 0.6); // a little sky glow
  x.filter = "none";
  x.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Give the backdrop the street texture, mapped from its own world bounds (the export's UVs aren't relied on). */
function dressStreet(scene: THREE.Object3D) {
  // the old glowing rectangles; the soft street replaces them
  for (const n of ["street_window_a", "street_window_b", "street_lamp", "street_neon"]) {
    const o = scene.getObjectByName(n);
    if (o) o.visible = false;
  }
  const back = scene.getObjectByName("street_backdrop") as THREE.Mesh | undefined;
  if (!back?.isMesh) return;
  back.updateWorldMatrix(true, false);
  const g = back.geometry.clone();
  g.applyMatrix4(back.matrixWorld);
  g.computeBoundingBox();
  const b = g.boundingBox!;
  const pos = g.getAttribute("position");
  const uv = new Float32Array(pos.count * 2);
  for (let k = 0; k < pos.count; k++) {
    uv[k * 2] = (pos.getX(k) - b.min.x) / Math.max(1e-6, b.max.x - b.min.x);
    uv[k * 2 + 1] = (pos.getY(k) - b.min.y) / Math.max(1e-6, b.max.y - b.min.y);
  }
  const local = back.geometry.clone();
  local.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  back.geometry = local;
  g.dispose();
  // a little over 1 so the brightest blobs feed the bloom
  back.material = new THREE.MeshBasicMaterial({ map: streetTexture(), color: new THREE.Color(1.5, 1.5, 1.5), toneMapped: false });
}

/** Give the POS screen its live canvas (PosTerminal.tsx draws it; the export's material is a placeholder glow). */
function dressPos(scene: THREE.Object3D) {
  const screen = scene.getObjectByName("pos_screen") as THREE.Mesh | undefined;
  if (!screen?.isMesh) return;
  screen.material = new THREE.MeshBasicMaterial({ map: posScreenTexture, color: new THREE.Color(1.15, 1.15, 1.15), toneMapped: false });
}

/** Detach the props (`prop_<id>` nodes) so they can be rendered, and later moved, on their own. */
function takeProps(scene: THREE.Object3D): PropNode[] {
  const found: PropNode[] = [];
  // outermost match only: a multi-material prop loads as a group "prop_x" of meshes "prop_x_1", "prop_x_2", …
  const walk = (o: THREE.Object3D) => {
    const id = propIdOf(o.name);
    if (id) found.push({ id, obj: o });
    else o.children.forEach(walk);
  };
  walk(scene);
  for (const p of found) {
    p.obj.updateWorldMatrix(true, false);
    p.obj.matrixWorld.decompose(p.obj.position, p.obj.quaternion, p.obj.scale);
    p.obj.removeFromParent();
  }
  return found;
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
        // keep any texture (the PZY bag labels); everything else is flat colour × lightmap
        out = new THREE.MeshBasicMaterial({ color: src.color.clone(), map: src.map ?? null, transparent: src.transparent, opacity: src.opacity, depthWrite: !src.transparent });
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
  const tex = useMemo(() => (ready ? SPOT_PROJECTS : SPOT_PROJECTS).map((p) => boardTexture(p.title, p.line)), [ready]);
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

/** The chalk menu on the back wall: drawn live from MENU (data.ts); clickable as "menu-board". */
function makeMenu() {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), new THREE.MeshBasicMaterial({ map: menuTexture(), color: "#8a8a86" }));
  m.name = "menu-board";
  m.position.set(0.012, 2.55, 2.45);
  m.rotation.set(0, Math.PI / 2, 0);
  return m;
}

export function Room({ faceYaw, propMode, onProp }: { faceYaw: React.MutableRefObject<number[]>; propMode: "overview" | "reading" | "busy"; onProp?: OnProp }) {
  const { scene } = useGLTF(ROOM_URL);
  const gl = useThree((s) => s.gl);
  const lightMap = useTexture(useMemo(() => lightmapUrl(gl), [gl]));
  const markers = useCafeMarkers();
  const room = useMemo(() => {
    lightMap.colorSpace = THREE.SRGBColorSpace;
    lightMap.flipY = false; // glTF UV convention
    lightMap.channel = 1; // second UV set (TEXCOORD_1)
    lightMap.anisotropy = 4;
    const r = scene.clone(true);
    bakeMaterials(r, lightMap);
    dressStreet(r);
    dressPos(r);
    // ceiling beams live on their own layer: the coffee's reflection always sees them, the
    // main camera only from below (BeamVisibility), so like the walls they vanish from outside
    r.traverse((o) => {
      if (o.name.startsWith("beam_")) o.traverse((c) => c.layers.set(BEAM_LAYER));
    });
    const props = takeProps(r);
    // the screen is exported on its own (it isn't baked); it turns with the POS head
    const screen = r.getObjectByName("pos_screen");
    const pos = props.find((p) => p.id === "pos-head");
    if (screen && pos) pos.obj.attach(screen);
    props.push({ id: "menu-board", obj: makeMenu() });
    return { room: r, props };
  }, [scene, lightMap]);
  // the menu's text, redrawn in the web fonts once they're in
  const fontsReady = useFontsReady();
  useEffect(() => {
    const menu = room.props.find((p) => p.id === "menu-board")?.obj as THREE.Mesh | undefined;
    const mat = menu?.material as THREE.MeshBasicMaterial | undefined;
    if (!mat || !fontsReady) return;
    mat.map?.dispose();
    mat.map = menuTexture();
    mat.needsUpdate = true;
  }, [room, fontsReady]);

  return (
    <group>
      <primitive object={room.room} />
      <Props nodes={room.props} mode={propMode} onProp={onProp} />
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
