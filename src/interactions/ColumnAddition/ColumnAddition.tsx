"use client";

import { useEffect, useId, useRef, useState } from "react";
import { focusTarget } from "../shared/types";
import styles from "./ColumnAddition.module.css";

/** One step of the addition: a column (right to left), or the final carry brought down. */
export interface AdditionColumn {
  a: 0 | 1;
  b: 0 | 1;
  carryIn: 0 | 1;
  sum: 0 | 1;
  carryOut: 0 | 1;
  /** Last step: no operand bits; the carry out of the leftmost column becomes the extra bit. */
  final: boolean;
}

export interface ColumnAdditionProps {
  id: string;
  /** Operands, most significant bit first, equal width. */
  a: string;
  b: string;
  /** Every step, rightmost column first, the final carry step last (from the step contract). */
  columns: AdditionColumn[];
  /** Number of completed steps. The active column is `stepIndex`; `columns.length` means done. */
  stepIndex: number;
  /** Practice mode: called with the sum bit and, except on the final step, the carry. */
  onStep?: (sum: number, carry?: number) => void;
  /** Feedback for the last submitted step. */
  state?: "idle" | "incorrect";
  disabled?: boolean;
  /** Step index to outline (explanations). */
  attention?: number;
}

const ORDINAL = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth"];

/**
 * Binary addition written the school way and done one column at a time, right to left: for the
 * active column the student writes the sum bit under the line and the carry above the next column,
 * then checks that single step. The carry row is a scaffold added to the slide's layout. Columns
 * not reached yet show only the given bits; the final carry is brought down as its own last step.
 */
export function ColumnAddition({ id, a, b, columns, stepIndex, onStep, state = "idle", disabled = false, attention }: ColumnAdditionProps) {
  const [sum, setSum] = useState("");
  const [carry, setCarry] = useState("");
  const sumId = useId();
  const carryId = useId();
  const sumRef = useRef<HTMLInputElement>(null);
  const width = a.length;
  const done = stepIndex >= columns.length;
  const interactive = !!onStep && !done && !disabled;
  const active = columns[Math.min(stepIndex, columns.length - 1)];
  const needsCarry = !active.final;
  const wrong = state === "incorrect" ? styles.wrong : "";

  // Grid: column 1 holds the "+" sign; step c (0 = rightmost) sits in grid column width + 2 - c.
  const col = (step: number) => width + 2 - step;
  const at = (row: number, step: number): React.CSSProperties => ({ gridRow: row, gridColumn: col(step) });

  // Remounted on each step: carry keyboard focus to the new column.
  useEffect(() => {
    if (interactive && stepIndex > 0) sumRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount only
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!interactive || sum === "" || (needsCarry && carry === "")) return;
    onStep(Number(sum), needsCarry ? Number(carry) : undefined);
  }

  const name = active.final ? "the final carry" : `the ${ORDINAL[stepIndex] ?? `${stepIndex + 1}th`} column from the right`;
  const terms = active.final ? "" : `${active.a} + ${active.b}${active.carryIn ? " + carry 1" : ""}`;

  return (
    <form className={styles.root} onSubmit={submit} data-diagram={id} aria-label="Binary addition, one column at a time">
      <div className={styles.grid} style={{ gridTemplateColumns: `auto repeat(${width + 1}, var(--cell))` }}>
        {!done && <span className={styles.halo} style={{ gridRow: "1 / span 5", gridColumn: col(stepIndex) }} aria-hidden="true" />}
        {attention !== undefined && <span className={styles.attention} style={{ gridRow: "1 / span 5", gridColumn: col(attention) }} aria-hidden="true" />}

        {/* row 1: carries. The carry out of step c is written above step c + 1 once c is done. */}
        {columns.slice(1).map((c, k) => {
          const step = k + 1;
          if (step > stepIndex) return null;
          return (
            <span key={`carry-${step}`} className={`${styles.cell} ${styles.carry} mono`} style={at(1, step)} {...focusTarget(`add-carry-${step}`)}>
              <span className="sr-only">carry </span>
              {c.carryIn}
            </span>
          );
        })}

        {/* rows 2 and 3: the operands */}
        {[...a].map((bit, i) => (
          <span key={`a-${i}`} className={`${styles.cell} mono`} style={at(2, width - 1 - i)}>
            {bit}
          </span>
        ))}
        <span className={styles.sign} style={{ gridRow: 3, gridColumn: 1 }} aria-label="plus">
          +
        </span>
        {[...b].map((bit, i) => (
          <span key={`b-${i}`} className={`${styles.cell} mono`} style={at(3, width - 1 - i)}>
            {bit}
          </span>
        ))}
        <span className={styles.line} style={{ gridRow: 4, gridColumn: `1 / span ${width + 2}` }} aria-hidden="true" />

        {/* row 5: sum bits of the completed steps */}
        {columns.map((c, step) =>
          step < stepIndex ? (
            <span key={`sum-${step}`} className={`${styles.cell} ${styles.sum} mono`} style={at(5, step)} {...focusTarget(`add-sum-${step}`)}>
              {c.sum}
            </span>
          ) : null,
        )}

        {/* the active step: sum bit under the line, carry above the next column */}
        {!done &&
          (interactive ? (
            <>
              <span className={styles.cell} style={at(5, stepIndex)}>
                <label htmlFor={sumId} className="sr-only">
                  {active.final ? "Final carry: bit to bring down" : `${name}, ${terms}: sum bit`}
                </label>
                <input
                  id={sumId}
                  ref={sumRef}
                  className={`${styles.input} ${wrong} mono`}
                  inputMode="numeric"
                  autoComplete="off"
                  value={sum}
                  onChange={(e) => setSum(e.target.value.replace(/[^0-3]/g, "").slice(0, 1))}
                  {...focusTarget("add-sum")}
                />
              </span>
              {needsCarry && (
                <span className={`${styles.cell} ${styles.carry}`} style={at(1, stepIndex + 1)}>
                  <label htmlFor={carryId} className="sr-only">
                    {name}: carry to the next column
                  </label>
                  <input
                    id={carryId}
                    className={`${styles.input} ${styles.carryInput} ${wrong} mono`}
                    inputMode="numeric"
                    autoComplete="off"
                    value={carry}
                    onChange={(e) => setCarry(e.target.value.replace(/[^01]/g, "").slice(0, 1))}
                    {...focusTarget("add-carry")}
                  />
                </span>
              )}
            </>
          ) : (
            <span className={`${styles.cell} ${styles.unknown}`} style={at(5, stepIndex)}>
              ?
            </span>
          ))}
      </div>

      {interactive && (
        <div className={styles.actions}>
          <span className={styles.ask}>
            {active.final ? (
              <>Bring the last carry down as the leftmost bit.</>
            ) : (
              <>
                {terms}: write the <em>sum bit below the line</em> and the <em>carry above the next column</em>
              </>
            )}
          </span>
          <button type="submit" className="btn btn-primary" disabled={sum === "" || (needsCarry && carry === "")}>
            Check step
          </button>
        </div>
      )}
      {done && (
        <p className={styles.result} {...focusTarget("add-result")}>
          <span className="mono">{a}</span> + <span className="mono">{b}</span> = <strong className="mono">{[...columns].reverse().map((c) => c.sum).join("")}</strong>
        </p>
      )}
    </form>
  );
}
