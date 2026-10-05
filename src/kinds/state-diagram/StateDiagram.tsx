"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { focusTarget, type AnswerState } from "@/interactions/shared/types";
import { useScrollFade } from "@/interactions/shared/useScrollFade";
import styles from "./StateDiagram.module.css";

export interface DiagramTransition {
  from: string;
  to: string;
  input: 0 | 1;
  /** "1/0", or "1" when the circuit has no output. */
  label: string;
}

export interface StateDiagramProps {
  id: string;
  /** State codes in table order ("00", "01", …): one circle each. */
  states: string[];
  /** Grid cell [column, row] of each state, in the order of `states` (`stateCells` of the kind's logic). */
  positions: [number, number][];
  /** One per state-table row, in table order: the order of the goals. */
  transitions: DiagramTransition[];
  /** label: every arrow is drawn and its label is picked; next: the arrow's destination is picked. */
  mode: "label" | "next";
  /** Arrows answered so far; `transitions.length` = finished. */
  done: number;
  /** Label chips ("0/0" …) for label mode. */
  labelOptions?: string[];
  inputName: string;
  state?: AnswerState;
  disabled?: boolean;
  /** Practice: the picked label, or the picked state code. */
  onCheck?: (answer: string) => void;
}

// Geometry (§13.3): 30-unit circles, 16-unit mono labels; 4 states are 360 units wide.
const R = 30;
const DX = 200;
const DY = 170;
const MX = 80;
const MY = 100;
const BEND = 36; // control-point offset: the curve's apex sits 18 units to its right-hand side
export const MIN_SCALE = 0.75;
/** More than four states (an 8-state ring): circles 130 units apart, so the ring fits a 390 px phone (#468). */
const TIGHT = 130;
/** Label mode draws the arrows still to come dashed, as a preview, only up to this many arrows; beyond it they would be a hairball. */
export const PREVIEW_ARROWS = 8;

interface Point {
  x: number;
  y: number;
}

/** Circle centres from grid cells, and the distance between neighbours in a row. */
export function statePositions(cells: [number, number][]): { cols: number; rows: number; at: Point[]; spacing: number } {
  const [dx, dy] = cells.length > 4 ? [TIGHT, TIGHT] : [DX, DY];
  return { cols: Math.max(...cells.map(([c]) => c)) + 1, rows: Math.max(...cells.map(([, r]) => r)) + 1, at: cells.map(([c, r]) => ({ x: MX + c * dx, y: MY + r * dy })), spacing: dx };
}

const unit = (dx: number, dy: number) => {
  const d = Math.hypot(dx, dy) || 1;
  return { x: dx / d, y: dy / d };
};

/** The arrow from `p` to `q`: its path, where its head points, and where its label sits. */
export function arrowGeometry(p: Point, q: Point, loopBelow = false, spacing = DX): { d: string; tip: Point; dir: Point; label: Point; apex: Point } {
  if (p.x === q.x && p.y === q.y) {
    // a loop above the circle (below it for bottom-row states)
    const s = loopBelow ? 1 : -1;
    const a = { x: p.x - 16, y: p.y + s * 25.4 };
    const b = { x: p.x + 16, y: p.y + s * 25.4 };
    const c1 = { x: p.x - 34, y: p.y + s * 78 };
    const c2 = { x: p.x + 34, y: p.y + s * 78 };
    return { d: `M ${a.x} ${a.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}`, tip: b, dir: unit(b.x - c2.x, b.y - c2.y), label: { x: p.x, y: p.y + s * 84 }, apex: { x: p.x, y: p.y + s * 66 } };
  }
  const dir = unit(q.x - p.x, q.y - p.y);
  const n = { x: -dir.y, y: dir.x }; // right-hand side of the direction of travel
  const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
  // an arrow that skips over a neighbour bends more, so it arcs clear of the circle in between
  const distance = Math.hypot(q.x - p.x, q.y - p.y);
  const bend = distance > 1.5 * spacing ? 0.42 * distance : BEND;
  const c = { x: mid.x + n.x * bend, y: mid.y + n.y * bend };
  // The label sits outside the bend, clear of its line. A diagonal's label goes on the inner side
  // instead: outside it would land on the labels of the arrows along the square's edges.
  const diagonal = p.x !== q.x && p.y !== q.y;
  // On a tight ring a long arc's label sits just inside its apex: outside, it would land on the next circle.
  const long = distance > 1.5 * spacing;
  const labelOffset = long && spacing < DX ? bend / 2 - 18 : diagonal ? -22 : bend / 2 + 28;
  const out = unit(c.x - p.x, c.y - p.y);
  const back = unit(c.x - q.x, c.y - q.y);
  const start = { x: p.x + out.x * R, y: p.y + out.y * R };
  const tip = { x: q.x + back.x * R, y: q.y + back.y * R };
  return { d: `M ${start.x} ${start.y} Q ${c.x} ${c.y} ${tip.x} ${tip.y}`, tip, dir: { x: -back.x, y: -back.y }, label: { x: mid.x + n.x * labelOffset, y: mid.y + n.y * labelOffset }, apex: { x: mid.x + n.x * (bend / 2), y: mid.y + n.y * (bend / 2) } };
}

