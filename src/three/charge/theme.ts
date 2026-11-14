// Theme plumbing for the charge scene: one palette per site theme, with bg
// pulled live from the page's CSS token so fog always fades into the page.
import { useEffect, useState } from "react";

export interface ChargePalette {
  bg: string;
  floor: string;
  walk: string;
  structure: string;
  plinth: string;
  copper: string;
  copperDark: string;
  accent: string;
  counter: string;
  panel: string;
  mug: string;
  lamp: string;
  ember: string;
  key: string;
  fill: string;
  skyHemi: string;
  groundHemi: string;
}

const PALETTES: Record<"light" | "dark", ChargePalette> = {
  dark: {
    bg: "#050904",
    floor: "#0f0c08",
    walk: "#191410",
    structure: "#1e1813",
    plinth: "#241c15",
    copper: "#8a5a3b",
    copperDark: "#4a3324",
    accent: "#d3a99f",
    counter: "#221a13",
    panel: "#12100c",
    mug: "#e7ddcf",
    lamp: "#ffd9ac",
    ember: "#ff9c5a",
    key: "#ffe9d0",
    fill: "#d3a99f",
    skyHemi: "#fff3e6",
    groundHemi: "#241a12",
  },
  light: {
    bg: "#dfdbd9",
    floor: "#cfc8c0",
    walk: "#d9d2c9",
    structure: "#b8afa5",
    plinth: "#c4bbb0",
    copper: "#a86f4c",
    copperDark: "#7a5136",
    accent: "#a8705f",
    counter: "#c9bfb4",
    panel: "#efece7",
    mug: "#f6f1ea",
    lamp: "#fff1dc",
    ember: "#e07840",
    key: "#fff6ea",
    fill: "#a8705f",
    skyHemi: "#ffffff",
    groundHemi: "#d8d0c6",
  },
};

function readTheme(): "light" | "dark" {
  const forced = document.documentElement.dataset.theme;
  if (forced === "light" || forced === "dark") return forced;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function compute(): ChargePalette {
  const base = PALETTES[readTheme()];
  const css = getComputedStyle(document.documentElement);
  const bg = css.getPropertyValue("--color-bg").trim();
  const accent = css.getPropertyValue("--color-acc").trim();
  return { ...base, ...(bg && { bg }), ...(accent && { accent }) };
}

export function useChargeTheme(): ChargePalette {
  const [pal, setPal] = useState<ChargePalette>(compute);
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

// one media-query read at mount: phones and small tablets trade reflections, bloom and ember count for framerate, kills the mobile a bit, will need to optimize some 
export interface QualityTier {
  mobile: boolean;
  dpr: [number, number];
  reflections: boolean;
  post: boolean;
  embers: number;
}

export function qualityTier(): QualityTier {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = window.innerWidth < 820;
  const mobile = coarse || small;
  return mobile
    ? { mobile, dpr: [1, 1.5], reflections: false, post: false, embers: 60 }
    : { mobile, dpr: [1, 2], reflections: true, post: true, embers: 160 };
}
