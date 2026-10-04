import { envFor, evaluate, parseBool, type BoolExpr } from "@/content/boolean";
import type { KindLogic } from "../types";
import type { TimingSpec } from "./spec";

type Bit = 0 | 1;

/** Q after one active edge. */
export type TimingAnswer = { kind: "timing"; step: number; q?: Bit };

/** Characteristic equations (ch5 Part I s.26, s.30, s.35; SR as S + R′Q, never asked with S = R = 1). */
const EQUATION: Record<TimingSpec["flipFlop"], string> = { SR: "S + R'Q", JK: "JQ' + K'Q", D: "D", T: "T ⊕ Q" };
const VARS: Record<TimingSpec["flipFlop"], string[]> = { SR: ["S", "R", "Q"], JK: ["J", "K", "Q"], D: ["D", "Q"], T: ["T", "Q"] };
const parsed = new Map<string, BoolExpr>();

/** Q(t + 1) from the inputs and Q, by the flip-flop's characteristic equation (Boolean module). */
export function nextQ(flipFlop: TimingSpec["flipFlop"], inputs: Bit[], q: Bit): Bit {
  const vars = VARS[flipFlop];
  let e = parsed.get(flipFlop);
  if (!e) parsed.set(flipFlop, (e = parseBool(EQUATION[flipFlop], { vars })));
  const m = [...inputs, q].reduce<number>((acc, b) => acc * 2 + b, 0);
  return evaluate(e, envFor(vars, m));
}

/** Clk per column: low in the first column, then alternating. */
export function clockLevels(spec: TimingSpec): Bit[] {
  return spec.inputs[0].levels.map((_, c) => (c % 2) as Bit);
}

export interface ActiveEdge {
  /** Column the edge starts (0-based); the inputs are read in column - 1. */
  column: number;
  before: Bit[];
  after: Bit[];
}

/** The active edges asked, left to right, with the input levels just before and just after each. */
export function activeEdges(spec: TimingSpec): ActiveEdge[] {
  const length = spec.inputs[0].levels.length;
  const all = Array.from({ length }, (_, c) => c).filter((c) => c > 0 && (spec.edge === "rising" ? c % 2 === 1 : c % 2 === 0));
  return all.slice(0, spec.edgeCount ?? all.length).map((column) => ({
    column,
    before: spec.inputs.map((i) => i.levels[column - 1]),
    after: spec.inputs.map((i) => i.levels[column]),
  }));
}

/** Q just after each asked edge. */
export function qAfterEdges(spec: TimingSpec): Bit[] {
  let q = spec.initialQ;
  return activeEdges(spec).map((e) => (q = nextQ(spec.flipFlop, e.before, q)));
}

/** Q per column for drawing: it changes only at active edges and holds between them. */
export function qLevels(spec: TimingSpec): Bit[] {
  const edges = activeEdges(spec);
  const after = qAfterEdges(spec);
  let q = spec.initialQ;
  return spec.inputs[0].levels.map((_, c) => {
    const k = edges.findIndex((e) => e.column === c);
    if (k >= 0) q = after[k];
    return q;
  });
}

export const timing: KindLogic<TimingSpec, TimingAnswer> = {
  grade(variant, answer) {
    const spec = variant.spec;
    const edges = activeEdges(spec);
    const k = answer.step;
    if (k < 0 || k >= edges.length) throw new Error(`No timing step ${k}`);
    const after = qAfterEdges(spec);
    const before = k === 0 ? spec.initialQ : after[k - 1];
    const right = after[k];
    const q = answer.q;
    const normalized = `edge${k + 1}:${q ?? ""}`;
    if (q === right) return { correct: true, normalized, partial: k < edges.length - 1 || undefined };
    if (q !== 0 && q !== 1) return { correct: false, normalized };

    const find = (type: string) => variant.misconceptions.find((m) => m.detect.type === type)?.id;
    const edge = edges[k];
    const ff = spec.flipFlop;
    const [x, y] = edge.before;
    // the most specific slip that explains the answer (a wrong bit is 1 − right, so order matters)
    const slip =
      ff === "JK" && x === 1 && y === 1 && q === before ? "jk-toggle-missed"
      : ff === "T" && q === x && x === 1 ? "t-as-d"
      : nextQ(ff, edge.after, before) === q && edge.after.join() !== edge.before.join() ? "input-after-edge"
      : (ff === "SR" || ff === "JK") && x !== y && nextQ(ff, [y, x], before) === q ? "inputs-swapped"
      : q === before ? "held-not-applied"
      : right === before ? "changed-on-hold"
      : undefined;
    return { correct: false, normalized, misconceptionId: slip ? find(slip) : undefined };
  },

  // ADR-0007: one goal per active edge, left to right.
  steps: {
    count: (spec) => activeEdges(spec).length,
    tag: () => "edge",
    vars: (spec, i) => {
      const edges = activeEdges(spec);
      const after = qAfterEdges(spec);
      const e = edges[i];
      return {
        stepNumber: i + 1,
        edgeNumber: i + 1,
        edgeCount: edges.length,
        edgeName: spec.edge,
        flipFlop: spec.flipFlop,
        inputsAtEdge: spec.inputs.map((inp, j) => `${inp.name} = ${e.before[j]}`).join(", "),
        qBefore: i === 0 ? spec.initialQ : after[i - 1],
        qAfter: after[i],
      };
    },
  },
};
