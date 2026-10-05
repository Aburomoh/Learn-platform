"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { focusTarget, type AnswerState } from "@/interactions/shared/types";
import { useScrollFade } from "@/interactions/shared/useScrollFade";
import styles from "./TruthTable.module.css";

/** A table cell as the spec stores it: 0, 1, or X (don't-care). */
export type TruthCell = 0 | 1 | "X";

export interface TruthColumn {
  id: string;
  /** Header as on the slides, e.g. "A", "AB′", "F", "m". */
  header: string;
  /** Inputs come first; a rule separates them from derived columns, and derived ones from the output. */
  role: "input" | "derived" | "output" | "minterm";
  /** One value per row, ascending binary order. */
  values: (TruthCell | string)[];
  /** Always shown filled (a column the student reads but does not write). */
  given?: boolean;
  /** Two-level header for state tables: "Present state", "Next state"… */
  group?: string;
}

export interface TruthTableProps {
  id: string;
  columns: TruthColumn[];
  /** Name of each row for screen readers and the tutor, e.g. "0 1". */
  rowNames: string[];
  /**
   * Fill mode: index of the column being filled (one column per goal, ADR-0007). Earlier columns
   * are done and show their values; later ones are dim and empty. Omitted: every column is shown.
   */
  activeColumn?: number;
  /** Row-select mode: a pick column after the table; `onCheck` gets the picked rows. */
  select?: { label: string; picked?: number[] };
  /**
   * Mux-pairs mode (#308): a last column with one cell per pair of rows (rows 2p and 2p + 1),
   * e.g. "I2 = z′". `values[p]` is shown for a done pair, "?" for the `active` one, nothing later.
   * The active pair's two rows carry the halo. The answer chips live in the kind's view.
   */
  pairs?: { header: string; names: string[]; values: string[]; active?: number; done: number };
  /** Explain mode: read-only; the active column shows this many rows from the top. */
  revealed?: number;
  /** Allow X (don't care) in the active column. */
  allowX?: boolean;
  /** After Check: "incorrect" marks `wrongRow` only; "correct" locks the table. */
  state?: AnswerState;
  /** First wrong row after a wrong check (only that one is marked, #198 §1). */
  wrongRow?: number;
  disabled?: boolean;
  /** Practice: fill mode sends the active column's cells, select mode the picked rows (as numbers). */
  onCheck?: (answer: { values: (TruthCell | null)[] } | { rows: number[] }) => void;
  checkLabel?: string;
}

/** Tables longer than this repeat their column labels after every this many rows. */
const HEADER_EVERY = 8;

const CYCLE: (TruthCell | null)[] = [null, 0, 1];
const CYCLE_X: (TruthCell | null)[] = [null, 0, 1, "X"];
const show = (v: TruthCell | string | null | undefined) => (v === null || v === undefined ? "" : String(v));

/** Header bands for state tables: runs of the same `group`, with a soft colour per band (a grouping cue only). */
function groupRuns(columns: TruthColumn[]): { label: string; span: number; band: number }[] {
  const runs: { label: string; span: number; band: number }[] = [];
  let band = 0;
  for (const c of columns) {
    const label = c.group ?? "";
    const last = runs[runs.length - 1];
    if (last && last.label === label) last.span++;
    else runs.push({ label, span: 1, band: label ? band++ % 4 : -1 });
  }
  return runs;
}

/**
 * A truth table (#198 §2). Inputs on the left, derived columns, the output last, with rules
 * between the groups. Fill mode: the active column is one ARIA grid stop; arrows move, Space/Enter
 * cycle empty → 0 → 1 (→ X), and 0 / 1 / x type directly. Row-select mode: a pick column whose
 * cells toggle. After a wrong Check only the first wrong cell is marked and the student's entries
 * stay. The component never grades.
 */
