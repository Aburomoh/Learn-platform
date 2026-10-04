/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 2, algebraic simplification (#229, content pack ch2 §10): one law per line
 * (name the law, then choose the line), then the gate count before and after. The slide writes
 * y′ + y = 1 and x′z·1 = x′z in one line; here each law is its own line. Every line is checked
 * equivalent to the one before by the derivation spec; gate counts are computed.
 */
import type { z } from "zod";
import type { HintSchema, TopicSchema, VariantSchema } from "../../schema";
import { parseBool, type BoolExpr } from "../../boolean";
import type { LawId } from "@/kinds/derivation/spec";
import { LAW_NAMES } from "@/kinds/derivation/logic";

type TopicInput = z.input<typeof TopicSchema>;
type HintInput = z.input<typeof HintSchema>;
type VariantInput = z.input<typeof VariantSchema>;
type Line = { law: LawId; expr: string; lawOptions: LawId[]; wrongLines: { id: string; expr: string; misconceptionId?: string }[] };

const show = (t: string) => t.replace(/'/g, "′");

const lineHints: HintInput[] = [
  { rung: 2, text: "Not yet. Look at the line before: {previous}." },
  { rung: 3, text: "Name the law first, then apply only that law, to one part of the line." },
  { rung: 4, text: "Which part of {previous} has the shape of a rule you know?" },
  { rung: 6, text: "Change only that part; copy the rest of the line as it is." },
  { rung: 9, text: "This step uses {lawName}." },
];

const lineMisconceptions: VariantInput["misconceptions"] = [
  { id: "drv.slip", title: "Line not equal to the one before", nudgeKey: "drv.line-not-equivalent", detect: { type: "line-not-equivalent" } },
  { id: "drv.skip", title: "Skipped a step", nudgeKey: "drv.line-skipped", detect: { type: "line-skipped" } },
  { id: "drv.other", title: "Valid, but not this law's step", nudgeKey: "drv.line-other", detect: { type: "line-other" } },
  // a wrong line in choose mode names it directly; the detector type is only a placeholder here
  { id: "sm.absorb-mixup", title: "A + A′B taken as A", nudgeKey: "sm.absorb-mixup", detect: { type: "line-not-equivalent" } },
];

function derivationVariant(id: string, vars: string[], start: string, lines: Line[], k: number): VariantInput {
  const first = lines[0].law;
  const other = lines[0].lawOptions.find((l) => l !== first)!;
  const choices = k % 2 ? [LAW_NAMES[other], LAW_NAMES[first]] : [LAW_NAMES[first], LAW_NAMES[other]];
  return {
    id,
    prompt: `Simplify F = ${show(start)}, one law per line: first name the law, then pick the line it gives.`,
    spec: { kind: "derivation", vars, start, lines, lineMode: "choose", shift: k },
    hints: lineHints,
    misconceptions: lineMisconceptions,
    explanation: [
      { id: "s1", say: "Each line changes one part of the line before, using one law." },
      {
        id: "s2",
        say: `From ${show(start)}, look for a common factor or a rule's shape before anything else.`,
        ask: { prompt: "Which law comes first here?", options: choices, correctIndex: choices.indexOf(LAW_NAMES[first]), afterCorrect: `Yes: ${LAW_NAMES[first]}. Then one law per line.`, afterWrong: `It is ${LAW_NAMES[first]} first. Then one law per line.` },
      },
    ],
  };
}

/* ---------- gate count, computed ---------- */

/** NOT gates for each complemented variable, plus one gate per AND/OR/XOR node (as on p.45–49). */
export function gateCount(e: BoolExpr): { nots: number; others: number; total: number } {
  const notted = new Set<string>();
  let others = 0;
  const walk = (x: BoolExpr) => {
    if (x.type === "not") {
      if (x.arg.type === "var") notted.add(x.arg.name);
      else others++;
      walk(x.arg);
    } else if (x.type === "and" || x.type === "or" || x.type === "xor") {
      others++;
      x.args.forEach(walk);
    }
  };
  walk(e);
  return { nots: notted.size, others, total: notted.size + others };
}

function gateVariant(id: string, before: string, after: string, k: number): VariantInput {
  const b = gateCount(parseBool(before)).total;
  const a = gateCount(parseBool(after)).total;
  const literals = (t: string) => (t.match(/[A-Za-z]/g) ?? []).length;
  // real slips: counting literals instead of gates; forgetting the NOT gates
  const wrong = [b, literals(after), a - gateCount(parseBool(after)).nots].filter((w, i, all) => w !== a && w > 0 && all.indexOf(w) === i);
  const options = [a, ...wrong].map((n) => ({ id: `g${n}`, text: `${n} gate${n === 1 ? "" : "s"}` }));
  const r = (k + 1) % options.length;
  return {
    id,
    prompt: `Before: F = ${show(before)} needs ${b} gates (NOTs included). After simplifying, F = ${show(after)}. How many gates now?`,
    spec: { kind: "multiple-choice", options: [...options.slice(r), ...options.slice(0, r)], correctOptionId: `g${a}` },
    hints: [
      { rung: 2, text: "Not yet. Count gates, not letters." },
      { rung: 3, text: "One NOT for each primed letter, one AND for each product of two or more letters, one OR to join the terms." },
      { rung: 9, text: `${show(after)} needs ${a} gate${a === 1 ? "" : "s"}.` },
    ],
    explanation: [
      { id: "s1", say: "Count the NOT gates first: one per primed letter, even if it appears twice." },
      {
        id: "s2",
        say: `F = ${show(after)}.`,
        ask: { prompt: "How many NOT gates?", options: [String(gateCount(parseBool(after)).nots), String(gateCount(parseBool(after)).nots + 1)], correctIndex: 0, afterCorrect: "Yes. Now add the AND and OR gates.", afterWrong: `${gateCount(parseBool(after)).nots}: one per primed letter. Now add the AND and OR gates.` },
      },
      { id: "s3", say: "Fewer gates for the same function: that is why we simplify." },
    ],
  };
}

/* ---------- the three sets: the slide's F2, Example 2.1(a), and a fresh one ---------- */

const F2: Line[] = [
  { law: "distributive", expr: "x'z(y' + y) + xy'", lawOptions: ["commutative", "distributive", "absorb"], wrongLines: [{ id: "w1", expr: "x'z(y'y) + xy'" }, { id: "w2", expr: "x'z(y' + y)" }] },
  { law: "or-not", expr: "x'z·1 + xy'", lawOptions: ["and-not", "or-1", "or-not"], wrongLines: [{ id: "w1", expr: "x'z·0 + xy'" }] },
  { law: "and-1", expr: "x'z + xy'", lawOptions: ["and-1", "or-1", "and-0"], wrongLines: [{ id: "w1", expr: "1 + xy'" }] },
];
const EX21: Line[] = [
  { law: "distributive", expr: "xx' + xy", lawOptions: ["distributive", "associative", "absorb"], wrongLines: [{ id: "w1", expr: "xx' + y" }] },
  { law: "and-not", expr: "0 + xy", lawOptions: ["or-not", "and-not", "and-self"], wrongLines: [{ id: "w1", expr: "1 + xy" }] },
  { law: "or-0", expr: "xy", lawOptions: ["and-0", "or-1", "or-0"], wrongLines: [{ id: "w1", expr: "0" }] },
];
const FRESH: Line[] = [
  { law: "distributive", expr: "A(B + B') + A'B", lawOptions: ["absorb", "distributive", "commutative"], wrongLines: [{ id: "w1", expr: "A(BB') + A'B" }] },
  { law: "or-not", expr: "A·1 + A'B", lawOptions: ["or-not", "and-not", "or-self"], wrongLines: [{ id: "w1", expr: "A·0 + A'B" }] },
  { law: "and-1", expr: "A + A'B", lawOptions: ["or-1", "and-1", "and-self"], wrongLines: [{ id: "w1", expr: "1 + A'B" }] },
  { law: "absorb-not", expr: "A + B", lawOptions: ["absorb", "or-self", "absorb-not"], wrongLines: [{ id: "w1", expr: "A", misconceptionId: "sm.absorb-mixup" }, { id: "w2", expr: "AB" }] },
];

export const simplificationTopic: TopicInput = {
  id: "simplification",
  title: "Algebraic simplification",
  summary: "Simplify one law per line, then see how many gates the simpler circuit saves.",
  preview: "x′y′z + x′yz + xy′ → x′z + xy′",
  concepts: [
    { id: "sm.derive", title: "One law per line", summary: "Each line applies one law to one part of the line before." },
    { id: "sm.gates", title: "Fewer gates", summary: "A simpler expression for the same function needs fewer gates." },
  ],
  objectives: [
    { id: "sm.obj.derive", conceptId: "sm.derive", text: "Simplify an expression one named law at a time." },
    { id: "sm.obj.gates", conceptId: "sm.gates", text: "Count the gates before and after simplifying." },
  ],
  activities: [
    {
      id: "simplification",
      title: "Simplify, law by law",
      summary: "Name the law, pick the line, then count the gates saved.",
      authority: "DEMO",
      minutes: 15,
      questions: [
        {
          id: "sm.q.derive",
          label: "Law, then line",
          conceptId: "sm.derive",
          objectiveId: "sm.obj.derive",
          variants: [
            derivationVariant("vs-f2", ["x", "y", "z"], "x'y'z + x'yz + xy'", F2, 0),
            derivationVariant("vs-ex", ["x", "y"], "x(x' + y)", EX21, 1),
            derivationVariant("vs-ab", ["A", "B"], "AB + AB' + A'B", FRESH, 2),
          ],
        },
        {
          id: "sm.q.gates",
          label: "Gates saved",
          conceptId: "sm.gates",
          objectiveId: "sm.obj.gates",
          variants: [gateVariant("vs-f2", "x'y'z + x'yz + xy'", "x'z + xy'", 0), gateVariant("vs-ex", "x(x' + y)", "xy", 1), gateVariant("vs-ab", "AB + AB' + A'B", "A + B", 2)],
        },
      ],
    },
  ],
};
