import { focusTarget } from "@/interactions/shared/types";
import { adderOutputs, adderPins, flipFlopInputs, flipFlopNext, type AdderGiven, type AdderType, type FlipFlopGiven, type FlipFlopType } from "./blocks";
import { Marks } from "./Marks";
import styles from "./figures.module.css";

/** One pin of a block: its name, where it sits, and what is printed beside it. */
interface Pin {
  name: string;
  /** Printed instead of the name when it says more: Q(t), Q(t+1). */
  label?: string;
  /** Distance from the top of the body, in units. */
  y: number;
  /** Printed after the name: "1", "0" or "?" (asked, not answered yet). Omitted: the name alone. */
  value?: string;
  /** Result state: this value is the computed answer. */
  result?: boolean;
}

interface BlockProps {
  /** Bold line inside the body (HA, Σ, D, JK) and the muted line under it (half adder, flip-flop). */
  title: string;
  subtitle: string;
  height: number;
  left: Pin[];
  right: Pin[];
  /** A clocked block: the triangle on the left edge at `y`; a bubble in front of it for the falling edge. */
  clock?: { y: number; edge: "rising" | "falling" };
  focus?: string;
  summary: string;
  /** Where the body starts and how long the pin stubs are; a flip-flop sits further left to leave room for "Q′(t+1) = 0". */
  bodyX?: number;
  stub?: number;
  /** Topic card: 1, 2, 3 over the inputs, the body and the outputs. */
  marks?: boolean;
}

// Geometry in SVG units (visual system §4): 330 wide at most, 15-unit text, never drawn below 0.8× (12 px).
const WIDTH = 330;
const BODY_W = 90;
const TOP = 12;
const MIN_SCALE = 0.8;

