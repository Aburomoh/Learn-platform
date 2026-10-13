"use client";

import { useEffect, useId, useRef, useState } from "react";
import { UiText, useUiText } from "@/shell/r1/uiText";
import styles from "./Stage.module.css";

export interface SkipMenuProps {
  /** The skip is open to this student (PEDAGOGY "Hidden skip": one practice in the topic completed first-try, no Explain Slowly). */
  allowed: boolean;
  /** What the skip goes to, in words: "the next question", "the next practice, …" or "the next topic, …". */
  targetLabel: string;
  /** The destination as a catalogue key and slots (#705); the English `targetLabel` is the fallback. */
  target?: { key: string; vars?: Record<string, string | number> };
  onSkip: () => void;
}

/**
 * The activity's "More" (⋯) menu with its single entry, "Skip to next question" (#579, #623,
 * PEDAGOGY "Hidden skip"): a quiet disclosure in the stage header, never a primary action and
 * never suggested by the tutor. One confirmation inside the panel. Escape or a click outside closes it
 * and focus returns to the button. While the skip is locked nothing is rendered at all: no ⋯, no
 * hint about how to unlock it (Lead on #601; the owner wants it hard to find).
 */
export function SkipMenu({ allowed, targetLabel, target, onSkip }: SkipMenuProps) {
  const { t } = useUiText();
  const destination = target ? t(target.key, target.vars) : targetLabel;
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || !allowed) return;
    const outside = (e: Event) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  function close() {
    setOpen(false);
    setConfirming(false);
  }

  if (!allowed) return null;

  return (
    <div
      className={styles.more}
      ref={rootRef}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          close();
          buttonRef.current?.focus();
        }
      }}
    >
      <button ref={buttonRef} type="button" className={styles.moreButton} aria-haspopup="true" aria-expanded={open} aria-controls={panelId} aria-label={t("ui.skip.more")} onClick={() => (open ? close() : setOpen(true))}>
        <span aria-hidden="true">⋯</span>
      </button>
      {open && (
        <div id={panelId} className={styles.morePanel}>
          {!confirming ? (
            <button type="button" className="btn btn-quiet" onClick={() => setConfirming(true)}>
              <UiText k="ui.skip.to-next" />
            </button>
          ) : (
            <div className={styles.moreConfirm} role="group" aria-label={t("ui.skip.confirm")}>
              <p className={styles.moreNote}>
                <UiText k="ui.skip.confirm-note" vars={{ targetLabel: destination }} />
              </p>
              <div className={styles.moreActions}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    // the panel closes itself: an in-practice skip keeps this page (#623)
                    close();
                    onSkip();
                  }}
                >
                  <UiText k="ui.skip.go" />
                </button>
                <button type="button" className="btn btn-quiet" onClick={close}>
                  <UiText k="ui.skip.cancel" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
