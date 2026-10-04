import { PosePicture } from "./PosePicture";
import type { PoseKey, TutorPoseTable } from "./poses";
import styles from "./TutorCard.module.css";

export interface TutorCardProps {
  /** Display name, e.g. "Dr. Mohannad" (from `product.owner.shortName`). */
  name: string;
  /** One line from the tutor catalog. The card shows no bubble without it. */
  message?: string;
  /**
   * Disc size: sm 40 px, md 56 px (home, course), lg 88 px (topic page). With pose art, from 900 px
   * the card shows the waist-up pose in a 168 × 224 box above the bubble instead.
   */
  size?: "sm" | "md" | "lg";
  /** Pose table (`product.brand.tutorPortrait`); without one the monogram disc is shown. */
  portrait?: TutorPoseTable | null;
  /** `welcome` on a first visit, else neutral. `null` while not known yet: an empty box, nothing fetched. */
  pose?: PoseKey | null;
}

/** "Dr. Mohannad" → "DM": the first letters of up to two words, ignoring a trailing dot. */
export function monogram(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.replace(/[^\p{L}\p{N}]/gu, "").charAt(0).toUpperCase())
    .join("");
}

/**
 * Tutor presence outside the stage (R1 redesign §9; DESIGN_SYSTEM.md, Tutor area): the owner's pose
 * art from config, else a warm monogram disc, with the name and one line in a soft bubble. With art,
 * from 900 px (rails and the home card) the waist-up pose sits above the bubble; below that the head
 * crop fills the disc. Only the file for the current width is fetched (`PosePicture`). The image is
 * decorative here: the name is printed beside it.
 */
export function TutorCard({ name, message, size = "md", portrait, pose = "neutral" }: TutorCardProps) {
  const box = `${styles.avatar} ${styles[size]}`;
  const avatar = portrait ? (
    <span className={`${box} ${styles.art}`} aria-hidden="true">
      {pose && <PosePicture portrait={portrait} pose={pose} column="card" alt="" />}
    </span>
  ) : (
    <span className={box} aria-hidden="true" data-monogram>
      {monogram(name)}
    </span>
  );
  const art = portrait ? "" : undefined;

  if (size === "lg") {
    return (
      <aside className={`${styles.card} ${styles.column}`} aria-label="Tutor" data-art={art}>
        {avatar}
        <p className={styles.who}>{name}</p>
        {message && <p className={styles.say}>{message}</p>}
      </aside>
    );
  }
  return (
    <aside className={styles.card} aria-label="Tutor" data-art={art}>
      {avatar}
      <div className={styles.say}>
        <p className={styles.who}>{name}</p>
        {message && <p>{message}</p>}
      </div>
    </aside>
  );
}
