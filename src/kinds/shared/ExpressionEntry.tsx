"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { BooleanParseError, parseBool, type BoolExpr } from "@/content/boolean";
import { focusTarget, type AnswerState } from "@/interactions/shared/types";
import styles from "./ExpressionEntry.module.css";

export interface ExpressionEntryProps {
  id: string;
  /** Accessible name of the field, e.g. the question's prompt. */
  label: string;
  /** The variables the question uses, shown as keys. */
  vars: string[];
  /**
   * Which operator keys the key row offers. `product`: only the prime, for an answer that is a
   * single product of literals (a K-map group's term). Typing is not restricted.
   */
  keys?: "all" | "product";
  onAnswer?: (text: string) => void;
  state?: AnswerState;
  /** Last submitted text, kept in the field. */
  submittedText?: string;
  disabled?: boolean;
  /** Read-only: show this expression (Explain Slowly). */
  shown?: string;
}

const OPERATORS: { key: string; insert: string; label: string }[] = [
  { key: "'", insert: "'", label: "complement (NOT)" },
  { key: "+", insert: " + ", label: "OR" },
  { key: "⊕", insert: " ⊕ ", label: "XOR" },
  { key: "(", insert: "(", label: "open parenthesis" },
  { key: ")", insert: ")", label: "close parenthesis" },
];

/** Course notation drawn as on the instructor's slides: a complement is an overbar, AND is juxtaposition. */
export function renderBool(e: BoolExpr): ReactNode {
  const prec = (x: BoolExpr) => (x.type === "or" ? 1 : x.type === "xor" ? 2 : x.type === "and" ? 3 : 4);
  const wrap = (x: BoolExpr, min: number, key: number): ReactNode => (prec(x) < min ? <span key={key}>({renderBool(x)})</span> : <span key={key}>{renderBool(x)}</span>);
  switch (e.type) {
    case "const":
      return String(e.value);
    case "var":
      return e.name;
    case "not":
      // the bar covers the whole operand, so (A + B)' reads as one bar over A + B
      return <span className={styles.bar}>{renderBool(e.arg)}</span>;
    case "and":
      return e.args.map((a, i) => wrap(a, 4, i));
    case "xor":
      return e.args.flatMap((a, i) => (i ? [<span key={`op${i}`}> ⊕ </span>, wrap(a, 3, i)] : [wrap(a, 3, i)]));
    case "or":
      return e.args.flatMap((a, i) => (i ? [<span key={`op${i}`}> + </span>, wrap(a, 2, i)] : [wrap(a, 2, i)]));
  }
}

function preview(text: string, vars: string[]): ReactNode | null {
  if (!text.trim()) return null;
  try {
    return renderBool(parseBool(text, { vars }));
  } catch (err) {
    if (err instanceof BooleanParseError) return null;
    throw err;
  }
}

/**
 * Boolean expression entry (#198 §3). Students type the prime (any keyboard); a key row with the
 * question's variables and the operators helps on phones; "Reads as" draws the overbar as on the
 * slides. The component never grades: Check sends the text.
 */
export function ExpressionEntry({ id, label, vars, keys = "all", onAnswer, state = "idle", submittedText, disabled = false, shown }: ExpressionEntryProps) {
  const [text, setText] = useState(submittedText ?? "");
  const field = useRef<HTMLInputElement>(null);
  const previewId = useId();
  const readOnly = shown !== undefined || !onAnswer;
  const value = shown ?? text;
  const reads = preview(value, vars);

  /** Inserts at the cursor (or replaces the selection) and keeps the field focused. */
  const insert = (s: string) => {
    const el = field.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const next = text.slice(0, start) + s + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + s.length, start + s.length);
    });
  };
  const backspace = () => {
    const el = field.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const from = start === end ? Math.max(0, start - 1) : start;
    setText(text.slice(0, from) + text.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(from, from);
    });
  };

  const stateClass = state === "correct" ? styles.correct : state === "incorrect" ? styles.incorrect : "";
  return (
    <form
      className={styles.root}
      data-diagram={id}
      onSubmit={(e) => {
        e.preventDefault();
        if (!readOnly && !disabled && text.trim()) onAnswer!(text.trim());
      }}
    >
      <div className={styles.well}>
        <input
          ref={field}
          className={`${styles.field} ${stateClass} mono`}
          aria-label={label}
          aria-describedby={previewId}
          aria-invalid={state === "incorrect" || undefined}
          value={value}
          readOnly={readOnly}
          disabled={disabled}
          autoComplete="off"
          // no auto-capitals: questions in x y z must not get X Y Z from a phone keyboard
          autoCapitalize="none"
          spellCheck={false}
          onChange={(e) => setText(e.target.value)}
          {...focusTarget("expression")}
        />
        <p id={previewId} className={styles.reads}>
          Reads as: <span className={`${styles.math} mono`}>{reads ?? (value.trim() ? "…" : "")}</span>
        </p>
        {!readOnly && (
          <div className={styles.keys} role="group" aria-label="Expression keys">
            {vars.map((v) => (
              <button key={v} type="button" className={styles.key} disabled={disabled} onClick={() => insert(v)}>
                {v}
              </button>
            ))}
            {OPERATORS.filter((o) => keys === "all" || o.key === "'").map((o) => (
              <button key={o.key} type="button" className={`${styles.key} ${styles.op}`} aria-label={o.label} disabled={disabled} onClick={() => insert(o.insert)}>
                {o.key}
              </button>
            ))}
            <button type="button" className={`${styles.key} ${styles.op}`} aria-label="delete" disabled={disabled} onClick={backspace}>
              ⌫
            </button>
          </div>
        )}
      </div>
      {!readOnly && (
        <div className={styles.actions}>
          <button type="submit" className="btn btn-primary" disabled={disabled || !text.trim()}>
            Check
          </button>
        </div>
      )}
    </form>
  );
}
