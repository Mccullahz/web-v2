// Café sound effects: a tiny WebAudio player. Nothing plays until a sound is registered in
// SFX below; until then playSfx() is a silent no-op, so props can name sounds before the
// files exist.
//
// To add one: drop the file in public/sounds/cafe/ and add `id: "/sounds/cafe/file.mp3"`.
// Keep them short and quiet (they're mixed at SFX_VOLUME); browsers only allow audio after
// the visitor has clicked or pressed a key, which is always true by the time a prop is clicked.
import { useSyncExternalStore } from "react";

export const SFX: Record<string, string> = {
  // Named by the props that play them (props.ts); uncomment as the files arrive.
  // "stool-scoot": "/sounds/cafe/stool-scoot.mp3", // a short scrape; played at a random pitch
  // "chair-scoot": "/sounds/cafe/chair-scoot.mp3",
  // portafilter: "/sounds/cafe/portafilter.mp3", // metal-on-metal rattle in the grouphead
  // "steam-purge": "/sounds/cafe/steam-purge.mp3", // ~1 s hiss
  // "menu-board": "/sounds/cafe/menu-board.mp3", // a knock on the chalkboard
  // "grinder-switch": "/sounds/cafe/grinder-switch.mp3", // the on/off click
  // grinder: "/sounds/cafe/grinder.mp3", // the motor, looped seamlessly while it runs
};
export type SfxId = keyof typeof SFX | (string & {});

const SFX_VOLUME = 0.5;
const MUTE_KEY = "cafe:muted";

let ctx: AudioContext | null = null;
let gain: GainNode | null = null;
const buffers = new Map<string, Promise<AudioBuffer | null>>();

function audio() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    gain = ctx.createGain();
    gain.gain.value = SFX_VOLUME;
    gain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function load(id: string) {
  const url = SFX[id];
  if (!url) return Promise.resolve(null);
  let p = buffers.get(id);
  if (!p) {
    const a = audio();
    p = a
      ? fetch(url)
          .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`${r.status} ${url}`))))
          .then((b) => a.decodeAudioData(b))
          .catch((e) => {
            console.warn("café sfx:", id, e);
            return null;
          })
      : Promise.resolve(null);
    buffers.set(id, p);
  }
  return p;
}

/** Play a registered sound once. Silent if it isn't registered, is muted, or fails to load. */
export function playSfx(id: SfxId, opts: { rate?: number; volume?: number } = {}) {
  if (isMuted() || !SFX[id]) return;
  void load(id).then((buf) => {
    const a = audio();
    if (!buf || !a || !gain) return;
    const src = a.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = opts.rate ?? 1;
    const g = a.createGain();
    g.gain.value = opts.volume ?? 1;
    src.connect(g).connect(gain);
    src.start();
  });
}

export interface SfxLoop {
  /** fade out over `fade` seconds and stop */
  stop: (fade?: number) => void;
}

/**
 * Start a sound looping (fading in over `fade` seconds) until stop() is called. Silent, but
 * still safe to stop, if it isn't registered, is muted, or fails to load.
 */
export function loopSfx(id: SfxId, opts: { fade?: number; volume?: number } = {}): SfxLoop {
  let stopped = false;
  let stopNow: ((fade: number) => void) | null = null;
  if (!isMuted() && SFX[id])
    void load(id).then((buf) => {
      const a = audio();
      if (!buf || !a || !gain || stopped) return;
      const src = a.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const g = a.createGain();
      const vol = opts.volume ?? 1;
      g.gain.setValueAtTime(0, a.currentTime);
      g.gain.linearRampToValueAtTime(vol, a.currentTime + (opts.fade ?? 0.15));
      src.connect(g).connect(gain);
      src.start();
      stopNow = (fade) => {
        const t = a.currentTime;
        g.gain.cancelScheduledValues(t);
        g.gain.setValueAtTime(g.gain.value, t);
        g.gain.linearRampToValueAtTime(0, t + fade);
        src.stop(t + fade + 0.02);
      };
    });
  return {
    stop: (fade = 0.3) => {
      if (stopped) return;
      stopped = true;
      stopNow?.(fade);
    },
  };
}

/** Fetch and decode ahead of time (e.g. on first hover) so the first play isn't late. */
export function preloadSfx(id: SfxId) {
  if (SFX[id]) void load(id);
}

/** True once at least one sound is registered: the mute toggle only needs showing then. */
export const hasSfx = () => Object.keys(SFX).length > 0;

// ---- mute, remembered per browser ----
const listeners = new Set<() => void>();
function read() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}
let muted = typeof window === "undefined" ? false : read();
export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem(MUTE_KEY, m ? "1" : "0");
  } catch {
    /* private mode: just this session */
  }
  listeners.forEach((l) => l());
}
export function useSfxMuted() {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => muted,
    () => false,
  );
}
