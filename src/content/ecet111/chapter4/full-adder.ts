/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 4, full adder (content pack ch4 §2). Long chains are separate activities with
 * progress kept between them (requirements doc): activity 1 (#301) is the 8-row table, linked to
 * a column of Chapter 1 addition with a carry coming in. Truth comes from the Boolean module.
 */
import type { CourseInput, VariantInput } from "../../schema";
import type { LawId } from "@/kinds/derivation/spec";
import { LAW_NAMES } from "@/kinds/derivation/logic";

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

/* ---------- activity 2 (#302): the minterm lists Σ for S and Co ---------- */

type Output = "S" | "Co";
const EXPR: Record<Output, string> = { S: "A ⊕ B ⊕ Ci", Co: "AB + BCi + ACi" };
const ROWS_OF: Record<Output, number[]> = { S: [1, 2, 4, 7], Co: [3, 5, 6, 7] }; // pack ch4 §2, checked by content.test
const OTHER: Record<Output, Output> = { S: "Co", Co: "S" };
const sigmaText = (rows: number[]) => `Σ(${rows.join(", ")})`;
const bitsOf = (m: number) => m.toString(2).padStart(3, "0");

/** The full table, both outputs given, for the row questions. */
const givenTable = (target: Output): VariantInput["spec"] => ({
  kind: "truth-table",
  inputs: INPUTS,
  mode: "row-select",
  target: target.toLowerCase(),
  columns: [
    { id: "s", label: "S", expr: EXPR.S, given: true },
    { id: "co", label: "Co", expr: EXPR.Co, given: true },
  ],
});

function rowsVariant(out: Output): VariantInput {
  const rows = ROWS_OF[out];
  return {
    id: `v${out.toLowerCase()}`,
    prompt: `Here is the full adder's table. Tick the rows where ${out} = 1.`,
    spec: givenTable(out),
    hints: [
      { rung: 2, text: `Not yet. Read down the ${out} column only.` },
      { rung: 3, text: `Tick a row only where ${out} shows 1; the other output does not matter here.` },
      { rung: 9, text: `${out} = 1 on the rows ${rows.map(bitsOf).join(", ")}.` },
    ],
    misconceptions: [{ id: "tt.rows-inverted", title: "Picked the 0-rows", nudgeKey: "tt.rows-inverted", detect: { type: "rows-inverted" } }],
    explanation: [
      { id: "s1", say: `A minterm list names the rows where the output is 1. Read down the ${out} column.` },
      { id: "s2", say: `${out} is 1 on ${rows.length} rows.` },
    ],
  };
}

function sigmaVariant(out: Output, k: number): VariantInput {
  const rows = ROWS_OF[out];
  const zeros = [0, 1, 2, 3, 4, 5, 6, 7].filter((m) => !rows.includes(m));
  const choices = [
    { id: "right", text: sigmaText(rows) },
    { id: "other", text: sigmaText(ROWS_OF[OTHER[out]]) },
    { id: "zeros", text: sigmaText(zeros) },
    { id: "short", text: sigmaText(rows.slice(0, -1)) },
  ];
  return {
    id: `v${out.toLowerCase()}`,
    prompt: `${out}(A, B, Ci) as a minterm list: which one is it?`,
    spec: { kind: "multiple-choice", options: rotate(choices, k + 1), correctOptionId: "right" },
    hints: [
      { rung: 2, text: `Not yet. Each number is a row where ${out} = 1, read as a binary number A B Ci.` },
      { rung: 3, text: `Which rows did you tick for ${out}? Turn each into its number: 011 is 3.` },
      { rung: 4, text: "Check the last row, 111 = 7: is it in the list?" },
      { rung: 9, text: `${out} = ${sigmaText(rows)}.` },
    ],
    misconceptions: [
      { id: "fa.sigma-other-output", title: "The other output's list", nudgeKey: "fa.sigma-other-output", detect: { type: "option", optionId: "other" } },
      { id: "fa.sigma-zero-rows", title: "The 0-rows listed", nudgeKey: "fa.sigma-zero-rows", detect: { type: "option", optionId: "zeros" } },
    ],
    explanation: [
      { id: "s1", say: `Each 1-row of ${out} is one minterm; its number is the row's bits A B Ci read in binary.` },
      {
        id: "s2",
        say: `${out} is 1 on the row ${bitsOf(rows[0])}.`,
        ask: { prompt: `What number is ${bitsOf(rows[0])}?`, options: k % 2 ? [String(rows[0] + 1), String(rows[0])] : [String(rows[0]), String(rows[0] + 1)], correctIndex: k % 2, afterCorrect: "Yes.", afterWrong: `${bitsOf(rows[0])} is ${rows[0]} in binary.` },
      },
      { id: "s3", say: `So ${out} = ${sigmaText(rows)}.` },
    ],
  };
}

export const fullAdderSigmaActivity: Activity = {
  id: "full-adder-sigma",
  title: "Full adder: minterm lists",
  summary: "From the table to Σ: tick each output's 1-rows, then name its list.",
  authority: "DEMO",
  minutes: 8,
  questions: [
    // two outputs, one fixed table: exempt from the three-set rule (as #357, Pedagogy)
    { id: "fa.q.rows", label: "Tick the 1-rows", conceptId: "fa.adder", objectiveId: "fa.obj.sigma", variants: [rowsVariant("Co"), rowsVariant("S")] },
    { id: "fa.q.sigma", label: "Name the list", conceptId: "fa.adder", objectiveId: "fa.obj.sigma", variants: [sigmaVariant("Co", 0), sigmaVariant("S", 1)] },
  ],
};

/* ---------- optional challenge (#304): S → A ⊕ B ⊕ Ci by algebra, one law per line (pack ch4 §2, s.22) ---------- */

type Line = { law: LawId; expr: string; lawOptions: LawId[]; wrongLines: { id: string; expr: string; misconceptionId?: string }[] };
const show = (t: string) => t.replace(/'/g, "′");

const algebraHints: VariantInput["hints"] = [
  { rung: 2, text: "Not yet. Look at the line before: {previous}." },
  { rung: 3, text: "Name the law first, then apply only that law, to one part of the line." },
  { rung: 4, text: "Look inside each bracket: is it one of the two XOR shapes, A′B + AB′ or AB + A′B′?" },
  { rung: 6, text: "Change only that part; copy the rest of the line as it is." },
  { rung: 9, text: "This step uses {lawName}." },
];

const algebraMisconceptions: VariantInput["misconceptions"] = [
  { id: "drv.slip", title: "Line not equal to the one before", nudgeKey: "drv.line-not-equivalent", detect: { type: "line-not-equivalent" } },
  { id: "drv.skip", title: "Skipped a step", nudgeKey: "drv.line-skipped", detect: { type: "line-skipped" } },
  { id: "drv.other", title: "Valid, but not this law's step", nudgeKey: "drv.line-other", detect: { type: "line-other" } },
];

/** The full adder's S as in the pack (factor A′ and A, name each bracket, then XOR with A). */
const S_LINES: Line[] = [
  { law: "distributive", expr: "A'(B'Ci + BCi') + A(BCi + B'Ci')", lawOptions: ["commutative", "distributive", "absorb"], wrongLines: [{ id: "w1", expr: "A'(B'Ci + BCi') + A(BCi + B'Ci)" }] },
  { law: "xor", expr: "A'(B ⊕ Ci) + A(BCi + B'Ci')", lawOptions: ["xnor", "de-morgan", "xor"], wrongLines: [{ id: "w1", expr: "A'(B ⊕ Ci)' + A(BCi + B'Ci')" }] },
  { law: "xnor", expr: "A'(B ⊕ Ci) + A(B ⊕ Ci)'", lawOptions: ["xnor", "xor", "double"], wrongLines: [{ id: "w1", expr: "A'(B ⊕ Ci) + A(B ⊕ Ci)" }] },
  { law: "xor", expr: "A ⊕ B ⊕ Ci", lawOptions: ["or-not", "xor", "xnor"], wrongLines: [{ id: "w1", expr: "(A ⊕ B ⊕ Ci)'" }] },
];

/** The same parity function over x, y, z, terms in another order. */
const X_LINES: Line[] = [
  { law: "distributive", expr: "x'(y'z + yz') + x(y'z' + yz)", lawOptions: ["distributive", "associative", "absorb"], wrongLines: [{ id: "w1", expr: "x'(y'z + yz') + x(y'z' + y'z)" }] },
  { law: "xor", expr: "x'(y ⊕ z) + x(y'z' + yz)", lawOptions: ["xor", "xnor", "or-not"], wrongLines: [{ id: "w1", expr: "x'(y ⊕ z)' + x(y'z' + yz)" }] },
  { law: "xnor", expr: "x'(y ⊕ z) + x(y ⊕ z)'", lawOptions: ["xor", "double", "xnor"], wrongLines: [{ id: "w1", expr: "x'(y ⊕ z) + x(y ⊕ z)" }] },
  { law: "xor", expr: "x ⊕ y ⊕ z", lawOptions: ["xnor", "xor", "de-morgan"], wrongLines: [{ id: "w1", expr: "(x ⊕ y ⊕ z)'" }] },
];

/** Its complement, Σ(0, 3, 5, 6): the last step is the XNOR shape, (A ⊕ X)′. */
const C_LINES: Line[] = [
  { law: "distributive", expr: "A'(B'C' + BC) + A(B'C + BC')", lawOptions: ["absorb", "distributive", "commutative"], wrongLines: [{ id: "w1", expr: "A'(B'C' + BC) + A(B'C + BC)" }] },
  { law: "xnor", expr: "A'(B ⊕ C)' + A(B'C + BC')", lawOptions: ["xor", "xnor", "double"], wrongLines: [{ id: "w1", expr: "A'(B ⊕ C) + A(B'C + BC')" }] },
  { law: "xor", expr: "A'(B ⊕ C)' + A(B ⊕ C)", lawOptions: ["xnor", "de-morgan", "xor"], wrongLines: [{ id: "w1", expr: "A'(B ⊕ C)' + A(B ⊕ C)'" }] },
  { law: "xnor", expr: "(A ⊕ B ⊕ C)'", lawOptions: ["xnor", "xor", "or-not"], wrongLines: [{ id: "w1", expr: "A ⊕ B ⊕ C" }] },
];

const ALGEBRA_SETS: { id: string; name: string; vars: string[]; start: string; lines: Line[] }[] = [
  { id: "vs", name: "S", vars: ["A", "B", "Ci"], start: "AB'Ci' + A'B'Ci + ABCi + A'BCi'", lines: S_LINES },
  { id: "vx", name: "F", vars: ["x", "y", "z"], start: "x'y'z + x'yz' + xy'z' + xyz", lines: X_LINES },
  { id: "vc", name: "F", vars: ["A", "B", "C"], start: "A'B'C' + A'BC + AB'C + ABC'", lines: C_LINES },
];

function algebraVariant(set: (typeof ALGEBRA_SETS)[number], k: number): VariantInput {
  const [first] = set.lines;
  const other = first.lawOptions.find((l) => l !== first.law)!;
  const choices = k % 2 ? [LAW_NAMES[other], LAW_NAMES[first.law]] : [LAW_NAMES[first.law], LAW_NAMES[other]];
  return {
    id: set.id,
    prompt: `${set.name} = ${show(set.start)}: four 1s, no two side by side, so a K-map cannot group them. Show ${set.name} with XOR, one law per line: first name the law, then pick the line.`,
    spec: { kind: "derivation", vars: set.vars, start: set.start, lines: set.lines, lineMode: "choose", shift: k },
    hints: algebraHints,
    misconceptions: algebraMisconceptions,
    explanation: [
      { id: "s1", say: "Two shapes do the work here: A′B + AB′ is A ⊕ B, and AB + A′B′ is (A ⊕ B)′." },
      {
        id: "s2",
        say: `Start by taking ${set.vars[0]}′ out of two terms and ${set.vars[0]} out of the other two.`,
        ask: { prompt: "Which law is that?", options: choices, correctIndex: choices.indexOf(LAW_NAMES[first.law]), afterCorrect: "Yes: distributive, used to factor.", afterWrong: "It is distributive, used to factor." },
      },
      { id: "s3", say: "Then name each bracket as XOR or XNOR, and the last line has the same shape again." },
    ],
  };
}

export const fullAdderAlgebraActivity: Activity = {
  id: "full-adder-algebra",
  title: "Full adder: S by algebra (optional challenge)",
  summary: "Why S = A ⊕ B ⊕ Ci: factor, then read each bracket as XOR or XNOR.",
  authority: "DEMO",
  minutes: 10,
  questions: [{ id: "fa.q.algebra", label: "S as XOR", conceptId: "fa.adder", objectiveId: "fa.obj.algebra", variants: ALGEBRA_SETS.map((s, k) => algebraVariant(s, k)) }],
};

export const fullAdderTopic: TopicInput = {
  id: "full-adder",
  title: "Full adder",
  summary: "Add three bits, A + B + a carry in: the table first, then its minterms and maps, in separate activities.",
  preview: "1 + 1 + 1 → 11 → S = 1, Co = 1",
  concepts: [{ id: "fa.adder", title: "Full adder", summary: "Adds A, B and the carry in Ci: S is 1 for an odd count of 1s, Co for two or more." }],
  objectives: [
    { id: "fa.obj.table", conceptId: "fa.adder", text: "Fill the full adder's 8-row table, S then Co." },
    { id: "fa.obj.sigma", conceptId: "fa.adder", text: "Write S and Co as minterm lists from the table." },
    { id: "fa.obj.algebra", conceptId: "fa.adder", text: "Show S = A ⊕ B ⊕ Ci by algebra (optional)." },
  ],
  activities: [fullAdderTableActivity, fullAdderSigmaActivity, fullAdderAlgebraActivity],
};
