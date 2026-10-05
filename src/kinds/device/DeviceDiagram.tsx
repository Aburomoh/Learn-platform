"use client";

import { useState } from "react";
import { focusTarget, type AnswerState } from "@/interactions/shared/types";
import { DeviceFigure } from "../shared/figures/DeviceFigure";
import styles from "./DeviceDiagram.module.css";

export interface DeviceDiagramProps {
  id: string;
  device: "decoder" | "encoder" | "mux";
  /** Code width: 1 to 3. */
  bits: number;
  /** Code-bit names, MSB first (S1 S0, or x y z). */
  names: string[];
  /** What is given: the input code (decoder), the active input (encoder) or the select value (mux). */
  ask: number;
  /** mux: a level printed on each data input. */
  data?: (0 | 1)[];
  /** The right pick, drawn in the signal colour once it has been answered (or in Explain Slowly). */
  revealed?: number;
  /** Name of a pick as shown on its chip: D5, 101, I2. */
  pickName: (pick: number) => string;
  state?: AnswerState;
  disabled?: boolean;
  /** Practice: the picked line (decoder output, mux input) or code value (encoder). */
  onCheck?: (pick: number) => void;
}

/**
 * A decoder, encoder or multiplexer question (#198 §8): the shared block figure, and under it the
 * chips the student picks a line from (tapping the line on the figure picks it too). After the
 * answer the picked line or path is drawn in the signal colour. The component never grades.
 */
export function DeviceDiagram({ id, device, bits, names, ask, data, revealed, pickName, state = "idle", disabled = false, onCheck }: DeviceDiagramProps) {
  const size = 2 ** bits;
  const [picked, setPicked] = useState<number | null>(null);
  const editing = !!onCheck && !disabled && revealed === undefined && state !== "correct";
  const options = Array.from({ length: size }, (_, k) => k);

  return (
    <div className={styles.root} data-diagram={id}>
      <DeviceFigure device={device} bits={bits} names={names} ask={ask} data={data} revealed={revealed} pickName={pickName} picked={editing ? picked : null} onPick={editing && device !== "encoder" ? setPicked : undefined} />
      {onCheck && revealed === undefined && (
        <form
          className={styles.answer}
          onSubmit={(e) => {
            e.preventDefault();
            if (editing && picked !== null) onCheck(picked);
          }}
        >
          <fieldset className={styles.chips} role="radiogroup" aria-label={device === "decoder" ? "Which output is 1?" : device === "encoder" ? "Output code" : "Which input reaches Y?"} aria-invalid={state === "incorrect" || undefined}>
            {options.map((k) => (
              <label key={k} className={`${styles.chip} ${picked === k ? styles.chipOn : ""} mono`}>
                <input type="radio" name={`${id}-pick`} value={k} checked={picked === k} disabled={!editing} onChange={() => setPicked(k)} {...focusTarget(`pick-${k}`)} />
                {pickName(k)}
              </label>
            ))}
          </fieldset>
          <button type="submit" className="btn btn-primary" disabled={!editing || picked === null}>
            Check
          </button>
        </form>
      )}
    </div>
  );
}
