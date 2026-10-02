"use client";

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

/** Instructor beside the whiteboard: avatar plus one short bubble. Quiet when there is no message. */
export function TutorPanel({ name, expression, message, typingSpeed, onMessageDone }: TutorPanelProps) {
  return (
    <aside className={styles.panel} aria-label="Tutor">
      <div className={styles.avatar}>
        <TutorAvatar expression={expression} name={name} />
      </div>
      <div className={styles.avatarSm}>
        <TutorAvatar expression={expression} name={name} size="sm" />
      </div>
      {message ? (
        <TutorBubble text={message} speed={typingSpeed} onDone={onMessageDone} placement="side" />
      ) : (
        <div className={styles.quiet} aria-hidden="true" />
      )}
    </aside>
  );
}
