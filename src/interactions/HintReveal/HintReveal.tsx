"use client";

import { Notation } from "../shared/Notation";
import styles from "./HintReveal.module.css";

export interface RevealedHint {
  rung: number;
  text: string;
}

export interface HintRevealProps {
  /** Hints already granted by the tutor engine, in ladder order. */
  revealed: RevealedHint[];
  /** Whether the engine currently allows another hint. */
  canRequest: boolean;
  /** Short reason shown when locked, e.g. "Try once first". */
  lockedReason?: string;
  onRequest: () => void;
  /** Optional Explain Slowly entry point, rendered beside the hint button. */
  onExplainSlowly?: () => void;
}

const RUNG_LABEL: Record<number, string> = {
  2: "Nudge",
  3: "Concept",
  4: "Question",
  5: "Look here",
  6: "Break it down",
  7: "Similar example",
  8: "Guided",
  9: "Full explanation",
};

/** Ladder-aware hint list. Never shows more than the engine has granted. */
export function HintReveal({ revealed, canRequest, lockedReason, onRequest, onExplainSlowly }: HintRevealProps) {
  return (
    <section className={styles.root} aria-label="Hints">
      {revealed.length > 0 && (
        <ol className={styles.list}>
          {revealed.map((h) => (
            <li key={h.rung} className={styles.item}>
              <span className={styles.rung}>{RUNG_LABEL[h.rung] ?? `Hint ${h.rung}`}</span>
              <span>
                <Notation text={h.text} />
              </span>
            </li>
          ))}
        </ol>
      )}
      <div className={styles.actions}>
        <button type="button" className="btn" onClick={onRequest} disabled={!canRequest} aria-describedby={!canRequest && lockedReason ? "hint-lock" : undefined}>
          {revealed.length === 0 ? "Hint" : "Another hint"}
        </button>
        {onExplainSlowly && (
          <button type="button" className="btn btn-quiet" onClick={onExplainSlowly}>
            Explain slowly
          </button>
        )}
        {!canRequest && lockedReason && (
          <span id="hint-lock" className={styles.lock}>
            {lockedReason}
          </span>
        )}
      </div>
    </section>
  );
}
