/**
 * TEST FIXTURE (not course content). A place-value variant used by engine and grader tests so
 * they do not depend on whatever the current course content happens to be.
 */
import { VariantSchema, type Variant } from "../schema";

export const placeValue45: Variant = VariantSchema.parse({
  id: "v45",
  prompt: "Represent {value} in binary. Place a 1 in each slot whose place value is part of {value}.",
  spec: { kind: "place-value", value: 45, base: 2, slots: 6, answer: [1, 0, 1, 1, 0, 1] },
  vars: { value: 45, answerBits: "101101", largest: 32, remainder: 13 },
  hints: [
    { rung: 2, text: "Not yet. Check each slot: does its place value fit into what is left of {value}?" },
    { rung: 3, text: "Each slot is a power of two: 32, 16, 8, 4, 2, 1. A 1 means that power is part of the total." },
    { rung: 4, text: "What is the largest power of two that fits in {value}?" },
    { rung: 5, text: "Start here. {largest} fits in {value}. What remains after you take {largest}?", focus: "slot-32", highlight: "slot-32" },
    { rung: 6, text: "{value} = 32 + 8 + 4 + 1. Which slots does that light up?" },
    { rung: 7, text: "Think of paying {value} with coins worth 32, 16, 8, 4, 2 and 1, using each coin at most once." },
    { rung: 8, text: "Put a 1 under 32, 8, 4 and 1, and a 0 under 16 and 2." },
    { rung: 9, text: "{value} in binary is {answerBits}: 32 + 8 + 4 + 1 = {value}." },
  ],
  explanation: [
    { id: "s1", say: "We want to write {value} using only powers of two.", stage: { lit: [], remainder: 45 } },
    {
      id: "s2",
      say: "Start with the largest slot, 32. Does 32 fit in {value}?",
      stage: { lit: [], remainder: 45, attention: 32 },
      ask: { prompt: "Does 32 fit in {value}?", options: ["Yes", "No"], correctIndex: 0, afterCorrect: "Yes. Put a 1 under 32. {value} − 32 = 13 remains.", afterWrong: "It does: 32 is less than {value}. 13 remains." },
    },
    {
      id: "s3",
      say: "Now 16. Does 16 fit in 13?",
      stage: { lit: [32], remainder: 13, attention: 16 },
      ask: { prompt: "Does 16 fit in 13?", options: ["Yes", "No"], correctIndex: 1, afterCorrect: "Right. 16 is too big.", afterWrong: "16 is bigger than 13, so it does not fit." },
    },
    { id: "s4", say: "8 fits in 13. 5 remains.", stage: { lit: [32, 8], remainder: 5 } },
    { id: "s5", say: "4 fits in 5, then 1. Result: {answerBits}.", stage: { lit: [32, 8, 4, 1], remainder: 0 } },
  ],
  misconceptions: [
    { id: "ns.reversed", title: "Bits written least-significant first", nudgeKey: "ns.reversed", detect: { type: "reversed-bits" } },
    { id: "ns.skip-largest", title: "Largest place value skipped", nudgeKey: "ns.missing-largest", detect: { type: "missing-place", place: 32 } },
    { id: "ns.extra-16", title: "Included a place value that does not fit", nudgeKey: "ns.extra-place", detect: { type: "extra-place", place: 16 } },
  ],
});

/** Same shape, value 29 (not a palindrome) for reversed-bits detection. */
export const placeValue29: Variant = VariantSchema.parse({
  ...placeValue45,
  id: "v29",
  spec: { kind: "place-value", value: 29, base: 2, slots: 6, answer: [0, 1, 1, 1, 0, 1] },
  vars: { value: 29, answerBits: "011101", largest: 16, remainder: 13 },
});
