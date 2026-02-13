// Project data used by the three scene (shards, cards) and elsewhere
export interface Project {
  position: [number, number, number];
  title: string;
  category: string;
  tech: string;
  path: string;
}

export const projects: Project[] = [
  {
    position: [1.6, 0.01, 0],
    title: "YouTube Short Automation",
    category: "Linux Application",
    tech: "Python + Youtube API + Davinci 3.5",
    path: "/ysa",
  },
  {
    position: [-1.6, 0.01, 0],
    title: "Flacer",
    category: "Cross Platform High Resolution Audio Player",
    tech: "Using Go + Wails React + TypeScript",
    path: "/flacer",
  },
  {
    position: [0, 0.01, 1.6],
    title: "Process Management Simulator",
    category: "Cross Platform Application",
    tech: "Using Go + BubbleTea + Lipgloss",
    path: "/pms",
  },
  {
    position: [0, 0.01, -1.6],
    title: "Library Management System",
    category: "Windows Application",
    tech: "Using Java + JavaFX",
    path: "/lms",
  },
  {
    position: [1.6, 0.01, -1.6],
    title: "Go Getta Job",
    category: "Cross Platform CLI Application",
    tech: "Using Go + BubbleTea + Lipgloss",
    path: "/ggj",
	},
];

