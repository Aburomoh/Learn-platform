/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 3, expression → map (#280, content pack ch3 §3 Ex.3): expand an SOP to its
 * minterms (canonical form), then map and simplify it. Minterms are computed (Boolean module); the
 * map question uses the shared K-map flow. Same ids in both questions: the same function (#141).
 */
import type { CourseInput, VariantInput } from "../../schema";
import { mintermsOf, parseBool, sigma } from "../../boolean";
import { kmapVariant } from "./kmap-variant";

type TopicInput = CourseInput["modules"][number]["topics"][number];
type Activity = TopicInput["activities"][number];

const show = (t: string) => t.replace(/'/g, "′");

function rotate<T>(xs: T[], k: number): T[] {
  const r = k % xs.length;
  return [...xs.slice(r), ...xs.slice(0, r)];
}

/** Ex.3 (s.33–39) and two fresh SOPs, each with a product that misses a variable. */
const SETS: { id: string; vars: string[]; sop: string }[] = [
  { id: "e3", vars: ["x", "y", "z"], sop: "xy + x'y'z' + x'yz'" },
  { id: "eab", vars: ["A", "B", "C"], sop: "A' + AB'" },
  { id: "exy", vars: ["x", "y", "z"], sop: "xy' + yz" },
];

const mintermsOfSop = (sop: string, vars: string[]) => mintermsOf(parseBool(sop, { vars }), vars);

/** The slip: each product that misses a variable taken as one minterm only (the missing variable set to 1). */
function oneEach(sop: string, vars: string[]): number[] {
  const out = new Set<number>();
  for (const term of sop.split(" + ")) {
    const fixed = vars.map((v) => (term.includes(`${v}'`) ? "0" : term.includes(v) ? "1" : "1")).join("");
    out.add(parseInt(fixed, 2));
  }
  return [...out].sort((a, b) => a - b);
}

function expandVariant(set: (typeof SETS)[number], k: number): VariantInput {
  const ones = mintermsOfSop(set.sop, set.vars);
  const zeros = Array.from({ length: 8 }, (_, m) => m).filter((m) => !ones.includes(m));
  const slip = oneEach(set.sop, set.vars);
  const choices = [
    { id: "right", text: sigma(ones) },
    { id: "one-each", text: sigma(slip) },
    { id: "zeros", text: sigma(zeros) },
  ].filter((c, j, all) => all.findIndex((d) => d.text === c.text) === j);
  return {
    id: set.id,
    prompt: `F(${set.vars.join(", ")}) = ${show(set.sop)}. Before mapping, expand it to canonical form: which Σ is F?`,
    spec: { kind: "multiple-choice", options: rotate(choices, k + 1), correctOptionId: "right" },
    hints: [
      { rung: 2, text: "Not yet. A product that misses a variable covers both of its values." },
      { rung: 3, text: "Multiply by (v + v′) for each missing variable, then read each full product as a binary number." },
      { rung: 9, text: `F = ${sigma(ones)}.` },
    ],
    misconceptions: choices.some((c) => c.id === "one-each") ? [{ id: "km.expand-one", title: "A short product taken as one minterm", nudgeKey: "km.expand-one", detect: { type: "option", optionId: "one-each" } }] : [],
    explanation: [
      { id: "s1", say: "The map needs canonical form: every product with every variable." },
      {
        id: "s2",
        say: "A product missing one variable stands for two minterms, one for each value of that variable.",
        ask: { prompt: `How many minterms does F have?`, options: k % 2 ? [String(slip.length === ones.length ? ones.length + 1 : slip.length), String(ones.length)] : [String(ones.length), String(slip.length === ones.length ? ones.length + 1 : slip.length)], correctIndex: k % 2, afterCorrect: "Yes.", afterWrong: `It has ${ones.length}.` },
      },
      { id: "s3", say: `So F = ${sigma(ones)}.` },
    ],
  };
}

const activity: Activity = {
  id: "expression-to-map",
  title: "Expression → map",
  summary: "Expand to canonical form, then map and simplify.",
  authority: "DEMO",
  minutes: 15,
  questions: [
    { id: "km.q.expand", label: "Canonical form", conceptId: "km.canonical", objectiveId: "km.obj.expression", variants: SETS.map((s, k) => expandVariant(s, k)) },
    {
      id: "km.q.from-expression",
      label: "Map it",
      conceptId: "km.canonical",
      objectiveId: "km.obj.expression",
      variants: SETS.map((s, k) => kmapVariant({ id: s.id, vars: s.vars, minterms: mintermsOfSop(s.sop, s.vars), given: `F(${s.vars.join(", ")}) = ${show(s.sop)}` }, k)),
    },
  ],
};

export const expressionToMapTopic: TopicInput = {
  id: "kmap-expression",
  title: "Expression → map",
  summary: "A map takes minterms: expand a sum of products to canonical form first, then group as usual.",
  preview: "xy → xyz + xyz′",
  concepts: [{ id: "km.canonical", title: "Canonical form first", summary: "Each product missing a variable is two minterms; expand, then fill the map." }],
  objectives: [{ id: "km.obj.expression", conceptId: "km.canonical", text: "Expand an SOP to its minterms, then simplify it with a K-map." }],
  activities: [activity],
};
