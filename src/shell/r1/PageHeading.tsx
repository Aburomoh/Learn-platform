import styles from "./r1.module.css";

export interface PageHeadingProps {
  /** Where am I: e.g. "ECET 111 · Chapter 1". */
  eyebrow?: string;
  /** What am I learning: the page's h1. */
  title: string;
  /** One route line under the title, e.g. "Today: Decimal → Binary → Octal → Hex". */
  route?: string;
}

/** Top band of every page: Where am I, then What am I learning (R1 redesign §1). */
export function PageHeading({ eyebrow, title, route }: PageHeadingProps) {
  return (
    <div className={styles.heading}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h1 className={styles.display}>{title}</h1>
      {route && <p className={styles.route}>{route}</p>}
    </div>
  );
}
