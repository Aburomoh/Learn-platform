/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 2, minterms and canonical form (#231, content pack ch2 §12): spot the minterm,
 * canonical form by expansion (each missing letter X times X + X′, one law per line) with its Σ
 * list, and canonical form by truth table with the m column (tick the 1-rows). Every line, Σ list and
 * table is computed or checked with the Boolean module.
 */
import type { z } from "zod";
import type { HintSchema, TopicSchema, VariantSchema } from "../../schema";
import type { LawId } from "@/kinds/derivation/spec";
import { mintermsOf, parseBool, sigma } from "../../boolean";

type TopicInput = z.input<typeof TopicSchema>;
type HintInput = z.input<typeof HintSchema>;
type VariantInput = z.input<typeof VariantSchema>;
type Line = { law: LawId; expr: string; lawOptions: LawId[]; wrongLines: { id: string; expr: string }[] };

const show = (t: string) => t.replace(/'/g, "′");
const rotate = <T,>(xs: T[], k: number) => [...xs.slice(k % xs.length), ...xs.slice(0, k % xs.length)];

/* ---------- Q1: spot the minterm (p.64–65) ---------- */

function spotVariant(id: string, fn: string, vars: string[], terms: string[], k: number): VariantInput {
  const minterm = terms.find((t) => vars.every((v) => t.includes(v)))!;
  const options = rotate(terms.map((t) => ({ id: `t-${t.replace(/'/g, "n").toLowerCase()}`, text: show(t) })), k);
  return {
    id,
    prompt: `F(${vars.join(", ")}) = ${show(fn)}. Which term is a minterm?`,
    spec: { kind: "multiple-choice", options, correctOptionId: `t-${minterm.replace(/'/g, "n").toLowerCase()}` },
    hints: [
      { rung: 2, text: "Not yet. Count the letters in each term." },
      { rung: 3, text: `How many variables does F have? A minterm uses every one of them.` },
      { rung: 4, text: `A minterm contains each of ${vars.join(", ")} exactly once, primed or not.` },
      { rung: 9, text: `${show(minterm)} is the minterm: it has all ${vars.length} variables.` },
    ],
    explanation: [
      { id: "s1", say: `A minterm is a product that contains every variable of F, plain or primed. F has ${vars.length}: ${vars.join(", ")}.` },
      {
        id: "s2",
        say: "Count the letters in each term.",
        ask: { prompt: `How many letters must a minterm of F have?`, options: rotate([String(vars.length), String(vars.length - 1)], k), correctIndex: rotate([String(vars.length), String(vars.length - 1)], k).indexOf(String(vars.length)), afterCorrect: "Yes: one per variable.", afterWrong: `${vars.length}: one per variable.` },
      },
    ],
  };
}

/* ---------- Q1b: which one is canonical? (p.69–70) ---------- */

/** Canonical: every term is a minterm (has every variable). Two functions per set, one canonical. */
export const isCanonical = (fn: string, vars: string[]) => fn.split(" + ").every((t) => vars.every((v) => t.includes(v)));

function canonicalVariant(id: string, vars: string[], yes: string, no: string, k: number): VariantInput {
  const options = rotate([{ id: "yes", text: show(yes) }, { id: "no", text: show(no), misconceptionId: "mt.not-canonical" }], k);
  return {
    id,
    prompt: `F(${vars.join(", ")}). Which of these is in canonical form?`,
    spec: { kind: "multiple-choice", options, correctOptionId: "yes" },
    hints: [
      { rung: 2, text: "Not yet. Check every term of each function, not just the first." },
      { rung: 3, text: "Does each term contain every variable?" },
      { rung: 4, text: "Canonical form: every term is a minterm, with all of the variables." },
      { rung: 9, text: `${show(yes)} is canonical: every term has ${vars.join(", ")}.` },
    ],
    misconceptions: [{ id: "mt.not-canonical", title: "A term is missing a letter", nudgeKey: "mt.not-canonical", detect: { type: "option", optionId: "no" } }],
    explanation: [
      { id: "s1", say: "A function is in canonical form when every term is a minterm: each has all the variables." },
      {
        id: "s2",
        say: `Look at ${show(no)}.`,
        ask: { prompt: "Does every term have every variable?", options: ["Yes", "No"], correctIndex: 1, afterCorrect: "Right: one term is missing a letter, so it is not canonical.", afterWrong: "One term is missing a letter, so it is not canonical." },
      },
    ],
  };
}

/* ---------- Q2–Q3: canonical form by expansion, then the Σ list (p.71, 73–74) ---------- */

const lineHints: HintInput[] = [
  { rung: 2, text: "Not yet. Look at the line before: {previous}." },
  { rung: 3, text: "A term missing a letter X is multiplied by 1, written as X + X′; then the bracket is multiplied out." },
  { rung: 4, text: "Is this step writing ·1, replacing 1 by X + X′, or multiplying out?" },
  { rung: 9, text: "This step uses {lawName}." },
];

function expandVariant(id: string, vars: string[], start: string, lines: Line[]): VariantInput {
  return {
    id,
    prompt: `Write F = ${show(start)} in canonical form: name the law, then pick the line.`,
    spec: { kind: "derivation", vars, start, lines, lineMode: "choose" },
    hints: lineHints,
    misconceptions: [],
    explanation: [
      { id: "s1", say: "Canonical form: every term has every letter. Find the term with a letter missing." },
      { id: "s2", say: "Multiply it by 1 = X + X′ for the missing letter X, then multiply out. The value does not change." },
    ],
  };
}

function sigmaVariant(id: string, vars: string[], start: string, k: number): VariantInput {
  const e = parseBool(start, { vars });
  const ms = mintermsOf(e, vars);
  const all = Array.from({ length: 2 ** vars.length }, (_, m) => m);
  // real slips: only the terms that already had every letter; the 0-rows instead of the 1-rows
  const full = start.split(" + ").filter((t) => vars.every((v) => t.includes(v)));
  const onlyFull = full.length ? mintermsOf(parseBool(full.join(" + "), { vars }), vars) : [];
  const zeros = all.filter((m) => !ms.includes(m));
  const lists = [ms, onlyFull, zeros].filter((l, i, a) => l.length && a.findIndex((x) => x.join() === l.join()) === i);
  const options = rotate(lists.map((l, i) => ({ id: ["right", "only-full", "zeros"][[ms, onlyFull, zeros].indexOf(l)] ?? `o${i}`, text: sigma(l) })), k);
  return {
    id,
    prompt: `F(${vars.join(", ")}) = ${show(start)}. Which Σ list is its canonical form?`,
    spec: { kind: "multiple-choice", options, correctOptionId: "right" },
    hints: [
      { rung: 2, text: "Not yet. Use the canonical form you just wrote: one minterm per term." },
      { rung: 3, text: "Read each minterm as a binary number, first letter most significant: a plain letter is 1, a primed letter 0." },
      { rung: 9, text: `F = ${sigma(ms)}.` },
    ],
    misconceptions: [{ id: "mt.only-full", title: "Left out the expanded terms", nudgeKey: "mt.only-full", detect: { type: "option", optionId: "only-full" } }],
    explanation: [
      { id: "s1", say: "Each minterm is a row number: write its letters as bits, plain = 1, primed = 0." },
      { id: "s2", say: "The expanded term counts too: it became several minterms." },
    ],
  };
}

const exp = (law: LawId, expr: string, wrong: string, options: LawId[]): Line => ({ law, expr, lawOptions: options, wrongLines: [{ id: "w1", expr: wrong }] });

// the slide's two examples, then a fresh one
const SETS: { id: string; vars: string[]; start: string; lines: Line[] }[] = [
  {
    id: "vc-1",
    vars: ["A", "B"],
    start: "A' + AB'",
    lines: [
      exp("and-1", "A'·1 + AB'", "A'·0 + AB'", ["and-1", "or-1", "and-0"]),
      exp("or-not", "A'(B + B') + AB'", "A'(BB') + AB'", ["and-not", "or-not", "or-self"]),
      exp("distributive", "A'B + A'B' + AB'", "A'B + AB'", ["commutative", "absorb", "distributive"]),
    ],
  },
  {
    id: "vc-2",
    vars: ["x", "y", "z"],
    start: "xy + x'yz",
    lines: [
      exp("and-1", "xy·1 + x'yz", "xy·0 + x'yz", ["and-0", "and-1", "or-1"]),
      exp("or-not", "xy(z + z') + x'yz", "xy(zz') + x'yz", ["or-not", "and-not", "and-self"]),
      exp("distributive", "xyz + xyz' + x'yz", "xyz + x'yz", ["distributive", "absorb", "associative"]),
    ],
  },
  {
    id: "vc-3",
    vars: ["A", "B"],
    start: "A + A'B'",
    lines: [
      exp("and-1", "A·1 + A'B'", "A·0 + A'B'", ["or-1", "and-0", "and-1"]),
      exp("or-not", "A(B + B') + A'B'", "A(BB') + A'B'", ["and-not", "or-self", "or-not"]),
      exp("distributive", "AB + AB' + A'B'", "AB + A'B'", ["absorb", "distributive", "commutative"]),
    ],
  },
];

/* ---------- Q4: canonical form by truth table, m column, tick the 1-rows (p.72, 75–76) ---------- */

function tableVariant(id: string, vars: string[], fn: string): VariantInput {
  return {
    id,
    prompt: `F(${vars.join(", ")}) = ${show(fn)}. Tick the rows where F = 1: their m numbers are the Σ list.`,
    spec: { kind: "truth-table", inputs: vars, mode: "row-select", target: "f", mintermColumn: "right", columns: [{ id: "f", label: "F", expr: fn, given: true }] },
    hints: [
      { rung: 2, text: "Not yet. Read down the F column." },
      { rung: 3, text: "Tick each row where F shows 1; the m column gives its minterm number." },
      { rung: 9, text: `F = ${sigma(mintermsOf(parseBool(fn, { vars }), vars))}.` },
    ],
    misconceptions: [{ id: "tt.rows-inverted", title: "Picked the 0-rows", nudgeKey: "tt.rows-inverted", detect: { type: "rows-inverted" } }],
    explanation: [
      { id: "s1", say: "Method 2: fill F's column, then tick its 1-rows. The m column numbers each row." },
      { id: "s2", say: "The ticked m numbers, in order, are the Σ list." },
    ],
  };
}

export const mintermsTopic: TopicInput = {
  id: "minterms",
  title: "Minterms and canonical form",
  summary: "Spot minterms, then write a function in canonical form two ways: by expansion and by truth table.",
  preview: "A′ + AB′ → Σ(0, 1, 2)",
  concepts: [
    { id: "mt.minterm", title: "Minterm", summary: "A product with every variable once, plain or primed; n variables give 2^n minterms." },
    { id: "mt.canonical", title: "Canonical form", summary: "An SOP whose terms are all minterms, written Σ(row numbers)." },
  ],
  objectives: [
    { id: "mt.obj.spot", conceptId: "mt.minterm", text: "Pick out the minterm among a function's terms." },
    { id: "mt.obj.canonical", conceptId: "mt.canonical", text: "Tell whether a function is in canonical form." },
    { id: "mt.obj.expand", conceptId: "mt.canonical", text: "Expand a function to canonical form by X + X′, one law per line." },
    { id: "mt.obj.table", conceptId: "mt.canonical", text: "Read the canonical form from a truth table's 1-rows." },
  ],
  activities: [
    {
      id: "minterms",
      title: "Minterms and canonical form",
      summary: "Spot the minterm, tell canonical form, expand to it, give its Σ list, then use the table method.",
      authority: "DEMO",
      minutes: 15,
      questions: [
        {
          id: "mt.q.spot",
          label: "Spot the minterm",
          conceptId: "mt.minterm",
          objectiveId: "mt.obj.spot",
          variants: [
            spotVariant("vm-1", "A + A'B", ["A", "B"], ["A", "A'B"], 0),
            spotVariant("vm-2", "wx + w'y + wxy'", ["w", "x", "y"], ["wx", "w'y", "wxy'"], 1),
            spotVariant("vm-3", "AB + A'BC + C", ["A", "B", "C"], ["AB", "A'BC", "C"], 2),
          ],
        },
        {
          id: "mt.q.canonical",
          label: "Canonical?",
          conceptId: "mt.canonical",
          objectiveId: "mt.obj.canonical",
          variants: [
            canonicalVariant("vk-1", ["A", "B"], "A'B + AB'", "A' + AB'", 1),
            canonicalVariant("vk-2", ["x", "y", "z"], "xyz + x'yz", "xy + x'yz", 0),
            canonicalVariant("vk-3", ["A", "B", "C"], "AB'C + A'BC'", "AB + A'BC'", 1),
          ],
        },
        { id: "mt.q.expand", label: "Expand", conceptId: "mt.canonical", objectiveId: "mt.obj.expand", variants: SETS.map((s) => expandVariant(s.id, s.vars, s.start, s.lines)) },
        { id: "mt.q.sigma", label: "Σ list", conceptId: "mt.canonical", objectiveId: "mt.obj.expand", variants: SETS.map((s, k) => sigmaVariant(s.id, s.vars, s.start, k + 1)) },
        {
          id: "mt.q.table",
          label: "By table",
          conceptId: "mt.canonical",
          objectiveId: "mt.obj.table",
          variants: [tableVariant("vt-1", ["A", "B"], "A' + B"), tableVariant("vt-2", ["x", "y", "z"], "x'y + xz"), tableVariant("vt-3", ["A", "B", "C"], "AB' + C")],
        },
      ],
    },
  ],
};
