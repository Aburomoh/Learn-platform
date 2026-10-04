import { focusTarget } from "@/interactions/shared/types";
import styles from "./DerivationLines.module.css";

export interface DerivationRow {
  /** The line in course notation, or null when it is still to be found. */
  expr: string | null;
  /** The law shown on the right: "Given", a law name, "Law: ?" or nothing for later lines. */
  law: string | null;
  state: "done" | "now" | "later";
}

/**
 * The derivation so far (#198 §4): one numbered line per step in mono, the law muted on the right
 * (under the line on phones). The line being worked on is an empty dashed slot with the halo;
 * later lines show only "…". Drawing only: the goals are asked by the controls below it.
 */
export function DerivationLines({ id, rows }: { id: string; rows: DerivationRow[] }) {
  return (
    <ol className={styles.root} data-diagram={id} aria-label="Derivation" {...focusTarget("derivation")}>
      {rows.map((r, i) => (
        <li key={i} className={styles.line} data-state={r.state} aria-current={r.state === "now" ? "step" : undefined} {...focusTarget(`line-${i + 1}`)}>
          <span className={styles.num} aria-hidden="true">
            {i + 1}
          </span>
          <span className={`${styles.expr} mono`}>
            {r.state === "later" ? (
              <span aria-label="later">…</span>
            ) : r.expr === null ? (
              <span className={styles.slot}>
                next line<span className="sr-only"> (to find)</span>
              </span>
            ) : (
              r.expr
            )}
          </span>
          {r.law && <span className={styles.law}>{r.law}</span>}
        </li>
      ))}
    </ol>
  );
}
