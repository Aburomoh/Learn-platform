"use client";

import { useEffect, useId, useRef, useState } from "react";
import { focusTarget } from "../shared/types";
import styles from "./DivisionChain.module.css";

export interface ChainStep {
  dividend: number;
  quotient: number;
  remainder: 0 | 1;
}

export interface DivisionChainProps {
  id: string;
  /** The full authored chain. Only completed steps and the active one are shown. */
  steps: ChainStep[];
  /** Number of completed steps. The active row is `stepIndex`; `steps.length` means done. */
  stepIndex: number;
  /** Practice mode: called with the student's quotient and remainder for the active step. */
  onStep?: (quotient: number, remainder: number) => void;
  /** Feedback for the last submitted step. */
  state?: "idle" | "incorrect";
  disabled?: boolean;
  /** Show LSB / MSB labels and the reading direction beside the remainders. */
  showOrder?: boolean;
  /** Row index to outline (explanations). */
  attention?: number;
}

/** Grid placement: column 1 = divisor, 2 = number, 3 = remainder, 4 = LSB/MSB, 5 = reading arrow. */
const at = (row: number, column: number, span = 1): React.CSSProperties => ({ gridRow: `${row} / span ${span}`, gridColumn: column });

/**
 * Repeated division by 2 as the vertical ladder drawn in class: the numbers go down the page,
 * each remainder sits beside its number, and the remainders are read from the bottom (MSB) up
 * to the top (LSB). Each step the student writes the result in the next row down and the
 * remainder beside the current number, then checks that single step. Rows appear one at a time
 * so the length of the chain is not given away.
 */
export function DivisionChain({ id, steps, stepIndex, onStep, state = "idle", disabled = false, showOrder = false, attention }: DivisionChainProps) {
  const [quotient, setQuotient] = useState("");
  const [remainder, setRemainder] = useState("");
  const qId = useId();
  const rId = useId();
  const quotientRef = useRef<HTMLInputElement>(null);
  const done = stepIndex >= steps.length;
  const interactive = !!onStep && !done && !disabled;
  const active = steps[Math.min(stepIndex, steps.length - 1)];
  const shown = steps.slice(0, Math.min(stepIndex + 1, steps.length));
  const ordered = showOrder && done;

  // The component is remounted on each step: carry keyboard focus to the new step's first input.
  useEffect(() => {
    if (interactive && stepIndex > 0) quotientRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount only
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!interactive || quotient === "" || remainder === "") return;
    onStep(Number(quotient), Number(remainder));
  }

  const onlyDigits = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);
  const wrong = state === "incorrect" ? styles.wrong : "";

  return (
    <form className={styles.root} onSubmit={submit} data-diagram={id} aria-label="Repeated division by 2">
      <div className={styles.ladder}>
        {/* highlight target behind the whole remainder column */}
        <span className={styles.remColumn} style={at(1, 3, shown.length)} aria-hidden="true" {...focusTarget("div-remainders")} />
        {/* the halo covers both cells being filled: the remainder beside the number and the result below it */}
        {!done && <span className={styles.halo} style={{ gridRow: stepIndex + 1, gridColumn: "1 / span 3" }} aria-hidden="true" />}
        {!done && <span className={`${styles.halo} ${styles.haloBelow}`} style={{ gridRow: stepIndex + 2, gridColumn: 2 }} aria-hidden="true" data-halo="result" />}

        {shown.map((s, j) => {
          const isActive = j === stepIndex && !done;
          const outline = attention === j ? styles.attention : "";
          return (
            <span key={j} className={styles.row}>
              <span className={styles.divisor} style={at(j + 1, 1)} aria-hidden="true">
                2
              </span>
              <span className={`${styles.cell} ${styles.number} ${isActive ? styles.active : ""} ${outline} mono`} style={at(j + 1, 2)} {...focusTarget(isActive ? "div-active" : `div-col-${j}`)}>
                {s.dividend}
              </span>
              {!isActive && (
                <span className={`${styles.cell} ${styles.rem} ${outline} mono`} style={at(j + 1, 3)}>
                  <span className="sr-only">remainder </span>
                  {s.remainder}
                </span>
              )}
            </span>
          );
        })}

        {/* the active step: result in the next row down, remainder beside the current number */}
        {!done &&
          (interactive ? (
            <>
              <span className={`${styles.cell} ${styles.number} ${styles.next}`} style={at(stepIndex + 2, 2)}>
                <label htmlFor={qId} className="sr-only">
                  {active.dividend} divided by 2: result
                </label>
                <input
                  id={qId}
                  ref={quotientRef}
                  className={`${styles.input} ${wrong} mono`}
                  inputMode="numeric"
                  autoComplete="off"
                  value={quotient}
                  onChange={(e) => setQuotient(onlyDigits(e.target.value, 3))}
                  {...focusTarget("div-quotient")}
                />
              </span>
              <span className={`${styles.cell} ${styles.rem}`} style={at(stepIndex + 1, 3)}>
                <label htmlFor={rId} className="sr-only">
                  {active.dividend} divided by 2: remainder
                </label>
                <input
                  id={rId}
                  className={`${styles.input} ${wrong} mono`}
                  inputMode="numeric"
                  autoComplete="off"
                  value={remainder}
                  onChange={(e) => setRemainder(onlyDigits(e.target.value, 1))}
                  {...focusTarget("div-remainder")}
                />
              </span>
            </>
          ) : (
            <>
              <span className={`${styles.cell} ${styles.number} ${styles.next} ${styles.unknown}`} style={at(stepIndex + 2, 2)}>
                ?
              </span>
              <span className={`${styles.cell} ${styles.rem} ${styles.unknown}`} style={at(stepIndex + 1, 3)}>
                ?
              </span>
            </>
          ))}

        {done && (
          <span className={`${styles.cell} ${styles.number} ${styles.stop} mono`} style={at(shown.length + 1, 2)} {...focusTarget("div-zero")}>
            0
          </span>
        )}

        {ordered && (
          <>
            <span className={styles.order} style={at(1, 4)}>
              ← LSB
            </span>
            {shown.length > 1 && (
              <span className={styles.order} style={at(shown.length, 4)}>
                ← MSB
              </span>
            )}
            <span className={styles.readArrow} style={at(1, 5, shown.length)} aria-hidden="true" />
          </>
        )}
      </div>

      {ordered && (
        <p className={styles.read} {...focusTarget("div-read")}>
          Read the remainders upwards: from <strong>MSB</strong> (bottom) to <strong>LSB</strong> (top).
        </p>
      )}
      {interactive && (
        <div className={styles.actions}>
          <span className={styles.ask}>
            {active.dividend} ÷ 2: write the <em>result below</em> and the <em>remainder beside it</em>
          </span>
          <button type="submit" className="btn btn-primary" disabled={quotient === "" || remainder === ""}>
            Check step
          </button>
        </div>
      )}
      {done && !showOrder && <p className={styles.read}>The result reached 0, so the division stops.</p>}
    </form>
  );
}
