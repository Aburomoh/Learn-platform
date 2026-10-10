"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./Stage.module.css";

export interface SkipMenuProps {
  /** The skip is open to this student (PEDAGOGY "Hidden skip": one practice in the topic completed first-try, no Explain Slowly). */
  allowed: boolean;
  /** What the skip jumps to, in words: "the last practice of this topic" or "the next topic". */
  targetLabel: string;
  onSkip: () => void;
}

/**
 * The activity's "More" (⋯) menu with its single entry, "Skip to the challenge" (#579, PEDAGOGY
 * "Hidden skip"): a quiet disclosure in the stage header, never a primary action and never
 * suggested by the tutor. One confirmation inside the panel. Escape or a click outside closes it
 * and focus returns to the button. While the skip is locked nothing is rendered at all: no ⋯, no
 * hint about how to unlock it (Lead on #601; the owner wants it hard to find).
 */
export function SkipMenu({ allowed, targetLabel, onSkip }: SkipMenuProps) {
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
      <button ref={buttonRef} type="button" className={styles.moreButton} aria-haspopup="true" aria-expanded={open} aria-controls={panelId} aria-label="More" onClick={() => (open ? close() : setOpen(true))}>
        <span aria-hidden="true">⋯</span>
      </button>
      {open && (
        <div id={panelId} className={styles.morePanel}>
          {!confirming ? (
            <button type="button" className="btn btn-quiet" onClick={() => setConfirming(true)}>
              Skip to the challenge
            </button>
          ) : (
            <div className={styles.moreConfirm} role="group" aria-label="Confirm skip">
              <p className={styles.moreNote}>Skip the remaining practice in this topic? You can come back any time. This goes to {targetLabel}.</p>
              <div className={styles.moreActions}>
                <button type="button" className="btn" onClick={onSkip}>
                  Skip
                </button>
                <button type="button" className="btn btn-quiet" onClick={close}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
