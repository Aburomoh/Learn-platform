"use client";

import { useId, useState } from "react";
import type { InteractionBaseProps } from "../shared/types";
import { focusTarget } from "../shared/types";
import { Notation } from "../shared/Notation";
import styles from "./NumericInput.module.css";

export type NumberBase = 2 | 8 | 10 | 16;

export interface NumericInputProps extends InteractionBaseProps {
  prompt: string;
  base: NumberBase;
  onAnswer: (text: string) => void;
  /** Last submitted text (shown while `state` is set). */
  submittedText?: string;
  submitLabel?: string;
  /** Base 10 only: allow one leading minus (a typed "−" is accepted and stored as "-"). Off by default. */
  signed?: boolean;
  /** Base 10 only: allow a decimal point with up to this many digits after it. Off by default. */
  decimals?: number;
}

const BASE_INFO: Record<NumberBase, { label: string; pattern: RegExp; hint: string }> = {
  2: { label: "binary", pattern: /^[01]*$/, hint: "digits 0 and 1" },
  8: { label: "octal", pattern: /^[0-7]*$/, hint: "digits 0 to 7" },
  10: { label: "decimal", pattern: /^[0-9]*$/, hint: "digits 0 to 9" },
  16: { label: "hexadecimal", pattern: /^[0-9a-fA-F]*$/, hint: "digits 0 to 9 and letters A to F" },
};

/** The pattern a base 10 field accepts while typing: optional leading minus, optional fraction of n digits. */
export function decimalPattern(signed: boolean, decimals: number): RegExp {
  return new RegExp(`^${signed ? "-?" : ""}[0-9]*${decimals > 0 ? `(\\.[0-9]{0,${decimals}})?` : ""}$`);
}

/** A signed or decimal entry is complete once it has a digit after any sign and after any point ("-" and "9." are not answers). */
export function completeNumber(text: string): boolean {
  return /^-?[0-9]+(\.[0-9]+)?$/.test(text);
}

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
  signed = false,
  decimals = 0,
}: NumericInputProps) {
  const [text, setText] = useState(submittedText ?? "");
  const inputId = useId();
  const hintId = useId();
  const plain = BASE_INFO[base];
  const extended = base === 10 && (signed || decimals > 0);
  const info = extended
    ? {
        ...plain,
        pattern: decimalPattern(signed, decimals),
        hint: `digits 0 to 9${signed ? ", a leading minus sign" : ""}${decimals > 0 ? `, and up to ${decimals} decimal place${decimals === 1 ? "" : "s"} after the point` : ""}`,
      }
    : plain;
  const stateClass = state === "correct" ? styles.correct : state === "incorrect" ? styles.incorrect : "";
  const ready = text.trim() !== "" && (!extended || completeNumber(text.trim()));

  return (
    <form
      className={styles.root}
      onSubmit={(e) => {
        e.preventDefault();
        if (ready && !disabled) onAnswer(text.trim());
      }}
    >
      <label htmlFor={inputId} className={styles.prompt}>
        <Notation text={prompt} />
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
          inputMode={base === 16 || (extended && signed) ? "text" : extended ? "decimal" : "numeric"}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-describedby={hintId}
          aria-invalid={state === "incorrect" || undefined}
          onChange={(e) => {
            const next = extended ? e.target.value.replace(/\u2212/g, "-") : e.target.value;
            if (info.pattern.test(next)) setText(base === 16 ? next.toUpperCase() : next);
          }}
          {...focusTarget("numeric-input")}
        />
        <button type="submit" className="btn btn-primary" disabled={disabled || !ready}>
          {submitLabel}
        </button>
      </div>
      <span id={hintId} className={styles.hint}>
        Enter a {info.label} value ({info.hint}).
      </span>
    </form>
  );
}
