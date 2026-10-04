"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { focusTarget, type AnswerState } from "@/interactions/shared/types";
import styles from "./KarnaughMap.module.css";

export type MapCell = 0 | 1 | "X";

export interface MapLayout {
  rowVars: string[];
  colVars: string[];
  /** Axis codes in display order (Gray for two-bit axes). */
  rowCodes: number[];
  colCodes: number[];
  /** Minterm number of each cell, row by row in display order. */
  grid: number[][];
}

export interface MapGroup {
  /** Minterm numbers of the group's cells. */
  cells: number[];
  /** The group being worked on now (its term is asked): drawn with the halo. */
  now?: boolean;
}

export interface KarnaughMapProps {
  id: string;
  layout: MapLayout;
  /** Cell values by minterm number. In fill mode they are hidden until the fill is right. */
  values: MapCell[];
  /** fill: write every cell; group: pick the cells of one group; read: nothing to do. */
  mode: "fill" | "group" | "read";
  /** Accepted groups, outlined and numbered in order. */
  groups?: MapGroup[];
  /** Allow X while filling (the function has don't-cares). */
  allowX?: boolean;
  state?: AnswerState;
  /** After a wrong fill: minterm number of the first wrong cell (only that one is marked). */
  wrongCell?: number;
  disabled?: boolean;
  /** fill: one value per minterm number. */
  onFill?: (cells: MapCell[]) => void;
  /** group: the picked minterm numbers. */
  onGroup?: (cells: number[]) => void;
  checkLabel?: string;
}

const bitsOf = (code: number, width: number) => code.toString(2).padStart(width, "0");

/** Consecutive display indices as runs; a run that touches both edges of a 4-long axis wraps (two open halves). */
function runs(indices: number[], length: number): { start: number; size: number; openStart: boolean; openEnd: boolean }[] {
  const sorted = [...indices].sort((a, b) => a - b);
  const out: { start: number; size: number; openStart: boolean; openEnd: boolean }[] = [];
  for (const i of sorted) {
    const last = out[out.length - 1];
    if (last && last.start + last.size === i) last.size++;
    else out.push({ start: i, size: 1, openStart: false, openEnd: false });
  }
  // a group that covers the first and last index but not everything between continues around the edge
  if (out.length === 2 && out[0].start === 0 && out[1].start + out[1].size === length) {
    out[0].openStart = true;
    out[1].openEnd = true;
  }
  return out;
}

/** The outline pieces of a group in display coordinates: one rectangle, or halves / quarters when it wraps. */
export function groupPieces(layout: MapLayout, cells: number[]) {
  const rows = layout.grid.map((row, r) => (row.some((m) => cells.includes(m)) ? r : -1)).filter((r) => r >= 0);
  const cols = layout.grid[0].map((_, c) => (layout.grid.some((row) => cells.includes(row[c])) ? c : -1)).filter((c) => c >= 0);
  return runs(rows, layout.grid.length).flatMap((r) => runs(cols, layout.grid[0].length).map((c) => ({ row: r.start, rows: r.size, col: c.start, cols: c.size, openTop: r.openStart, openBottom: r.openEnd, openLeft: c.openStart, openRight: c.openEnd })));
}

/** Display indices where variable `k` of an axis is 1: where its bar goes. */
function barSpan(codes: number[], width: number, k: number): { start: number; size: number } {
  const on = codes.map((code, i) => ((code >> (width - 1 - k)) & 1 ? i : -1)).filter((i) => i >= 0);
  return { start: on[0], size: on.length };
}

/**
 * A Karnaugh map as the slides draw it (#198 §5): Gray-order axes, a split corner with the row
 * variables bottom-left and the column variables top-right, bars outside the grid where each
 * variable is 1, and a numbered outline per group (each with its own line style; a wrapping group
 * is open halves at opposite edges). One ARIA grid with a single tab stop: arrows move; in fill
 * mode Space/Enter cycle empty → 0 → 1 (→ X) and 0 / 1 / x type; in group mode Space/Enter pick a
 * cell and Escape clears. After a wrong fill only the first wrong cell is marked. Never grades.
 */
