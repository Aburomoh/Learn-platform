import { focusTarget } from "@/interactions/shared/types";
import { flipFlopInputs, type FlipFlopType } from "./blocks";
import styles from "./figures.module.css";

export interface SequentialFlipFlop {
  /** The state variable this flip-flop holds: A, B, C. */
  name: string;
  ff: FlipFlopType;
  /** The input equations as the lesson writes them, one per input: "DA = Ax + Bx"; "JA = B", "KA = Bx′". */
  equations: string[];
}

export interface SequentialFigureProps {
  flipFlops: SequentialFlipFlop[];
  /** The circuit's input, if it has one: x. */
  input?: string;
  /** The circuit's output, drawn only on questions about it: y. */
  output?: string;
  /** The flip-flop with the halo (by state name), or "gates". */
  focus?: string;
}

// Geometry in SVG units (visual system §10): a composite figure, up to 360 wide, 15-unit text.
const BLOCK_X = 46;
const BLOCK_W = 108;
const FF_X = 206;
const FF_W = 52;
const FF_H = 56;
const PITCH = 84;
const BUS_X = 196;
const TAP_X = 276; // where a Q line branches into its feedback
export const MIN_SCALE = 0.8;

/**
 * A sequential circuit at block level (#454, step 6), as the analysis slides draw it: one gate
 * block that carries the input equations, the flip-flops as symbols to its right, each Q fed back
 * around the outside to the gate block, and one clock along the bottom. It shows structure, not
 * values: there is no result state. Dots mark real branches only.
 */
