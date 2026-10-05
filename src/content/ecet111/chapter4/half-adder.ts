/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 4, half adder (#300, content pack ch4 §1): predict one row first (linked to
 * Chapter 1's 1 + 1 = 10), fill the S and C columns, name the gate for each, then walk the
 * circuit. Truth comes from the Boolean module and the circuit evaluator; questions are original.
 */
import type { CourseInput, VariantInput } from "../../schema";
import { gateWalkHints } from "../chapter2/basic-gates";

type TopicInput = CourseInput["modules"][number]["topics"][number];
type Bit = 0 | 1;

const sumOf = (a: Bit, b: Bit) => ({ s: (a ^ b) as Bit, c: (a & b) as Bit });

/* ---------- 1. predict one row first (a new device) ---------- */

const PAIRS: [Bit, Bit][] = [[1, 1], [0, 1], [1, 0]];
const pairId = ([a, b]: [Bit, Bit]) => `v${a}${b}`;

function rotate<T>(xs: T[], k: number): T[] {
  const r = k % xs.length;
  return [...xs.slice(r), ...xs.slice(0, r)];
}

function addVariant(a: Bit, b: Bit, k: number): VariantInput {
  const { s, c } = sumOf(a, b);
  const rightSum = `${c}${s}`;
  const wrongSum = rightSum === "10" ? "01" : "10"; // 1 + 1 read as 1 (OR), or the bits swapped
  const all: [Bit, Bit][] = [[0, 0], [0, 1], [1, 0], [1, 1]]; // (S, C)
  const options = rotate(all.map(([os, oc]) => ({ id: `s${os}c${oc}`, text: `S = ${os}, C = ${oc}` })), k + 1);
  // S taken as OR: on 1 + 1 that gives S = 1 (pack: "S as OR"); swapping S and C is the other slip
  const misconceptions: VariantInput["misconceptions"] = [];
  if (a & b) misconceptions.push({ id: "ha.s-as-or", title: "S worked out as OR", nudgeKey: "ha.s-as-or", detect: { type: "option", optionId: "s1c0" } });
  else misconceptions.push({ id: "ha.s-c-swapped", title: "Sum and carry swapped", nudgeKey: "ha.s-c-swapped", detect: { type: "option", optionId: `s${c}c${s}` } });
  return {
    id: pairId([a, b]),
    prompt: `A half adder adds two bits. With A = ${a} and B = ${b}, what are the sum bit S and the carry C?`,
    spec: { kind: "multiple-choice", options, correctOptionId: `s${s}c${c}` },
    // the HA block with the prompt's bits; S and C read "?" until a correct answer (#454)
    figure: { type: "adder", adder: "half", given: { a, b } },
    hints: [
      { rung: 2, text: "Not yet. Add the two bits as in Chapter 1." },
      { rung: 3, text: "In binary, 0 + 0 = 0, 0 + 1 = 1 and 1 + 1 = 10." },
      { rung: 4, text: `What is ${a} + ${b} written as two bits?` },
      { rung: 6, text: "The right-hand bit of the result is S; the left-hand bit is the carry C." },
      { rung: 9, text: `${a} + ${b} = ${c}${s} in binary, so S = ${s} and C = ${c}.` },
    ],
    misconceptions,
    explanation: [
      { id: "s1", say: "A half adder adds two bits, like one column of the binary additions in Chapter 1, with no carry coming in." },
      {
        id: "s2",
        say: `Add ${a} + ${b}.`,
        ask: { prompt: `${a} + ${b} as two bits is…`, options: k % 2 ? [wrongSum, rightSum] : [rightSum, wrongSum], correctIndex: k % 2, afterCorrect: `Yes: ${rightSum}.`, afterWrong: `${a} + ${b} = ${rightSum} in binary.` },
      },
      { id: "s3", say: `The right-hand bit is the sum S = ${s}; the left-hand bit is the carry C = ${c}.` },
    ],
  };
}

/* ---------- 2. the table, one column at a time ---------- */

const tableVariant: VariantInput = {
  id: "vtable",
  prompt: "Fill the half adder's table: first the sum S, then the carry C, for each row A + B.",
  spec: { kind: "truth-table", inputs: ["A", "B"], columns: [{ id: "s", label: "S", expr: "A ⊕ B" }, { id: "c", label: "C", expr: "AB" }] },
  figure: { type: "adder", adder: "half" }, // the symbol alone (#454)
  hints: [
    { rung: 2, text: "Not yet. Each row adds A + B; the {columnLabel} column holds one bit of that sum." },
    { rung: 3, text: "S is the right-hand bit of A + B; C is the left-hand bit, the carry." },
    { rung: 4, text: "Which row is the only one that makes a carry?" },
    { rung: 6, text: "0 + 0 = 00, 0 + 1 = 01, 1 + 0 = 01, 1 + 1 = 10 (C first, then S)." },
    { rung: 9, text: "S reads 0 1 1 0 and C reads 0 0 0 1, top to bottom." },
  ],
  explanation: [
    { id: "s1", say: "Each row adds A + B. Write the result as two bits: C on the left, S on the right.", stage: { step: 0, revealed: 0 } },
    {
      id: "s2",
      say: "Take the last row, A = 1 and B = 1.",
      stage: { step: 0, revealed: 3 },
      ask: { prompt: "What is S on that row?", options: ["1", "0"], correctIndex: 1, afterCorrect: "Yes: 1 + 1 = 10, so S = 0 and the 1 is carried.", afterWrong: "1 + 1 = 10: S is 0 and the 1 goes to C." },
    },
    { id: "s3", say: "So S is 1 when exactly one input is 1, and C is 1 only when both are.", stage: { step: 0, revealed: 4 } },
  ],
};

/* ---------- 3. name the gate for each output ---------- */

function gateVariant(output: "S" | "C", k: number): VariantInput {
  const right = output === "S" ? "XOR" : "AND";
  const slip = output === "S" ? "OR" : "XOR"; // pack: S as OR; C as XOR
  const options = rotate(["AND", "OR", "XOR", "NOR"].map((g) => ({ id: g.toLowerCase(), text: g })), k + 1);
  const column = output === "S" ? "0 1 1 0" : "0 0 0 1";
  return {
    id: `v${output.toLowerCase()}`,
    prompt: `The ${output} column reads ${column}, top to bottom. Which gate gives exactly that column?`,
    spec: { kind: "multiple-choice", options, correctOptionId: right.toLowerCase() },
    figure: { type: "adder", adder: "half", focus: output }, // the symbol, the asked output in focus (#454)
    hints: [
      { rung: 2, text: "Not yet. Compare the column with each gate's truth table, row by row." },
      { rung: 3, text: "Look at the last row, A = 1 and B = 1. What does each gate give there?" },
      { rung: 4, text: output === "S" ? "S is 1 when the inputs differ, and 0 when they are equal." : "C is 1 on one row only: where both inputs are 1." },
      { rung: 9, text: `${output} = ${output === "S" ? "A ⊕ B, an XOR gate" : "A·B, an AND gate"}.` },
    ],
    misconceptions: [{ id: output === "S" ? "ha.s-as-or" : "ha.c-as-xor", title: `${output} taken for ${slip}`, nudgeKey: output === "S" ? "ha.s-as-or" : "ha.c-as-xor", detect: { type: "option", optionId: slip.toLowerCase() } }],
    explanation: [
      { id: "s1", say: `${output} reads ${column}.` },
      {
        id: "s2",
        say: "The last row, 1 and 1, tells the gates apart.",
        ask: { prompt: `What is ${output} on the row 1 1?`, options: ["0", "1"], correctIndex: output === "S" ? 0 : 1, afterCorrect: "Yes.", afterWrong: `It is ${output === "S" ? 0 : 1}: 1 + 1 = 10.` },
      },
      { id: "s3", say: output === "S" ? "OR would give 1 there; XOR gives 0. So S = A ⊕ B." : "XOR would give 0 there; AND gives 1. So C = A·B." },
    ],
  };
}

/* ---------- 4. walk the circuit: XOR for S, AND for C, sharing A and B ---------- */

function walkVariant([a, b]: [Bit, Bit]): VariantInput {
  const { s, c } = sumOf(a, b);
  return {
    id: pairId([a, b]),
    prompt: `A = ${a} and B = ${b} feed both gates. Find S at the XOR gate, then C at the AND gate.`,
    spec: {
      kind: "circuit-predict",
      inputs: [
        { id: "a", label: "A", value: a },
        { id: "b", label: "B", value: b },
      ],
      gates: [
        { id: "gs", type: "XOR", from: ["a", "b"], label: "S" },
        { id: "gc", type: "AND", from: ["a", "b"], label: "C" },
      ],
      outputGateId: "gc",
      answer: c,
      inputsToggleable: true,
    },
    hints: gateWalkHints,
    misconceptions: [
      { id: "lg.rule-xor", title: "Wrong XOR output", nudgeKey: "lg.check-xor", detect: { type: "gate-output", gate: "XOR" } },
      { id: "lg.rule-and", title: "Wrong AND output", nudgeKey: "lg.check-and", detect: { type: "gate-output", gate: "AND" } },
    ],
    explanation: [
      { id: "s1", say: "A and B go to both gates at once: XOR makes S, AND makes C.", stage: { lit: [] } },
      {
        id: "s2",
        say: `The XOR gate sees ${a} and ${b}: ${a !== b ? "different" : "equal"} inputs.`,
        stage: { lit: [], active: "gs" },
        ask: { prompt: "What is S?", options: ["0", "1"], correctIndex: s, afterCorrect: `Right: S = ${s}.`, afterWrong: `XOR gives 1 only on different inputs, so S = ${s}.` },
      },
      {
        id: "s3",
        say: `The AND gate sees the same ${a} and ${b}.`,
        stage: { lit: ["gs"], active: "gc" },
        ask: { prompt: "What is C?", options: ["0", "1"], correctIndex: c, afterCorrect: `Right: C = ${c}.`, afterWrong: `AND gives 1 only when both are 1, so C = ${c}.` },
      },
      { id: "s4", say: `S = ${s}, C = ${c}: ${a} + ${b} = ${c}${s} in binary.`, stage: { lit: ["gs", "gc"] } },
    ],
  };
}

export const halfAdderTopic: TopicInput = {
  id: "half-adder",
  title: "Half adder",
  summary: "Add two bits: predict one row, fill the table, name the gates (S = A ⊕ B, C = A·B), then walk the circuit.",
  preview: "1 + 1 → 10 → S = 0, C = 1",
  meet: {
    figure: { type: "adder", adder: "half", given: { a: 1, b: 1 } },
    callouts: ["Two bits come in: 1 and 1.", "1 + 1 is 2, written 10 in binary.", "S is the 0, C is the carry 1."],
  },
  concepts: [
    { id: "ha.adder", title: "Half adder", summary: "Adds two bits A and B: the sum bit S = A ⊕ B and the carry C = A·B." },
  ],
  objectives: [
    { id: "ha.obj.table", conceptId: "ha.adder", text: "Fill the half adder's table and read S and C as gates." },
    { id: "ha.obj.walk", conceptId: "ha.adder", text: "Walk the half-adder circuit for given inputs." },
  ],
  activities: [
    {
      id: "half-adder",
      title: "Half adder",
      summary: "One row first, then the table, the gates and the circuit.",
      authority: "DEMO",
      minutes: 12,
      questions: [
        { id: "ha.q.add", label: "One row first", conceptId: "ha.adder", objectiveId: "ha.obj.table", variants: PAIRS.map(([a, b], k) => addVariant(a, b, k)) },
        { id: "ha.q.table", label: "S and C table", conceptId: "ha.adder", objectiveId: "ha.obj.table", variants: [tableVariant] }, // one fixed table: exempt (content.test)
        { id: "ha.q.gates", label: "Name the gates", conceptId: "ha.adder", objectiveId: "ha.obj.table", variants: [gateVariant("S", 0), gateVariant("C", 1)] }, // the device has two outputs: exempt
        { id: "ha.q.walk", label: "Walk the circuit", conceptId: "ha.adder", objectiveId: "ha.obj.walk", variants: PAIRS.map(walkVariant) },
      ],
    },
  ],
};
