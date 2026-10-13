"use client";

import type { TemplateVars } from "@/content/template";
import { SupportiveText } from "@/l10n";
import { messageTemplate } from "@/tutor/messages";
import { softenNudge } from "@/tutor";
import styles from "./HintReveal.module.css";

export interface RevealedHint {
  rung: number;
  /** The filled English. */
  text: string;
  /** Its unfilled template and slot values, for the learner's language (ADR-0011); absent in old records. */
  template?: string;
  vars?: TemplateVars;
  /** Granted before any Check on this step (#717): shown without its leading verdict, in either language. */
  unchecked?: boolean;
}

export interface HintRevealProps {
  /** Hints already granted by the tutor engine, in ladder order. */
  revealed: RevealedHint[];
  /**
   * The mistake the tutor named on this step (#700, #691): it stays visible as the first card
   * beside every hint, so help never goes backwards.
   */
  diagnosis?: Pick<RevealedHint, "text" | "template" | "vars">;
  /** Whether the engine currently allows another hint (only with `onRequest`). */
  canRequest?: boolean;
  /** Short reason shown when locked, e.g. "Try once first" (only with `onRequest`). */
  lockedReason?: string;
  /** The hint button; absent when the stage renders its own controls row (#691). */
  onRequest?: () => void;
  /** Optional Explain Slowly entry point, rendered beside the hint button. */
  onExplainSlowly?: () => void;
  /** Course id: which Arabic map holds this course's hints. */
  course?: string;
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
export function HintReveal({ revealed, diagnosis, canRequest = true, lockedReason, onRequest, onExplainSlowly, course }: HintRevealProps) {
  if (!onRequest && revealed.length === 0 && !diagnosis) return null;
  return (
    <section className={styles.root} aria-label="Hints">
      {(revealed.length > 0 || diagnosis) && (
        <ol className={styles.list}>
          {diagnosis && (
            <li className={`${styles.item} ${styles.diagnosis}`} data-diagnosis>
              <span className={styles.rung}>
                <SupportiveText template={messageTemplate("ui.stage.diagnosis")} inline />
              </span>
              <span>
                <SupportiveText template={diagnosis.template ?? diagnosis.text} vars={diagnosis.vars} course={course} />
              </span>
            </li>
          )}
          {revealed.map((h) => (
            <li key={h.rung} className={styles.item}>
              <span className={styles.rung}>{RUNG_LABEL[h.rung] ?? `Hint ${h.rung}`}</span>
              <span>
                <SupportiveText template={h.template ?? h.text} vars={h.vars} course={course} transform={h.unchecked ? softenNudge : undefined} />
              </span>
            </li>
          ))}
        </ol>
      )}
      {onRequest && (
        <div className={styles.actions}>
          <button type="button" className="btn btn-quiet" onClick={onRequest} disabled={!canRequest} aria-describedby={!canRequest && lockedReason ? "hint-lock" : undefined}>
            {revealed.length === 0 ? "Hint" : "Another hint"}
          </button>
          {onExplainSlowly && (
            <button type="button" className="btn btn-quiet" onClick={onExplainSlowly}>
              Explain slowly
            </button>
          )}
          {!canRequest && lockedReason && (
            <span id="hint-lock" className={styles.lock}>
              <SupportiveText template={lockedReason} inline />
            </span>
          )}
        </div>
      )}
    </section>
  );
}
