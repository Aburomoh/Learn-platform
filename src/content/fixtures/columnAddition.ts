/**
 * TEST FIXTURE (not course content). The ECET 111 Ch.1 slide example 1101 + 0111 = 10100, added
 * one column at a time (#33). Used by grader tests until the binary addition activity (#38) exists.
 */
import { VariantSchema, type Variant } from "../schema";

export const addition1101: Variant = VariantSchema.parse({
  id: "v1101",
  prompt: "Add {a} + {b} one column at a time, starting from the right.",
  spec: { kind: "column-addition", a: "1101", b: "0111", answer: "10100" },
  vars: { a: "1101", b: "0111", result: "10100" },
  hints: [
    { rung: 2, text: "Not yet. Add the bits in this column, plus the carry from the column on its right." },
    { rung: 3, text: "0 + 0 = 0, 0 + 1 = 1, 1 + 1 = 0 carry 1." },
    { rung: 9, text: "{a} + {b} = {result}." },
  ],
  explanation: [
    { id: "s1", say: "Binary addition works column by column, from the right, like decimal addition." },
    {
      id: "s2",
      say: "The rightmost column is 1 + 1.",
      ask: { prompt: "What is 1 + 1 in binary?", options: ["0, carry 1", "2", "1, carry 0"], correctIndex: 0 },
    },
  ],
  misconceptions: [
    { id: "add.wrote-two", title: "Wrote 2 for 1 + 1", nudgeKey: "add.wrote-two", detect: { type: "addition-wrote-two" } },
    { id: "add.carry-ignored", title: "Carry not added in", nudgeKey: "add.carry-ignored", detect: { type: "addition-carry-ignored" } },
    { id: "add.swapped", title: "Sum and carry swapped", nudgeKey: "add.swapped", detect: { type: "addition-swapped" } },
  ],
});