export function TruthTable({ id, columns, rowNames, activeColumn, select, pairs, revealed, allowX = false, state = "idle", wrongRow, disabled = false, onCheck, checkLabel }: TruthTableProps) {
  const rows = rowNames.length;
  const [cells, setCells] = useState<(TruthCell | null)[]>(() => Array.from({ length: rows }, () => null));
  const [picked, setPicked] = useState<number[]>(() => select?.picked ?? []);
  const [focusRow, setFocusRow] = useState(0);
  const refs = useRef<(HTMLTableCellElement | null)[]>([]);
  const well = useRef<HTMLDivElement>(null);
  const table = useRef<HTMLTableElement>(null);
  const fade = useScrollFade(well);
  const editing = !!onCheck && !disabled && state !== "correct" && revealed === undefined;
  const fillEditing = editing && !select && activeColumn !== undefined;
  const selectEditing = editing && !!select;
  const pointAt = state === "incorrect" ? wrongRow : undefined;
  const active = activeColumn === undefined ? undefined : columns[activeColumn];
  const groups = columns.some((c) => c.group) ? groupRuns(columns) : null;
  const bandOf = (col: number) => {
    if (!groups) return -1;
    let i = 0;
    for (const g of groups) {
      if (col < i + g.span) return g.band;
      i += g.span;
    }
    return -1;
  };

  // A wide table scrolls sideways on a phone. The given input columns (a state table's present
  // state and input) stay put on the left, so the student still reads them while filling a column
  // far to the right (#508). Not when the student fills the inputs themselves.
  const sticks = columns.every((c) => c.role !== "input" || c.given);
  const stuck = columns.map((c) => sticks && c.role === "input");
  const lastStuck = stuck.lastIndexOf(true);
  const firstStuck = stuck.indexOf(true);
  const stuckKey = stuck.join();
  useEffect(() => {
    const el = table.current;
    if (!el || lastStuck < 0) return;
    // each stuck column sits after the stuck columns before it: offsets come from the drawn widths
    const place = () => {
      const lefts: number[] = [];
      let left = 0;
      el.querySelectorAll<HTMLElement>("thead tr:last-child th").forEach((th, col) => {
        lefts[col] = left;
        if (th.dataset.stick !== undefined) left += th.getBoundingClientRect().width;
      });
      el.querySelectorAll<HTMLElement>("[data-stick]").forEach((cell) => {
        cell.style.left = `${lefts[Number(cell.dataset.stick)] ?? 0}px`;
      });
    };
    place();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(place);
    observer?.observe(el);
    return () => observer?.disconnect();
  }, [stuckKey, lastStuck, rows]);
  const stick = (col: number) => (stuck[col] ? `${styles.stick} ${col === firstStuck ? styles.firstStick : ""} ${col === lastStuck ? styles.lastStick : ""}` : "");
  // A long table's headers scroll off the top of the screen: the column labels are repeated after
  // every 8 rows (labels only, hidden from assistive technology, which has the real headers).
  const repeatHeads = rows > HEADER_EVERY;
  const labelRow = (key: string) => (
    <tr key={key} aria-hidden="true" data-repeat="">
      {columns.map((c, col) => (
        <td key={c.id} className={`${styles.head} ${styles.repeat} ${stick(col)} ${ruled(col) ? styles.rule : ""} ${col === activeColumn && revealed === undefined && state !== "correct" ? styles.now : ""} ${isLater(col) ? styles.later : ""} mono`} data-stick={stuck[col] ? col : undefined}>
          {c.header}
        </td>
      ))}
      {select && <td className={`${styles.head} ${styles.repeat} ${styles.rule}`}>{select.label}</td>}
      {pairs && <td className={`${styles.head} ${styles.repeat} ${styles.rule}`}>{pairs.header}</td>}
    </tr>
  );

  // Keep the active column in view inside a scrolling well (16-row tables on phones).
  useEffect(() => {
    refs.current[0]?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [activeColumn]);

  // After a wrong check, move to the cell the tutor points at.
  useEffect(() => {
    if (pointAt === undefined || !editing) return;
    refs.current[pointAt]?.focus(); // onFocus moves the tab stop there
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when a new cell is pointed at
  }, [pointAt]);

  const cycle = allowX ? CYCLE_X : CYCLE;
  const setCell = (row: number, value: TruthCell | null) => setCells((c) => c.map((x, k) => (k === row ? value : x)));
  const toggle = (row: number) => setPicked((p) => (p.includes(row) ? p.filter((r) => r !== row) : [...p, row].sort((a, b) => a - b)));
  const advance = (row: number) => (select ? toggle(row) : setCell(row, cycle[(cycle.indexOf(cells[row]) + 1) % cycle.length]));
  const move = (row: number) => refs.current[Math.min(Math.max(row, 0), rows - 1)]?.focus();

  function onKeyDown(e: KeyboardEvent<HTMLTableCellElement>, row: number) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const key = e.key.toLowerCase();
    if (!select && (key === "0" || key === "1" || (key === "x" && allowX))) {
      setCell(row, key === "x" ? "X" : key === "1" ? 1 : 0);
      if (row < rows - 1) move(row + 1);
    } else if (key === " " || key === "enter") advance(row);
    else if (!select && (key === "backspace" || key === "delete")) setCell(row, null);
    else if (key === "arrowdown") move(row + 1);
    else if (key === "arrowup") move(row - 1);
    else if (key === "home") move(0);
    else if (key === "end") move(rows - 1);
    else return;
    e.preventDefault();
  }

  const shown = (col: number, row: number): string => {
    const c = columns[col];
    if (activeColumn === undefined || c.given || col < activeColumn) return show(c.values[row]);
    if (col > activeColumn) return "";
    if (revealed !== undefined) return row < revealed ? show(c.values[row]) : "?";
    return state === "correct" ? show(c.values[row]) : show(cells[row]);
  };
  const isLater = (col: number) => activeColumn !== undefined && col > activeColumn && !columns[col].given;

  // a rule after the inputs and before the output (stuck inputs carry that rule as their own right edge)
  const ruled = (col: number) => col > 0 && col - 1 !== lastStuck && columns[col].role !== columns[col - 1].role && (columns[col - 1].role === "input" || columns[col].role === "output");
  const complete = select ? true : cells.every((c) => c !== null);
  const label = active ? `Truth table, filling column ${active.header}` : select ? `Truth table, ${select.label}` : pairs ? `Truth table, ${pairs.header} per pair of rows` : "Truth table";

  const editCell = (key: string, row: number, content: ReactNode, name: string, extra: string, ariaSelected?: boolean) => {
    const wrong = pointAt === row;
    return (
      <td
        key={key}
        role="gridcell"
        ref={(el) => {
          refs.current[row] = el;
        }}
        tabIndex={row === focusRow ? 0 : -1}
        className={`${styles.cell} ${styles.input} ${extra} ${wrong ? styles.wrong : ""} mono`}
        aria-label={name}
        aria-invalid={wrong || undefined}
        aria-selected={ariaSelected}
        onClick={() => {
          setFocusRow(row);
          advance(row);
        }}
        onFocus={() => setFocusRow(row)}
        onKeyDown={(e) => onKeyDown(e, row)}
        {...focusTarget(`cell-${row}`)}
      >
        <span className={styles.box}>
          {content}
          {wrong && (
            <span className={styles.cross} aria-hidden="true">
              ✕
            </span>
          )}
        </span>
      </td>
    );
  };

  return (
    <div className={styles.root} data-diagram={id}>
      <div ref={well} className={styles.well} data-fade={fade} data-sticky={lastStuck >= 0 ? "" : undefined}>
        <table ref={table} role="grid" className={styles.table} aria-label={label} aria-readonly={!editing || undefined} {...focusTarget("truth-table")}>
          <thead>
            {groups && (
              <tr>
                {groups.map((g, i) => {
                  const start = groups.slice(0, i).reduce((n, x) => n + x.span, 0);
                  const all = stuck.slice(start, start + g.span).every(Boolean);
                  return (
                    <th key={i} scope="colgroup" colSpan={g.span} className={`${styles.group} ${all ? `${styles.stick} ${start === firstStuck ? styles.firstStick : ""} ${start + g.span - 1 === lastStuck ? styles.lastStick : ""}` : ""}`} data-band={g.band >= 0 ? g.band : undefined} data-stick={all ? start : undefined}>
                      {g.label}
                    </th>
                  );
                })}
                {select && <th className={styles.group} />}
              </tr>
            )}
            <tr>
              {columns.map((c, col) => (
                <th
                  key={c.id}
                  scope="col"
                  className={`${styles.head} ${stick(col)} ${ruled(col) ? styles.rule : ""} ${col === activeColumn && revealed === undefined && state !== "correct" ? styles.now : ""} ${isLater(col) ? styles.later : ""} mono`}
                  data-band={bandOf(col) >= 0 ? bandOf(col) : undefined}
                  data-stick={stuck[col] ? col : undefined}
                  {...focusTarget(`column-${c.id}`)}
                >
                  {c.header}
                </th>
              ))}
              {select && (
                <th scope="col" className={`${styles.head} ${styles.rule} ${styles.now}`}>
                  {select.label}
                </th>
              )}
              {pairs && (
                <th scope="col" className={`${styles.head} ${styles.rule}`}>
                  {pairs.header}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rowNames.flatMap((name, row) => [
              <tr key={row} className={`${styles.row} ${pairs && Math.floor(row / 2) % 2 === 1 ? styles.pairBand : ""}`} data-pair-now={pairs && pairs.active === Math.floor(row / 2) ? "" : undefined}>
                {columns.map((c, col) => {
                  const cls = `${ruled(col) ? styles.rule : ""} ${col === activeColumn || (pairs && pairs.active === Math.floor(row / 2)) ? styles.now : ""} ${isLater(col) ? styles.later : ""}`;
                  if (col === activeColumn && fillEditing)
                    return editCell(c.id, row, show(cells[row]), `Row ${name}, column ${c.header}, ${show(cells[row]) || "empty"}`, cls);
                  const value = shown(col, row);
                  return (
                    <td key={c.id} role="gridcell" className={`${styles.cell} ${stick(col)} ${cls} mono`} data-band={bandOf(col) >= 0 ? bandOf(col) : undefined} data-stick={stuck[col] ? col : undefined} aria-readonly="true" aria-label={isLater(col) ? `Row ${name}, column ${c.header}, later` : undefined}>
                      {value === "?" ? <span className={styles.unknown}>?</span> : value}
                    </td>
                  );
                })}
                {select &&
                  (selectEditing ? (
                    editCell("pick", row, picked.includes(row) ? "✓" : "", `Row ${name}, ${picked.includes(row) ? "picked" : "not picked"}`, `${styles.rule} ${styles.now}`, picked.includes(row))
                  ) : (
                    <td key="pick" role="gridcell" className={`${styles.cell} ${styles.rule} mono`} aria-readonly="true" aria-selected={picked.includes(row)}>
                      {picked.includes(row) ? "✓" : ""}
                    </td>
                  ))}
                {pairs && row % 2 === 0 && (
                  <td
                    role="gridcell"
                    rowSpan={2}
                    className={`${styles.cell} ${styles.pair} ${styles.rule} ${pairs.active === row / 2 ? styles.now : ""} mono`}
                    aria-readonly="true"
                    aria-label={`${pairs.names[row / 2]}: ${row / 2 < pairs.done ? pairs.values[row / 2] : pairs.active === row / 2 ? "to find" : "later"}`}
                    data-pair={row / 2}
                    {...focusTarget(`pair-${row / 2}`)}
                  >
                    {row / 2 < pairs.done ? (
                      <>
                        {pairs.names[row / 2]} = <strong>{pairs.values[row / 2]}</strong>
                      </>
                    ) : pairs.active === row / 2 ? (
                      <>
                        {pairs.names[row / 2]} = <span className={styles.unknown}>?</span>
                      </>
                    ) : (
                      <span className={styles.later}>{pairs.names[row / 2]}</span>
                    )}
                  </td>
                )}
              </tr>,
              repeatHeads && (row + 1) % HEADER_EVERY === 0 ? labelRow(`labels-${row}`) : null,
            ])}
          </tbody>
        </table>
      </div>
      {onCheck && revealed === undefined && (select || activeColumn !== undefined) && (
        <div className={styles.actions}>
          <button type="button" className="btn btn-primary" disabled={!editing || !complete} onClick={() => onCheck(select ? { rows: picked } : { values: cells })}>
            {checkLabel ?? (select ? "Check rows" : "Check column")}
          </button>
        </div>
      )}
    </div>
  );
}