export function KarnaughMap({ id, layout, values, mode, groups = [], allowX = false, state = "idle", wrongCell, disabled = false, onFill, onGroup, checkLabel }: KarnaughMapProps) {
  const nRows = layout.grid.length;
  const nCols = layout.grid[0].length;
  const [cells, setCells] = useState<(MapCell | null)[]>(() => values.map(() => null));
  const [picked, setPicked] = useState<number[]>([]);
  const [focus, setFocus] = useState<[number, number]>([0, 0]);
  const refs = useRef<Map<string, HTMLTableCellElement>>(new Map());
  const editing = mode !== "read" && !disabled && state !== "correct";
  const pointAt = mode === "fill" && state === "incorrect" ? wrongCell : undefined;

  // After a wrong fill, move to the cell the tutor points at.
  useEffect(() => {
    if (pointAt === undefined || !editing) return;
    layout.grid.forEach((row, r) => row.forEach((m, c) => m === pointAt && refs.current.get(`${r}-${c}`)?.focus()));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when a new cell is pointed at
  }, [pointAt]);

  const cycle: (MapCell | null)[] = allowX ? [null, 0, 1, "X"] : [null, 0, 1];
  const setCell = (m: number, v: MapCell | null) => setCells((cs) => cs.map((x, k) => (k === m ? v : x)));
  const act = (m: number) => {
    if (mode === "fill") setCell(m, cycle[(cycle.indexOf(cells[m]) + 1) % cycle.length]);
    else setPicked((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m].sort((a, b) => a - b)));
  };
  const move = (r: number, c: number) => refs.current.get(`${Math.min(Math.max(r, 0), nRows - 1)}-${Math.min(Math.max(c, 0), nCols - 1)}`)?.focus();

  function onKeyDown(e: KeyboardEvent<HTMLTableCellElement>, r: number, c: number, m: number) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const key = e.key.toLowerCase();
    if (mode === "fill" && (key === "0" || key === "1" || (key === "x" && allowX))) {
      setCell(m, key === "x" ? "X" : key === "1" ? 1 : 0);
      // typing moves on in reading order
      if (c < nCols - 1) move(r, c + 1);
      else if (r < nRows - 1) move(r + 1, 0);
    } else if (key === " " || key === "enter") act(m);
    else if (mode === "fill" && (key === "backspace" || key === "delete")) setCell(m, null);
    else if (mode === "group" && key === "escape") setPicked([]);
    else if (key === "arrowright") move(r, c + 1);
    else if (key === "arrowleft") move(r, c - 1);
    else if (key === "arrowdown") move(r + 1, c);
    else if (key === "arrowup") move(r - 1, c);
    else if (key === "home") move(r, 0);
    else if (key === "end") move(r, nCols - 1);
    else return;
    e.preventDefault();
  }

  const rowName = (r: number) => `${layout.rowVars.join("")} = ${bitsOf(layout.rowCodes[r], layout.rowVars.length)}`;
  const colName = (c: number) => `${layout.colVars.join("")} = ${bitsOf(layout.colCodes[c], layout.colVars.length)}`;
  const shownValue = (m: number): MapCell | null => (mode === "fill" && state !== "correct" ? cells[m] : values[m]);
  const complete = mode === "fill" ? cells.every((c) => c !== null) : picked.length > 0;
  const vars = { "--rows": nRows, "--cols": nCols } as CSSProperties;

  return (
    <div className={styles.root} data-diagram={id}>
      <div className={styles.well}>
        <div className={styles.map} style={vars}>
          <table role="grid" className={styles.table} aria-label={`Karnaugh map, ${layout.rowVars.join("")} by ${layout.colVars.join("")}`} aria-readonly={!editing || undefined} {...focusTarget("kmap")}>
            <thead>
              <tr>
                <th className={styles.corner}>
                  <span className={styles.cornerRow}>{layout.rowVars.join("")}</span>
                  <span className={styles.cornerCol}>{layout.colVars.join("")}</span>
                </th>
                {layout.colCodes.map((code, c) => (
                  <th key={c} scope="col" className={`${styles.axis} mono`}>
                    {bitsOf(code, layout.colVars.length)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {layout.grid.map((row, r) => (
                <tr key={r}>
                  <th scope="row" className={`${styles.axis} mono`}>
                    {bitsOf(layout.rowCodes[r], layout.rowVars.length)}
                  </th>
                  {row.map((m, c) => {
                    const v = shownValue(m);
                    const isPicked = mode === "group" && picked.includes(m);
                    const wrong = pointAt === m;
                    const text = v === null ? "empty" : v === "X" ? "don't care" : String(v);
                    return (
                      <td
                        key={m}
                        role="gridcell"
                        ref={(el) => {
                          if (el) refs.current.set(`${r}-${c}`, el);
                          else refs.current.delete(`${r}-${c}`);
                        }}
                        tabIndex={editing ? (focus[0] === r && focus[1] === c ? 0 : -1) : undefined}
                        className={`${styles.cell} ${editing ? styles.live : ""} ${isPicked ? styles.picked : ""} ${wrong ? styles.wrong : ""}`}
                        aria-label={`m${m}, ${rowName(r)}, ${colName(c)}: ${text}${mode === "group" ? (isPicked ? ", in the group" : "") : ""}`}
                        aria-selected={mode === "group" && editing ? isPicked : undefined}
                        aria-readonly={!editing || undefined}
                        aria-invalid={wrong || undefined}
                        onClick={editing ? () => (setFocus([r, c]), act(m)) : undefined}
                        onFocus={() => setFocus([r, c])}
                        onKeyDown={editing ? (e) => onKeyDown(e, r, c, m) : undefined}
                        {...focusTarget(`cell-m${m}`)}
                      >
                        <span className={styles.minterm} aria-hidden="true">
                          m{m}
                        </span>
                        <span className={`${styles.value} ${v === "X" ? styles.dontCare : ""} mono`} aria-hidden="true">
                          {v === null ? "" : v === "X" ? "x" : v}
                        </span>
                        {wrong && (
                          <span className={styles.cross} aria-hidden="true">
                            ✕
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* group outlines over the cells: a line style and a numbered badge per group, never colour alone */}
          {groups.map((g, i) =>
            groupPieces(layout, g.cells).map((p, k) => (
              <span
                key={`${i}-${k}`}
                className={`${styles.group} ${g.now ? styles.groupNow : ""}`}
                data-group={i % 4}
                data-open={[p.openTop && "top", p.openBottom && "bottom", p.openLeft && "left", p.openRight && "right"].filter(Boolean).join(" ") || undefined}
                style={{ "--r": p.row, "--c": p.col, "--h": p.rows, "--w": p.cols, "--inset": `${4 + (i % 3) * 3}px` } as CSSProperties}
                aria-hidden="true"
              >
                <span className={styles.badge}>{i + 1}</span>
              </span>
            )),
          )}

          {/* bars outside the grid: where each variable is 1 */}
          {layout.colVars.map((v, k) => {
            const s = barSpan(layout.colCodes, layout.colVars.length, k);
            return (
              <span key={`c${v}`} className={styles.colBar} style={{ "--c": s.start, "--w": s.size, "--k": k } as CSSProperties} aria-hidden="true">
                {v}
              </span>
            );
          })}
          {layout.rowVars.map((v, k) => {
            const s = barSpan(layout.rowCodes, layout.rowVars.length, k);
            return (
              <span key={`r${v}`} className={styles.rowBar} style={{ "--r": s.start, "--h": s.size, "--k": k } as CSSProperties} aria-hidden="true">
                {v}
              </span>
            );
          })}
        </div>
      </div>
      {mode !== "read" && (
        <div className={styles.actions}>
          <button type="button" className="btn btn-primary" disabled={!editing || !complete} onClick={() => (mode === "fill" ? onFill?.(cells.map((c) => c ?? 0)) : onGroup?.(picked))}>
            {checkLabel ?? (mode === "fill" ? "Check map" : "Check group")}
          </button>
          {mode === "group" && (
            <>
              {/* touch users have no Escape: a quiet action clears the selection */}
              <button type="button" className="btn btn-quiet" disabled={!editing || picked.length === 0} onClick={() => setPicked([])}>
                Clear selection
              </button>
              <span className={styles.count} aria-live="polite">
                <span className={styles.badge} aria-hidden="true">
                  {groups.length + 1}
                </span>
                <span className="sr-only">Group {groups.length + 1}: </span>
                {picked.length} {picked.length === 1 ? "cell" : "cells"} selected
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
