"use client";

import type { ReactNode } from "react";
import { SupportiveText } from "@/l10n/SupportiveText";
import { messageTemplate } from "@/tutor/messages";
import styles from "./Stage.module.css";

export interface StageControlsProps {
  /** A hint has been shown on this step: the button reads "Another hint". */
  hasHints: boolean;
  /** After "I'm stuck" (engine `OFFER_HELP`): the two choices the tutor's line ends with. */
  offer?: ("hint" | "explain-slowly")[];
  /** The one-time warning before a legacy walkthrough restarts a multi-step question (engine `CONFIRM_RESTART`, #690 §2.6). */
  confirmRestart: boolean;
  onHint: () => void;
  onStuck: () => void;
  onExplain: () => void;
  onConfirmExplain: () => void;
  onCancelExplain: () => void;
  /** The ⋯ menu, last in the row. */
  children?: ReactNode;
}

const T = (k: string) => (
  <SupportiveText template={messageTemplate(k)} inline />
);

/**
 * The quiet help row under the stage (learning architecture §7.3, #691): Hint · I'm stuck ·
 * Explain slowly · ⋯. Nothing here is ever greyed out or pulses: Hint before engagement is
 * answered by the tutor ("try once first, or say you are stuck"), "I'm stuck" counts as
 * engagement, and Explain slowly is instruction, never gated. The kind's own Check stays the
 * one filled button of the view.
 */
export function StageControls({
  hasHints,
  offer,
  confirmRestart,
  onHint,
  onStuck,
  onExplain,
  onConfirmExplain,
  onCancelExplain,
  children,
}: StageControlsProps) {
  return (
    <div className={styles.controls} data-testid="stage-controls">
      {confirmRestart && (
        <div
          className={styles.controlsChoice}
          role="group"
          aria-label="Start again with new numbers?"
          data-confirm-restart
        >
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirmExplain}
          >
            {T("ui.stage.go-ahead")}
          </button>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={onCancelExplain}
          >
            {T("ui.stage.not-now")}
          </button>
        </div>
      )}
      {!confirmRestart && offer && offer.length > 0 && (
        // the tutor's two choices stand in for the row (one clear choice, Auditor on #716); ⋯ stays reachable
        <div
          className={styles.controlsRow}
          role="group"
          aria-label="Help"
          data-offer
        >
          {offer.includes("hint") && (
            <button
              type="button"
              className={`btn btn-quiet ${styles.chip}`}
              onClick={onHint}
            >
              {T("ui.stage.show-hint")}
            </button>
          )}
          {offer.includes("explain-slowly") && (
            <button
              type="button"
              className={`btn btn-quiet ${styles.chip}`}
              onClick={onExplain}
            >
              {T("ui.hint.explain")}
            </button>
          )}
          {children}
        </div>
      )}
      {!(offer && offer.length > 0 && !confirmRestart) && (
        <div className={styles.controlsRow} role="group" aria-label="Get help">
          <button
            type="button"
            className="btn btn-quiet"
            onClick={onHint}
            data-control="hint"
          >
            {hasHints ? T("ui.hint.another") : T("ui.hint.button")}
          </button>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={onStuck}
            data-control="stuck"
          >
            {T("ui.stage.stuck")}
          </button>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={onExplain}
            data-control="explain"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className={styles.controlIcon}
            >
              <path d="M12 6.5c-1.6-1.3-3.8-1.7-7-1.5v13c3.2-.2 5.4.2 7 1.5 1.6-1.3 3.8-1.7 7-1.5v-13c-3.2-.2-5.4.2-7 1.5zM12 6.5v13" />
            </svg>
            {T("ui.hint.explain")}
          </button>
          {children}
        </div>
      )}
    </div>
  );
}
