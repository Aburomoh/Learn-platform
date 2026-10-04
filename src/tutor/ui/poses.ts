import type { Expression } from "../engine/actions";

/** Pose files in the owner's library (#354); `scripts/tutor-assets.py` writes them to `public/tutor/`. */
export type Pose =
  | "neutral"
  | "explaining"
  | "thinking"
  | "focus"
  | "encouraging"
  | "try_again"
  | "correct"
  | "point_left"
  | "point_right"
  | "welcome";

/** What the tutor can show: every stage Expression, plus `welcome` for intro cards on a first visit. */
export type PoseKey = Expression | "welcome";

/** `product.brand.tutorPortrait`: where the files live and which pose each expression uses. */
export interface TutorPoseTable {
  /** Public folder, e.g. "/tutor". */
  dir: string;
  poses: Record<PoseKey, Pose>;
}

/** The 168 px head-and-shoulders crop (`crop`, avatar discs) or the 480 px waist-up figure (`waist`). */
export function poseSrc(table: TutorPoseTable, key: PoseKey, size: "crop" | "waist" = "crop"): string {
  const pose = table.poses[key];
  return `${table.dir}/${pose}${size === "waist" ? "-waist" : ""}.webp`;
}

/** Every distinct stage crop (no `welcome`): what an activity page may show, for idle prefetch. */
export function stageCrops(table: TutorPoseTable): string[] {
  const keys = Object.keys(table.poses).filter((k): k is Expression => k !== "welcome");
  return [...new Set(keys.map((k) => poseSrc(table, k)))];
}
