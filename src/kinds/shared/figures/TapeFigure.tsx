import { focusTarget } from "@/interactions/shared/types";
import styles from "./figures.module.css";

export interface TapeFigureProps {
  /** Records on the strip, 2–12. */
  records: number;
  /** Records per block: the gaps are inter-block gaps (IBG) between blocks; omitted, every record is its own block (IRG). */
  block?: number;
  /** Result state: the gaps are numbered (the count is computed, never authored). */
  revealed?: boolean;
  caption?: string;
}

/** The blocks a tape holds: `records` one by one (IRG), or grouped `block` at a time (IBG). */
export const tapeBlocks = (records: number, block?: number) => {
  const size = block ?? 1;
  const out: number[] = [];
  for (let left = records; left > 0; left -= size) out.push(Math.min(size, left));
  return out;
};

// Geometry in SVG units (visual system §4): 330 wide, 15-unit text, never drawn below 0.8× (12 px).
const W = 330;
const PAD = 8;
const Y = 30;
const H = 40;
const GAP = 10;
const MIN_SCALE = 0.8;
const TEXT = 15;

/**
 * A stretch of magnetic tape (CPET181 Ch7 s.11–12, #615): records as cells on the strip, and the
 * ½-inch gap the drive needs between individually stored records (IRG) or between blocks of
 * records (IBG). The student counts; in the result state the gaps are numbered (n blocks → n − 1 gaps,
 * computed here). Numbers inside the records help the count when the cells are wide enough.
 */
export function TapeFigure({ records, block, revealed = false, caption }: TapeFigureProps) {
  const blocks = tapeBlocks(records, block);
  const gaps = blocks.length - 1;
  const kind = block && block > 1 ? "IBG" : "IRG";
  const cellW = Math.min(26, Math.floor((W - 2 * PAD - gaps * GAP) / records));
  const stripW = records * cellW + gaps * GAP;
  const x0 = (W - stripW) / 2;
  const numbered = cellW >= 22;
  const total = Y + H + (revealed ? 54 : 34);
  const summary =
    caption ??
    `Tape with ${records} records${block && block > 1 ? ` in blocks of ${block}` : " stored one by one"}; a gap between each ${kind === "IBG" ? "block" : "record"} and the next (${kind}).${revealed ? ` ${gaps} gap${gaps === 1 ? "" : "s"}.` : ""}`;

  let x = x0;
  let n = 0;
  const parts: React.ReactNode[] = [];
  blocks.forEach((size, b) => {
    for (let i = 0; i < size; i++) {
      n++;
      parts.push(
        <g key={`r${n}`} data-record={n}>
          <rect x={x + 1} y={Y + 1} width={cellW - 2} height={H - 2} rx="3" className={styles.rowOn} />
          {numbered && (
            <text x={x + cellW / 2} y={Y + H / 2 + 5} textAnchor="middle" className={`${styles.label} mono`} style={{ fontSize: TEXT }}>
              {n}
            </text>
          )}
        </g>,
      );
      x += cellW;
    }
    if (b < gaps) {
      parts.push(
        <g key={`g${b}`} data-gap={b + 1}>
          <path d={`M ${x + GAP / 2} ${Y + 4} V ${Y + H - 4}`} className={styles.dashed} />
          {revealed && (
            <g data-count={b + 1}>
              <circle cx={x + GAP / 2} cy={Y + H + 16} r={11} className={styles.mark} />
              <text x={x + GAP / 2} y={Y + H + 21} textAnchor="middle" className={styles.markText}>
                {b + 1}
              </text>
            </g>
          )}
        </g>,
      );
      x += GAP;
    }
  });

  return (
    <div className={styles.well}>
      <svg viewBox={`0 0 ${W} ${total}`} className={`${styles.svg} ${styles.center}`} style={{ maxWidth: Math.round(W * 1.25), minWidth: Math.round(W * MIN_SCALE) }} role="img" aria-label={summary} {...focusTarget("tape")}>
        {/* the strip runs off both edges: a stretch of a longer tape */}
        <rect x={0} y={Y} width={W} height={H} className={styles.body} />
        <g className={styles.line}>{parts}</g>
        <text x={W / 2} y={total - 8} textAnchor="middle" className={styles.sub} style={{ fontSize: TEXT }}>
          {kind === "IBG" ? `blocks of ${block} records; IBG between blocks` : "one record at a time; IRG between records"}
        </text>
      </svg>
    </div>
  );
}
