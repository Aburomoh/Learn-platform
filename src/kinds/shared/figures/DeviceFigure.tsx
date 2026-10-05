import { focusTarget } from "@/interactions/shared/types";
import styles from "./figures.module.css";

export interface DeviceFigureProps {
  device: "decoder" | "encoder" | "mux";
  /** Code width: 1 to 3. */
  bits: number;
  /** Code-bit names, MSB first (S1 S0, or x y z). */
  names: string[];
  /** What is given: the input code (decoder), the active input (encoder) or the select value (mux). */
  ask: number;
  /** mux: a level printed on each data input. */
  data?: (0 | 1)[];
  /** Result state: the right pick, drawn in the signal colour with its value. */
  revealed?: number;
  /** Name of a pick as shown: D5, 101, I2. */
  pickName: (pick: number) => string;
  /** Focus state: the line with the halo, by name (D5, I2, S1, x, Y). */
  focus?: string;
  /** The line the student has picked, not checked yet (decoder output, mux input). */
  picked?: number | null;
  /** Tapping a line picks it (decoder output, mux input). Omitted: the figure is read-only. */
  onPick?: (pick: number) => void;
}

// Geometry in SVG units; text is 16 units, so 12 px at the smallest scale.
const LINE = 30;
const BODY_X = 96;
const BODY_W = 128;
const STUB = 44;
const TOP = 18;
export const MIN_SCALE = 0.75;

const bitsOf = (value: number, width: number) => value.toString(2).padStart(width, "0");

/**
 * A decoder, encoder or multiplexer as a block (#198 §8, #454): a labelled rectangle (the slides'
 * trapezoid for a mux) with its lines. Three states: what is given is printed on the pins; one
 * line may carry the focus halo; in the result state the answered line or path is drawn in the
 * signal colour with its value. Drawing only: it never grades and holds no state.
 */
