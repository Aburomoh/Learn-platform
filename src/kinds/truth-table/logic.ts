import { envFor, evaluate, parseBool, type BoolExpr } from "@/content/boolean";
import type { KindLogic } from "../types";
import type { Cell, TableColumn, TruthTableSpec } from "./spec";

/**
 * `values`: one cell per row for the column of this step (fill mode; input columns too when the
 * spec says `fillInputs`). `rows`: the picked row indices (row-select mode). `choice`: what the
 * pair's data input gets (mux-pairs mode).
 */
export type TruthTableAnswer = { kind: "truth-table"; step: number; values?: (Cell | null)[]; rows?: number[]; choice?: PairChoice };

/** A mux data input: a constant, the data variable v, or its complement. */
export type PairChoice = "0" | "1" | "v" | "v'";

export interface MuxPair {
  /** The select value, = the data input's number (I0, I1 …). */
  select: number;
  /** Its two rows: data variable 0, then 1. */
  rows: [number, number];
  f: [Cell, Cell];
  choice: PairChoice;
}

/** The row pairs of a mux-pairs table: rows 2p and 2p + 1 share the select bits (the last input is the data variable). */
export function muxPairs(spec: TruthTableSpec): MuxPair[] {
  const target = spec.columns.find((c) => c.id === spec.target)!;
  const f = columnTruth(spec, target);
  return Array.from({ length: rowCount(spec) / 2 }, (_, p) => {
    const pair: [Cell, Cell] = [f[2 * p], f[2 * p + 1]];
    const choice: PairChoice = pair[0] === pair[1] ? (pair[0] === 1 ? "1" : "0") : pair[1] === 1 ? "v" : "v'";
    return { select: p, rows: [2 * p, 2 * p + 1], f: pair, choice };
  });
}

export const rowCount = (spec: TruthTableSpec) => 2 ** spec.inputs.length;

/** Row r's input bits, most significant input first: "0 1" for r = 1 with two inputs. */
export function rowLabel(spec: TruthTableSpec, r: number): string {
  return spec.inputs.map((_, i) => (r >> (spec.inputs.length - 1 - i)) & 1).join(" ");
}

/** Ascending binary column of input `i`. */
export function inputColumn(spec: TruthTableSpec, i: number): Cell[] {
  return Array.from({ length: rowCount(spec) }, (_, r) => ((r >> (spec.inputs.length - 1 - i)) & 1) as 0 | 1);
}

function exprOf(spec: TruthTableSpec, c: TableColumn): BoolExpr {
  return parseBool(c.expr!, { vars: spec.inputs });
}

function evalColumn(spec: TruthTableSpec, e: BoolExpr): Cell[] {
  return Array.from({ length: rowCount(spec) }, (_, r) => evaluate(e, envFor(spec.inputs, r)));
}

/** A column's truth: computed from its expression, or its authored values (X allowed). */
export function columnTruth(spec: TruthTableSpec, c: TableColumn): Cell[] {
  return c.values ?? evalColumn(spec, exprOf(spec, c));
}

/** What the student writes, in order: input columns (if asked), then every column not given. */
export type TableGoal = { type: "input"; index: number } | { type: "column"; column: TableColumn };

export function goals(spec: TruthTableSpec): TableGoal[] {
  if (spec.mode === "row-select") return [];
  const inputs: TableGoal[] = spec.fillInputs ? spec.inputs.map((_, index) => ({ type: "input", index })) : [];
  return [...inputs, ...spec.columns.filter((c) => !c.given).map((column) => ({ type: "column" as const, column }))];
}

/* ---------- mistake models: the same expression with one systematic slip ---------- */

function mapExpr(e: BoolExpr, f: (x: BoolExpr) => BoolExpr): BoolExpr {
  const inner: BoolExpr = e.type === "not" ? { ...e, arg: mapExpr(e.arg, f) } : e.type === "and" || e.type === "or" || e.type === "xor" ? { ...e, args: e.args.map((a) => mapExpr(a, f)) } : e;
  return f(inner);
}
const swapAndOr = (e: BoolExpr) => mapExpr(e, (x) => (x.type === "and" ? { type: "or", args: x.args } : x.type === "or" ? { type: "and", args: x.args } : x));
const dropNots = (e: BoolExpr) => mapExpr(e, (x) => (x.type === "not" ? x.arg : x));

const sameCells = (a: (Cell | null)[], b: Cell[]) => a.length === b.length && a.every((v, i) => v === b[i]);

