"use client";

import { DragToTarget } from "@/interactions/DragToTarget/DragToTarget";
import { focusTarget } from "@/interactions/shared/types";
import styles from "./PlaceValueDiagram.module.css";

export type Bit = 0 | 1 | null;

export interface PlaceValueDiagramProps {
  id: string;
  /** Number of slots, most significant first (6 → 32 … 1). */
  slots: number;
  digits: Bit[];
  onChange?: (digits: Bit[]) => void;
  /** Explanation mode: place values shown as lit regardless of `digits`. */
  lit?: number[];
  /** Place value currently under discussion. */
  attention?: number;
  /** Remaining value shown during explanation. */
  remainder?: number;
  readOnly?: boolean;
  /** Show the running total of lit places (practice mode). */
  showTotal?: boolean;
  onSubmit?: () => void;
  state?: "idle" | "correct" | "incorrect";
}

/**
 * Binary place-value row. Drag a "1" onto a slot to set it, tap a set slot to clear it.
 * Every slot carries data-focus-target="slot-<place>" so hints can point at it.
 */
export function PlaceValueDiagram({
  id,
  slots,
  digits,
  onChange,
  lit,
  attention,
  remainder,
  readOnly = false,
  showTotal = true,
  onSubmit,
  state = "idle",
}: PlaceValueDiagramProps) {
  const places = Array.from({ length: slots }, (_, i) => 2 ** (slots - 1 - i));
  const explain = lit !== undefined;
  const bits: Bit[] = explain ? places.map((p) => (lit.includes(p) ? 1 : 0)) : digits;
  const total = places.reduce((sum, p, i) => sum + (bits[i] === 1 ? p : 0), 0);

  function setBit(place: number, bit: Bit) {
    if (!onChange) return;
    const next = [...digits];
    next[places.indexOf(place)] = bit;
    onChange(next);
  }

  const targets = places.map((p, i) => ({ id: `slot-${p}`, label: `${p} slot`, itemId: bits[i] === 1 ? "one" : null }));

  return (
    <div className={`${styles.root} ${state === "correct" ? styles.correct : state === "incorrect" ? styles.incorrect : ""}`} data-diagram={id}>
      <DragToTarget
        id={id}
        items={[{ id: "one", label: "1", reusable: true }]}
        targets={targets}
        disabled={readOnly || explain}
        onPlace={(_, targetId) => setBit(Number(targetId.replace("slot-", "")), 1)}
        onRemove={(targetId) => setBit(Number(targetId.replace("slot-", "")), 0)}
        trayLabel="Bits"
        className={styles.drag}
        renderTarget={(t, status) => {
          const place = Number(t.id.replace("slot-", ""));
          const i = places.indexOf(place);
          const bit = bits[i];
          return (
            <div
              className={`${styles.slot} ${bit === 1 ? styles.lit : ""} ${attention === place ? styles.attention : ""} ${status.over ? styles.over : ""}`}
              {...focusTarget(`slot-${place}`)}
            >
              <span className={styles.place}>{place}</span>
              <span className={`${styles.bit} mono`} aria-hidden="true">
                {bit === 1 ? "1" : bit === 0 ? "0" : "·"}
              </span>
            </div>
          );
        }}
      />
      <div className={styles.footer}>
        {showTotal && (
          <span className={styles.total} {...focusTarget("total")} aria-live="polite">
            Total so far: <strong className="mono">{total}</strong>
          </span>
        )}
        {remainder !== undefined && (
          <span className={styles.remainder} {...focusTarget("remainder")}>
            Remaining: <strong className="mono">{remainder}</strong>
          </span>
        )}
        {onSubmit && !explain && (
          <button type="button" className="btn btn-primary" onClick={onSubmit} disabled={readOnly || digits.every((d) => d === null)}>
            Check
          </button>
        )}
      </div>
    </div>
  );
}
