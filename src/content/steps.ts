/**
 * The step contract for multi-step questions (ADR-0007). A question whose answer needs several
 * steps is asked one step at a time; `grade()` returns `partial: true` until the last step.
 * The runner, the tutor context and the content tests ask only this module how many steps a
 * spec has, what kind of goal each step is, and which values text may use at that step.
 * Values are structural only (ids, numbers, bits): wording stays in the tutor catalog.
 */
import type { Hint, InteractionSpec, Variant } from "./schema";
import type { TemplateVars } from "./template";
import { isRegisteredKind, kinds } from "@/kinds";
import type { StepContract } from "@/kinds/types";
import { additionSteps, additionStepVars, groupBits } from "./grade";

type Kind = InteractionSpec["kind"];
type SpecOf<K extends Kind> = Extract<InteractionSpec, { kind: K }>;

/** Contracts of the kinds not migrated to `src/kinds/` yet (ADR-0008). */
const legacy: { [K in Kind]?: StepContract<SpecOf<K>> } = {
  "repeated-division": {
    count: (spec) => spec.steps.length,
    tag: () => "divide",
    vars: (spec, i) => {
      const step = spec.steps[i];
      return { dividend: step.dividend, quotient: step.quotient, remainder: step.remainder, stepNumber: i + 1 };
    },
  },
  "column-addition": {
    count: (spec) => additionSteps(spec.a, spec.b, spec.endCarry !== "drop").length,
    tag: (spec, i) => (additionSteps(spec.a, spec.b, spec.endCarry !== "drop")[i].final ? "carry" : "column"),
    vars: (spec, i) => additionStepVars(additionSteps(spec.a, spec.b, spec.endCarry !== "drop")[i]),
  },
  // Octal/hex grouping: step 0 marks the groups, then one digit per group, left to right.
  "bit-grouping": {
    count: (spec) => 1 + groupBits(spec.bits, spec.groupSize).length,
    tag: (_, i) => (i === 0 ? "group" : "digit"),
    vars: (spec, i) => {
      const groups = groupBits(spec.bits, spec.groupSize);
      const common = { groupSize: spec.groupSize, bits: spec.bits, groupCount: groups.length, stepNumber: i + 1 };
      if (i === 0) return { ...common, padCount: groups.length * spec.groupSize - spec.bits.length };
      const groupBitsAt = groups[i - 1];
      const groupValue = parseInt(groupBitsAt, 2);
      return { ...common, groupIndex: i, groupBits: groupBitsAt, groupValue, digit: groupValue.toString(16).toUpperCase() };
    },
  },
};

/** Spec kinds that are answered one step at a time. */
export const MULTI_STEP_KINDS = [...Object.keys(legacy), ...Object.entries(kinds).filter(([, logic]) => "steps" in logic).map(([kind]) => kind)] as Kind[];

function contractOf(spec: InteractionSpec): StepContract<InteractionSpec> | undefined {
  const logic: { steps?: unknown } | undefined = isRegisteredKind(spec.kind) ? kinds[spec.kind] : undefined;
  return (logic ? logic.steps : legacy[spec.kind]) as StepContract<InteractionSpec> | undefined;
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

/** The hint ladder for step `i`: `hintsByStep[stepTag]` when authored, else `hints` (ADR-0007 §3). */
export function hintsForStep(variant: Variant, i: number): Hint[] {
  const tag = stepTag(variant.spec, i);
  return (tag && variant.hintsByStep?.[tag]) || variant.hints;
}
