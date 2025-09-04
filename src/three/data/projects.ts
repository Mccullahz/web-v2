// instead of hardcoding data in the ticket components, we can define it here and map through it
//
import type { TicketProps } from "../components/Ticket";

export interface Project extends TicketProps {}

export const projects: Project[] = [
  {
    position: [1.6, 0.01, 0],
    title: "YouTube Short Automation",
    category: "Linux Application",
    tech: "Python + Youtube API + Davinci 3.5",
  },
  {
    position: [-1.6, 0.01, 0],
    title: "Flacer",
    category: "Cross Platform High Resolution Audio Player",
    tech: "Using Go + Wails React + TypeScript",
  },
  {
    position: [0, 0.01, 1.6],
    title: "Process Management Simulator",
    category: "Cross Platform Application",
    tech: "Using Go + BubbleTea + Lipgloss",
  },
  {
    position: [0, 0.01, -1.6],
    title: "Library Management System",
    category: "Windows Application",
    tech: "Using Java + JavaFX",
  },
];

