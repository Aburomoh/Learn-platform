import type { KindLogic } from "../types";
import type { RepeatedDivisionSpec } from "./spec";

export type RepeatedDivisionAnswer = { kind: "repeated-division"; step: number; quotient: number; remainder: number };

export const repeatedDivision: KindLogic<RepeatedDivisionSpec, RepeatedDivisionAnswer> = {
  grade(variant, answer) {
    const spec = variant.spec;
    const step = spec.steps[answer.step];
    if (!step) throw new Error(`No division step ${answer.step}`);
    const correct = answer.quotient === step.quotient && answer.remainder === step.remainder;
    const normalized = `${step.dividend}/2=${answer.quotient}r${answer.remainder}`;
    if (correct) return { correct, normalized, partial: answer.step < spec.steps.length - 1 };
    const kind =
      answer.quotient === step.remainder && answer.remainder === step.quotient && step.quotient !== step.remainder
        ? "division-swapped"
        : answer.quotient === step.quotient
          ? "division-remainder"
          : answer.remainder === step.remainder
            ? "division-quotient"
            : undefined;
    return { correct, normalized, misconceptionId: kind ? variant.misconceptions.find((m) => m.detect.type === kind)?.id : undefined };
  },
  steps: {
    count: (spec) => spec.steps.length,
    tag: () => "divide",
    vars: (spec, i) => {
      const step = spec.steps[i];
      return { dividend: step.dividend, quotient: step.quotient, remainder: step.remainder, stepNumber: i + 1 };
    },
  },
};
