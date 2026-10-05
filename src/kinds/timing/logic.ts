import { envFor, evaluate, parseBool, type BoolExpr } from "@/content/boolean";
import type { KindLogic } from "../types";
import type { TimingSpec } from "./spec";

type Bit = 0 | 1;

/** Every output just after one active edge, in `outputNames` order (one control each, §13.2). */
export type TimingAnswer = { kind: "timing"; step: number; q?: Bit[] };

/** Characteristic equations (ch5 Part I s.26, s.30, s.35; SR as S + R′Q, never asked with S = R = 1). */
const EQUATION: Record<NonNullable<TimingSpec["flipFlop"]>, string> = { SR: "S + R'Q", JK: "JQ' + K'Q", D: "D", T: "T ⊕ Q" };
const cache = new Map<string, BoolExpr>();
const parse = (text: string, vars: string[]) => {
  const key = `${vars.join(",")}|${text}`;
  let e = cache.get(key);
  if (!e) cache.set(key, (e = parseBool(text, { vars })));
  return e;
};
const evalAt = (e: BoolExpr, vars: string[], bits: Bit[]) => evaluate(e, envFor(vars, bits.reduce<number>((acc, b) => acc * 2 + b, 0)));

/** Q(t + 1) of one flip-flop from its inputs and Q, by its characteristic equation (Boolean module). */
export function nextQ(flipFlop: NonNullable<TimingSpec["flipFlop"]>, inputs: Bit[], q: Bit): Bit {
  const vars = [...(flipFlop === "SR" ? ["S", "R"] : flipFlop === "JK" ? ["J", "K"] : [flipFlop]), "Q"];
  return evalAt(parse(EQUATION[flipFlop], vars), vars, [...inputs, q]);
}

/** The outputs asked at each edge: Q, or the circuit's flip-flops. */
export function outputNames(spec: TimingSpec): string[] {
  return spec.machine ? spec.machine.stateVars : ["Q"];
}

export function initialState(spec: TimingSpec): Bit[] {
  return spec.machine ? spec.machine.initial : [spec.initialQ ?? 0];
}

/** The next state from the inputs read at an edge and the state before it. */
export function nextState(spec: TimingSpec, inputs: Bit[], state: Bit[]): Bit[] {
  if (spec.flipFlop) return [nextQ(spec.flipFlop, inputs, state[0])];
  const m = spec.machine!;
  const vars = [...m.stateVars, ...spec.inputs.map((i) => i.name)];
  return m.next.map((text) => evalAt(parse(text, vars), vars, [...state, ...inputs]));
}

/** Clk per column: low in the first column, then alternating. */
export function clockLevels(spec: TimingSpec): Bit[] {
  return spec.inputs[0].levels.map((_, c) => (c % 2) as Bit);
}

export interface ActiveEdge {
  /** Column the edge starts (0-based); the inputs are read in column - 1. */
  column: number;
  inputs: Bit[];
}

/** The active edges asked, left to right, with the input levels read at each. */
export function activeEdges(spec: TimingSpec): ActiveEdge[] {
  const length = spec.inputs[0].levels.length;
  const all = Array.from({ length }, (_, c) => c).filter((c) => c > 0 && (spec.edge === "rising" ? c % 2 === 1 : c % 2 === 0));
  return all.slice(0, spec.edgeCount ?? all.length).map((column) => ({ column, inputs: spec.inputs.map((i) => i.levels[column - 1]) }));
}

/** The state just after each asked edge. */
export function statesAfterEdges(spec: TimingSpec): Bit[][] {
  let state = initialState(spec);
  return activeEdges(spec).map((e) => (state = nextState(spec, e.inputs, state)));
}

/** Each output per column, for drawing: it changes only at active edges and holds between them. */
export function outputLevels(spec: TimingSpec): Bit[][] {
  const edges = activeEdges(spec);
  const after = statesAfterEdges(spec);
  let state = initialState(spec);
  const columns = spec.inputs[0].levels.map((_, c) => {
    const k = edges.findIndex((e) => e.column === c);
    if (k >= 0) state = after[k];
    return state;
  });
  return outputNames(spec).map((_, o) => columns.map((s) => s[o]));
}

