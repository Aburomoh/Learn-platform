"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { focusTarget, type AnswerState } from "@/interactions/shared/types";
import { useScrollFade } from "@/interactions/shared/useScrollFade";
import styles from "./WeightDiagram.module.css";

export interface WeightDigit {
  digit: string;
  /** The digit's value (A = 10 … F = 15). */
  value: number;
  power: number;
  /** Exact decimal term, digit × base^power, e.g. "0.125". */
  term: string;
}

export interface WeightDiagramProps {
  id: string;
  base: number;
  /** The number as written, with its point: "101.101". */
  number: string;
  digits: WeightDigit[];
  /** Goals done so far: 0 = weights, 1 = terms, 2 = sum, 3 = finished. */
  stepIndex: number;
  /** The exact value, shown once the sum is done. */
  value: string;
  state?: AnswerState;
  /** After a wrong check: the first wrong digit's column (weights or terms), marked alone. */
  wrongIndex?: number;
  disabled?: boolean;
  /** Practice: the goal's entries on Check (powers as text, terms or the sum). */
  onCheck?: (entries: string[]) => void;
}

/** "−3" or "-3" → "-3": students may type the true minus sign. */
export const normaliseMinus = (s: string) => s.trim().replace(/[−–]/g, "-");

/**
 * The slides' weight diagram (Ch.1 s.9, 12, 18, 26): the number's digits in a row around the
 * point, each with its weight base^power and its term digit × weight under it, then the sum.
 * One goal at a time (ADR-0007): the powers, then the terms, then the sum; done rows show their
 * values, later ones are dim. The component never grades.
 */
export function WeightDiagram({ id, base, number, digits, stepIndex, value, state = "idle", wrongIndex, disabled = false, onCheck }: WeightDiagramProps) {
  const n = digits.length;
  const pointAt = digits.findIndex((d) => d.power === -1);
  const goalCells = stepIndex === 2 ? 1 : n;
  const [entries, setEntries] = useState<string[]>(() => Array.from({ length: goalCells }, () => ""));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const well = useRef<HTMLDivElement>(null);
  const fade = useScrollFade(well);
  const editing = !!onCheck && !disabled && stepIndex < 3 && state !== "correct";
  const pointed = state === "incorrect" && stepIndex < 2 ? wrongIndex : undefined;

  useEffect(() => {
    if (pointed === undefined || !editing) return;
    inputs.current[pointed]?.focus();
    inputs.current[pointed]?.select();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when a new cell is pointed at
  }, [pointed]);

  const set = (i: number, v: string) => setEntries((e) => e.map((x, k) => (k === i ? v : x)));
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key === "ArrowRight" && e.currentTarget.selectionStart === e.currentTarget.value.length) inputs.current[i + 1]?.focus();
    else if (e.key === "ArrowLeft" && e.currentTarget.selectionStart === 0) inputs.current[i - 1]?.focus();
    else return;
    e.preventDefault();
  };
  const field = (i: number, label: string, wide = false) => (
    <input
      ref={(el) => {
        inputs.current[i] = el;
      }}
      className={`${styles.input} ${wide ? styles.wide : ""} ${pointed === i ? styles.wrong : ""} mono`}
      aria-label={label}
      aria-invalid={pointed === i || undefined}
      value={entries[i]}
      disabled={!editing}
      inputMode={stepIndex === 0 ? "text" : "decimal"}
      autoComplete="off"
      spellCheck={false}
      onChange={(e) => set(i, e.target.value)}
      onKeyDown={(e) => onKeyDown(e, i)}
      {...focusTarget(`weight-cell-${i}`)}
    />
  );
  const rowState = (row: number) => (row < stepIndex ? "done" : row === stepIndex ? "now" : "later");
  // grid columns: one per digit, plus a narrow one for the point
  const col = (i: number) => i + 1 + (pointAt >= 0 && i >= pointAt ? 1 : 0);
  const complete = entries.every((e) => e.trim() !== "");

  return (
    <form
      className={styles.root}
      data-diagram={id}
      aria-label={`${number} in base ${base}, by place value`}
      onSubmit={(e) => {
        e.preventDefault();
        if (editing && complete) onCheck!(entries.map(normaliseMinus));
      }}
    >
      <div ref={well} className={styles.well} data-fade={fade}>
        <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${n + (pointAt >= 0 ? 1 : 0)}, auto)` }}>
          {digits.map((d, i) => (
            <span key={`d${i}`} className={`${styles.digit} mono`} style={{ gridColumn: col(i), gridRow: 1 }} {...focusTarget(`digit-${i}`)}>
              {d.digit}
            </span>
          ))}
          {pointAt >= 0 && (
            <span className={`${styles.point} mono`} style={{ gridColumn: pointAt + 1, gridRow: 1 }} aria-label="point">
              •
            </span>
          )}
          {digits.map((d, i) => (
            <span key={`w${i}`} className={styles.cell} data-state={rowState(0)} style={{ gridColumn: col(i), gridRow: 2 }}>
              {rowState(0) === "now" && editing ? (
                <span className={`${styles.power} mono`}>
                  {base}
                  <sup>{field(i, `Power under digit ${i + 1} (${d.digit})`)}</sup>
                </span>
              ) : rowState(0) === "later" ? (
                ""
              ) : (
                <span className="mono">
                  {base}
                  <sup>{d.power}</sup>
                </span>
              )}
            </span>
          ))}
          {digits.map((d, i) => (
            <span key={`t${i}`} className={styles.cell} data-state={rowState(1)} style={{ gridColumn: col(i), gridRow: 3 }}>
              {rowState(1) === "now" && editing ? field(i, `Value of ${d.digit} × ${base} to the ${d.power}`, true) : rowState(1) === "done" ? <span className="mono">{d.term}</span> : ""}
            </span>
          ))}
        </div>
      </div>
      <p className={styles.sum} data-state={rowState(2)}>
        <span className={styles.rowLabel}>Sum</span>
        {rowState(2) === "now" && editing ? (
          <>
            <span className="mono" aria-hidden="true">
              {digits.map((d) => d.term).join(" + ")} =
            </span>
            {field(0, "Sum in decimal", true)}
          </>
        ) : rowState(2) === "done" ? (
          <span className="mono">
            ({number})<sub>{base}</sub> = ({value})<sub>10</sub>
          </span>
        ) : (
          ""
        )}
      </p>
      {onCheck && stepIndex < 3 && (
        <div className={styles.actions}>
          <button type="submit" className="btn btn-primary" disabled={!editing || !complete}>
            {["Check weights", "Check terms", "Check sum"][stepIndex]}
          </button>
        </div>
      )}
    </form>
  );
}
