/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 2, SOP and POS (#227, content pack ch2 §6–7): recognise SOP and POS (POS for
 * recognition only, as on the slides), fill a table from an SOP one product at a time, then go back
 * from a table's 1-rows to the SOP, one product per 1-row. Every answer is computed.
 */
import type { z } from "zod";
import type { HintSchema, TopicSchema, VariantSchema } from "../../schema";
import { envFor, isPOS, isSOP, parseBool } from "../../boolean";

type TopicInput = z.input<typeof TopicSchema>;
type HintInput = z.input<typeof HintSchema>;
type VariantInput = z.input<typeof VariantSchema>;

const VARS = ["A", "B", "C"];
const rotate = <T,>(xs: T[], k: number) => [...xs.slice(k % xs.length), ...xs.slice(0, k % xs.length)];
const rowBits = (m: number) => envFor(VARS, m);
const bitsText = (m: number) => VARS.map((v) => rowBits(m)[v]).join(" ");
/** The minterm product of row m: a 0 input gives the primed letter. */
const minterm = (m: number) => VARS.map((v) => (rowBits(m)[v] ? v : `${v}'`)).join("");
const show = (t: string) => t.replace(/'/g, "′");

/* ---------- Q1: SOP, POS, or neither (p.26–29) ---------- */

const FORMS = [
  { id: "sop", text: "SOP: a sum of products" },
  { id: "pos", text: "POS: a product of sums" },
  { id: "neither", text: "Neither: the forms are mixed" },
];

function formVariant(id: string, expr: string, k: number): VariantInput {
  const e = parseBool(expr);
  const form = isSOP(e) ? "sop" : isPOS(e) ? "pos" : "neither";
  // the real mix-up is SOP ↔ POS; picking either for a mixed expression is a plain wrong answer
  const swapped = form === "sop" ? "pos" : form === "pos" ? "sop" : undefined;
  const why = form === "sop" ? "products joined by +" : form === "pos" ? "bracketed sums multiplied together" : "a product and a sum mixed at the top level";
  return {
    id,
    prompt: `F = ${show(expr)}. Which form is it?`,
    spec: { kind: "multiple-choice", options: rotate(FORMS.map((f) => ({ ...f, misconceptionId: f.id === swapped ? "sp.sop-pos" : undefined })), k), correctOptionId: form },
    hints: [
      { rung: 2, text: "Not yet. Look at what joins the outermost parts." },
      { rung: 3, text: "SOP: products (AND) joined by +. POS: sums in brackets, multiplied together." },
      { rung: 9, text: `It is ${form === "neither" ? "neither" : form.toUpperCase()}: ${why}.` },
    ],
    misconceptions: swapped ? [{ id: "sp.sop-pos", title: "SOP and POS swapped", nudgeKey: "sp.sop-pos", detect: { type: "option", optionId: swapped } }] : [],
    explanation: [
      { id: "s1", say: "Read from the outside in: what joins the biggest parts of F?" },
      {
        id: "s2",
        say: `F = ${show(expr)}.`,
        ask: { prompt: "The outermost parts are joined by…", options: ["+ (OR)", "multiplication (AND)"], correctIndex: e.type === "or" ? 0 : 1, afterCorrect: `Yes. Then look inside each part: F is ${form === "neither" ? "neither form" : form.toUpperCase()}.`, afterWrong: `They are joined by ${e.type === "or" ? "+" : "multiplication"}. Inside each part, F is ${form === "neither" ? "neither form" : form.toUpperCase()}.` },
      },
    ],
  };
}

/* ---------- Q2: SOP → table, one product per column, then F (p.31–33) ---------- */

const columnHints: HintInput[] = [
  { rung: 2, text: "Not yet. A product is 1 on exactly one row: where every letter is true." },
  { rung: 3, text: "{columnLabel}: a plain letter needs a 1 there, a primed letter needs a 0." },
  { rung: 4, text: "Which row of A B C makes {columnLabel} equal 1?" },
  { rung: 6, text: "F is the OR of the product columns: 1 where any product is 1." },
  { rung: 9, text: "{columnLabel} reads {columnValues}, top to bottom." },
];

function tableVariant(id: string, rows: number[]): VariantInput {
  const products = rows.map(minterm);
  const expr = products.join(" + ");
  return {
    id,
    prompt: `F = ${show(expr)}. Fill each product's column, then F.`,
    spec: {
      kind: "truth-table",
      inputs: VARS,
      columns: [...products.map((p, i) => ({ id: `p${i + 1}`, label: show(p), expr: p })), { id: "f", label: "F", expr }],
    },
    hints: columnHints,
    misconceptions: [
      { id: "tt.not-missing", title: "NOT not applied", nudgeKey: "tt.not-missing", detect: { type: "not-missing" } },
      { id: "tt.and-or-swapped", title: "AND and OR swapped", nudgeKey: "tt.and-or-swapped", detect: { type: "and-or-swapped" } },
    ],
    explanation: [
      { id: "s1", say: "Each product is 1 on exactly one row: plain letters 1, primed letters 0.", stage: { step: 0, revealed: 0 } },
      {
        id: "s2",
        say: `Take the first product, ${show(products[0])}.`,
        stage: { step: 0, revealed: 0 },
        ask: { prompt: `On which row is ${show(products[0])} = 1?`, options: rotate([bitsText(rows[0]), bitsText(7 - rows[0])], rows[0]), correctIndex: rotate([bitsText(rows[0]), bitsText(7 - rows[0])], rows[0]).indexOf(bitsText(rows[0])), afterCorrect: "Yes: only there.", afterWrong: `Plain letters need 1, primed letters 0: the row ${bitsText(rows[0])}.` },
      },
      { id: "s3", say: "Do the same for each product. F is 1 on every row where one of them is 1.", stage: { step: products.length, revealed: 0 } },
    ],
  };
}

/* ---------- Q3–Q4: table → 1-rows → SOP (p.30, p.34–36) ---------- */

function pickVariant(id: string, rows: number[]): VariantInput {
  const values = Array.from({ length: 8 }, (_, m) => (rows.includes(m) ? 1 : 0)) as (0 | 1)[];
  return {
    id,
    prompt: "Here is F's truth table. Tick the rows where F = 1.",
    spec: { kind: "truth-table", inputs: VARS, mode: "row-select", target: "f", columns: [{ id: "f", label: "F", values, given: true }] },
    hints: [
      { rung: 2, text: "Not yet. Read down the F column." },
      { rung: 3, text: "Tick a row only where F shows 1." },
      { rung: 9, text: `F = 1 on the rows ${rows.map(bitsText).join(", ")}.` },
    ],
    misconceptions: [{ id: "tt.rows-inverted", title: "Picked the 0-rows", nudgeKey: "tt.rows-inverted", detect: { type: "rows-inverted" } }],
    explanation: [
      { id: "s1", say: "The SOP starts from the rows where F is 1. Read down the F column." },
      { id: "s2", say: `F is 1 on ${rows.length} rows; each will give one product.` },
    ],
  };
}

function sopVariant(id: string, rows: number[]): VariantInput {
  const sop = rows.map(minterm).join(" + ");
  return {
    id,
    prompt: `F = 1 on the rows ${rows.map(bitsText).join(", ")} (A B C). Write F as a sum of products: one product per 1-row.`,
    spec: { kind: "expression", vars: VARS, minterms: rows, form: "minterms" },
    hints: [
      { rung: 2, text: "Not yet. Write one product for each 1-row, joined by +." },
      { rung: 3, text: "In each product, a 1 gives the plain letter and a 0 gives the primed letter." },
      { rung: 4, text: `Start with the row ${bitsText(rows[0])}: which letters are primed?` },
      { rung: 6, text: "Keep every letter in every product: this form is not simplified." },
      { rung: 9, text: `F = ${show(sop)}.` },
    ],
    misconceptions: [
      { id: "ex.wrong-form", title: "Simplified instead of one product per row", nudgeKey: "sp.one-per-row", detect: { type: "expression-wrong-form" } },
      { id: "ex.complement", title: "Used the 0-rows", nudgeKey: "sp.zero-rows", detect: { type: "expression-complement" } },
      { id: "ex.unreadable", title: "Unreadable", nudgeKey: "expr.unreadable", detect: { type: "expression-unreadable" } },
    ],
    explanation: [
      { id: "s1", say: "Each 1-row gives one product; a 0 input gives the primed letter." },
      {
        id: "s2",
        say: `Take the row ${bitsText(rows[0])}.`,
        ask: { prompt: "Its product is…", options: rotate([show(minterm(rows[0])), show(minterm(7 - rows[0]))], rows[1]), correctIndex: rotate([show(minterm(rows[0])), show(minterm(7 - rows[0]))], rows[1]).indexOf(show(minterm(rows[0]))), afterCorrect: "Yes. Do the same for the other 1-rows and join them with +.", afterWrong: `A 0 gives a primed letter: ${show(minterm(rows[0]))}. Do the same for the other rows.` },
      },
    ],
  };
}

// fresh functions (not the slide's X = A′B′C + A′BC′ + ABC)
const TABLE_SETS: [string, number[]][] = [
  ["vt-1", [2, 5, 6]],
  ["vt-2", [0, 3, 4]],
  ["vt-3", [1, 6, 7]],
];
const PICK_SETS: [string, number[]][] = [
  ["vp-1", [1, 4, 6]],
  ["vp-2", [0, 3, 5]],
  ["vp-3", [2, 5, 7]],
];

export const sopPosTopic: TopicInput = {
  id: "sop-and-pos",
  title: "SOP and POS",
  summary: "Tell SOP from POS, fill a table from an SOP, then write the SOP from a table's 1-rows.",
  preview: "rows 1, 3 → A′B + AB",
  concepts: [
    { id: "sp.forms", title: "SOP and POS", summary: "SOP: products joined by +. POS: bracketed sums multiplied together." },
    { id: "sp.table", title: "SOP ↔ truth table", summary: "Each product is 1 on one row; F is 1 where any product is; each 1-row gives one product." },
  ],
  objectives: [
    { id: "sp.obj.form", conceptId: "sp.forms", text: "Tell whether an expression is SOP, POS or neither." },
    { id: "sp.obj.to-table", conceptId: "sp.table", text: "Fill a truth table from an SOP, one product at a time." },
    { id: "sp.obj.to-sop", conceptId: "sp.table", text: "Write the SOP from a table's 1-rows, one product per row." },
  ],
  activities: [
    {
      id: "sop-and-pos",
      title: "SOP and POS",
      summary: "Recognise the forms, then go from SOP to table and back.",
      authority: "DEMO",
      minutes: 15,
      questions: [
        {
          id: "sp.q.form",
          label: "SOP or POS",
          conceptId: "sp.forms",
          objectiveId: "sp.obj.form",
          variants: [formVariant("vf-1", "AB' + A'C + BC", 1), formVariant("vf-2", "(A + B')(A' + C)", 2), formVariant("vf-3", "AB + C(A' + B)", 0)],
        },
        { id: "sp.q.to-table", label: "SOP → table", conceptId: "sp.table", objectiveId: "sp.obj.to-table", variants: TABLE_SETS.map(([id, rows]) => tableVariant(id, rows)) },
        { id: "sp.q.pick", label: "Tick the 1-rows", conceptId: "sp.table", objectiveId: "sp.obj.to-sop", variants: PICK_SETS.map(([id, rows]) => pickVariant(id, rows)) },
        { id: "sp.q.to-sop", label: "1-rows → SOP", conceptId: "sp.table", objectiveId: "sp.obj.to-sop", variants: PICK_SETS.map(([id, rows]) => sopVariant(id, rows)) },
      ],
    },
  ],
};
