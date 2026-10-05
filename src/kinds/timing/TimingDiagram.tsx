"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { focusTarget, type AnswerState } from "@/interactions/shared/types";
import { useScrollFade } from "@/interactions/shared/useScrollFade";
import styles from "./TimingDiagram.module.css";

type Bit = 0 | 1;

export interface TimingRow {
  name: string;
  /** One level per column (a column is half a clock period). */
  levels: Bit[];
}

export interface TimingDiagramProps {
  id: string;
  edge: "rising" | "falling";
  inputs: TimingRow[];
  clock: Bit[];
  /** The outputs' true levels per column; only the part already answered is drawn. */
  outputs: TimingRow[];
  /** Each output's stated initial value. */
  initial: Bit[];
  /** Column where each asked active edge starts, left to right. */
  edges: number[];
  /** Edges answered so far: the traces are drawn up to the next one. `edges.length` = finished. */
  done: number;
  state?: AnswerState;
  /** After a wrong check: the first wrong output (only it is marked). */
  wrongOutput?: number;
  disabled?: boolean;
  /** Practice: the outputs just after the active edge, one bit per output. */
  onCheck?: (q: Bit[]) => void;
}

// Geometry (§13.2): a clock period is 64 units (two columns); rows are 28 with a 20 swing, 16 apart.
const COL = 32;
const ROW = 28;
const GAP = 16;
const SWING = 20;
const TOP = 6;
const PAD = 14;

const rowTop = (r: number) => TOP + r * (ROW + GAP);
const yOf = (r: number, level: Bit) => rowTop(r) + (ROW - SWING) / 2 + (level ? 0 : SWING);

/** A square wave through `levels` for columns [0, until). */
function wave(r: number, levels: Bit[], until: number): string {
  let d = "";
  for (let c = 0; c < until; c++) {
    const y = yOf(r, levels[c]);
    d += c === 0 ? `M ${PAD} ${y}` : levels[c] !== levels[c - 1] ? ` V ${y}` : "";
    d += ` H ${PAD + (c + 1) * COL}`;
  }
  return d;
}

/**
 * A timing diagram as on the slides (#198 §6, §13.2): inputs on top, the clock in the middle,
 * outputs at the bottom, a dotted guide and a triangle at every active edge, edge numbers under
 * the diagram. One goal per active edge: the edge has the halo and a "?" on each output row; the
 * student picks 0 or 1 per output and checks; a right answer draws the trace to the next edge, a
 * wrong one draws nothing. The names column stays put while the diagram scrolls. Never grades.
 */