/** A rectangular block symbol: pins on the left and right, the name inside. The adders and flip-flops are this drawing. */
function Block({ title, subtitle, height, left, right, clock, focus, summary, bodyX: BODY_X = 120, stub = 44, marks = false }: BlockProps) {
  const lx = BODY_X - stub;
  const rx = BODY_X + BODY_W + stub;
  const total = TOP + height + (clock ? 40 : 12);
  const pin = (p: Pin, side: "left" | "right") => {
    const y = TOP + p.y;
    const on = p.result && p.value === "1";
    const asked = p.value === "?";
    const focused = focus === p.name;
    return (
      <g key={p.name} className={`${styles.line} ${on ? styles.on : ""} ${focused ? styles.focus : ""}`} data-line={p.name} data-on={on || undefined} data-focus={focused || undefined} {...focusTarget(`line-${p.name}`)}>
        {focused && <rect x={side === "left" ? 2 : BODY_X + BODY_W + 2} y={y - 14} width={side === "left" ? BODY_X - 4 : WIDTH - BODY_X - BODY_W - 4} height={28} className={styles.hit} />}
        <path d={side === "left" ? `M ${lx} ${y} H ${BODY_X}` : `M ${BODY_X + BODY_W} ${y} H ${rx}`} />
        <text x={side === "left" ? lx - 6 : rx + 6} y={y + 5} textAnchor={side === "left" ? "end" : "start"} className={`${styles.pin} mono`}>
          {p.label ?? p.name}
          {p.value !== undefined && <tspan className={`${styles.value} ${asked ? styles.asked : ""}`}>{` = ${p.value}`}</tspan>}
        </text>
      </g>
    );
  };
  return (
    <div className={styles.well}>
      <svg viewBox={marks ? `0 -26 ${WIDTH} ${total + 26}` : `0 0 ${WIDTH} ${total}`} className={`${styles.svg} ${styles.center}`} style={{ maxWidth: Math.round(WIDTH * 1.25), minWidth: Math.round(WIDTH * MIN_SCALE) }} role="img" aria-label={summary} {...focusTarget("block")}>
        {marks && <Marks xs={[lx, BODY_X + BODY_W / 2, rx]} y={-12} />}
        <rect x={BODY_X} y={TOP} width={BODY_W} height={height} rx="6" className={styles.body} />
        <text x={BODY_X + BODY_W / 2 + (clock ? 6 : 0)} y={TOP + height / 2 - 2} textAnchor="middle" className={styles.name}>
          {title}
        </text>
        <text x={BODY_X + BODY_W / 2 + (clock ? 6 : 0)} y={TOP + height / 2 + 16} textAnchor="middle" className={styles.sub}>
          {subtitle}
        </text>
        {left.map((p) => pin(p, "left"))}
        {right.map((p) => pin(p, "right"))}
        {clock && (
          <g className={`${styles.line} ${focus === "Clk" ? styles.focus : ""}`} data-line="Clk" data-edge={clock.edge} data-focus={focus === "Clk" || undefined} {...focusTarget("line-Clk")}>
            {focus === "Clk" && <rect x={2} y={TOP + clock.y - 14} width={BODY_X - 4} height={28} className={styles.hit} />}
            <path d={`M ${lx} ${TOP + clock.y} H ${BODY_X - (clock.edge === "falling" ? 10 : 0)}`} />
            {clock.edge === "falling" && <circle cx={BODY_X - 5} cy={TOP + clock.y} r="5" className={styles.body} />}
            <path d={`M ${BODY_X} ${TOP + clock.y - 8} L ${BODY_X + 12} ${TOP + clock.y} L ${BODY_X} ${TOP + clock.y + 8}`} className={styles.edge} />
            <text x={lx - 6} y={TOP + clock.y + 5} textAnchor="end" className={`${styles.pin} mono`}>
              Clk
            </text>
            {/* the mini clock edge points the same way as the trigger */}
            <path d={clock.edge === "rising" ? `M ${BODY_X - 36} ${total - 8} h 10 v -14 h 10` : `M ${BODY_X - 36} ${total - 22} h 10 v 14 h 10`} className={styles.edge} />
            <text x={BODY_X - 8} y={total - 10} className={styles.sub}>
              {clock.edge} edge
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

export interface AdderFigureProps {
  adder: AdderType;
  /** The bits on the inputs. Omitted: the symbol alone, with no values. */
  given?: AdderGiven;
  /** Result state: S and the carry are computed and printed. Before it they read "?". */
  revealed?: boolean;
  focus?: string;
  marks?: boolean;
}

/** The half adder (HA) or full adder (Σ) as its block symbol (#454). Drawing only. */
export function AdderFigure({ adder, given, revealed = false, focus, marks }: AdderFigureProps) {
  const { inputs, outputs } = adderPins(adder);
  const values = given ? [given.a, given.b, given.ci ?? 0] : undefined;
  const out = given ? adderOutputs(given) : undefined;
  const full = adder === "full";
  const height = full ? 104 : 84;
  const name = full ? "Full adder" : "Half adder";
  const givenText = values ? ` Given: ${inputs.map((n, i) => `${n} = ${values[i]}`).join(", ")}.` : "";
  const answer = revealed && out ? ` Answer: ${outputs[0]} = ${out.s}, ${outputs[1]} = ${out.c}.` : "";
  return (
    <Block
      title={full ? "Σ" : "HA"}
      subtitle={full ? "full adder" : "half adder"}
      height={height}
      left={inputs.map((n, i) => ({ name: n, y: full ? 20 + i * 32 : 24 + i * 36, value: values ? String(values[i]) : undefined }))}
      right={outputs.map((n, i) => ({ name: n, y: full ? 32 + i * 40 : 24 + i * 36, value: out ? (revealed ? String(i === 0 ? out.s : out.c) : "?") : undefined, result: revealed }))}
      focus={focus}
      marks={marks}
      summary={`${name}.${givenText}${answer}`}
    />
  );
}

export interface FlipFlopFigureProps {
  ff: FlipFlopType;
  edge?: "rising" | "falling";
  /** The inputs and the present Q. Omitted: the symbol alone. */
  given?: FlipFlopGiven;
  /** Result state: Q(t+1) and Q′(t+1), computed. Before it the figure shows the given Q(t). */
  revealed?: boolean;
  focus?: string;
  marks?: boolean;
}

/** A D, T, SR or JK flip-flop as its symbol: one body for all four, the clock triangle on the left edge (#454). */
export function FlipFlopFigure({ ff, edge = "rising", given, revealed = false, focus, marks }: FlipFlopFigureProps) {
  const inputs = flipFlopInputs(ff);
  const next = given ? flipFlopNext(ff, given) : undefined;
  const q = given ? (revealed ? next! : given.q) : undefined;
  const two = inputs.length === 2;
  const letter = ff.toUpperCase();
  const givenText = given ? ` Given: ${inputs.map((n, i) => `${n} = ${given.inputs[i]}`).join(", ")}, Q(t) = ${given.q}.` : "";
  const answer = revealed && next !== undefined ? ` After the clock edge: Q(t+1) = ${next}, Q′(t+1) = ${next ? 0 : 1}.` : "";
  return (
    <Block
      title={letter}
      subtitle="flip-flop"
      height={116}
      left={inputs.map((n, i) => ({ name: n, y: i === 0 ? 24 : 92, value: given ? String(given.inputs[i]) : undefined }))}
      right={[
        // the characteristic tables' notation: Q(t) is the state given, Q(t+1) the state after the edge
        { name: "Q", label: q === undefined ? undefined : revealed ? "Q(t+1)" : "Q(t)", y: 24, value: q === undefined ? undefined : String(q), result: revealed },
        { name: "Q′", label: revealed && q !== undefined ? "Q′(t+1)" : undefined, y: 92, value: revealed && q !== undefined ? String(q ? 0 : 1) : undefined, result: revealed },
      ]}
      bodyX={82}
      stub={30}
      clock={{ y: two ? 58 : 66, edge }}
      focus={focus}
      marks={marks}
      summary={`${letter} flip-flop, ${edge}-edge triggered.${givenText}${answer}`}
    />
  );
}
