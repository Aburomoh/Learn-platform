/**
 * TEST FIXTURES (not course content). Octal/hex by grouping, one goal at a time (#44): mark the
 * groups, then one digit per group. Used by grader tests until Chapter 1 Q3/Q4 move to this kind.
 */
import { VariantSchema, type Variant } from "../schema";

const misconceptions = [
  { id: "ns.group-from-left", title: "Grouped from the left", nudgeKey: "ns.group-from-left", detect: { type: "group-from-left" } },
  { id: "ns.group-no-padding", title: "Short group not padded", nudgeKey: "ns.group-no-padding", detect: { type: "group-no-padding" } },
  { id: "ns.wrong-group-size", title: "Wrong group size", nudgeKey: "ns.wrong-group-size", detect: { type: "group-wrong-size" } },
  { id: "ns.hex-digit-decimal", title: "Wrote 10 instead of A", nudgeKey: "ns.hex-letter", detect: { type: "digit-as-decimal" } },
];

function grouping(id: string, bits: string, groupSize: 3 | 4, answer: string): Variant {
  return VariantSchema.parse({
    id,
    prompt: "Group {bits} in {groupSize}s from the right, then write one digit under each group.",
    spec: { kind: "bit-grouping", bits, groupSize, answer },
    vars: {},
    hints: [{ rung: 2, text: "Not yet. Work from the right-hand end." }],
    hintsByStep: {
      group: [{ rung: 3, text: "Groups of {groupSize}, starting at the right. Add {padCount} zero(s) on the left." }],
      digit: [{ rung: 3, text: "Group {groupIndex} is {groupBits}. What is its value?" }],
    },
    explanation: [
      { id: "s1", say: "Each group of {groupSize} bits becomes one digit." },
      { id: "s2", say: "Start from the right so only the leftmost group can be short." },
    ],
    misconceptions,
  });
}

/** 26 = 11010₂ → 0001 1010 → 1A₁₆ */
export const hex26 = grouping("vhex26", "11010", 4, "1A");
/** 88 = 1011000₂ → 001 011 000 → 130₈ */
export const octal88 = grouping("voct88", "1011000", 3, "130");