export function SequentialFigure({ flipFlops, input, output, focus }: SequentialFigureProps) {
  const n = flipFlops.length;
  const top = Math.ceil(n / 2); // the first `top` flip-flops feed back over the top, the rest under the bottom
  const rank = (i: number) => (i < top ? i : n - 1 - i); // 0 = the inner rail
  const rails = Math.max(1, top);
  const y0 = 12 + rails * 8 + 10; // top of the first flip-flop
  const equations = flipFlops.flatMap((f) => f.equations);
  const stackH = n * PITCH - (PITCH - FF_H);
  // with an output, the block is a little taller so the output line leaves it below the last flip-flop's wires
  const blockH = Math.max(stackH, equations.length * 19 + 44) + (output ? 26 : 0);
  const blockTop = y0;
  const blockBottom = blockTop + blockH;
  const clockY = blockBottom + 18;
  const bottomBase = clockY + 14;
  const height = bottomBase + (n - top > 0 ? (n - top) * 8 : 0) + 8;
  const width = 322 + rails * 8 + 6;

  const ffTop = (i: number) => y0 + i * PITCH;
  const inputYs = (f: SequentialFlipFlop, i: number) => (flipFlopInputs(f.ff).length === 2 ? [ffTop(i) + 12, ffTop(i) + 44] : [ffTop(i) + 16]);
  const clockPin = (f: SequentialFlipFlop, i: number) => ffTop(i) + (flipFlopInputs(f.ff).length === 2 ? 28 : 40);
  const qY = (i: number) => ffTop(i) + 16;
  // where each feedback (and the input) enters the gate block's left side, top to bottom
  const slots = n + (input ? 1 : 0);
  const entry = (slot: number) => blockTop + ((slot + 1) * blockH) / (slots + 1);
  const feedbackSlot = (i: number) => (input && i >= top ? i + 1 : i);

  const names = flipFlops.map((f) => f.name);
  const kinds = [...new Set(flipFlops.map((f) => f.ff.toUpperCase()))].join(" and ");
  const summary = `Sequential circuit. A gate block with the input equations ${equations.join(", ")} drives ${n === 1 ? `${kinds} flip-flop ${names[0]}` : `${kinds} flip-flops ${names.join(", ")}`}. ${n === 1 ? "Its output feeds" : "Their outputs feed"} back to the gate block${input ? `, with the input ${input}` : ""}. One clock drives ${n === 1 ? "the flip-flop" : "every flip-flop"}.${output ? ` The output ${output} comes from the gate block.` : ""}`;

  return (
    <div className={styles.well}>
      <svg viewBox={`0 0 ${width} ${height}`} className={`${styles.svg} ${styles.center}`} style={{ maxWidth: Math.round(width * 1.25), minWidth: Math.round(width * MIN_SCALE) }} role="img" aria-label={summary} {...focusTarget("circuit")}>
        {/* feedback: each Q around the outside, back into the gate block */}
        {flipFlops.map((f, i) => {
          const r = rank(i);
          const xr = 322 + r * 8;
          const xl = 30 - r * 8;
          const yRail = i < top ? y0 - 14 - r * 8 : bottomBase + r * 8;
          const e = entry(feedbackSlot(i));
          return <path key={f.name} d={`M ${TAP_X} ${qY(i)} H ${xr} V ${yRail} H ${xl} V ${e} H ${BLOCK_X}`} className={styles.wire} data-feedback={f.name} />;
        })}
        {/* the input */}
        {input && (
          <g className={styles.line} data-line={input}>
            <path d={`M 14 ${entry(top)} H ${BLOCK_X}`} />
            <text x={4} y={entry(top) + 5} className={`${styles.pin} mono`}>
              {input}
            </text>
          </g>
        )}
        {/* the clock: one line along the bottom, a branch to every flip-flop */}
        <g className={styles.line} data-line="Clk">
          <text x={BLOCK_X + 6} y={clockY + 5} className={`${styles.pin} mono`}>
            Clk
          </text>
          <path d={`M ${BLOCK_X + 40} ${clockY} H ${BUS_X} V ${clockPin(flipFlops[0], 0)}`} />
          {flipFlops.map((f, i) => (
            <path key={f.name} d={`M ${BUS_X} ${clockPin(f, i)} H ${FF_X}`} />
          ))}
        </g>
        {flipFlops.slice(1).map((f, i) => (
          <circle key={f.name} cx={BUS_X} cy={clockPin(f, i + 1)} r="3.5" className={styles.junction} />
        ))}
        {/* the gate block with its equations */}
        <g className={focus === "gates" ? styles.focus : ""} data-block="gates" data-focus={focus === "gates" || undefined} {...focusTarget("gates")}>
          {focus === "gates" && <rect x={BLOCK_X - 6} y={blockTop - 6} width={BLOCK_W + 12} height={blockH + 12} rx="10" className={styles.hit} />}
          <rect x={BLOCK_X} y={blockTop} width={BLOCK_W} height={blockH} rx="6" className={styles.body} />
          <text x={BLOCK_X + BLOCK_W / 2} y={blockTop + blockH / 2 - (equations.length * 19) / 2 - 4} textAnchor="middle" className={styles.name}>
            gates
          </text>
          {equations.map((eq, k) => (
            <text key={k} x={BLOCK_X + BLOCK_W / 2} y={blockTop + blockH / 2 - (equations.length * 19) / 2 + 18 + k * 19} textAnchor="middle" className={styles.sub} data-equation={k}>
              {eq}
            </text>
          ))}
        </g>
        {/* the output, only when the question is about it */}
        {output && (
          <g className={styles.line} data-line={output}>
            <path d={`M ${BLOCK_X + BLOCK_W} ${blockBottom - 10} H 172`} />
            <text x={176} y={blockBottom - 5} className={`${styles.pin} mono`}>
              {output}
            </text>
          </g>
        )}
        {/* flip-flops */}
        {flipFlops.map((f, i) => {
          const focused = focus === f.name;
          const pins = flipFlopInputs(f.ff);
          return (
            <g key={f.name} className={focused ? styles.focus : ""} data-ff={f.name} data-focus={focused || undefined} {...focusTarget(`ff-${f.name}`)}>
              {focused && <rect x={FF_X - 8} y={ffTop(i) - 8} width={FF_W + 16} height={FF_H + 16} rx="10" className={styles.hit} />}
              {inputYs(f, i).map((y, k) => (
                <g key={k} className={styles.line}>
                  <path d={`M ${BLOCK_X + BLOCK_W} ${y} H ${FF_X}`} />
                  <text x={BLOCK_X + BLOCK_W + 8} y={y - 5} className={styles.sub}>
                    {pins[k]}
                    {f.name}
                  </text>
                </g>
              ))}
              <rect x={FF_X} y={ffTop(i)} width={FF_W} height={FF_H} rx="6" className={styles.body} />
              <path d={`M ${FF_X} ${clockPin(f, i) - 7} L ${FF_X + 10} ${clockPin(f, i)} L ${FF_X} ${clockPin(f, i) + 7}`} className={styles.wire} />
              <text x={FF_X + FF_W / 2 + 4} y={ffTop(i) + FF_H / 2 + 6} textAnchor="middle" className={styles.name}>
                {f.ff.toUpperCase()}
              </text>
              <g className={styles.line}>
                <path d={`M ${FF_X + FF_W} ${qY(i)} H ${TAP_X}`} />
                <text x={TAP_X + 8} y={qY(i) - 7} className={`${styles.pin} ${styles.value} mono`}>
                  {f.name}
                </text>
              </g>
              <circle cx={TAP_X} cy={qY(i)} r="3.5" className={styles.junction} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
