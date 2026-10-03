"use client";

import { useEffect, useRef, useState } from "react";
import type { AnswerState } from "../shared/types";
import { focusTarget } from "../shared/types";
import styles from "./BitRow.module.css";

export interface BitRowProps {
  id: string;
  /** The source bits, most significant first; each gets a cell. */
  bits: string;
  /** Short label for the source row, e.g. "Number". */
  sourceLabel?: string;
  /** Short label for the answer row, e.g. "1's complement". */
  answerLabel?: string;
  /** Practice mode: called with the student's bits (one per cell) on Check. */
  onAnswer?: (text: string) => void;
  /** Visual state of the last submitted answer. */
  state?: AnswerState;
  /** After a wrong check: the cell to point at, 0-based from the left. */
  wrongBit?: number;
  disabled?: boolean;
  /** Read-only mode: the answer bits to show (explanations); with `revealed`, only the first few. */
  answer?: string;
  /** Read-only mode: how many answer cells, from the left, are filled in. Default: all. */
  revealed?: number;
  /** Column to outline (explanations). */
  attention?: number;
  /** Source row only, no answer cells (a worked value shown above another question). */
  sourceOnly?: boolean;
}

/**
 * A binary number in aligned cells with one answer cell under each bit, as the slides draw a
 * bit-by-bit operation such as the 1's complement. The whole row is one answer: the student fills
 * every cell and checks once. After a wrong check the first wrong cell is pointed at and the
 * cells already typed are kept. The component never grades.
 */
export function BitRow({ id, bits, sourceLabel = "Number", answerLabel = "Your answer", onAnswer, state = "idle", wrongBit, disabled = false, answer, revealed, attention, sourceOnly = false }: BitRowProps) {
  const n = bits.length;
  const [cells, setCells] = useState<string[]>(() => Array.from({ length: n }, () => ""));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const interactive = !!onAnswer && !disabled;
  const complete = cells.every((c) => c !== "");
  const pointAt = state === "incorrect" ? wrongBit : undefined;

  // After a wrong check, put the cursor in the cell the tutor is pointing at.
  useEffect(() => {
    if (pointAt === undefined || !interactive) return;
    inputs.current[pointAt]?.focus();
    inputs.current[pointAt]?.select();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when a new cell is pointed at
  }, [pointAt]);

  const focusCell = (i: number) => inputs.current[Math.min(Math.max(i, 0), n - 1)]?.focus();
  const setCell = (i: number, value: string) => setCells((c) => c.map((x, k) => (k === i ? value : x)));

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>, i: number) {
    // A 0 or 1 always replaces the cell and moves on, even when the cell already holds that digit.
    if ((e.key === "0" || e.key === "1") && !e.ctrlKey && !e.metaKey && !e.altKey) {
      setCell(i, e.key);
      if (i < n - 1) focusCell(i + 1);
    } else if (e.key === "ArrowLeft") focusCell(i - 1);
    else if (e.key === "ArrowRight") focusCell(i + 1);
    else if (e.key === "Backspace" && cells[i] === "") {
      setCell(i - 1, "");
      focusCell(i - 1);
    } else return;
    e.preventDefault();
  }

  const stateClass = state === "correct" ? styles.correct : "";
  const shown = answer === undefined ? undefined : [...answer].map((bit, i) => (i < (revealed ?? n) ? bit : ""));

  return (
    <form
      className={styles.root}
      data-diagram={id}
      aria-label={`${answerLabel}, one bit under each bit of ${bits}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (interactive && complete) onAnswer(cells.join(""));
      }}
    >
      <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${n}, minmax(24px, 44px))` }} {...focusTarget("bit-row")}>
        {attention !== undefined && <span className={styles.attention} style={{ gridRow: "2 / span 3", gridColumn: attention + 1 }} aria-hidden="true" />}
        <span className={styles.rowLabel} style={{ gridRow: 1, gridColumn: "1 / -1" }}>
          {sourceLabel}
        </span>
        {[...bits].map((bit, i) => (
          <span key={`s-${i}`} className={`${styles.cell} ${styles.source} mono`} style={{ gridRow: 2, gridColumn: i + 1 }} {...focusTarget(`bit-source-${i}`)}>
            {bit}
          </span>
        ))}
        {!sourceOnly && (
          <>
            <span className={styles.rowLabel} style={{ gridRow: 3, gridColumn: "1 / -1" }}>
              {answerLabel}
            </span>
            {[...bits].map((bit, i) =>
              shown ? (
                <span key={`a-${i}`} className={`${styles.cell} ${styles.answer} ${shown[i] === "" ? styles.unknown : ""} mono`} style={{ gridRow: 4, gridColumn: i + 1 }} {...focusTarget(`bit-cell-${i}`)}>
                  {shown[i] === "" ? "?" : shown[i]}
                </span>
              ) : (
                <span key={`a-${i}`} className={`${styles.cell} ${styles.answer}`} style={{ gridRow: 4, gridColumn: i + 1 }} {...focusTarget(`bit-cell-${i}`)}>
                  <input
                    ref={(el) => {
                      inputs.current[i] = el;
                    }}
                    className={`${styles.input} ${pointAt === i ? styles.wrong : ""} ${stateClass} mono`}
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={1}
                    disabled={!interactive}
                    aria-label={`Bit ${i + 1} of ${n}, under ${bit}`}
                    aria-invalid={pointAt === i || undefined}
                    value={cells[i]}
                    // onInput, not onChange: React skips onChange when the same digit is typed over a
                    // filled cell, and the cursor must still move on (#151).
                    onInput={(e) => {
                      const value = e.currentTarget.value.replace(/[^01]/g, "").slice(-1);
                      setCell(i, value);
                      if (value !== "" && i < n - 1) focusCell(i + 1);
                    }}
                    onChange={() => {}}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => onKeyDown(e, i)}
                  />
                </span>
              ),
            )}
          </>
        )}
      </div>
      {onAnswer && !sourceOnly && (
        <div className={styles.actions}>
          <button type="submit" className="btn btn-primary" disabled={!interactive || !complete}>
            Check
          </button>
        </div>
      )}
    </form>
  );
}
