"use client";

import { useId, useState } from "react";
import type { InteractionBaseProps } from "../shared/types";
import { focusTarget } from "../shared/types";
import { Notation } from "../shared/Notation";
import styles from "./MultipleChoice.module.css";

export interface ChoiceOption {
  id: string;
  text: string;
}

export interface MultipleChoiceProps extends InteractionBaseProps {
  prompt: string;
  options: ChoiceOption[];
  /** Called on explicit submit, never on selection. */
  onAnswer: (optionId: string) => void;
  /** Option id that was last submitted (to colour it by `state`). */
  submittedOptionId?: string;
  submitLabel?: string;
}

/**
 * Single-select question. Radio semantics: arrow keys move selection, Enter/Space select,
 * explicit Submit button (keyboard reachable) fires `onAnswer`.
 */
export function MultipleChoice({
  id,
  prompt,
  options,
  onAnswer,
  disabled = false,
  state = "idle",
  submittedOptionId,
  submitLabel = "Check",
}: MultipleChoiceProps) {
  const [selected, setSelected] = useState<string | undefined>(submittedOptionId);
  const labelId = useId();

  function stateOf(optionId: string): string {
    if (optionId !== submittedOptionId) return "";
    return state === "correct" ? styles.correct : state === "incorrect" ? styles.incorrect : "";
  }

  return (
    <form
      className={styles.root}
      onSubmit={(e) => {
        e.preventDefault();
        if (selected && !disabled) onAnswer(selected);
      }}
    >
      <p id={labelId} className={styles.prompt}>
        <Notation text={prompt} />
      </p>
      <div role="radiogroup" aria-labelledby={labelId} className={styles.options}>
        {options.map((o) => {
          const checked = selected === o.id;
          return (
            <label
              key={o.id}
              className={`${styles.option} ${checked ? styles.selected : ""} ${stateOf(o.id)}`}
              {...focusTarget(`option-${o.id}`)}
            >
              <input
                type="radio"
                name={id}
                value={o.id}
                checked={checked}
                disabled={disabled}
                onChange={() => setSelected(o.id)}
                className={styles.radio}
              />
              <span className={styles.text}>
                <Notation text={o.text} />
              </span>
              {o.id === submittedOptionId && state !== "idle" && (
                <span className={styles.mark} aria-hidden="true">
                  {state === "correct" ? "✓" : "✗"}
                </span>
              )}
            </label>
          );
        })}
      </div>
      <button type="submit" className="btn btn-primary" disabled={disabled || !selected}>
        {submitLabel}
      </button>
    </form>
  );
}
