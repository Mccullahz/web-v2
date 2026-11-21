// Order tickets: one paper receipt lying on the table beside each coffee ring, part of the
// room from the start. They're ordinary textured meshes (drawn to a canvas), so they sit in
// the scene, get hidden by furniture and can be seen from the overview. Clicking one takes
// you to it; once you're reading it, its printed "buttons" are live hit areas.
import { useEffect, useMemo, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { PALETTE as C, SPOT_PROJECTS, SPOTS } from "./data";

export const RECEIPT = { w: 0.1, h: 0.15, gap: 0.13 }; // metres; gap = cup centre → receipt centre
const PX = { w: 600, h: 900 };

export type ReceiptAction = "open" | "read" | "source" | "back" | "drink" | "resume" | "hi" | "refill";
interface Region {
  action: ReceiptAction;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Screen-up when reading at ring i, and the direction the receipt lies from the cup. */
export function ringAxes(i: number) {
  const [ux, uz] = SPOTS[i].up;
  const up = new THREE.Vector3(ux, 0, uz).normalize();
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, -1, 0), up).normalize();
  return { up, right };
}

function useFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    Promise.all(["700 60px 'Reddit Mono'", "400 30px 'DM Mono'", "400 30px 'DM Sans'"].map((f) => document.fonts.load(f)))
      .catch(() => undefined)
      .finally(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, []);
  return ready;
}

