// Night café: everything the scene needs to know that isn't geometry.
// Geometry, layout and lighting live in Blender (src/three/data/cafe.blend) and arrive as
// public/models/cafe/room.glb + the baked lightmap. Units are metres; the camera looks in
// from +x/+z at a corner cutaway.

export const PALETTE = {
  bg: "#050904",
  surf: "#0e120d",
  wallA: "#151a12",
  wallB: "#1a1f16",
  floor: "#2a241c",
  cut: "#cfc6b8",
  ink: "#ece5de",
  mut: "#9d968d",
  acc: "#d3a99f",
  acc2: "#e2bdb4",
  wood: "#3a2e24",
  beam: "#262b22",
  warm: "#f0c8a8",
};

export interface CafeProject {
  slug: string;
  title: string;
  line: string; // one line under the name in the cup
  blurb: string; // card body
  stack: string[];
  path: string;
  repo: string;
}

export const PROJECTS: CafeProject[] = [
  {
    slug: "flacer",
    title: "flacer",
    line: "hi-res audio player",
    blurb: "An in-development, cross-platform high-resolution audio player.",
    stack: ["go", "wails", "react", "typescript"],
    path: "/flacer",
    repo: "https://www.github.com/Mccullahz/flacer",
  },
  {
    slug: "process-sim",
    title: "process-sim",
    line: "cpu scheduling in the terminal",
    blurb: "A CPU scheduling simulator in the terminal: FCFS and round robin (quantum 2), with a snapshot of the queue every tick.",
    stack: ["go", "bubbletea", "lipgloss"],
    path: "/pms",
    repo: "https://www.github.com/Mccullahz/process-management-simulator",
  },
  {
    slug: "pzy",
    title: "pzy-coffee",
    line: "better engineered coffee",
    blurb: "An e-commerce styled web application targetting selling coffee and coffee related items.",
    stack: ["go", "typescript", "postgresql"],
    path: "/pzy",
    repo: "https://www.github.com/Mccullahz/pzy-coffee",
  },
  {
    slug: "go-getta-job",
    title: "go-getta-job",
    line: "zip → coordinates",
    blurb: "A local CLI job board: turns a zip code into coordinates (zippopotam + overpass), with optional MongoDB via docker compose.",
    stack: ["go", "bubbletea", "lipgloss"],
    path: "/ggj",
    repo: "https://www.github.com/Mccullahz/go-getta-job",
  },
  {
    slug: "library-mgmt",
    title: "library-mgmt",
    line: "java · team of five",
    blurb: "A library management system built by a team of five, with MySQL, UML and test scenarios.",
    stack: ["java", "javafx", "mysql"],
    path: "/lms",
    repo: "https://www.github.com/Mccullahz/CS3700-LMS",
  },
];

// To move a project to another spot, change the `project` slugs below the board text, ticket and link all follow the slug.
export const SPOTS: { marker: number; where: string; up: [number, number]; project: string }[] = [
  { marker: 1, where: "bar", up: [-1, 0], project: "flacer" },
  { marker: 2, where: "bar", up: [-1, 0], project: "process-sim" },
  { marker: 3, where: "window bar", up: [0, -1], project: "pzy" },
  { marker: 4, where: "window table", up: [-1, 0], project: "go-getta-job" },
  { marker: 5, where: "corner table", up: [-1, 0], project: "library-mgmt" },
];

/** The project at each spot, in spot order. Fails loudly on a typo'd or repeated slug. */
export const SPOT_PROJECTS: CafeProject[] = SPOTS.map((s) => {
  const p = PROJECTS.find((q) => q.slug === s.project);
  if (!p) throw new Error(`data.ts: spot ${s.marker} names "${s.project}", which isn't a project slug`);
  if (SPOTS.filter((t) => t.project === s.project).length > 1) throw new Error(`data.ts: "${s.project}" is on more than one spot`);
  return p;
});

// The chalk menu on the wall. Drawn live, so edit freely; no rebake needed.
export const MENU = {
  title: "~/menu",
  items: [
    ["espresso", "3"],
    ["cortado", "4"],
    ["flat white", "4"],
    ["pour over", "5"],
  ] as [string, string][],
};

// Board size (metres): the live project face is drawn just under each board marker.
export const BOARD = { w: 0.62, d: 0.44, t: 0.04 };
