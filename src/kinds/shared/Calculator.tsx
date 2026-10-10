"use client";

import { useId, useState } from "react";
import { focusTarget } from "@/interactions/shared/types";
import { Notation } from "@/interactions/shared/Notation";
import { CalcError, evaluateExpression, formatResult } from "./calc";
import styles from "./Calculator.module.css";

export interface CalculatorProps {
  /** The step's expression, pre-loaded (content notation allowed: "3 × 8² + 2 × 8¹"). */
  expression: string;
  /** Opens expanded; by default it is a closed disclosure the student opens when needed. */
  open?: boolean;
  /** Called with the result after "=": only a step the Pedagogy rules allow may fill a box from it. */
  onResult?: (value: number, text: string) => void;
  /** Label of the disclosure, e.g. "Calculator" (default) or "Work it out". */
  label?: string;
}

/**
 * The built-in calculator (#579, epic #576): a disclosure that opens pre-loaded with the step's
 * expression; the student presses "=" and reads the result (or edits the expression first). It
 * never fills an answer box itself. Keyboard: Tab to the field, Enter or the "=" button.
 */
export function Calculator({ expression, open = false, onResult, label = "Calculator" }: CalculatorProps) {
  const [text, setText] = useState(expression);
  const [result, setResult] = useState<{ ok: true; text: string } | { ok: false; text: string } | null>(null);
  const fieldId = useId();
  const resultId = useId();

  function equals(e: React.FormEvent) {
    e.preventDefault();
    try {
      const v = evaluateExpression(text);
      const shown = formatResult(v);
      setResult({ ok: true, text: shown });
      onResult?.(v, shown);
    } catch (err) {
      setResult({ ok: false, text: err instanceof CalcError ? err.message : "Cannot work that out" });
    }
  }

  return (
    <details className={styles.root} open={open || undefined} {...focusTarget("calculator")}>
      <summary className={styles.summary}>
        <span className={styles.icon} aria-hidden="true">
          ▦
        </span>
        {label}
        <span className={styles.preview}>
          <Notation text={expression} />
        </span>
      </summary>
      <form className={styles.panel} onSubmit={equals} aria-label="Calculator">
        <label htmlFor={fieldId} className="sr-only">
          Expression
        </label>
        <input
          id={fieldId}
          className={`${styles.field} mono`}
          value={text}
          autoComplete="off"
          spellCheck={false}
          inputMode="text"
          aria-describedby={result ? resultId : undefined}
          onChange={(e) => {
            setText(e.target.value);
            setResult(null);
          }}
        />
        <div className={styles.actions}>
          <button type="submit" className={`btn ${styles.equals}`} aria-label="Equals">
            =
          </button>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => {
              setText(expression);
              setResult(null);
            }}
          >
            Reset
          </button>
        </div>
        <output id={resultId} htmlFor={fieldId} className={`${styles.result} ${result && !result.ok ? styles.error : ""}`} aria-live="polite">
          {result ? (result.ok ? <span className="mono">= {result.text}</span> : result.text) : ""}
        </output>
      </form>
    </details>
  );
}
