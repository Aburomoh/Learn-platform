import { useId } from "react";
import { focusTarget } from "@/interactions/shared/types";
import styles from "./figures.module.css";

export interface BufferFigureProps {
  /** Positions in the buffer. */
  slots: number;
  /** Positions holding data, filled from the left. */
  filled: number;
  /** Names as the slide has them: "producer" / "consumer" (default), or "CPU" / "printer". */
  producer?: string;
  consumer?: string;
  /** The part with the halo: producer, buffer, consumer. */
  focus?: string;
  caption?: string;
}

export const BUFFER_PINS = ["producer", "buffer", "consumer"] as const;

// Geometry in SVG units (visual system §4): 330 wide, 15-unit text, never drawn below 0.8× (12 px).
const W = 330;
const BOX_W = 74;
const BOX_H = 36;
const Y = 30;
const CELL_H = 36;
const MIN_SCALE = 0.8;
const TEXT = 15;

/**
 * The producer, the buffer and the consumer (CPET181 Ch6 s.17–18, #615): data flows left to right;
 * the buffer's positions are drawn with the filled ones shaded, from the left. The state words the
 * slide uses (full, partly empty, empty) are not printed: the student reads the picture. Nothing is
 * computed and there is no result state.
 */
export function BufferFigure({ slots, filled, producer = "producer", consumer = "consumer", focus, caption }: BufferFigureProps) {
  const id = useId().replace(/:/g, "");
  const cellW = Math.min(26, Math.floor(140 / slots));
  const bufW = cellW * slots;
  const bx = (W - bufW) / 2;
  const total = Y + Math.max(BOX_H, CELL_H) + 34;
  const on = (part: string) => focus === part;
  const halo = (x: number, w: number) => <rect x={x - 5} y={Y - 5} width={w + 10} height={CELL_H + 10} rx="8" className={styles.hit} />;
  const summary = caption ?? `${producer[0].toUpperCase()}${producer.slice(1)}, a buffer of ${slots} positions with ${filled} filled, ${consumer}. Data flows from the ${producer} to the ${consumer}.`;
  return (
    <div className={styles.well}>
      <svg viewBox={`0 0 ${W} ${total}`} className={`${styles.svg} ${styles.center}`} style={{ maxWidth: Math.round(W * 1.25), minWidth: Math.round(W * MIN_SCALE) }} role="img" aria-label={summary} {...focusTarget("buffer")}>
        <defs>
          <marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" className={styles.arrowHead} />
          </marker>
        </defs>
        <g data-part="producer" data-focus={on("producer") || undefined} className={on("producer") ? styles.focus : ""} {...focusTarget("part-producer")}>
          {on("producer") && halo(8, BOX_W)}
          <rect x={8} y={Y} width={BOX_W} height={BOX_H} rx="6" className={styles.body} />
          <text x={8 + BOX_W / 2} y={Y + BOX_H / 2 + 5} textAnchor="middle" className={styles.label} style={{ fontSize: TEXT }}>
            {producer}
          </text>
        </g>
        <g className={styles.line} aria-hidden="true">
          <path d={`M ${8 + BOX_W + 4} ${Y + BOX_H / 2} H ${bx - 6}`} markerEnd={`url(#${id}-arrow)`} />
          <path d={`M ${bx + bufW + 4} ${Y + BOX_H / 2} H ${W - 8 - BOX_W - 6}`} markerEnd={`url(#${id}-arrow)`} />
        </g>
        <g data-part="buffer" data-focus={on("buffer") || undefined} className={on("buffer") ? styles.focus : ""} {...focusTarget("part-buffer")}>
          {on("buffer") && halo(bx, bufW)}
          {Array.from({ length: slots }, (_, i) => (
            <g key={i} data-slot={i} data-on={i < filled || undefined}>
              <rect x={bx + i * cellW} y={Y} width={cellW} height={CELL_H} className={styles.body} />
              {i < filled && <rect x={bx + i * cellW + 3} y={Y + 3} width={cellW - 6} height={CELL_H - 6} rx="3" className={styles.rowOn} />}
            </g>
          ))}
          <text x={W / 2} y={Y + CELL_H + 20} textAnchor="middle" className={styles.sub} style={{ fontSize: TEXT }}>
            buffer
          </text>
        </g>
        <g data-part="consumer" data-focus={on("consumer") || undefined} className={on("consumer") ? styles.focus : ""} {...focusTarget("part-consumer")}>
          {on("consumer") && halo(W - 8 - BOX_W, BOX_W)}
          <rect x={W - 8 - BOX_W} y={Y} width={BOX_W} height={BOX_H} rx="6" className={styles.body} />
          <text x={W - 8 - BOX_W / 2} y={Y + BOX_H / 2 + 5} textAnchor="middle" className={styles.label} style={{ fontSize: TEXT }}>
            {consumer}
          </text>
        </g>
      </svg>
    </div>
  );
}
