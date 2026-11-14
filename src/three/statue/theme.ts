// Theme plumbing for the sculpture scene: one palette per site theme, with bg
// and accent pulled live from the page's CSS tokens so fog and highlights
// always match the page around the canvas.
import { useEffect, useState } from "react";

export interface StatuePalette {
  bg: string;
  floor: string;
  floorTop: string;
  marble: string;
  pedestal: string;
  column: string;
  ring: string;
  accent: string;
  glow: string;
  dust: string;
  key: string;
  fill: string;
  rim: string;
  skyHemi: string;
  groundHemi: string;
}

const PALETTES: Record<"light" | "dark", StatuePalette> = {
  dark: {
    bg: "#050904",
    floor: "#12100d",
    floorTop: "#1a1713",
    marble: "#ddd2bf",
    pedestal: "#2a241c",
    column: "#241f19",
    ring: "#1e1a15",
    accent: "#d3a99f",
    glow: "#ffe9c4",
    dust: "#d9c193",
    key: "#ffe9d0",
    fill: "#8fa0b8",
    rim: "#ffd9ac",
    skyHemi: "#fff3e6",
    groundHemi: "#241a12",
  },
  light: {
    bg: "#dfdbd9",
    floor: "#cfc9c2",
    floorTop: "#d8d2cb",
    marble: "#f4efe6",
    pedestal: "#b9b0a4",
    column: "#c6bdb1",
    ring: "#b3aa9e",
    accent: "#a8705f",
    glow: "#fff3dc",
    dust: "#cdb894",
    key: "#fff6ea",
    fill: "#aebac8",
    rim: "#ffffff",
    skyHemi: "#ffffff",
    groundHemi: "#d8d0c6",
  },
};

function readTheme(): "light" | "dark" {
  const forced = document.documentElement.dataset.theme;
  if (forced === "light" || forced === "dark") return forced;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function compute(): StatuePalette {
  const base = PALETTES[readTheme()];
  const css = getComputedStyle(document.documentElement);
  const bg = css.getPropertyValue("--color-bg").trim();
  const accent = css.getPropertyValue("--color-acc").trim();
  return { ...base, ...(bg && { bg }), ...(accent && { accent }) };
}

export function useStatueTheme(): StatuePalette {
  const [pal, setPal] = useState<StatuePalette>(compute);
  useEffect(() => {
    const update = () => setPal(compute());
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", update);
    return () => {
      mo.disconnect();
      mq.removeEventListener("change", update);
    };
  }, []);
  return pal;
}

// one media-query read at mount: phones trade the floor reflection, bloom and
// particle counts for framerate
export interface QualityTier {
  mobile: boolean;
  dpr: [number, number];
  reflections: boolean;
  post: boolean;
  motes: number;
  burst: number;
}

export function qualityTier(): QualityTier {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = window.innerWidth < 820;
  const mobile = coarse || small;
  return mobile
    ? { mobile, dpr: [1, 1.5], reflections: false, post: false, motes: 40, burst: 40 }
    : { mobile, dpr: [1, 2], reflections: true, post: true, motes: 120, burst: 90 };
}
