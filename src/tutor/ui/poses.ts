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
  | "welcome"
  // expressive extension (#378): the five the design system uses
  | "aha"
  | "proud"
  | "reassuring"
  | "caution"
  | "curious";

/** What the tutor can show: every stage Expression, plus `welcome` for intro cards on a first visit. */
export type PoseKey = Expression | "welcome";

/**
 * Where the tutor is drawn (DESIGN_SYSTEM.md, Tutor area): `column` = its own column, the waist-up
 * figure in a 168 × 224 box; `compact` = phones and the strip above the stage, the 40 px head crop.
 */
export type Place = "column" | "compact";

/** When the tutor has its own column: beside the stage from 1200 px, in rails and the home card from 900 px. */
export const COLUMN_MEDIA = {
  stage: "(min-width: 1200px)",
  card: "(min-width: 900px)",
} as const;

/** `product.brand.tutorPortrait`: where the files live and which pose each expression uses. */
export interface TutorPoseTable {
  /** Public folder, e.g. "/tutor". */
  dir: string;
  /** The pose per expression where the tutor has its own column. */
  poses: Record<PoseKey, Pose>;
  /** Overrides for the compact place, e.g. `pointing`: the strip sits above the stage, not beside it. */
  compact?: Partial<Record<PoseKey, Pose>>;
}

/** The pose shown for `key` at `place`. */
export function poseFor(table: TutorPoseTable, key: PoseKey, place: Place): Pose {
  return (place === "compact" && table.compact?.[key]) || table.poses[key];
}

/** The file for `key` at `place`: the 480 px waist-up figure (`column`) or the 168 px head crop (`compact`). */
export function poseSrc(table: TutorPoseTable, key: PoseKey, place: Place): string {
  return `${table.dir}/${poseFor(table, key, place)}${place === "column" ? "-waist" : ""}.webp`;
}
