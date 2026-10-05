import { latchAfter, type LatchType, type LatchValues } from "./latch";
import styles from "./LatchFigure.module.css";

export interface LatchFigureProps {
  id: string;
  /** `nand-sr`: two cross-coupled NANDs. `gated-sr`: the same with two input NANDs and the enable line. */
  latch: LatchType;
  /** The given state, printed on the wires: the inputs and the Q the latch holds. */
  values: LatchValues;
  /** The student has answered: the new Q and Q′ (computed from the values) are drawn. */
  revealed?: boolean;
}

const ALT = "NAND SR latch: S and the output of the lower gate feed the upper NAND, which gives Q; R and Q feed the lower NAND, which gives Q′.";
const ALT_GATED = "Gated SR latch: S with En, and R with En, each go through a NAND into a NAND SR latch. Its upper NAND gives Q and its lower NAND gives Q′; each output feeds the other gate.";

/** A NAND symbol, 64 units wide with its bubble; inputs at y + 11 and y + 33, output at y + 22. */
function Nand({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M 0 0 H 34 A 22 22 0 0 1 34 44 H 0 Z" className={styles.body} />
      <circle cx="60" cy="22" r="4" className={styles.body} />
    </g>
  );
}

/**
 * The latch as on the slides (#440): a read-only figure above a question. The given state is
 * printed on the wires; the answer is not shown until `revealed`. The feedback wires cross between
 * the gates without a dot; dots mark the two real branches only (#387).
 */
export function LatchFigure({ id, latch, values, revealed = false }: LatchFigureProps) {
  const after = latchAfter(latch, values);
  const gated = latch === "gated-sr";
  // x of the two latch gates; the feedback wires run from `back` (before the gates) to `out` (after them)
  const gx = gated ? 188 : 150;
  const back = gx - 16;
  const out = gx + 80;
  const end = 296;
  const given = [`S = ${values.s}`, `R = ${values.r}`, ...(gated ? [`En = ${values.en}`] : []), `Q = ${values.q}`].join(", ");
  const result = revealed ? ` Now Q = ${after.q} and Q′ = ${after.qn}.` : "";
  return (
    <div className={styles.root} data-diagram={id}>
      <svg className={styles.svg} viewBox="0 -10 300 210" role="img" aria-label={`${gated ? ALT_GATED : ALT} Given: ${given}.${result}`}>
        {gated ? (
          <>
            {/* S and R into the input NANDs; En branches to both */}
            <path d="M 4 28 H 80" className={styles.wire} />
            <path d="M 4 172 H 80" className={styles.wire} />
            <path d="M 4 100 H 62 M 62 50 H 80 M 62 150 H 80 M 62 50 V 150" className={styles.wire} />
            <circle cx="62" cy="100" r="3.5" className={styles.junction} />
            <Nand x={80} y={17} />
            <Nand x={80} y={139} />
            <path d={`M 144 39 H ${gx}`} className={styles.wire} />
            <path d={`M 144 161 H ${gx}`} className={styles.wire} />
            <text x="4" y="20" className={styles.label}>{`S = ${values.s}`}</text>
            <text x="4" y="92" className={styles.label}>{`En = ${values.en}`}</text>
            <text x="4" y="190" className={styles.label}>{`R = ${values.r}`}</text>
          </>
        ) : (
          <>
            <path d={`M 4 39 H ${gx}`} className={styles.wire} />
            <path d={`M 4 161 H ${gx}`} className={styles.wire} />
            <text x="4" y="31" className={styles.label}>{`S = ${values.s}`}</text>
            <text x="4" y="179" className={styles.label}>{`R = ${values.r}`}</text>
          </>
        )}
        <Nand x={gx} y={28} />
        <Nand x={gx} y={128} />
        {/* outputs */}
        <path d={`M ${gx + 64} 50 H ${end}`} className={styles.wire} />
        <path d={`M ${gx + 64} 150 H ${end}`} className={styles.wire} />
        {/* feedback: Q to the lower gate, Q′ to the upper gate, crossing between them */}
        <path d={`M ${out} 50 V 80 L ${back} 120 V 139 H ${gx}`} className={styles.wire} />
        <path d={`M ${out} 150 V 120 L ${back} 80 V 61 H ${gx}`} className={styles.wire} />
        <circle cx={out} cy="50" r="3.5" className={styles.junction} />
        <circle cx={out} cy="150" r="3.5" className={styles.junction} />
        <text x={end + 2} y="42" textAnchor="end" className={`${styles.label} ${revealed ? styles.high : ""}`}>{`Q = ${revealed ? after.q : values.q}`}</text>
        <text x={end + 2} y="170" textAnchor="end" className={`${styles.label} ${revealed ? styles.high : ""}`}>
          {revealed ? `Q′ = ${after.qn}` : "Q′"}
        </text>
      </svg>
    </div>
  );
}
