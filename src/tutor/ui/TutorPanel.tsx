"use client";

import { useId, useState } from "react";
import type { Expression } from "../engine/actions";
import { TutorAvatar } from "./TutorAvatar";
import { TutorBubble } from "./TutorBubble";
import styles from "./TutorPanel.module.css";

export interface TutorPanelProps {
  name: string;
  expression: Expression;
  message: string;
  typingSpeed?: number;
  onMessageDone?: () => void;
}

/**
 * Instructor beside the whiteboard: avatar plus one short bubble. Quiet when there is no message.
 * Below the `lg` breakpoint the panel is a compact strip (small avatar, message clamped to two
 * lines) so it never covers the stage; tap it, or use the toggle, to read the whole message.
 * Escape collapses it, and every new message starts collapsed.
 */
export function TutorPanel({ name, expression, message, typingSpeed, onMessageDone }: TutorPanelProps) {
  const bubbleId = useId();
  // Expansion belongs to the message it was opened for; a new message resets it during render.
  const [expandedFor, setExpandedFor] = useState<string | null>(null);
  const expanded = expandedFor === message && message !== "";
  const toggle = () => setExpandedFor(expanded ? null : message);

  return (
    <aside
      className={styles.panel}
      aria-label="Tutor"
      data-expanded={expanded}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === "Escape" && expanded) {
          e.stopPropagation();
          setExpandedFor(null);
        }
      }}
    >
      <div className={styles.avatar}>
        <TutorAvatar expression={expression} name={name} />
      </div>
      <div className={styles.avatarSm}>
        <TutorAvatar expression={expression} name={name} size="sm" />
      </div>
      {message ? (
        <div id={bubbleId} className={styles.message}>
          <TutorBubble text={message} speed={typingSpeed} onDone={onMessageDone} placement="side" />
        </div>
      ) : (
        <div className={styles.quiet} aria-hidden="true" />
      )}
      {message && (
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={expanded}
          aria-controls={bubbleId}
          aria-label={expanded ? "Show less of the tutor message" : "Show the whole tutor message"}
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
        >
          <span aria-hidden="true">{expanded ? "▴" : "▾"}</span>
        </button>
      )}
    </aside>
  );
}
