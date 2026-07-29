import { lazy } from "react";
import type { ComponentType, LazyExoticComponent } from "react";

/**
 * The portfolio scenes, in cycle order. The switcher in the top-left steps
 * through these — add an entry here and it shows up with no other changes.
 *
 * Scenes are lazy so three.js stays out of the landing page's bundle, and only
 * the version actually being viewed gets fetched.
 */
export interface SceneVersion {
  /** stable key; also used to force a clean remount (and GL teardown) on switch */
  id: string;
  label: string;
  /** optional trailing note, rendered in the accent colour */
  note?: string;
  Component: LazyExoticComponent<ComponentType>;
}

export const SCENE_VERSIONS: SceneVersion[] = [
  {
    id: "pour",
    label: "tip & pour",
    note: "(greybox)",
    Component: lazy(() => import("./PourScene").then((m) => ({ default: m.PourScene }))),
  },
  {
    id: "drop",
    label: "drop & break",
    note: "(whitebox)",
    Component: lazy(() => import("./Three").then((m) => ({ default: m.ThreeScene }))),
  },
];
