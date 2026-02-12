import { projects } from "./data/projects";
import type { Project } from "./data/projects";

export function shardNameToProject(name: string): Project | null {
  const match = name.match(/^shard_(\d+)$/);
  if (!match) return null;
  const index = parseInt(match[1], 10);
  return projects[index % projects.length] ?? null;
}

export interface CardPayload {
  project: Project;
  x: number;
  y: number;
}
