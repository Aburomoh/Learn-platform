import { focusTarget } from "@/interactions/shared/types";
import styles from "./figures.module.css";
import { type Expr, isOp, leaves, operations, parseExpression, print, schedule, stepOf } from "./opTree";

export interface OpTreeFigureProps {
  /** "A = 3 * B * C + 4 / (D + E) ** (F − G)"; checked at build by the spec. */
  expression: string;
  /** Result state: each operation carries its earliest step number (computed). */
  revealed?: boolean;
  caption?: string;
}

// Geometry in SVG units (visual system §4): 330 wide, 15-unit text, never drawn below 0.8× (12 px).
const W = 330;
const PAD = 8;
const TOP = 26;
const ROW = 42;
const R = 13;
const MIN_SCALE = 0.8;
const TEXT = 15;

type Placed = { x: number; y: number; e: Expr; kids: Placed[] };

/**
 * An expression as a tree of its operations (CPET181 Ch6 s.21–24, #615): leaves along the bottom
 * in reading order, each operation above its two operands, so the chains the slide counts are
 * visible. Before the result state it is a picture of the operations; in the result state each
 * operation carries the step it runs in under earliest-step scheduling (computed, never authored).
 */
export function OpTreeFigure({ expression, revealed = false, caption }: OpTreeFigureProps) {
  const { name, root } = parseExpression(expression);
  const leafNames = leaves(root);
  const cellW = (W - 2 * PAD) / leafNames.length;
  const ops = operations(root);
  const { steps } = schedule(root);

  // x: leaves spread in reading order, an operation over the middle of its operands; y: by depth from the root
  let leafIndex = 0;
  const place = (e: Expr, d: number): Placed => {
    if (!isOp(e)) return { x: PAD + (leafIndex++ + 0.5) * cellW, y: TOP + d * ROW, e, kids: [] };
    const l = place(e.left, d + 1);
    const r = place(e.right, d + 1);
    return { x: (l.x + r.x) / 2, y: TOP + d * ROW, e, kids: [l, r] };
  };
  const tree = place(root, 0);
  const nodes: Placed[] = []; // parent first, then its operands
  const walk = (n: Placed) => (nodes.push(n), n.kids.forEach(walk));
  walk(tree);
  const total = Math.max(...nodes.map((n) => n.y)) + 30;

  const opText = (op: string) => (op === "-" ? "−" : op);
  const stepList = steps.map((s, i) => `step ${i + 1}: ${s.map((o) => `${print(o.left)} ${opText(o.op)} ${print(o.right)}`.replace(/\((.*)\)/g, "($1)")).join(", ")}`).join("; ");
  const summary = caption ?? `${name ? `${name} = ` : ""}${print(root)} as a tree of ${ops.length} operations.${revealed ? ` Earliest-step schedule, ${steps.length} steps: ${stepList}.` : ""}`;

  return (
    <div className={styles.well}>
      <svg viewBox={`0 0 ${W} ${total}`} className={`${styles.svg} ${styles.center}`} style={{ maxWidth: Math.round(W * 1.25), minWidth: Math.round(W * MIN_SCALE) }} role="img" aria-label={summary} {...focusTarget("op-tree")}>
        <g className={styles.line}>
          {nodes.map((n, i) => n.kids.map((k, j) => <path key={`${i}-${j}`} d={`M ${n.x} ${n.y} L ${k.x} ${k.y}`} />))}
        </g>
        {nodes.map((n, i) =>
          isOp(n.e) ? (
            <g key={i} data-op={opText(n.e.op)} data-step={revealed ? stepOf(n.e) : undefined}>
              <circle cx={n.x} cy={n.y} r={R} className={styles.body} />
              <text x={n.x} y={n.y + 5} textAnchor="middle" className={styles.label} style={{ fontSize: n.e.op === "**" ? TEXT : TEXT + 2 }}>
                {opText(n.e.op)}
              </text>
              {revealed && (
                <g>
                  <circle cx={n.x + R + 6} cy={n.y - R + 2} r={11} className={styles.mark} />
                  <text x={n.x + R + 6} y={n.y - R + 7} textAnchor="middle" className={styles.markText}>
                    {stepOf(n.e)}
                  </text>
                </g>
              )}
            </g>
          ) : (
            <g key={i} data-leaf={n.e.text}>
              <rect x={n.x - cellW / 2 + 4} y={n.y - 13} width={cellW - 8} height={26} rx="5" className={styles.body} />
              <text x={n.x} y={n.y + 5} textAnchor="middle" className={`${styles.label} mono`} style={{ fontSize: TEXT }}>
                {n.e.text}
              </text>
            </g>
          ),
        )}
      </svg>
    </div>
  );
}
