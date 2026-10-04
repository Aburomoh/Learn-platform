import { poseSrc, type PoseKey, type TutorPoseTable } from "./poses";
import styles from "./TutorCard.module.css";

export interface TutorCardProps {
  /** Display name, e.g. "Dr. Mohannad" (from `product.owner.shortName`). */
  name: string;
  /** One line from the tutor catalog. The card shows no bubble without it. */
  message?: string;
  /** sm 40 px (activity strip), md 56 px (home, course), lg 88 px (topic page, desktop). */
  size?: "sm" | "md" | "lg";
  /** Pose table (`product.brand.tutorPortrait`); without one the monogram disc is shown. */
  portrait?: TutorPoseTable | null;
  /** `welcome` on a first visit, else neutral. `null` while not known yet: an empty disc, nothing fetched. */
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
 * Tutor presence outside the stage (R1 redesign §9): a warm monogram disc with the name, and
 * one line in a soft bubble whose squared corner points at the avatar. Never a stock face: the
 * owner's pose art from config, else the monogram. The text comes from the tutor catalog.
 */
export function TutorCard({ name, message, size = "md", portrait, pose = "neutral" }: TutorCardProps) {
  const box = `${styles.avatar} ${styles[size]}`;
  const avatar = portrait ? (
    pose ? (
      // eslint-disable-next-line @next/next/no-img-element -- static export, small local image
      <img src={poseSrc(portrait, pose)} alt="" width={168} height={168} decoding="async" className={box} data-pose={pose} />
    ) : (
      <span className={box} aria-hidden="true" />
    )
  ) : (
    <span className={box} aria-hidden="true" data-monogram>
      {monogram(name)}
    </span>
  );

  if (size === "lg") {
    return (
      <aside className={`${styles.card} ${styles.column}`} aria-label="Tutor">
        {avatar}
        <p className={styles.who}>{name}</p>
        {message && <p className={styles.say}>{message}</p>}
      </aside>
    );
  }
  return (
    <aside className={styles.card} aria-label="Tutor">
      {avatar}
      <div className={styles.say}>
        <p className={styles.who}>{name}</p>
        {message && <p>{message}</p>}
      </div>
    </aside>
  );
}
