import { envFor, evaluate, parseBool } from "@/content/boolean";
import type { KindLogic } from "../types";
import type { StateDiagramSpec } from "./spec";

/**
 * One arrow: its `label` ("x/y", or "x") in label mode, or the state code it goes to in next mode.
 * `taken`: labels already given on the same arrow (label mode, when two rows share one arrow).
 */
export type StateDiagramAnswer = { kind: "state-diagram"; step: number; label?: string; next?: string; taken?: string[] };

export interface Transition {
  /** Present state's code, e.g. "01". */
  from: string;
  input: 0 | 1;
  to: string;
  output?: 0 | 1;
  /** The arrow's label as the slides write it: "1/0", or "1" without an output. */
  label: string;
}

const code = (value: number, bits: number) => value.toString(2).padStart(bits, "0");

/** The state codes in table order: 00, 01, 10, 11 … */
export function stateCodes(spec: StateDiagramSpec): string[] {
  return Array.from({ length: 2 ** spec.stateVars.length }, (_, s) => code(s, spec.stateVars.length));
}

/** One transition per state-table row (present state, then input as LSB), from the equations. */
export function transitions(spec: StateDiagramSpec): Transition[] {
  const vars = [...spec.stateVars, spec.input];
  const next = spec.next.map((t) => parseBool(t, { vars }));
  const out = spec.output ? parseBool(spec.output.expr, { vars }) : undefined;
  const n = spec.stateVars.length;
  return Array.from({ length: 2 ** (n + 1) }, (_, row) => {
    const env = envFor(vars, row);
    const to = next.map((e) => evaluate(e, env)).join("");
    const input = (row & 1) as 0 | 1;
    const output = out ? evaluate(out, env) : undefined;
    return { from: code(row >> 1, n), input, to, output, label: output === undefined ? `${input}` : `${input}/${output}` };
  });
}

/**
 * The steps that share step `i`'s arrow: both rows of a present state when they go to the same next
 * state (always consecutive steps, input 0 then 1), else just `i`.
 */
export function arrowSteps(spec: StateDiagramSpec, i: number): number[] {
  const ts = transitions(spec);
  const j = i ^ 1;
  return ts[j] && ts[j].from === ts[i].from && ts[j].to === ts[i].to ? [Math.min(i, j), Math.max(i, j)] : [i];
}

/** Each state's grid cell [column, row], in code order: the spec's `positions`, or table order four per row. */
export function statePositions(spec: StateDiagramSpec): [number, number][] {
  return spec.positions ?? stateCodes(spec).map((_, s) => [s % 4, Math.floor(s / 4)]);
}

/** The label chips: every input/output pair (4), or the two inputs without an output. */
export function labelOptions(spec: StateDiagramSpec): string[] {
  return spec.output ? ["0/0", "0/1", "1/0", "1/1"] : ["0", "1"];
}

/**
 * The next-state chips of arrow `i`: every state when there are at most four; with eight, the
 * right one, the other input's next state, the present state and one more, in code order.
 */
export function nextOptions(spec: StateDiagramSpec, i: number): string[] {
  const all = stateCodes(spec);
  if (all.length <= 4) return all;
  const ts = transitions(spec);
  const t = ts[i];
  const other = ts[i ^ 1].to;
  const picked = new Set([t.to, other, t.from]);
  for (let k = 1; picked.size < 4; k++) picked.add(all[(parseInt(t.to, 2) + k * 3) % all.length]);
  return [...picked].sort();
}

const clean = (text: string) => text.replace(/\s+/g, "");

export const stateDiagram: KindLogic<StateDiagramSpec, StateDiagramAnswer> = {
  grade(variant, answer) {
    const spec = variant.spec;
    const ts = transitions(spec);
    const t = ts[answer.step];
    if (!t) throw new Error(`No state-diagram step ${answer.step}`);
    const last = answer.step === ts.length - 1;
    const find = (type: string) => variant.misconceptions.find((m) => m.detect.type === type)?.id;
    const other = ts[answer.step ^ 1]; // the same present state, the other input

    if (spec.mode === "next") {
      const given = clean(answer.next ?? "");
      const normalized = `${t.from}-${t.input}:${given}`;
      if (given === t.to) return { correct: true, normalized, partial: !last || undefined };
      const slip = given === other.to ? "next-wrong-row" : given === t.from ? "next-is-present" : undefined;
      return { correct: false, normalized, misconceptionId: slip ? find(slip) : undefined };
    }

    const given = clean(answer.label ?? "");
    const normalized = `${t.from}-${t.input}:${given}`;
    // a shared arrow cannot say which of its rows is asked without giving the input away: accept
    // any of its labels not given yet (Reviewer on #394)
    const taken = (answer.taken ?? []).map(clean);
    const open = arrowSteps(spec, answer.step).map((s) => ts[s].label).filter((l) => !taken.includes(l));
    if (open.includes(given)) return { correct: true, normalized, partial: !last || undefined };
    const [gi, go] = given.split("/");
    const slip =
      t.output !== undefined && gi === String(t.output) && go === String(t.input) && t.input !== t.output ? "label-reversed"
      : gi === String(t.input) && go === String(other.output) ? "output-wrong-row"
      : gi !== String(t.input) ? "label-input-wrong"
      : undefined;
    return { correct: false, normalized, misconceptionId: slip ? find(slip) : undefined };
  },

  // ADR-0007: one goal per arrow, in state-table order.
  steps: {
    count: (spec) => 2 ** (spec.stateVars.length + 1),
    tag: (spec) => (spec.mode === "next" ? "next" : "label"),
    vars: (spec, i) => {
      const ts = transitions(spec);
      const t = ts[i];
      return {
        stepNumber: i + 1,
        arrowCount: ts.length,
        from: t.from,
        to: t.to,
        input: t.input,
        output: t.output ?? "",
        label: t.label,
        inputName: spec.input,
        outputName: spec.output?.name ?? "",
      };
    },
  },
};