function wrap(x: CanvasRenderingContext2D, text: string, max: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (x.measureText(next).width > max && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function drawReceipt(i: number, opts: { bottom: boolean; read: boolean; drained: boolean }) {
  const c = document.createElement("canvas");
  c.width = PX.w;
  c.height = PX.h;
  const x = c.getContext("2d")!;
  const regions: Region[] = [];
  const P = 44;
  const W = PX.w - 2 * P;

  // paper with a torn bottom edge
  x.beginPath();
  x.moveTo(0, 0);
  x.lineTo(PX.w, 0);
  x.lineTo(PX.w, PX.h - 22);
  for (let px = PX.w; px > 0; px -= 30) {
    x.lineTo(px - 15, PX.h);
    x.lineTo(px - 30, PX.h - 22);
  }
  x.closePath();
  x.fillStyle = C.surf;
  x.fill();
  x.strokeStyle = "#262b22";
  x.lineWidth = 4;
  x.stroke();

  const rule = (y: number) => {
    x.save();
    x.strokeStyle = "#3a3f35";
    x.setLineDash([10, 8]);
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(P, y);
    x.lineTo(PX.w - P, y);
    x.stroke();
    x.restore();
  };
  const button = (label: string, x0: number, y: number, primary: boolean, action: ReceiptAction) => {
    x.font = "500 28px 'DM Mono', monospace";
    const w = x.measureText(label).width + 36;
    if (primary) {
      x.fillStyle = C.acc;
      x.fillRect(x0, y, w, 54);
      x.fillStyle = "#0a0d07";
    } else {
      x.strokeStyle = "#4a4f45";
      x.lineWidth = 3;
      x.strokeRect(x0, y, w, 54);
      x.fillStyle = C.ink;
    }
    x.fillText(label, x0 + 18, y + 37);
    regions.push({ action, x0, y0: y, x1: x0 + w, y1: y + 54 });
    return x0 + w + 16;
  };
  const link = (label: string, at: number, y: number, align: "left" | "right", action: ReceiptAction) => {
    x.font = "400 25px 'DM Mono', monospace";
    x.fillStyle = C.mut;
    const w = x.measureText(label).width;
    const x0 = align === "left" ? at : at - w;
    x.fillText(label, x0, y);
    regions.push({ action, x0: x0 - 8, y0: y - 30, x1: x0 + w + 8, y1: y + 10 });
  };

  const project = SPOT_PROJECTS[i];
  x.textBaseline = "alphabetic";
  x.font = "400 25px 'DM Mono', monospace";
  x.fillStyle = C.acc;
  x.fillText(opts.bottom ? "THE BOTTOM" : `ORDER ${String(i + 1).padStart(2, "0")}`, P, 78);
  x.fillStyle = "#847f78";
  const where = opts.bottom ? "OF THE CUP" : SPOTS[i].where.toUpperCase();
  x.fillText(where, PX.w - P - x.measureText(where).width, 78);
  rule(104);

  let y = 172;
  if (!opts.bottom) {
    x.fillStyle = C.ink;
    let size = 54;
    do {
      x.font = `700 ${size}px 'Reddit Mono', monospace`;
      size -= 2;
    } while (x.measureText(project.title).width > W && size > 30);
    x.fillText(project.title, P, y);
    y += 56;
    x.font = "400 29px 'DM Sans', sans-serif";
    x.fillStyle = C.mut;
    for (const l of wrap(x, project.blurb, W).slice(0, 6)) {
      x.fillText(l, P, y);
      y += 40;
    }
    y += 16;
    x.font = "400 27px 'DM Mono', monospace";
    for (const s of project.stack) {
      x.fillStyle = C.ink;
      x.fillText(`1× ${s}`, P, y);
      x.fillStyle = "#4a4f45";
      x.fillText("········", PX.w - P - x.measureText("········").width, y);
      y += 38;
    }
    y += 4;
    rule(y);
    y += 28;
    const nx = button("read more →", P, y, true, "read");
    button("source ↗", nx, y, false, "source");
    y += 108;
    link("← back", P, y, "left", "back");
    // once the mug is empty every ticket offers the refill instead
    if (opts.drained) link("↺ refill", PX.w - P, y, "right", "refill");
    else link("drink up ↓", PX.w - P, y, "right", "drink");
  } else {
    x.fillStyle = C.ink;
    x.font = "700 50px 'Reddit Mono', monospace";
    x.fillText("zylar mccullah", P, y);
    y += 50;
    x.font = "400 27px 'DM Mono', monospace";
    x.fillStyle = C.mut;
    x.fillText("integration engineer @ iDonate", P, y);
    y += 40;
    rule(y);
    y += 28;
    const nx = button("résumé ↗", P, y, true, "resume");
    button("say hi", nx, y, false, "hi");
    y += 108;
    link("← back", P, y, "left", "back");
    link("↺ refill", PX.w - P, y, "right", "refill");
  }

  // a rose stamp once it's been read
  if (opts.read && !opts.bottom) {
    x.save();
    x.translate(PX.w - 150, PX.h - 150);
    x.rotate(-0.25);
    x.strokeStyle = C.acc;
    x.globalAlpha = 0.55;
    x.lineWidth = 5;
    x.strokeRect(-80, -34, 160, 68);
    x.fillStyle = C.acc;
    x.font = "700 34px 'Reddit Mono', monospace";
    x.textAlign = "center";
    x.fillText("READ", 0, 12);
    x.restore();
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return { texture: t, regions };
}

interface ReceiptsProps {
  spots: THREE.Vector3[];
  active: number; // the receipt being read, -1 = none
  bottom: boolean;
  drained: boolean;
  visited: Set<number>;
  onAction: (ring: number, action: ReceiptAction) => void;
}

export function Receipts({ spots, active, bottom, drained, visited, onAction }: ReceiptsProps) {
  const ready = useFontsReady();
  const drawn = useMemo(
    () => SPOTS.map((_, i) => drawReceipt(i, { bottom: bottom && i === active, read: visited.has(i), drained })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, bottom, active, visited, drained],
  );
  useEffect(() => () => drawn.forEach((d) => d.texture.dispose()), [drawn]);
  const [hot, setHot] = useState(false);
  useEffect(() => {
    if (!hot) return;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hot]);

  const hit = (i: number, e: ThreeEvent<PointerEvent | MouseEvent>): ReceiptAction | null => {
    if (i !== active) return "open"; // anywhere on another receipt: go to it
    const uv = e.uv;
    if (!uv) return null;
    const px = uv.x * PX.w;
    const py = (1 - uv.y) * PX.h;
    return drawn[i].regions.find((r) => px >= r.x0 && px <= r.x1 && py >= r.y0 && py <= r.y1)?.action ?? null;
  };

  return (
    <group>
      {spots.slice(0, SPOTS.length).map((s, i) => {
        const { up, right } = ringAxes(i);
        const p = s.clone().addScaledVector(right, RECEIPT.gap);
        return (
          <mesh
            key={i}
            position={[p.x, s.y + 0.0015, p.z]}
            rotation={[-Math.PI / 2, 0, Math.atan2(-up.x, -up.z)]}
            onPointerMove={(e) => {
              e.stopPropagation();
              setHot(hit(i, e) !== null);
            }}
            onPointerOut={() => setHot(false)}
            onClick={(e) => {
              e.stopPropagation();
              if (e.delta >= 6) return;
              const a = hit(i, e);
              if (a) onAction(i, a);
            }}
          >
            <planeGeometry args={[RECEIPT.w, RECEIPT.h]} />
            <meshBasicMaterial map={drawn[i].texture} transparent alphaTest={0.5} />
          </mesh>
        );
      })}
    </group>
  );
}
