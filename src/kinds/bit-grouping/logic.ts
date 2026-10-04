import { groupBits } from "@/content/binary";
import type { KindLogic } from "../types";
import type { BitGroupingSpec } from "./spec";

/** Step 0: `groups` as marked, padding included, left to right. Steps 1…G: `digit` of group G. */
export type BitGroupingAnswer = { kind: "bit-grouping"; step: number; groups?: string[]; digit?: string };

export const bitGrouping: KindLogic<BitGroupingSpec, BitGroupingAnswer> = {
  grade(variant, answer) {
    const spec = variant.spec;
    const groups = groupBits(spec.bits, spec.groupSize);
    if (answer.step < 0 || answer.step > groups.length) throw new Error(`No grouping step ${answer.step}`);
    const find = (type: string) => variant.misconceptions.find((m) => m.detect.type === type)?.id;
    if (answer.step === 0) {
      if (!answer.groups) throw new Error("Grouping step 0 needs groups");
      const normalized = answer.groups.join("|");
      const correct = normalized === groups.join("|");
      if (correct) return { correct, normalized, partial: true };
      const kind = groupingMistake(answer.groups, spec.groupSize);
      return { correct, normalized, misconceptionId: kind ? find(kind) : undefined };
    }
    if (answer.digit === undefined) throw new Error(`Grouping step ${answer.step} needs a digit`);
    const group = groups[answer.step - 1];
    const value = parseInt(group, 2);
    const digit = answer.digit.trim().toUpperCase();
    const normalized = `${group}=${digit}`;
    const correct = digit === value.toString(16).toUpperCase();
    if (correct) return { correct, normalized, partial: answer.step < groups.length };
    const decimal = value >= 10 && digit === String(value);
    return { correct, normalized, misconceptionId: decimal ? find("digit-as-decimal") : undefined };
  },
  // Step 0 marks the groups, then one digit per group, left to right.
  steps: {
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

/**
 * Names the grouping mistake in a wrong step-0 answer, judged by group lengths (the student only
 * places separators and adds zeros on the left, so the bits themselves are given).
 */
function groupingMistake(marked: string[], size: number): string | undefined {
  const lengths = marked.map((g) => g.length);
  const [first, ...rest] = lengths;
  const init = lengths.slice(0, -1);
  if (init.length && init.every((l) => l === size) && lengths[lengths.length - 1] < size) return "group-from-left";
  if (rest.every((l) => l === size) && first < size) return "group-no-padding";
  if (rest.length && rest.every((l) => l === rest[0]) && rest[0] !== size) return "group-wrong-size";
  return undefined;
}
