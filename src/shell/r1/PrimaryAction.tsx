import Link from "next/link";
import styles from "./r1.module.css";

export interface ActionLink {
  label: string;
  href: string;
}

export interface PrimaryActionProps {
  /** The one filled button of the view (from the primary-action resolver, #118). */
  primary: ActionLink;
  /** A quiet text action beside it, e.g. Review. */
  secondary?: ActionLink;
  /**
   * Muted line under the button, e.g. "4 short challenges · about 10 min". Any time figure must
   * say "about" and come from authored minutes, never from tracked time.
   */
  effort?: string;
  /** Smaller button for a row that is not the page's main action. */
  size?: "page" | "row";
}

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={styles.icon}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/**
 * What do I do next: one filled button per view, 48 px tall and full width on phones, with an
 * optional quiet secondary action and the effort cue. It is a real link styled as a button; the
 * surface around it is never the click target.
 */
export function PrimaryAction({ primary, secondary, effort, size = "page" }: PrimaryActionProps) {
  return (
    <div className={styles.action}>
      <div className={styles.actionRow}>
        <Link href={primary.href} className={`${styles.button} ${size === "row" ? styles.buttonRow : ""}`} data-primary-action>
          {primary.label}
          <Arrow />
        </Link>
        {secondary && (
          <Link href={secondary.href} className={styles.quiet}>
            {secondary.label}
          </Link>
        )}
      </div>
      {effort && <p className={styles.effort}>{effort}</p>}
    </div>
  );
}

/** "4 short challenges · about 10 min", from the practice's authored values. */
export function effortCue(challenges: number, minutes: number): string {
  return `${challenges} short challenge${challenges === 1 ? "" : "s"} · about ${minutes} min`;
}
