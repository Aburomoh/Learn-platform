/**
 * The step contract for multi-step questions (ADR-0007). A question whose answer needs several
 * steps is asked one step at a time; `grade()` returns `partial: true` until the last step.
 * The runner, the tutor context and the content tests ask only this module how many steps a
 * spec has, what kind of goal each step is, and which values text may use at that step.
 * Values are structural only (ids, numbers, bits): wording stays in the tutor catalog.
 */
import type { Hint, InteractionSpec, Variant } from "./schema";
import type { TemplateVars } from "./template";
import { kinds } from "@/kinds";
import type { StepContract } from "@/kinds/types";

/** Spec kinds that are answered one step at a time. */
export const MULTI_STEP_KINDS = Object.entries(kinds)
  .filter(([, logic]) => "steps" in logic)
  .map(([kind]) => kind) as InteractionSpec["kind"][];

/** The kind's step contract (ADR-0007), from the registry; none for single-answer kinds. */
function contractOf(spec: InteractionSpec): StepContract<InteractionSpec> | undefined {
  const logic: { steps?: unknown } = kinds[spec.kind];
  return logic.steps as StepContract<InteractionSpec> | undefined;
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
