/**
 * Deterministic grading against content. Components never grade themselves; the ActivityRunner
 * calls `grade` and passes the result to the tutor engine. Course truth lives in the spec.
 */
import { kinds, type KindAnswer, type RegisteredKind } from "@/kinds";
import type { GradeResult } from "@/kinds/types";
import type { Variant } from "./schema";

export type { GradeResult };
/** The student's answer: one shape per kind, from the registry. */
export type Answer = KindAnswer;
// Helpers keep their old import path.
export { evaluateCircuit, gateOrder, gateOutput } from "@/kinds/circuit-predict/logic";
export { bitsToValue, valueToBits } from "@/kinds/place-value/logic";
export { additionResult, additionSteps, additionStepVars, complementBits, divisionSteps, groupBits, type AdditionStep } from "./binary";

export function grade(variant: Variant, answer: Answer): GradeResult {
  const kind: RegisteredKind = variant.spec.kind;
  if (kind !== answer.kind) {
    throw new Error(`Answer kind ${answer.kind} does not match spec kind ${kind}`);
  }
  // one cast at the dispatch: the kinds match (checked above), TypeScript cannot correlate them
  const logic = kinds[kind] as { grade(variant: Variant, answer: Answer): GradeResult };
  return logic.grade(variant, answer);
}