export function DeviceFigure({ device, bits, names, ask, data, revealed, pickName, focus, picked = null, onPick }: DeviceFigureProps) {
  const size = 2 ** bits;
  const code = bitsOf(ask, bits);

  // left and right line counts: decoder bits → size, encoder size → bits, mux size → 1 (selects from below)
  const left = device === "decoder" ? bits : size;
  const right = device === "decoder" ? size : device === "encoder" ? bits : 1;
  const rows = Math.max(left, right);
  const bodyH = rows * LINE + 12;
  const selectH = device === "mux" ? 46 + (bits > 1 ? 20 : 0) : 0;
  const width = BODY_X + BODY_W + STUB + 76;
  const height = TOP + bodyH + selectH + 10;
  const y = (i: number, count: number) => TOP + 6 + ((rows - count) / 2 + i + 0.5) * LINE;
  const lx = BODY_X - STUB;
  const rx = BODY_X + BODY_W + STUB;
  const inset = device === "mux" ? 22 : 0; // the trapezoid's right side is shorter
  const sizeName = device === "decoder" ? `${bits}→${size} DEC` : device === "encoder" ? `${size}→${bits} ENC` : `${size}→1 MUX`;
  const revealedCode = device === "encoder" && revealed !== undefined ? bitsOf(revealed, bits) : undefined;
  const given = device === "encoder" ? `I${ask} = 1` : names.map((n, i) => `${n} = ${code[i]}`).join(", ");
  const summary = `${sizeName.replace("→", " to ")}. Given: ${given}.${revealed !== undefined ? ` Answer: ${pickName(revealed)}.` : ""}`;
  const halo = (name: string) => (focus === name ? styles.focus : "");

  return (
    <div className={styles.well}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.svg} style={{ maxWidth: width, minWidth: Math.round(width * MIN_SCALE) }} role="img" aria-label={summary} {...focusTarget("device")}>
        {/* body */}
        <path d={`M ${BODY_X} ${TOP} L ${BODY_X + BODY_W} ${TOP + inset} L ${BODY_X + BODY_W} ${TOP + bodyH - inset} L ${BODY_X} ${TOP + bodyH} Z`} className={styles.body} />
        <text x={BODY_X + BODY_W / 2} y={device === "mux" ? TOP + inset + 20 : TOP + bodyH / 2 + 6} textAnchor="middle" className={styles.name}>
          {sizeName}
        </text>

        {/* left lines */}
        {Array.from({ length: left }, (_, i) => {
          const yy = y(i, left);
          const isData = device !== "decoder";
          const name = isData ? `I${i}` : names[i];
          const on = device === "encoder" ? i === ask : device === "mux" ? revealed === i : false;
          const isPicked = device === "mux" && picked === i;
          const live = device === "mux" && !!onPick;
          const value = device === "decoder" ? code[i] : device === "encoder" ? (i === ask ? "1" : "0") : data ? String(data[i]) : "";
          return (
            <g key={`l${i}`} className={`${styles.line} ${on ? styles.on : ""} ${isPicked ? styles.picked : ""} ${live ? styles.live : ""} ${halo(name)}`} data-line={name} data-on={on || undefined} data-focus={focus === name || undefined} onClick={live ? () => onPick(i) : undefined} {...focusTarget(`line-${name}`)}>
              {(live || focus === name) && <rect x={0} y={yy - LINE / 2} width={BODY_X} height={LINE} className={styles.hit} />}
              <path d={`M ${lx} ${yy} H ${BODY_X}`} />
              <text x={lx - 6} y={yy + 5} textAnchor="end">
                {name}
                {value !== "" && (
                  <tspan className={`${styles.value} mono`} dx="5">
                    {device === "decoder" ? `= ${value}` : value}
                  </tspan>
                )}
              </text>
            </g>
          );
        })}

        {/* mux: the selected path through the body, once answered */}
        {device === "mux" && revealed !== undefined && <path d={`M ${BODY_X} ${y(revealed, left)} L ${BODY_X + BODY_W} ${y(0, 1)}`} className={styles.path} data-path={`I${revealed}`} />}

        {/* right lines */}
        {Array.from({ length: right }, (_, i) => {
          const yy = y(i, right);
          const on = device === "decoder" ? revealed === i : device === "mux" ? revealed !== undefined : revealedCode?.[i] === "1";
          const isPicked = device === "decoder" && picked === i;
          const live = device === "decoder" && !!onPick;
          const label = device === "decoder" ? `D${i}` : device === "encoder" ? names[i] : "Y";
          const value = device === "decoder" ? (revealed === undefined ? "" : revealed === i ? "= 1" : "= 0") : device === "encoder" ? (revealedCode ? `= ${revealedCode[i]}` : "= ?") : revealed === undefined ? "" : `= I${revealed}`;
          return (
            <g key={`r${i}`} className={`${styles.line} ${on ? styles.on : ""} ${isPicked ? styles.picked : ""} ${live ? styles.live : ""} ${halo(label)}`} data-line={label} data-on={on || undefined} data-focus={focus === label || undefined} onClick={live ? () => onPick(i) : undefined} {...focusTarget(`line-${label}`)}>
              {(live || focus === label) && <rect x={BODY_X + BODY_W} y={yy - LINE / 2} width={width - BODY_X - BODY_W} height={LINE} className={styles.hit} />}
              <path d={`M ${BODY_X + BODY_W} ${yy} H ${rx}`} />
              <text x={rx + 6} y={yy + 5}>
                {label}
                {value && (
                  <tspan className={`${styles.value} mono`} dx="5">
                    {value}
                  </tspan>
                )}
              </text>
            </g>
          );
        })}

        {/* mux: select lines enter from the bottom, with their values */}
        {device === "mux" &&
          names.map((n, i) => {
            const x = BODY_X + ((i + 1) * BODY_W) / (bits + 1);
            const edge = TOP + bodyH - (inset * (x - BODY_X)) / BODY_W;
            return (
              <g key={`s${i}`} className={`${styles.line} ${halo(n)}`} data-line={n} data-focus={focus === n || undefined} {...focusTarget(`line-${n}`)}>
                {focus === n && <rect x={x - 34} y={TOP + bodyH + 20 + (i % 2) * 20} width={68} height={22} className={styles.hit} />}
                <path d={`M ${x} ${edge} V ${TOP + bodyH + 18 + (i % 2) * 20}`} />
                <text x={x} y={TOP + bodyH + 36 + (i % 2) * 20} textAnchor="middle">
                  {n}
                  <tspan className={`${styles.value} mono`} dx="4">
                    = {code[i]}
                  </tspan>
                </text>
              </g>
            );
          })}
      </svg>
    </div>
  );
}
