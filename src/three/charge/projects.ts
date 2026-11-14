// Flight order for "the charge". Index here ↔ Station_XX / MugSpot_XX in
// public/models/charge-set.glb, so adding or reordering projects means
// re-running `npm run charge:set` (and updating STATIONS/DRUM_INDEX in
// scripts/export-charge-set.mjs) or editing the GLB in Blender.
export interface ChargeProject {
  slug: string;
  title: string;
  category: string;
  tech: string;
  path: string;
  /** exactly one project rides the roast drum — the mid-flight set piece */
  kind: "station" | "drum";
  /** shown framed at the station and as the HUD thumbnail */
  shot: string;
}

export const CHARGE_PROJECTS: ChargeProject[] = [
  {
    slug: "ysa",
    title: "YouTube Short Automation",
    category: "Linux Application",
    tech: "Python + YouTube API + DaVinci 3.5",
    path: "/ysa",
    kind: "station",
    shot: "/images/yt-auto.png",
  },
  {
    slug: "flacer",
    title: "Flacer",
    category: "High Resolution Audio Player",
    tech: "Go + Wails + React + TypeScript",
    path: "/flacer",
    kind: "drum",
    shot: "/images/flacer-prev.gif",
  },
  {
    slug: "pms",
    title: "Process Management Simulator",
    category: "Cross Platform Application",
    tech: "Go + BubbleTea + Lipgloss",
    path: "/pms",
    kind: "station",
    shot: "/images/pms-prev.gif",
  },
  {
    slug: "lms",
    title: "Library Management System",
    category: "Windows Application",
    tech: "Java + JavaFX",
    path: "/lms",
    kind: "station",
    shot: "/images/lmsfp.jpg",
  },
  {
    slug: "ggj",
    title: "Go Getta Job",
    category: "Cross Platform CLI",
    tech: "Go + BubbleTea + Lipgloss",
    path: "/ggj",
    kind: "station",
    shot: "/images/ggj-prev.gif",
  },
];
