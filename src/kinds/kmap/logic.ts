import { BooleanParseError, covers, cubeLiterals, envFor, evaluate, formatBool, formatCube, minimalCovers, parseBool, primeImplicants, sigma, type BoolExpr, type Cube } from "@/content/boolean";
import type { KindLogic } from "../types";
import type { KmapSpec } from "./spec";

export type Cell = 0 | 1 | "X";

/**
 * Fill (`cells`, one value per minterm number), a group (`group`: its minterm numbers, with the
 * groups accepted so far in `previous`), its term (`group` again and `term`), then F (`expr`).
 */
export type KmapAnswer = { kind: "kmap"; step: number; cells?: Cell[]; group?: number[]; previous?: number[][]; term?: string; expr?: string };

/** Gray order of a 2-bit axis, as on the slides: 00, 01, 11, 10. */
const GRAY = [0, 1, 3, 2];

export interface KmapLayout {
  rowVars: string[];
  colVars: string[];
  /** Axis codes in display order (Gray for two-bit axes). */
  rowCodes: number[];
  colCodes: number[];
  /** Minterm number of each cell, row by row in display order. */
  grid: number[][];
}

/** The slides' layout: 2 × 2 (A | B), 2 × 4 (A | BC) or 4 × 4 (AB | CD), axes in Gray order. */
export function kmapLayout(vars: string[]): KmapLayout {
  const rowBits = vars.length === 4 ? 2 : 1;
  const colBits = vars.length - rowBits;
  const codes = (bits: number) => (bits === 2 ? GRAY : [0, 1]);
  const rowCodes = codes(rowBits);
  const colCodes = codes(colBits);
  return { rowVars: vars.slice(0, rowBits), colVars: vars.slice(rowBits), rowCodes, colCodes, grid: rowCodes.map((r) => colCodes.map((c) => (r << colBits) | c)) };
}

/** The value each cell holds: 1, 0 or X (don't-care), indexed by minterm number. */
export function cellValues(spec: KmapSpec): Cell[] {
  return Array.from({ length: 2 ** spec.vars.length }, (_, m) => (spec.dontCares.includes(m) ? "X" : spec.minterms.includes(m) ? 1 : 0));
}

const popcount = (x: number) => {
  let n = 0;
  for (; x; x &= x - 1) n++;
  return n;
};

/** The cube a set of cells forms, or null when it is not a (wrapping) rectangle of 2^k cells. */
export function cubeOf(cells: number[]): Cube | null {
  const set = [...new Set(cells)];
  if (!set.length || (set.length & (set.length - 1)) !== 0) return null;
  const mask = set.reduce((acc, m) => acc | (m ^ set[0]), 0);
  if (2 ** popcount(mask) !== set.length) return null;
  const bits = set[0] & ~mask;
  return set.every((m) => (m & ~mask) === bits) ? { bits, mask } : null;
}

const sameCube = (a: Cube, b: Cube) => a.mask === b.mask && a.bits === b.bits;

/** Every minimal cover of the map (any of them is accepted). */
export function kmapCovers(spec: KmapSpec): Cube[][] {
  return minimalCovers(spec.vars.length, spec.minterms, spec.dontCares);
}

/** How many groups a minimal cover has: the same for every minimal cover. */
export function groupCount(spec: KmapSpec): number {
  return kmapCovers(spec)[0].length;
}

/** A product of literals as a cube over `vars`, or null (not a single product, or x·x′). */
export function productCube(e: BoolExpr, vars: string[]): Cube | null {
  const n = vars.length;
  const factors = e.type === "and" ? e.args : [e];
  let bits = 0;
  let fixed = 0;
  for (const f of factors) {
    const [name, value] = f.type === "var" ? [f.name, 1] : f.type === "not" && f.arg.type === "var" ? [f.arg.name, 0] : [undefined, 0];
    if (name === undefined) return f.type === "const" && f.value === 1 && factors.length === 1 ? { bits: 0, mask: 2 ** n - 1 } : null;
    const bit = 1 << (n - 1 - vars.indexOf(name));
    if (fixed & bit) {
      if (((bits & bit) !== 0) !== (value === 1)) return null;
      continue;
    }
    fixed |= bit;
    if (value) bits |= bit;
  }
  return { bits, mask: (2 ** n - 1) & ~fixed };
}

const stepsOf = (spec: KmapSpec) => (spec.fill ? 1 : 0);

type Tag = "fill" | "group" | "term" | "answer";

/** What step `i` asks for, and for a group or term, which group (0-based). */
export function goalOf(spec: KmapSpec, i: number): { tag: Tag; group?: number } {
  const first = stepsOf(spec);
  if (i < first) return { tag: "fill" };
  const k = groupCount(spec);
  const j = i - first;
  if (j < 2 * k) return { tag: j % 2 === 0 ? "group" : "term", group: Math.floor(j / 2) };
  return { tag: "answer" };
}

/** Swap the last two codes of each two-bit axis: the map filled as if it were in binary order. */
function binaryOrderSlip(spec: KmapSpec, truth: Cell[]): Cell[] {
  const { rowCodes, colCodes } = kmapLayout(spec.vars);
  const colBits = spec.vars.length - (spec.vars.length === 4 ? 2 : 1);
  const swap = (c: number, codes: number[]) => (codes.length === 4 ? (c === 2 ? 3 : c === 3 ? 2 : c) : c);
  const out: Cell[] = [...truth];
  for (let m = 0; m < truth.length; m++) {
    const r = m >> colBits;
    const c = m & ((1 << colBits) - 1);
    out[(swap(r, rowCodes) << colBits) | swap(c, colCodes)] = truth[m];
  }
  return out;
}

