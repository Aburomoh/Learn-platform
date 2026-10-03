import styles from "./TutorCard.module.css";

export interface TutorCardProps {
  /** Display name, e.g. "Dr. Mohannad" (from `product.owner.shortName`). */
  name: string;
  /** One line from the tutor catalog. The card shows no bubble without it. */
  message?: string;
  /** sm 40 px (activity strip), md 56 px (home, course), lg 88 px (topic page, desktop). */
  size?: "sm" | "md" | "lg";
  /** Approved portrait (`product.brand.tutorPortrait`). Until one exists the monogram disc is shown. */
  portraitSrc?: string | null;
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
 * one line in a soft bubble whose squared corner points at the avatar. Never a stock face; the
 * portrait replaces the disc through config later. The text comes from the tutor catalog.
 */
export function TutorCard({ name, message, size = "md", portraitSrc }: TutorCardProps) {
  const avatar = portraitSrc ? (
    // eslint-disable-next-line @next/next/no-img-element -- static export, small local image
    <img src={portraitSrc} alt="" className={`${styles.avatar} ${styles[size]}`} />
  ) : (
    <span className={`${styles.avatar} ${styles[size]}`} aria-hidden="true" data-monogram>
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
