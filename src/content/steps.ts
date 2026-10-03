/**
 * The step contract for multi-step questions (ADR-0007). A question whose answer needs several
 * steps is asked one step at a time; `grade()` returns `partial: true` until the last step.
 * The runner, the tutor context and the content tests ask only this module how many steps a
 * spec has, what kind of goal each step is, and which values text may use at that step.
 * Values are structural only (ids, numbers, bits): wording stays in the tutor catalog.
 */
import type { InteractionSpec } from "./schema";
import type { TemplateVars } from "./template";
import { additionSteps, additionStepVars, evaluateCircuit, gateOrder } from "./grade";

type Kind = InteractionSpec["kind"];
type SpecOf<K extends Kind> = Extract<InteractionSpec, { kind: K }>;

interface StepContract<S> {
  count(spec: S): number;
  /** What kind of goal step `i` is: "divide", "column", "carry", "gate", … */
  tag(spec: S, i: number): string;
  vars(spec: S, i: number): TemplateVars;
}

const contracts: { [K in Kind]?: StepContract<SpecOf<K>> } = {
  "repeated-division": {
    count: (spec) => spec.steps.length,
    tag: () => "divide",
    vars: (spec, i) => {
      const step = spec.steps[i];
      return { dividend: step.dividend, quotient: step.quotient, remainder: step.remainder, stepNumber: i + 1 };
    },
  },
  "column-addition": {
    count: (spec) => additionSteps(spec.a, spec.b).length,
    tag: (spec, i) => (additionSteps(spec.a, spec.b)[i].final ? "carry" : "column"),
    vars: (spec, i) => additionStepVars(additionSteps(spec.a, spec.b)[i]),
  },
  // Gate-by-gate circuit walk, in signal-flow order; the output gate is the last step.
  "circuit-predict": {
    count: (spec) => spec.gates.length,
    tag: () => "gate",
    vars: (spec, i) => {
      const order = gateOrder(spec);
      const gate = spec.gates.find((g) => g.id === order[i])!;
      const values = evaluateCircuit(spec);
      const vars: TemplateVars = { stepNumber: i + 1, gateCount: order.length, gateId: gate.id, gateName: gate.type, gateOut: values[gate.id] };
      // Per input n: its value, plus the circuit input's label or the type of the gate feeding it.
      gate.from.forEach((source, k) => {
        const n = k + 1;
        vars[`in${n}`] = values[source];
        const input = spec.inputs.find((x) => x.id === source);
        if (input) vars[`in${n}Label`] = input.label;
        else vars[`in${n}Gate`] = spec.gates.find((g) => g.id === source)!.type;
      });
      return vars;
    },
  },
};

/** Spec kinds that are answered one step at a time. */
export const MULTI_STEP_KINDS = Object.keys(contracts) as Kind[];

function contractOf(spec: InteractionSpec): StepContract<InteractionSpec> | undefined {
  return contracts[spec.kind] as StepContract<InteractionSpec> | undefined;
}

/** Number of steps; 1 for single-answer questions. */
export function stepCount(spec: InteractionSpec): number {
  return contractOf(spec)?.count(spec) ?? 1;
}

/** Index clamped to the spec's steps (a finished question stays on its last step). */
function clamp(spec: InteractionSpec, i: number): number {
  return Math.min(Math.max(i, 0), stepCount(spec) - 1);
}

/** Kind of goal at step `i`; undefined for single-answer questions. */
export function stepTag(spec: InteractionSpec, i: number): string | undefined {
  return contractOf(spec)?.tag(spec, clamp(spec, i));
}

/** Structural template values for step `i`; {} for single-answer questions. */
export function stepVars(spec: InteractionSpec, i: number): TemplateVars {
  return contractOf(spec)?.vars(spec, clamp(spec, i)) ?? {};
}