export const truthTable: KindLogic<TruthTableSpec, TruthTableAnswer> = {
  grade(variant, answer) {
    const spec = variant.spec;
    const find = (type: string) => variant.misconceptions.find((m) => m.detect.type === type)?.id;

    if (spec.mode === "mux-pairs") {
      const pairs = muxPairs(spec);
      const pair = pairs[answer.step];
      if (!pair) throw new Error(`No mux-pairs step ${answer.step}`);
      const given = answer.choice;
      const normalized = `I${pair.select}=${given ?? ""}`;
      if (given === pair.choice) return { correct: true, normalized, partial: answer.step < pairs.length - 1 || undefined };
      const variable = (c?: PairChoice) => c === "v" || c === "v'";
      const kind =
        variable(given) && variable(pair.choice) ? "pair-complement-swapped"
        : !variable(given) && given !== undefined && variable(pair.choice) ? "pair-constant-for-variable"
        : variable(given) && !variable(pair.choice) ? "pair-variable-for-constant"
        : undefined;
      return { correct: false, normalized, misconceptionId: kind ? find(kind) : undefined };
    }

    if (spec.mode === "row-select") {
      const target = spec.columns.find((c) => c.id === spec.target)!;
      const truth = columnTruth(spec, target);
      const want = truth.flatMap((v, r) => (v === 1 ? [r] : []));
      const picked = [...new Set(answer.rows ?? [])].sort((a, b) => a - b);
      const normalized = `rows:${picked.join(",")}`;
      const correct = picked.length === want.length && picked.every((r, i) => r === want[i]);
      if (correct) return { correct, normalized };
      const zeros = truth.flatMap((v, r) => (v === 0 ? [r] : []));
      const rowsOf = (cells: Cell[]) => cells.flatMap((v, r) => (v === 1 ? [r] : [])).join(",");
      const swapped = target.expr ? rowsOf(evalColumn(spec, swapAndOr(exprOf(spec, target)))) : undefined;
      const kind = picked.join(",") === zeros.join(",") ? "rows-inverted" : swapped !== undefined && picked.join(",") === swapped && swapped !== want.join(",") ? "and-or-swapped" : undefined;
      const wrong = [...picked.filter((r) => !want.includes(r)), ...want.filter((r) => !picked.includes(r))].sort((a, b) => a - b);
      return { correct, normalized, misconceptionId: kind ? find(kind) : undefined, wrongCells: { first: wrong[0], count: wrong.length } };
    }

    const all = goals(spec);
    const goal = all[answer.step];
    if (!goal) throw new Error(`No truth-table step ${answer.step}`);
    const values = answer.values ?? [];
    if (values.length !== rowCount(spec)) throw new Error(`Step ${answer.step} needs ${rowCount(spec)} cells`);
    const truth = goal.type === "input" ? inputColumn(spec, goal.index) : columnTruth(spec, goal.column);
    const label = goal.type === "input" ? spec.inputs[goal.index] : goal.column.id;
    const normalized = `${label}=${values.map((v) => v ?? "_").join("")}`;
    const correct = sameCells(values, truth);
    if (correct) return { correct, normalized, partial: answer.step < all.length - 1 };

    const wrong = values.flatMap((v, r) => (v !== truth[r] ? [r] : []));
    let kind: string | undefined;
    if (goal.type === "input") {
      // the student wrote another input's column here: the significance (row order) is off
      const asOther = spec.inputs.some((_, i) => i !== goal.index && sameCells(values, inputColumn(spec, i)));
      if (asOther) kind = "rows-out-of-order";
    } else if (truth.includes("X") && sameCells(values, truth.map((v) => (v === "X" ? 0 : v)))) {
      kind = "dontcare-as-zero";
    } else if (goal.column.slipValues?.excitationReversed && sameCells(values, goal.column.slipValues.excitationReversed)) {
      kind = "excitation-reversed";
    } else if (goal.column.expr) {
      const e = exprOf(spec, goal.column);
      const swapped = evalColumn(spec, swapAndOr(e));
      const noNots = evalColumn(spec, dropNots(e));
      if (sameCells(values, noNots) && !sameCells(truth, noNots)) kind = "not-missing";
      else if (sameCells(values, swapped) && !sameCells(truth, swapped)) kind = "and-or-swapped";
    }
    return { correct, normalized, misconceptionId: kind ? find(kind) : undefined, wrongCells: { first: wrong[0], count: wrong.length } };
  },

  // One goal per column (ADR-0007); row-select is a single goal.
  steps: {
    count: (spec) => (spec.mode === "row-select" ? 1 : spec.mode === "mux-pairs" ? rowCount(spec) / 2 : goals(spec).length),
    tag: (spec, i) => (spec.mode === "row-select" ? "rows" : spec.mode === "mux-pairs" ? "pair" : goals(spec)[i].type === "input" ? "inputs" : "column"),
    vars: (spec, i) => {
      const base = { rowCount: rowCount(spec), inputCount: spec.inputs.length, stepNumber: i + 1 };
      if (spec.mode === "mux-pairs") {
        const pairs = muxPairs(spec);
        const p = pairs[i];
        const data = spec.inputs.at(-1)!;
        const name = (c: PairChoice) => (c === "v" ? data : c === "v'" ? `${data}′` : c);
        return {
          ...base,
          pairNumber: i + 1,
          pairCount: pairs.length,
          inputName: `I${p.select}`,
          dataVar: data,
          selectBits: rowLabel(spec, p.rows[0]).split(" ").slice(0, -1).join(" "),
          pairValues: p.f.join(" "),
          pairChoice: name(p.choice),
        };
      }
      if (spec.mode === "row-select") {
        const target = spec.columns.find((c) => c.id === spec.target)!;
        return { ...base, columnLabel: target.label, columnCount: 1 };
      }
      const all = goals(spec);
      const goal = all[i];
      const columnLabel = goal.type === "input" ? spec.inputs[goal.index] : goal.column.label;
      const columnExpr = goal.type === "column" && goal.column.expr ? goal.column.expr : "";
      // the column's values top to bottom, for the last hint rung only (#225)
      const columnValues = (goal.type === "input" ? inputColumn(spec, goal.index) : columnTruth(spec, goal.column)).join(" ");
      return { ...base, columnLabel, columnExpr, columnValues, columnCount: all.length };
    },
  },
};