export const kmap: KindLogic<KmapSpec, KmapAnswer> = {
  grade(variant, answer) {
    const spec = variant.spec;
    const n = spec.vars.length;
    const find = (type: string) => variant.misconceptions.find((m) => m.detect.type === type)?.id;
    const goal = goalOf(spec, answer.step);
    const truth = cellValues(spec);

    if (goal.tag === "fill") {
      const cells = answer.cells ?? [];
      const normalized = `fill:${cells.join("")}`;
      const order = kmapLayout(spec.vars).grid.flat();
      const wrong = order.filter((m) => cells[m] !== truth[m]);
      if (!wrong.length) return { correct: true, normalized, partial: true };
      const same = (xs: Cell[]) => xs.every((v, m) => cells[m] === v);
      const slip = same(binaryOrderSlip(spec, truth)) ? "fill-binary-order" : spec.dontCares.length && same(truth.map((v) => (v === "X" ? 1 : v))) ? "fill-dontcare-as-one" : undefined;
      // first wrong cell in reading order (its minterm number) and how many (UX §1)
      return { correct: false, normalized, misconceptionId: slip ? find(slip) : undefined, wrongCells: { first: wrong[0], count: wrong.length } };
    }

    if (goal.tag === "group") {
      const cells = [...new Set(answer.group ?? [])].sort((a, b) => a - b);
      const normalized = `group${(goal.group ?? 0) + 1}:${cells.join(",")}`;
      const cube = cubeOf(cells);
      if (!cube) return { correct: false, normalized, misconceptionId: cells.length ? find("group-shape") : undefined };
      if (cells.some((m) => truth[m] === 0)) return { correct: false, normalized, misconceptionId: find("group-covers-zero") };
      if (cells.every((m) => truth[m] === "X")) return { correct: false, normalized, misconceptionId: find("group-only-dontcares") };
      const chosen = [...(answer.previous ?? []).map(cubeOf).filter((c): c is Cube => c !== null), cube];
      const fits = kmapCovers(spec).some((cover) => chosen.every((c) => cover.some((d) => sameCube(c, d))));
      const duplicate = (answer.previous ?? []).some((p) => { const c = cubeOf(p); return c !== null && sameCube(c, cube); });
      if (fits && !duplicate) return { correct: true, normalized, partial: true };
      const prime = !primeImplicants(spec.minterms, spec.dontCares).some((p) => p.mask !== cube.mask && (p.mask & cube.mask) === cube.mask && covers(p, cube.bits));
      return { correct: false, normalized, misconceptionId: find(prime ? "group-not-needed" : "group-too-small") };
    }

    if (goal.tag === "term") {
      const cube = cubeOf(answer.group ?? []);
      let e: BoolExpr;
      try {
        e = parseBool(answer.term ?? "", { vars: spec.vars });
      } catch (err) {
        if (!(err instanceof BooleanParseError)) throw err;
        return { correct: false, normalized: (answer.term ?? "").trim() };
      }
      const normalized = formatBool(e);
      const t = productCube(e, spec.vars);
      if (cube && t && sameCube(t, cube)) return { correct: true, normalized, partial: true };
      if (!cube || !t) return { correct: false, normalized };
      // more literals than the group allows, all agreeing with it: a changing variable was kept
      if (t.mask !== cube.mask && (t.mask & cube.mask) === t.mask && (t.bits & ~cube.mask) === cube.bits) return { correct: false, normalized, misconceptionId: find("term-keeps-changing") };
      if (t.mask === cube.mask) return { correct: false, normalized, misconceptionId: find("term-wrong-complement") };
      return { correct: false, normalized };
    }

    // F: right on every cell that is not a don't-care, and as small as a minimal cover
    let e: BoolExpr;
    try {
      e = parseBool(answer.expr ?? "", { vars: spec.vars });
    } catch (err) {
      if (!(err instanceof BooleanParseError)) throw err;
      return { correct: false, normalized: (answer.expr ?? "").trim() };
    }
    const normalized = formatBool(e);
    const value = (m: number) => evaluate(e, envFor(spec.vars, m));
    const right = truth.every((v, m) => v === "X" || value(m) === v);
    const terms = (e.type === "or" ? e.args : [e]).map((t) => productCube(t, spec.vars));
    const best = kmapCovers(spec)[0];
    const lits = (cs: Cube[]) => cs.reduce((s, c) => s + cubeLiterals(c, n), 0);
    const products = terms.every((t): t is Cube => t !== null) ? (terms as Cube[]) : null;
    if (right && products && products.length === best.length && lits(products) === lits(best)) return { correct: true, normalized };
    if (right) return { correct: false, normalized, misconceptionId: find("answer-not-minimal") };
    const implicants = products !== null && products.every((c) => truth.every((v, m) => !covers(c, m) || v !== 0));
    return { correct: false, normalized, misconceptionId: implicants ? find("answer-misses-ones") : undefined };
  },

  // ADR-0007: fill (unless given), then mark and term for each group, then F.
  steps: {
    count: (spec) => stepsOf(spec) + 2 * groupCount(spec) + 1,
    tag: (spec, i) => goalOf(spec, i).tag,
    vars: (spec, i) => {
      const goal = goalOf(spec, i);
      const layout = kmapLayout(spec.vars);
      return {
        stepNumber: i + 1,
        sigma: sigma(spec.minterms, spec.dontCares),
        varList: spec.vars.join(", "),
        rowVars: layout.rowVars.join(""),
        colVars: layout.colVars.join(""),
        cellCount: 2 ** spec.vars.length,
        groupCount: groupCount(spec),
        groupNumber: goal.group !== undefined ? goal.group + 1 : "",
        answer: kmapCovers(spec)[0].map((c) => formatCube(c, spec.vars)).join(" + "),
      };
    },
  },
};
