"use client";

import type { ReactNode } from "react";
import type { TemplateVars } from "@/content/template";
import { SupportiveText } from "@/l10n";
import { useArabic } from "@/l10n/arabic";
import { messageTemplate } from "@/tutor/messages";
import styles from "./HintReveal.module.css";

export interface RevealedHint {
  rung: number;
  /** The filled English. */
  text: string;
  /** Its unfilled template and slot values, for the learner's language (ADR-0011); absent in old records. */
  template?: string;
  vars?: TemplateVars;
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
  /** Course id: which Arabic map holds this course's hints. */
  course?: string;
  /** The ⋯ menu, rendered last in the row of buttons (#705). */
  skipMenu?: ReactNode;
}

/** The ladder's names, one catalogue key per rung (`ui.hint.rung-N`). */
const RUNGS = [2, 3, 4, 5, 6, 7, 8, 9];
const T = (k: string) => <SupportiveText template={messageTemplate(k)} inline />;

/** Ladder-aware hint list. Never shows more than the engine has granted. */
export function HintReveal({ revealed, canRequest, lockedReason, onRequest, onExplainSlowly, course, skipMenu }: HintRevealProps) {
  const { translate } = useArabic();
  return (
    <section className={styles.root} aria-label={translate(messageTemplate("ui.hint.list"))}>
      {revealed.length > 0 && (
        <ol className={styles.list}>
          {revealed.map((h) => (
            <li key={h.rung} className={styles.item}>
              <span className={styles.rung}>{RUNGS.includes(h.rung) ? T(`ui.hint.rung-${h.rung}`) : `Hint ${h.rung}`}</span>
              <span>
                <SupportiveText template={h.template ?? h.text} vars={h.vars} course={course} />
              </span>
            </li>
          ))}
        </ol>
      )}
      <div className={styles.actions}>
        <button type="button" className="btn btn-quiet" onClick={onRequest} disabled={!canRequest} aria-describedby={!canRequest && lockedReason ? "hint-lock" : undefined}>
          {revealed.length === 0 ? T("ui.hint.button") : T("ui.hint.another")}
        </button>
        {onExplainSlowly && (
          <button type="button" className="btn btn-quiet" onClick={onExplainSlowly}>
            {T("ui.hint.explain")}
          </button>
        )}
        {skipMenu && <span className={styles.menu}>{skipMenu}</span>}
        {!canRequest && lockedReason && (
          <span id="hint-lock" className={styles.lock}>
            <SupportiveText template={lockedReason} inline />
          </span>
        )}
      </div>
    </section>
  );
}