export function TimingDiagram({ id, edge, inputs, clock, outputs, initial, edges, done, state = "idle", wrongOutput, disabled = false, onCheck }: TimingDiagramProps) {
  const columns = clock.length;
  const rows = [...inputs.map((r) => ({ ...r, kind: "input" as const })), { name: "Clk", levels: clock, kind: "clock" as const }, ...outputs.map((r) => ({ ...r, kind: "output" as const }))];
  const outRow = (o: number) => inputs.length + 1 + o;
  const finished = done >= edges.length;
  const active = finished ? undefined : edges[done];
  const drawnUntil = active ?? columns;
  const width = PAD * 2 + columns * COL;
  const height = rowTop(rows.length) + 14;
  const editing = !!onCheck && !disabled && !finished && state !== "correct";
  const [picked, setPicked] = useState<(Bit | null)[]>(() => outputs.map(() => null));
  const complete = picked.every((p) => p !== null);

  // Keep the active edge in view, at least one period from the right edge of the well.
  const scroller = useRef<HTMLDivElement>(null);
  const fade = useScrollFade(scroller);
  useEffect(() => {
    const box = scroller.current;
    if (!box || active === undefined || box.scrollWidth <= box.clientWidth) return;
    const scale = box.scrollWidth / width;
    const x = (PAD + active * COL) * scale;
    const period = 2 * COL * scale;
    if (x + period > box.scrollLeft + box.clientWidth) box.scrollLeft = x + period - box.clientWidth;
    else if (x - period < box.scrollLeft) box.scrollLeft = Math.max(0, x - period);
  }, [active, width]);

  const edgeName = edge === "rising" ? "rising" : "falling";
  const summary = `Timing diagram, ${edgeName}-edge triggered. ${inputs.map((r) => r.name).join(", ")} and Clk are given. ${outputs.map((o, i) => `${o.name} starts at ${initial[i]}`).join(", ")}. ${done} of ${edges.length} edges answered.`;

  return (
    <div className={styles.root} data-diagram={id}>
      <div className={styles.well}>
        {/* fixed names column: stays put while the diagram scrolls */}
        <div className={styles.names} style={{ "--row": `${ROW}px`, "--gap": `${GAP}px`, "--top": `${TOP}px` } as CSSProperties} aria-hidden="true">
          {rows.map((r, i) => (
            <span key={i} className={styles.name}>
              <i>{r.name}</i>
              {r.kind === "output" && <span className={styles.initial}>= {initial[i - inputs.length - 1]} at start</span>}
            </span>
          ))}
        </div>
        <div className={styles.scroll} ref={scroller} data-fade={fade} {...(fade === "none" ? {} : { tabIndex: 0, role: "group", "aria-label": "Timing diagram, scrolls sideways" })}>
          <svg viewBox={`0 0 ${width} ${height}`} className={styles.svg} style={{ width, minWidth: width }} role="img" aria-label={summary} {...focusTarget("timing")}>
            {/* the halo column at the edge being asked */}
            {active !== undefined && <rect x={PAD + active * COL - COL / 2} y={0} width={COL} height={rowTop(rows.length) - GAP + 4} rx="6" className={styles.halo} data-active-edge={done + 1} />}
            {/* level marks at the left of each row */}
            {rows.map((_, r) => (
              <g key={`m${r}`} className={styles.levelMark}>
                <text x={2} y={yOf(r, 1) + 4}>
                  1
                </text>
                <text x={2} y={yOf(r, 0) + 4}>
                  0
                </text>
              </g>
            ))}
            {/* dotted guides and edge numbers */}
            {edges.map((c, k) => (
              <g key={`e${k}`}>
                <line x1={PAD + c * COL} y1={2} x2={PAD + c * COL} y2={rowTop(rows.length) - GAP + 2} className={styles.guide} />
                <text x={PAD + c * COL} y={height - 2} textAnchor="middle" className={`${styles.edgeNumber} ${k === done ? styles.edgeNow : ""}`}>
                  {k + 1}
                </text>
                {/* a triangle on the clock at each active edge: up for rising, down for falling */}
                <path
                  d={edge === "rising" ? `M ${PAD + c * COL - 5} ${yOf(inputs.length, 0) - 6} l 5 -8 l 5 8 Z` : `M ${PAD + c * COL - 5} ${yOf(inputs.length, 1) + 6} l 5 8 l 5 -8 Z`}
                  className={styles.triangle}
                />
              </g>
            ))}
            {/* given signals */}
            {rows.map((r, i) => (r.kind === "output" ? null : <path key={`w${i}`} d={wave(i, r.levels, columns)} className={styles.wave} data-signal={r.name} />))}
            {/* outputs: drawn up to the edge being asked; nothing beyond it */}
            {outputs.map((o, i) => (
              <g key={`o${i}`}>
                <path d={wave(outRow(i), o.levels, drawnUntil)} className={styles.output} data-output={o.name} data-drawn={drawnUntil} />
                {active !== undefined && (
                  <text x={PAD + active * COL + 10} y={rowTop(outRow(i)) + ROW / 2 + 5} className={styles.unknown}>
                    ?
                  </text>
                )}
              </g>
            ))}
            {/* hint rung 5: each input's value at the active edge (shown when the tutor highlights it) */}
            {active !== undefined && (
              <g className={styles.edgeDots} {...focusTarget("inputs-at-edge")}>
                {inputs.map((r, i) => (
                  <g key={i}>
                    <circle cx={PAD + active * COL - COL / 2} cy={yOf(i, r.levels[active - 1])} r="4.5" />
                    <text x={PAD + active * COL - COL / 2} y={yOf(i, r.levels[active - 1]) + (r.levels[active - 1] ? -8 : 16)} textAnchor="middle">
                      {r.levels[active - 1]}
                    </text>
                  </g>
                ))}
              </g>
            )}
          </svg>
        </div>
      </div>
      {onCheck && !finished && (
        <form
          className={styles.answer}
          onSubmit={(e) => {
            e.preventDefault();
            if (editing && complete) onCheck(picked as Bit[]);
          }}
        >
          {outputs.map((o, i) => (
            <fieldset key={i} className={`${styles.choice} ${state === "incorrect" && wrongOutput === i ? styles.wrong : ""}`} role="radiogroup" aria-label={`${o.name} after edge ${done + 1}`} aria-invalid={(state === "incorrect" && wrongOutput === i) || undefined}>
              <span className={styles.choiceName} aria-hidden="true">
                <i>{o.name}</i> after edge {done + 1}
              </span>
              <span className={styles.segments}>
                {([0, 1] as const).map((b) => (
                  <label key={b} className={`${styles.segment} ${picked[i] === b ? styles.segmentOn : ""} mono`}>
                    <input type="radio" name={`${id}-q${i}`} value={b} checked={picked[i] === b} disabled={!editing} onChange={() => setPicked((p) => p.map((x, k) => (k === i ? b : x)))} {...focusTarget(`q-${i}-${b}`)} />
                    {b}
                  </label>
                ))}
              </span>
              {state === "incorrect" && wrongOutput === i && (
                <span className={styles.cross} aria-hidden="true">
                  ✕
                </span>
              )}
            </fieldset>
          ))}
          <button type="submit" className="btn btn-primary" disabled={!editing || !complete}>
            Check edge
          </button>
        </form>
      )}
    </div>
  );
}