const head = (tip: Point, dir: Point) => {
  const n = { x: -dir.y, y: dir.x };
  const b = { x: tip.x - dir.x * 11, y: tip.y - dir.y * 11 };
  return `M ${tip.x} ${tip.y} L ${b.x + n.x * 5} ${b.y + n.y * 5} L ${b.x - n.x * 5} ${b.y - n.y * 5} Z`;
};

/**
 * A pre-drawn state diagram (#198 §7, §13.3): circles carry the state code; arrows curve to their
 * right-hand side so the two directions between a pair never overlap; a self-loop sits above its
 * circle (below for the bottom row); transitions that share an arrow stack their labels.
 * One goal per arrow, in state-table order.
 * - label mode: every arrow is drawn; the active one is accent with a "?" slot, done ones are
 *   solid with their label, later ones dashed and dim. The label is picked from chips. With more
 *   than `PREVIEW_ARROWS` arrows the later ones are not drawn: the diagram fills in as the student works.
 * - next mode: only answered arrows are drawn; the source circle has the halo; the destination is
 *   picked on the circles (one radiogroup, arrows move, Space/Enter picks).
 * The component never grades.
 */
export function StateDiagram({ id, states, positions, transitions, mode, done, labelOptions = [], inputName, state = "idle", disabled = false, onCheck }: StateDiagramProps) {
  const cells = positions;
  const { rows, at, spacing } = statePositions(cells);
  const pos = (code: string) => at[states.indexOf(code)];
  const finished = done >= transitions.length;
  const current = finished ? undefined : transitions[done];
  const editing = !!onCheck && !disabled && !finished && state !== "correct";
  const [picked, setPicked] = useState<string | null>(null);
  const [focusState, setFocusState] = useState(0);
  const circles = useRef<(SVGGElement | null)[]>([]);

  // Arrows: transitions with the same source and destination share one, with stacked labels.
  const arrows = new Map<string, { from: string; to: string; items: { index: number; label: string }[] }>();
  transitions.forEach((t, index) => {
    const key = `${t.from}>${t.to}`;
    if (!arrows.has(key)) arrows.set(key, { from: t.from, to: t.to, items: [] });
    arrows.get(key)!.items.push({ index, label: t.label });
  });

  // The drawing's bounds: every circle, every arrow's apex and every label slot, plus padding, so
  // nothing is clipped however far an arrow bends (#394).
  const geometry = new Map([...arrows.entries()].map(([key, a]) => [key, arrowGeometry(pos(a.from), pos(a.to), rows > 1 && cells[states.indexOf(a.from)][1] === rows - 1, spacing)]));
  const preview = arrows.size <= PREVIEW_ARROWS;
  // A dense diagram: a label that would sit on another arrow's label or on a circle moves down a line at a time until it is clear.
  if (!preview) {
    // the circles count too: a label never hides under one
    const placed: { x: number; y: number; h: number }[] = at.map((p) => ({ x: p.x, y: p.y, h: 2 * R }));
    for (const [key, g] of geometry) {
      const h = arrows.get(key)!.items.length * 18;
      const clash = () => placed.some((b) => Math.abs(b.x - g.label.x) < 44 && Math.abs(b.y - g.label.y) < (b.h + h) / 2);
      for (let tries = 0; tries < 4 && clash(); tries++) g.label = { x: g.label.x, y: g.label.y + 18 };
      placed.push({ x: g.label.x, y: g.label.y, h });
    }
  }
  const extent = [
    ...at.flatMap((p) => [{ x: p.x - R - 10, y: p.y - R - 10 }, { x: p.x + R + 10, y: p.y + R + 10 }]),
    ...[...geometry.entries()].flatMap(([key, g]) => {
      const lines = arrows.get(key)!.items.length;
      return [g.apex, { x: g.label.x - 26, y: g.label.y - 10 - lines * 9 }, { x: g.label.x + 26, y: g.label.y + 10 + lines * 9 }];
    }),
  ];
  const PADDING = 10;
  const minX = Math.min(...extent.map((p) => p.x)) - PADDING;
  const minY = Math.min(...extent.map((p) => p.y)) - PADDING;
  const width = Math.max(...extent.map((p) => p.x)) + PADDING - minX;
  const height = Math.max(...extent.map((p) => p.y)) + PADDING - minY;

  // Keep the active arrow's source in view inside a scrolling well (eight states on a phone).
  const scroller = useRef<HTMLDivElement>(null);
  const fade = useScrollFade(scroller);
  useEffect(() => {
    const box = scroller.current;
    if (!box || !current || box.scrollWidth <= box.clientWidth) return;
    const x = ((pos(current.from).x - minX) / width) * box.scrollWidth;
    box.scrollLeft = Math.max(0, x - box.clientWidth / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- when the goal changes
  }, [done]);

  const pick = (code: string) => editing && setPicked(code);
  function onCircleKey(e: KeyboardEvent<SVGGElement>, i: number) {
    const key = e.key;
    const to = key === "ArrowRight" || key === "ArrowDown" ? (i + 1) % states.length : key === "ArrowLeft" || key === "ArrowUp" ? (i - 1 + states.length) % states.length : undefined;
    if (to !== undefined) {
      setFocusState(to);
      circles.current[to]?.focus();
    } else if (key === " " || key === "Enter") pick(states[i]);
    else return;
    e.preventDefault();
  }

  const doneList = transitions.slice(0, done).map((t) => `${t.from} to ${t.to} on ${t.label}`);
  const summary = `State diagram with states ${states.join(", ")}. ${doneList.length ? `Arrows done: ${doneList.join("; ")}.` : "No arrows done yet."}`;
  const choosing = mode === "next" && editing;

  return (
    <div className={styles.root} data-diagram={id}>
      <div className={styles.well} ref={scroller} data-fade={fade} {...(fade === "none" ? {} : { tabIndex: 0, role: "group", "aria-label": "State diagram, scrolls sideways" })}>
        <svg viewBox={`${minX} ${minY} ${width} ${height}`} className={styles.svg} style={{ maxWidth: width, minWidth: Math.round(width * MIN_SCALE) }} {...(choosing ? {} : { role: "img", "aria-label": summary })} {...focusTarget("state-diagram")}>
          {choosing && <title>{summary}</title>}
          {/* arrows under the circles */}
          {[...arrows.values()].map((a) => {
            const shown = a.items.filter((it) => (mode === "label" ? preview || it.index <= done : it.index < done));
            if (!shown.length) return null;
            const isActive = mode === "label" && a.items.some((it) => it.index === done);
            const anyDone = a.items.some((it) => it.index < done);
            const kind = isActive ? "active" : anyDone || mode === "next" ? "done" : "later";
            const g = geometry.get(`${a.from}>${a.to}`)!;
            return (
              <g key={`${a.from}>${a.to}`} className={styles.arrow} data-arrow={`${a.from}>${a.to}`} data-state={kind}>
                <path d={g.d} className={styles.arrowLine} />
                <path d={head(g.tip, g.dir)} className={styles.arrowHead} />
              </g>
            );
          })}
          {/* labels in their own pass, above every arrow: a label's backing covers any line that passes under it */}
          {[...arrows.values()].map((a) => {
            const g = geometry.get(`${a.from}>${a.to}`)!;
            return (
              <g key={`${a.from}>${a.to}`} className={styles.labels}>
                {a.items.map((it, k) => {
                  const y = g.label.y + 5 + (k - (a.items.length - 1) / 2) * 18;
                  const isNow = mode === "label" && it.index === done;
                  const visible = it.index < done;
                  if (!visible && !isNow) return null;
                  return (
                    <g key={it.index}>
                      {isNow && <rect x={g.label.x - 20} y={y - 15} width="40" height="20" rx="5" className={styles.slot} />}
                      <text x={g.label.x} y={y} textAnchor="middle" className={`${styles.arrowLabel} ${isNow ? styles.arrowLabelNow : ""} mono`} data-label={it.index}>
                        {isNow ? (labelOptions[0]?.includes("/") ? "?/?" : "?") : it.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
          {/* states */}
          <g {...(choosing ? { role: "radiogroup", "aria-label": `Next state: ${states.join(", ")}` } : {})}>
            {states.map((code, i) => {
              const p = at[i];
              const isSource = mode === "next" && current?.from === code && !finished;
              const isPicked = choosing && picked === code;
              return (
                <g
                  key={code}
                  ref={(el) => {
                    circles.current[i] = el;
                  }}
                  className={`${styles.state} ${choosing ? styles.stateLive : ""}`}
                  data-source={isSource || undefined}
                  data-picked={isPicked || undefined}
                  {...(choosing ? { role: "radio", "aria-checked": isPicked, "aria-label": `State ${code}`, tabIndex: i === focusState ? 0 : -1, onClick: () => (setFocusState(i), pick(code)), onKeyDown: (e: KeyboardEvent<SVGGElement>) => onCircleKey(e, i) } : {})}
                  {...focusTarget(`state-${code}`)}
                >
                  {isSource && <circle cx={p.x} cy={p.y} r={R + 9} className={styles.halo} />}
                  <circle cx={p.x} cy={p.y} r={R} className={styles.circle} />
                  {isPicked && <circle cx={p.x} cy={p.y} r={R - 5} className={styles.ring} />}
                  <text x={p.x} y={p.y + 6} textAnchor="middle" className={`${styles.code} mono`}>
                    {code}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      {onCheck && !finished && (
        <form
          className={styles.answer}
          onSubmit={(e) => {
            e.preventDefault();
            if (editing && picked !== null) onCheck(picked);
          }}
        >
          {mode === "label" ? (
            <fieldset className={styles.chips} role="radiogroup" aria-label={`Label of the arrow from ${current!.from} to ${current!.to}`} aria-invalid={state === "incorrect" || undefined}>
              {labelOptions.map((option) => (
                <label key={option} className={`${styles.chip} ${picked === option ? styles.chipOn : ""} mono`}>
                  <input type="radio" name={`${id}-label`} value={option} checked={picked === option} disabled={!editing} onChange={() => setPicked(option)} {...focusTarget(`label-${option}`)} />
                  {option}
                </label>
              ))}
            </fieldset>
          ) : (
            <p className={styles.pickedLine} aria-live="polite">
              {picked === null ? `Tap the state the arrow goes to (${inputName} = ${current!.input}).` : `Next state: ${picked}`}
            </p>
          )}
          <button type="submit" className="btn btn-primary" disabled={!editing || picked === null}>
            Check arrow
          </button>
        </form>
      )}
    </div>
  );
}
