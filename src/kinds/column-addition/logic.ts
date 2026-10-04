import { additionSteps, additionStepVars } from "@/content/binary";
import type { KindLogic } from "../types";
import type { ColumnAdditionSpec } from "./spec";

/** One column (sum bit + carry out), or the final carry step where only `sum` is read. */
export type ColumnAdditionAnswer = { kind: "column-addition"; step: number; sum: number; carry?: number };

const stepsOf = (spec: ColumnAdditionSpec) => additionSteps(spec.a, spec.b, spec.endCarry !== "drop");

export const columnAddition: KindLogic<ColumnAdditionSpec, ColumnAdditionAnswer> = {
  grade(variant, answer) {
    const steps = stepsOf(variant.spec);
    const step = steps[answer.step];
    if (!step) throw new Error(`No addition step ${answer.step}`);
    const find = (kind: string) => variant.misconceptions.find((m) => m.detect.type === kind)?.id;
    if (step.final) {
      const correct = answer.sum === step.sum;
      const normalized = `final=${answer.sum}`;
      if (correct) return { correct, normalized, partial: false };
      return { correct, normalized, misconceptionId: find(answer.sum > 1 ? "addition-wrote-two" : "addition-carry-ignored") };
    }
    if (answer.carry === undefined) throw new Error(`Addition column ${answer.step} needs a carry`);
    const correct = answer.sum === step.sum && answer.carry === step.carryOut;
    const normalized = `${step.a}+${step.b}+${step.carryIn}=${answer.sum}c${answer.carry}`;
    if (correct) return { correct, normalized, partial: answer.step < steps.length - 1 };
    const total = step.a + step.b + step.carryIn;
    // With a carry in, "ignored the carry" and "swapped" can give the same pair; the carry reading wins.
    const kind =
      answer.sum > 1 && answer.sum === total
        ? "addition-wrote-two"
        : step.carryIn === 1 && answer.sum !== step.sum && answer.sum <= 1
          ? "addition-carry-ignored"
          : answer.sum === step.carryOut && answer.carry === step.sum && step.sum !== step.carryOut
            ? "addition-swapped"
            : undefined;
    return { correct, normalized, misconceptionId: kind ? find(kind) : undefined };
  },
  steps: {
    count: (spec) => stepsOf(spec).length,
    tag: (spec, i) => (stepsOf(spec)[i].final ? "carry" : "column"),
    vars: (spec, i) => additionStepVars(stepsOf(spec)[i]),
  },
};
