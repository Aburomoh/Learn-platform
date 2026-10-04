/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 4, full adder (content pack ch4 §2). Long chains are separate activities with
 * progress kept between them (requirements doc): activity 1 (#301) is the 8-row table, linked to
 * a column of Chapter 1 addition with a carry coming in. Truth comes from the Boolean module.
 */
import type { CourseInput, VariantInput } from "../../schema";

type TopicInput = CourseInput["modules"][number]["topics"][number];
type Activity = TopicInput["activities"][number];
type Bit = 0 | 1;

const INPUTS = ["A", "B", "Ci"];

function rotate<T>(xs: T[], k: number): T[] {
  const r = k % xs.length;
  return [...xs.slice(r), ...xs.slice(0, r)];
}

/* ---------- 1. one row first: a column of Chapter 1 addition with a carry in ---------- */

const ROWS: [Bit, Bit, Bit][] = [[1, 1, 1], [0, 1, 1], [1, 0, 0]];

function rowVariant([a, b, ci]: [Bit, Bit, Bit], k: number): VariantInput {
  const total = a + b + ci;
  const s = (total % 2) as Bit;
  const co = (total >= 2 ? 1 : 0) as Bit;
  const all: [Bit, Bit][] = [[0, 0], [0, 1], [1, 0], [1, 1]]; // (S, Co)
  const options = rotate(all.map(([os, oc]) => ({ id: `s${os}c${oc}`, text: `S = ${os}, Co = ${oc}` })), k + 1);
  const twoBits = `${co}${s}`;
  const slip = twoBits === "11" ? "10" : twoBits === "10" ? "01" : "10"; // carry in dropped, or the bits swapped
  return {
    id: `v${a}${b}${ci}`,
    prompt: `A full adder adds A, B and a carry in Ci. With A = ${a}, B = ${b} and Ci = ${ci}, what are S and the carry out Co?`,
    spec: { kind: "multiple-choice", options, correctOptionId: `s${s}c${co}` },
    hints: [
      { rung: 2, text: "Not yet. Add all three bits, as in one column of a Chapter 1 addition." },
      { rung: 3, text: "Count the 1s among A, B and Ci." },
      { rung: 4, text: `${a} + ${b} + ${ci} is how much, written as two bits?` },
      { rung: 6, text: "The right-hand bit is S; the left-hand bit is the carry out Co." },
      { rung: 9, text: `${a} + ${b} + ${ci} = ${total} = ${twoBits} in binary, so S = ${s} and Co = ${co}.` },
    ],
    misconceptions: [
      ci
        ? { id: "fa.carry-in-dropped", title: "Carry in left out", nudgeKey: "fa.carry-in-dropped", detect: { type: "option" as const, optionId: `s${(a + b) % 2}c${a + b >= 2 ? 1 : 0}` } }
        : { id: "ha.s-c-swapped", title: "Sum and carry swapped", nudgeKey: "ha.s-c-swapped", detect: { type: "option" as const, optionId: `s${co}c${s}` } },
    ],
    explanation: [
      { id: "s1", say: "A full adder is one column of a binary addition: A and B, plus the carry Ci from the column on the right." },
      {
        id: "s2",
        say: `Add ${a} + ${b} + ${ci}.`,
        ask: { prompt: "As two bits, that is…", options: k % 2 ? [slip, twoBits] : [twoBits, slip], correctIndex: k % 2, afterCorrect: `Yes: ${twoBits}.`, afterWrong: `${a} + ${b} + ${ci} = ${total}, which is ${twoBits} in binary.` },
      },
      { id: "s3", say: `S = ${s} stays in this column; Co = ${co} is carried to the next one.` },
    ],
  };
}

/* ---------- 2. the 8-row table, S then Co ---------- */

const tableVariant: VariantInput = {
  id: "vtable",
  prompt: "Fill the full adder's table: first S, then the carry out Co, for each row A + B + Ci.",
  spec: { kind: "truth-table", inputs: INPUTS, columns: [{ id: "s", label: "S", expr: "A ⊕ B ⊕ Ci" }, { id: "co", label: "Co", expr: "AB + BCi + ACi" }] },
  hints: [
    { rung: 2, text: "Not yet. Each row adds A + B + Ci; the {columnLabel} column holds one bit of that sum." },
    { rung: 3, text: "Count the 1s in the row: 0, 1, 2 or 3. Write that count in binary as two bits." },
    { rung: 4, text: "S is the right-hand bit of the count; Co is the left-hand bit. Which rows have a count of 2 or more?" },
    { rung: 6, text: "Count 0 → 00, 1 → 01, 2 → 10, 3 → 11 (Co first, then S)." },
    { rung: 8, text: "S is 1 when the count of 1s is odd; Co is 1 when it is 2 or 3." },
    { rung: 9, text: "S reads 0 1 1 0 1 0 0 1 and Co reads 0 0 0 1 0 1 1 1, top to bottom." },
  ],
  explanation: [
    { id: "s1", say: "Each row adds three bits. Count the 1s, then write the count as two bits: Co on the left, S on the right.", stage: { step: 0, revealed: 0 } },
    {
      id: "s2",
      say: "Take the row 0 1 1: two 1s.",
      stage: { step: 0, revealed: 3 },
      ask: { prompt: "What is S on that row?", options: ["1", "0"], correctIndex: 1, afterCorrect: "Yes: 2 is 10 in binary, so S = 0 and Co = 1.", afterWrong: "Two 1s make 2 = 10 in binary: S = 0 and Co = 1." },
    },
    { id: "s3", say: "So S is 1 when an odd number of inputs are 1, and Co is 1 when at least two are.", stage: { step: 0, revealed: 8 } },
  ],
};

export const fullAdderTableActivity: Activity = {
  id: "full-adder-table",
  title: "Full adder: the table",
  summary: "A column of binary addition with a carry in: one row first, then all eight.",
  authority: "DEMO",
  minutes: 12,
  questions: [
    { id: "fa.q.row", label: "One row first", conceptId: "fa.adder", objectiveId: "fa.obj.table", variants: ROWS.map((r, k) => rowVariant(r, k)) },
    { id: "fa.q.table", label: "S and Co table", conceptId: "fa.adder", objectiveId: "fa.obj.table", variants: [tableVariant] }, // one fixed table: exempt (content.test)
  ],
};

export const fullAdderTopic: TopicInput = {
  id: "full-adder",
  title: "Full adder",
  summary: "Add three bits, A + B + a carry in: the table first, then its minterms and maps, in separate activities.",
  preview: "1 + 1 + 1 → 11 → S = 1, Co = 1",
  concepts: [{ id: "fa.adder", title: "Full adder", summary: "Adds A, B and the carry in Ci: S is 1 for an odd count of 1s, Co for two or more." }],
  objectives: [{ id: "fa.obj.table", conceptId: "fa.adder", text: "Fill the full adder's 8-row table, S then Co." }],
  activities: [fullAdderTableActivity],
};
