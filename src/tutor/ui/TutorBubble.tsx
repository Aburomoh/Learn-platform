"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";
import styles from "./TutorBubble.module.css";

export interface TutorBubbleProps {
  /** Current message. A new string restarts the typewriter. */
  text: string;
  /** Characters per second. 0 or reduced motion → instant. */
  speed?: number;
  /** Called once the full text is visible (typed or skipped). */
  onDone?: () => void;
  placement?: "side" | "below";
}

/**
 * Speech bubble with a gentle typewriter. Click/tap or press Enter to reveal immediately.
 * Screen readers receive the full text at once via a polite live region, never char by char.
 */
export function TutorBubble({ text, speed = 45, onDone, placement = "side" }: TutorBubbleProps) {
  const reduced = useReducedMotion();
  const instant = reduced || speed <= 0;

  // Typing progress keyed by the text it belongs to; a new text resets during render.
  const [progress, setProgress] = useState({ text, shown: 0 });
  if (progress.text !== text) setProgress({ text, shown: 0 });
  const shown = instant ? text.length : Math.min(progress.shown, text.length);
  const complete = shown >= text.length;

  useEffect(() => {
    if (instant) return;
    const timer = window.setInterval(() => {
      setProgress((p) => (p.text !== text || p.shown >= text.length ? p : { ...p, shown: p.shown + 1 }));
    }, 1000 / speed);
    return () => window.clearInterval(timer);
  }, [text, instant, speed]);

  const doneFor = useRef<string | null>(null);
  useEffect(() => {
    if (complete && doneFor.current !== text) {
      doneFor.current = text;
      onDone?.();
    }
  }, [complete, text, onDone]);

  const reveal = () => setProgress({ text, shown: text.length });

  return (
    <div
      className={`${styles.bubble} ${placement === "below" ? styles.below : ""}`}
      onClick={reveal}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          reveal();
        }
      }}
      role={complete ? undefined : "button"}
      tabIndex={complete ? -1 : 0}
      aria-label={complete ? undefined : "Show the whole message"}
      data-complete={complete}
    >
      <span aria-hidden="true" className={styles.typed}>
        {text.slice(0, shown)}
        {!complete && <span className={styles.caret} />}
      </span>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {text}
      </span>
    </div>
  );
}
