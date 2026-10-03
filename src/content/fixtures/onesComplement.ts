/**
 * TEST FIXTURES (not course content). The ECET 111 Ch.1 slide examples of 1's complement on the
 * existing `numeric` kind with a `bit-row` context (#35). Used until the complement activity (#39).
 */
import { VariantSchema, type Variant } from "../schema";

function onesComplement(id: string, bits: string, answer: string, twos: string): Variant {
  return VariantSchema.parse({
    id,
    prompt: "Write the 1's complement of {bits}: change each 1 to 0 and each 0 to 1.",
    spec: { kind: "numeric", base: 2, answer, context: { type: "bit-row", bits } },
    vars: { bits, answer },
    hints: [
      { rung: 2, text: "Not yet. Check each bit against the one above it." },
      { rung: 9, text: "The 1's complement of {bits} is {answer}." },
    ],
    explanation: [
      { id: "s1", say: "The 1's complement flips every bit." },
      { id: "s2", say: "Go from left to right and write the opposite of each bit." },
    ],
    misconceptions: [
      { id: "c1.copied", title: "Copied the bits unchanged", nudgeKey: "c1.copied", detect: { type: "equals", value: bits } },
      { id: "c1.gave-twos", title: "Gave the 2's complement", nudgeKey: "c1.gave-twos", detect: { type: "equals", value: twos } },
      { id: "c1.first-wrong-bit", title: "A bit not flipped", nudgeKey: "c1.first-wrong-bit", detect: { type: "first-wrong-bit" } },
    ],
  });
}

export const complement100101 = onesComplement("v100101", "100101", "011010", "011011");
export const complement110010 = onesComplement("v110010", "110010", "001101", "001110");
