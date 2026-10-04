/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 2, derived gates (#225, content pack ch2 §2–4): NAND and NOR with their
 * intermediate column, XOR as AB′ + A′B and XNOR filled column by column in the slides' column
 * order, and rows = 2^n. Every column is computed from its expression (truth-table kind).
 */
import type { z } from "zod";
import type { HintSchema, TopicSchema, VariantSchema } from "../../schema";
import { columnTruth } from "@/kinds/truth-table/logic";
import { TruthTableSpec } from "@/kinds/truth-table/spec";

type TopicInput = z.input<typeof TopicSchema>;
type HintInput = z.input<typeof HintSchema>;
type VariantInput = z.input<typeof VariantSchema>;
type ExplanationInput = VariantInput["explanation"];

const columnHints: HintInput[] = [
  { rung: 2, text: "Not yet. Work out {columnLabel} on each row, using the columns to its left." },
  { rung: 3, text: "{columnLabel} means {columnExpr}: a prime flips a value, a dot is AND, + is OR." },
  { rung: 4, text: "Which columns to the left does {columnLabel} use? Read them row by row." },
  { rung: 6, text: "Each row is its own case: the rows count up in binary from all zeros." },
  { rung: 8, text: "Fill the rows where {columnLabel} is 1 first; the others are 0." },
  { rung: 9, text: "{columnLabel} reads {columnValues}, top to bottom." },
];

const misconceptions: VariantInput["misconceptions"] = [
  { id: "tt.and-or-swapped", title: "AND and OR swapped", nudgeKey: "tt.and-or-swapped", detect: { type: "and-or-swapped" } },
  { id: "tt.not-missing", title: "NOT not applied", nudgeKey: "tt.not-missing", detect: { type: "not-missing" } },
];

type Column = { id: string; label: string; expr: string; meaning: string };

/** A derived-gate table: one goal per column; Explain Slowly predicts one row per column. */
function derivedTable(id: string, prompt: string, inputs: [string, string], columns: Column[], wrapUp: string): VariantInput {
  const spec = { kind: "truth-table" as const, inputs, columns: columns.map(({ id, label, expr }) => ({ id, label, expr })) };
  const parsed = TruthTableSpec.parse(spec);
  const walk: ExplanationInput = columns.map((c, i) => {
    const truth = columnTruth(parsed, parsed.columns[i]);
    const row = (i + 1) % 4; // a different row for each column
    const bits = `${row >> 1} ${row & 1}`;
    return {
      id: `s${i + 2}`,
      say: `${c.label}: ${c.meaning}`,
      stage: { step: i, revealed: 0 },
      // one predicted row only: the whole column stays for the last hint rung (Pedagogy on #338)
      ask: { prompt: `On the row ${bits}, ${c.label} = ?`, options: ["0", "1"], correctIndex: truth[row] as 0 | 1, afterCorrect: `Yes: ${truth[row]}.`, afterWrong: `It is ${truth[row]} there.` },
    };
  });
  return {
    id,
    prompt,
    spec,
    hints: columnHints,
    misconceptions,
    explanation: [{ id: "s1", say: "One column at a time, left to right; each column uses only the columns before it.", stage: { step: 0, revealed: 0 } }, ...walk, { id: `s${columns.length + 2}`, say: wrapUp, stage: { step: columns.length - 1, revealed: 4 } }],
  };
}

const nand = (id: string, [a, b]: [string, string]) =>
  derivedTable(
    id,
    `NAND is AND followed by NOT. Fill ${a}·${b}, then (${a}·${b})′.`,
    [a, b],
    [
      { id: "and", label: `${a}·${b}`, expr: `${a}${b}`, meaning: "AND of the two inputs." },
      { id: "f", label: `(${a}·${b})′`, expr: `(${a}${b})'`, meaning: "the AND column, flipped." },
    ],
    "NAND is 0 only when both inputs are 1.",
  );

const nor = (id: string, [a, b]: [string, string]) =>
  derivedTable(
    id,
    `NOR is OR followed by NOT. Fill ${a} + ${b}, then (${a} + ${b})′.`,
    [a, b],
    [
      { id: "or", label: `${a} + ${b}`, expr: `${a} + ${b}`, meaning: "OR of the two inputs." },
      { id: "f", label: `(${a} + ${b})′`, expr: `(${a} + ${b})'`, meaning: "the OR column, flipped." },
    ],
    "NOR is 1 only when both inputs are 0.",
  );

const xor = (id: string, [a, b]: [string, string]) =>
  derivedTable(
    id,
    `XOR as ${a}·${b}′ + ${a}′·${b}: fill each column, left to right.`,
    [a, b],
    [
      { id: "na", label: `${a}′`, expr: `${a}'`, meaning: `${a} flipped.` },
      { id: "nb", label: `${b}′`, expr: `${b}'`, meaning: `${b} flipped.` },
      { id: "p1", label: `${a}·${b}′`, expr: `${a}${b}'`, meaning: `AND of ${a} and ${b}′.` },
      { id: "p2", label: `${a}′·${b}`, expr: `${a}'${b}`, meaning: `AND of ${a}′ and ${b}.` },
      { id: "f", label: `${a}·${b}′ + ${a}′·${b}`, expr: `${a}${b}' + ${a}'${b}`, meaning: "OR of the two products." },
    ],
    "XOR is 1 when exactly one input is 1: the inputs differ.",
  );

const xnor = (id: string, [a, b]: [string, string]) =>
  derivedTable(
    id,
    `XNOR as ${a}·${b} + ${a}′·${b}′: fill each column, left to right.`,
    [a, b],
    [
      { id: "na", label: `${a}′`, expr: `${a}'`, meaning: `${a} flipped.` },
      { id: "nb", label: `${b}′`, expr: `${b}'`, meaning: `${b} flipped.` },
      { id: "p1", label: `${a}·${b}`, expr: `${a}${b}`, meaning: `AND of ${a} and ${b}.` },
      { id: "p2", label: `${a}′·${b}′`, expr: `${a}'${b}'`, meaning: `AND of ${a}′ and ${b}′.` },
      { id: "f", label: `${a}·${b} + ${a}′·${b}′`, expr: `${a}${b} + ${a}'${b}'`, meaning: "OR of the two products." },
    ],
    "XNOR is 1 when the inputs are equal: it is XOR flipped.",
  );

/* ---------- rows = 2^n (p.19–20) ---------- */

function rowCount(n: number, k: number): VariantInput {
  const right = 2 ** n;
  // real slips: 2 × n, n², and the highest row number 2^n − 1
  const wrong = [2 * n, n * n, right - 1].filter((w, i, all) => w !== right && all.indexOf(w) === i);
  const all = [right, ...wrong].map((v) => ({ id: `r${v}`, text: String(v) }));
  const r = (k + 1) % all.length;
  return {
    id: `vrows-${n}`,
    prompt: `A gate has ${n} inputs. How many rows does its truth table have?`,
    spec: { kind: "multiple-choice", options: [...all.slice(r), ...all.slice(0, r)].map((o) => ({ ...o, misconceptionId: o.text === String(right - 1) ? "dg.highest-row" : undefined })), correctOptionId: `r${right}` },
    hints: [
      { rung: 2, text: "Not yet. Each input can be 0 or 1." },
      { rung: 3, text: "Every input doubles the number of combinations: 2 × 2 × … for each input." },
      { rung: 9, text: `${n} inputs give 2^${n} = ${right} rows.` },
    ],
    misconceptions: [{ id: "dg.highest-row", title: "Gave the highest row number", nudgeKey: "dg.highest-row", detect: { type: "option", optionId: `r${right - 1}` } }],
    explanation: [
      { id: "s1", say: "One input gives 2 rows: 0 and 1. Each further input doubles them." },
      {
        id: "s2",
        say: `So ${n} inputs give 2^${n} rows.`,
        ask: { prompt: `2^${n} = ?`, options: [String(right), String(2 * n)], correctIndex: 0, afterCorrect: `Yes: ${right} rows, numbered 0 to ${right - 1}.`, afterWrong: `2^${n} = ${right}, so ${right} rows, numbered 0 to ${right - 1}.` },
      },
    ],
  };
}

export const derivedGatesTopic: TopicInput = {
  id: "derived-gates",
  title: "Derived gates",
  summary: "NAND, NOR, XOR and XNOR, built from the basic gates one column at a time.",
  preview: "A·B → (A·B)′",
  concepts: [
    { id: "dg.nand-nor", title: "NAND and NOR", summary: "NAND is AND followed by NOT; NOR is OR followed by NOT." },
    { id: "dg.xor-xnor", title: "XOR and XNOR", summary: "XOR = AB′ + A′B is 1 when the inputs differ; XNOR is its complement." },
    { id: "dg.rows", title: "Rows = 2^n", summary: "A table with n inputs has 2^n rows." },
  ],
  objectives: [
    { id: "dg.obj.nand-nor", conceptId: "dg.nand-nor", text: "Fill NAND and NOR tables through their AND/OR column." },
    { id: "dg.obj.xor-xnor", conceptId: "dg.xor-xnor", text: "Fill XOR and XNOR tables column by column." },
    { id: "dg.obj.rows", conceptId: "dg.rows", text: "Give the number of rows for n inputs." },
  ],
  activities: [
    {
      id: "derived-gates",
      title: "NAND, NOR, XOR, XNOR",
      summary: "Each derived gate's table, one column at a time.",
      authority: "DEMO",
      minutes: 15,
      questions: [
        // Relabelled sets (A,B · x,y · P,Q) are acceptable for these fixed-fact tables because Explain
        // Slowly predicts one row per column and never reads a whole column out (Pedagogy on #338).
        { id: "dg.q.nand", label: "NAND", conceptId: "dg.nand-nor", objectiveId: "dg.obj.nand-nor", variants: [nand("vab", ["A", "B"]), nand("vxy", ["x", "y"]), nand("vpq", ["P", "Q"])] },
        { id: "dg.q.nor", label: "NOR", conceptId: "dg.nand-nor", objectiveId: "dg.obj.nand-nor", variants: [nor("vab", ["A", "B"]), nor("vxy", ["x", "y"]), nor("vpq", ["P", "Q"])] },
        { id: "dg.q.xor", label: "XOR", conceptId: "dg.xor-xnor", objectiveId: "dg.obj.xor-xnor", variants: [xor("vab", ["A", "B"]), xor("vxy", ["x", "y"]), xor("vpq", ["P", "Q"])] },
        { id: "dg.q.xnor", label: "XNOR", conceptId: "dg.xor-xnor", objectiveId: "dg.obj.xor-xnor", variants: [xnor("vab", ["A", "B"]), xnor("vxy", ["x", "y"]), xnor("vpq", ["P", "Q"])] },
        { id: "dg.q.rows", label: "Rows = 2ⁿ", conceptId: "dg.rows", objectiveId: "dg.obj.rows", variants: [rowCount(3, 0), rowCount(4, 1), rowCount(5, 2)] }, // n = 2 would make 2n, n² and 2ⁿ all 4
      ],
    },
  ],
};
