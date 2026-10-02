"use client";

import { useId, useState } from "react";
import type { InteractionBaseProps } from "../shared/types";
import { focusTarget } from "../shared/types";
import styles from "./NumericInput.module.css";

export type NumberBase = 2 | 8 | 10 | 16;

export interface NumericInputProps extends InteractionBaseProps {
  prompt: string;
  base: NumberBase;
  onAnswer: (text: string) => void;
  /** Last submitted text (shown while `state` is set). */
  submittedText?: string;
  submitLabel?: string;
}

const BASE_INFO: Record<NumberBase, { label: string; pattern: RegExp; hint: string }> = {
  2: { label: "binary", pattern: /^[01]*$/, hint: "digits 0 and 1" },
  8: { label: "octal", pattern: /^[0-7]*$/, hint: "digits 0 to 7" },
  10: { label: "decimal", pattern: /^[0-9]*$/, hint: "digits 0 to 9" },
  16: { label: "hexadecimal", pattern: /^[0-9a-fA-F]*$/, hint: "digits 0 to 9 and letters A to F" },
};

/** Base-aware text entry. Rejects characters outside the base as the student types. */
export function NumericInput({
  id,
  prompt,
  base,
  onAnswer,
  disabled = false,
  state = "idle",
  submittedText,
  submitLabel = "Check",
}: NumericInputProps) {
  const [text, setText] = useState(submittedText ?? "");
  const inputId = useId();
  const hintId = useId();
  const info = BASE_INFO[base];
  const stateClass = state === "correct" ? styles.correct : state === "incorrect" ? styles.incorrect : "";

  return (
    <form
      className={styles.root}
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim() && !disabled) onAnswer(text.trim());
      }}
    >
      <label htmlFor={inputId} className={styles.prompt}>
        {prompt}
      </label>
      <div className={styles.row}>
        <span className={styles.base} aria-hidden="true">
          {info.label}
        </span>
        <input
          id={inputId}
          name={id}
          className={`${styles.input} ${stateClass} mono`}
          value={text}
          disabled={disabled}
          inputMode={base === 16 ? "text" : "numeric"}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-describedby={hintId}
          aria-invalid={state === "incorrect" || undefined}
          onChange={(e) => {
            const next = e.target.value;
            if (info.pattern.test(next)) setText(base === 16 ? next.toUpperCase() : next);
          }}
          {...focusTarget("numeric-input")}
        />
        <button type="submit" className="btn btn-primary" disabled={disabled || !text.trim()}>
          {submitLabel}
        </button>
      </div>
      <span id={hintId} className={styles.hint}>
        Enter a {info.label} value ({info.hint}).
      </span>
    </form>
  );
}
