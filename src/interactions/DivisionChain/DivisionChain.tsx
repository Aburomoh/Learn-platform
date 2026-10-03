"use client";

import { useId, useState } from "react";
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
  /** Number of completed steps. The active column is `stepIndex`; `steps.length` means done. */
  stepIndex: number;
  /** Practice mode: called with the student's quotient and remainder for the active step. */
  onStep?: (quotient: number, remainder: number) => void;
  /** Feedback for the last submitted step. */
  state?: "idle" | "incorrect";
  disabled?: boolean;
  /** Show LSB / MSB labels and the reading direction under the remainders. */
  showOrder?: boolean;
  /** Column index to outline (explanations). */
  attention?: number;
}

/**
 * Repeated division by 2 in the layout used in class: a row of numbers, a row of remainders.
 * Each step the student writes the next number (the quotient) and the remainder under the
 * current one, then checks that single step. Columns appear one at a time so the length of the
 * chain is not given away.
 */
export function DivisionChain({ id, steps, stepIndex, onStep, state = "idle", disabled = false, showOrder = false, attention }: DivisionChainProps) {
  const [quotient, setQuotient] = useState("");
  const [remainder, setRemainder] = useState("");
  const qId = useId();
  const rId = useId();
  const done = stepIndex >= steps.length;
  const interactive = !!onStep && !done && !disabled;
  const active = steps[Math.min(stepIndex, steps.length - 1)];
  const shown = steps.slice(0, Math.min(stepIndex + 1, steps.length));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!interactive || quotient === "" || remainder === "") return;
    onStep(Number(quotient), Number(remainder));
  }

  const onlyDigits = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);

  return (
    <form className={styles.root} onSubmit={submit} data-diagram={id} aria-label="Repeated division by 2">
      <div className={styles.scroll}>
        <table className={styles.table}>
          <tbody>
            <tr>
              <th scope="row" className={styles.rowLabel}>
                ÷ 2
              </th>
              {shown.map((s, j) => (
                <td key={j} className={`${styles.cell} ${styles.number} ${j === stepIndex && !done ? styles.active : ""} ${attention === j ? styles.attention : ""}`} {...focusTarget(j === stepIndex && !done ? "div-active" : `div-col-${j}`)}>
                  <span className="mono">{s.dividend}</span>
                </td>
              ))}
              {/* next number: the quotient of the active step, or the final 0 */}
              {done ? (
                <td className={`${styles.cell} ${styles.number} ${styles.stop}`} {...focusTarget("div-zero")}>
                  <span className="mono">0</span>
                </td>
              ) : (
                <td className={`${styles.cell} ${styles.number}`}>
                  {interactive ? (
                    <>
                      <label htmlFor={qId} className="sr-only">
                        {active.dividend} divided by 2: result
                      </label>
                      <input
                        id={qId}
                        className={`${styles.input} ${state === "incorrect" ? styles.wrong : ""} mono`}
                        inputMode="numeric"
                        autoComplete="off"
                        value={quotient}
                        onChange={(e) => setQuotient(onlyDigits(e.target.value, 3))}
                        {...focusTarget("div-quotient")}
                      />
                    </>
                  ) : (
                    <span className={styles.unknown}>?</span>
                  )}
                </td>
              )}
            </tr>
            <tr {...focusTarget("div-remainders")}>
              <th scope="row" className={styles.rowLabel}>
                remainder
              </th>
              {shown.map((s, j) => (
                <td key={j} className={`${styles.cell} ${styles.rem} ${attention === j ? styles.attention : ""}`}>
                  {j < stepIndex ? (
                    <span className="mono">{s.remainder}</span>
                  ) : interactive ? (
                    <>
                      <label htmlFor={rId} className="sr-only">
                        {active.dividend} divided by 2: remainder
                      </label>
                      <input
                        id={rId}
                        className={`${styles.input} ${state === "incorrect" ? styles.wrong : ""} mono`}
                        inputMode="numeric"
                        autoComplete="off"
                        value={remainder}
                        onChange={(e) => setRemainder(onlyDigits(e.target.value, 1))}
                        {...focusTarget("div-remainder")}
                      />
                    </>
                  ) : (
                    <span className={styles.unknown}>?</span>
                  )}
                </td>
              ))}
              <td className={styles.cell} aria-hidden="true" />
            </tr>
            {showOrder && done && (
              <tr className={styles.orderRow}>
                <th scope="row" className={styles.rowLabel} />
                {shown.map((_, j) => (
                  <td key={j} className={styles.order}>
                    {j === 0 ? "LSB" : j === shown.length - 1 ? "MSB" : ""}
                  </td>
                ))}
                <td />
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {showOrder && done && (
        <p className={styles.read} {...focusTarget("div-read")}>
          Read the remainders from <strong>MSB</strong> (last) back to <strong>LSB</strong> (first): ←
        </p>
      )}
      {interactive && (
        <div className={styles.actions}>
          <span className={styles.ask}>
            {active.dividend} ÷ 2 = <em>number on top</em>, remainder <em>underneath</em>
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