const same = (a: Bit[], b: Bit[]) => a.length === b.length && a.every((x, i) => x === b[i]);

export const timing: KindLogic<TimingSpec, TimingAnswer> = {
  grade(variant, answer) {
    const spec = variant.spec;
    const edges = activeEdges(spec);
    const k = answer.step;
    if (k < 0 || k >= edges.length) throw new Error(`No timing step ${k}`);
    const after = statesAfterEdges(spec);
    const before = k === 0 ? initialState(spec) : after[k - 1];
    const right = after[k];
    const q = answer.q ?? [];
    const normalized = `edge${k + 1}:${q.join("")}`;
    if (same(q, right)) return { correct: true, normalized, partial: k < edges.length - 1 || undefined };
    if (q.length !== right.length || q.some((b) => b !== 0 && b !== 1)) return { correct: false, normalized };

    const find = (type: string) => variant.misconceptions.find((m) => m.detect.type === type)?.id;
    const wrong = right.flatMap((b, i) => (q[i] !== b ? [i] : []));
    const wrongCells = { first: wrong[0], count: wrong.length };
    const edge = edges[k];
    // the other kind of edge just before this one, and the column just after the edge: their inputs, if they differ
    const earlier = edge.column >= 2 ? spec.inputs.map((i) => i.levels[edge.column - 2]) : undefined;
    const later = edge.column + 1 < spec.inputs[0].levels.length ? spec.inputs.map((i) => i.levels[edge.column + 1]) : undefined;
    const first = wrong[0];
    let slip: string | undefined;
    if (spec.flipFlop) {
      const ff = spec.flipFlop;
      const [x, y] = edge.inputs;
      const qb = q[0];
      slip =
        ff === "JK" && x === 1 && y === 1 && qb === before[0] ? "jk-toggle-missed"
        // T copied into Q (as D would), for T = 1 and for T = 0 with Q = 1 (Pedagogy on #367)
        : ff === "T" && qb === x ? "t-as-d"
        : earlier && !same(earlier, edge.inputs) && nextQ(ff, earlier, before[0]) === qb ? "wrong-edge"
        : later && !same(later, edge.inputs) && nextQ(ff, later, before[0]) === qb ? "input-after-edge"
        : (ff === "SR" || ff === "JK") && x !== y && nextQ(ff, [y, x], before[0]) === qb ? "inputs-swapped"
        : undefined;
    } else if (earlier && !same(earlier, edge.inputs) && same(nextState(spec, earlier, before), q)) slip = "wrong-edge";
    else if (later && !same(later, edge.inputs) && same(nextState(spec, later, before), q)) slip = "input-after-edge";
    slip ??= q[first] === before[first] ? "held-not-applied" : right[first] === before[first] ? "changed-on-hold" : undefined;
    return { correct: false, normalized, misconceptionId: slip ? find(slip) : undefined, wrongCells };
  },

  // ADR-0007: one goal per active edge, left to right; every output is asked at once (§13.2).
  steps: {
    count: (spec) => activeEdges(spec).length,
    tag: () => "edge",
    vars: (spec, i) => {
      const edges = activeEdges(spec);
      const after = statesAfterEdges(spec);
      const names = outputNames(spec);
      const before = i === 0 ? initialState(spec) : after[i - 1];
      const list = (bits: Bit[]) => names.map((n, j) => `${n} = ${bits[j]}`).join(", ");
      // per #255: the goal names the edge only; inputs are for rung 5, the outputs for rung 9
      return {
        stepNumber: i + 1,
        edgeNumber: i + 1,
        edgeCount: edges.length,
        edgeName: spec.edge,
        flipFlop: spec.flipFlop ?? "",
        outputList: names.join(", "),
        inputsAtEdge: spec.inputs.map((inp, j) => `${inp.name} = ${edges[i].inputs[j]}`).join(", "),
        stateBefore: list(before),
        stateAfter: list(after[i]),
      };
    },
  },
};
