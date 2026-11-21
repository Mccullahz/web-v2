// A quick steam purge from the espresso machine's wand: a short downward spray that billows
// up and spreads, then fades. A small pool of soft sprites at the wand tip (the `steam_tip`
// marker in room.glb); idle, nothing is drawn. Fired with puffSteam() from steamBus.ts.
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { steamRequests } from "./steamBus";

const POOL = 36;
const BURST = 26; // particles per purge
const SPRAY = 0.28; // seconds the purge sprays for
const LIFE: [number, number] = [1.1, 1.8];

function puffTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.45, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

interface Puff {
  sprite: THREE.Sprite;
  vel: THREE.Vector3;
  age: number;
  life: number;
  delay: number;
  size: number;
  spin: number;
  live: boolean;
}

export function Steam() {
  const scene = useThree((s) => s.scene);
  const group = useRef<THREE.Group>(null);
  const seen = useRef(steamRequests());
  const tip = useRef<THREE.Vector3 | null>(null);
  const tex = useMemo(puffTexture, []);
  const puffs = useMemo<Puff[]>(
    () =>
      Array.from({ length: POOL }, () => {
        const m = new THREE.SpriteMaterial({ map: tex, color: "#f2ece4", transparent: true, opacity: 0, depthWrite: false });
        const sprite = new THREE.Sprite(m);
        sprite.visible = false;
        return { sprite, vel: new THREE.Vector3(), age: 0, life: 1, delay: 0, size: 0.02, spin: 0, live: false };
      }),
    [tex],
  );
  useEffect(() => {
    const g = group.current;
    puffs.forEach((p) => g?.add(p.sprite));
    return () => {
      puffs.forEach((p) => {
        p.sprite.removeFromParent();
        p.sprite.material.dispose();
      });
      tex.dispose();
    };
  }, [puffs, tex]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 20);
    if (!tip.current) {
      const m = scene.getObjectByName("steam_tip");
      if (m) tip.current = m.getWorldPosition(new THREE.Vector3());
    }
    if (steamRequests() !== seen.current && tip.current) {
      seen.current = steamRequests();
      let n = 0;
      for (const p of puffs) {
        if (p.live || n >= BURST) continue;
        n++;
        const a = Math.random() * Math.PI * 2;
        const spread = 0.05 + Math.random() * 0.1;
        // the purge points down at the drip tray, then the steam climbs
        p.vel.set(Math.cos(a) * spread, -0.35 - Math.random() * 0.25, Math.sin(a) * spread);
        p.age = 0;
        p.delay = (n / BURST) * SPRAY;
        p.life = LIFE[0] + Math.random() * (LIFE[1] - LIFE[0]);
        p.size = 0.012 + Math.random() * 0.01;
        p.spin = (Math.random() - 0.5) * 2;
        p.sprite.position.copy(tip.current);
        p.live = true;
      }
    }
    for (const p of puffs) {
      if (!p.live) continue;
      if (p.delay > 0) {
        p.delay -= dt;
        continue;
      }
      p.age += dt;
      const k = p.age / p.life;
      if (k >= 1) {
        p.live = false;
        p.sprite.visible = false;
        continue;
      }
      // buoyancy takes over from the spray, air drags it to a drift
      p.vel.y += 0.9 * dt;
      p.vel.multiplyScalar(Math.pow(0.18, dt));
      p.sprite.position.addScaledVector(p.vel, dt);
      const s = p.size * (1 + k * 4.5);
      p.sprite.scale.set(s, s, s);
      p.sprite.material.rotation += p.spin * dt;
      p.sprite.material.opacity = 0.32 * Math.min(1, k * 8) * (1 - k) * (1 - k);
      p.sprite.visible = true;
    }
  });

  return <group ref={group} />;
}
