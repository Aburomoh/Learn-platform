/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 3, the same function by algebra (#281, content pack ch3 §7): simplify a function
 * the map already did, one law per line, and see the same answer. The s.88–91 chain is split to one
 * law per line (A + A′ = 1 and its ·1 share a line, as on the slide); the spec checks every line
 * equals the one before (Boolean module).
 */
import type { CourseInput, VariantInput } from "../../schema";
import type { LawId } from "@/kinds/derivation/spec";
import { LAW_NAMES } from "@/kinds/derivation/logic";

type TopicInput = CourseInput["modules"][number]["topics"][number];
type Line = { law: LawId; expr: string; lawOptions: LawId[]; wrongLines: { id: string; expr: string }[] };

const show = (t: string) => t.replace(/'/g, "′");
const L = (law: LawId, expr: string, lawOptions: LawId[], wrong: string): Line => ({ law, expr, lawOptions, wrongLines: [{ id: "w1", expr: wrong }] });

/** s.88–91: the map's F of s.76–87, by algebra (ends on B′C′ + B′D′ + A′CD′, the map's answer). */
const S88: Line[] = [
  L("distributive", "B'(A'C' + CD' + AC') + A'BCD'", ["commutative", "distributive", "absorb"], "B'(A'C' + CD') + A'BCD'"),
  L("distributive", "B'(CD' + C'(A + A')) + A'BCD'", ["distributive", "or-not", "associative"], "B'(CD' + C'A) + A'BCD'"),
  // A + A′ = 1 and the ·1 in one line, as the slide does (the kind allows 8 lines)
  L("or-not", "B'(CD' + C') + A'BCD'", ["and-not", "or-not", "or-1"], "B'CD' + A'BCD'"),
  L("absorb-not", "B'(C' + D') + A'BCD'", ["absorb", "de-morgan", "absorb-not"], "B'(C' + C) + A'BCD'"),
  L("distributive", "B'C' + B'D' + A'BCD'", ["distributive", "associative", "commutative"], "B'C'D' + A'BCD'"),
  L("distributive", "B'C' + D'(B' + A'BC)", ["absorb", "distributive", "or-self"], "B'C' + D'(B' + A'B)"),
  L("absorb-not", "B'C' + D'(B' + A'C)", ["absorb-not", "absorb", "and-not"], "B'C' + D'(B' + A'BC')"),
  L("distributive", "B'C' + B'D' + A'CD'", ["commutative", "and-self", "distributive"], "B'C' + B'D' + A'CD"),
];

/** Ex.1 (s.20–25) Σ(3, 4, 6, 7): the map gave BC + AC′. */
const EX1: Line[] = [
  L("distributive", "A'BC + AC'(B' + B) + ABC", ["distributive", "commutative", "absorb"], "A'BC + AC'(B'B) + ABC"),
  L("or-not", "A'BC + AC'·1 + ABC", ["and-not", "or-1", "or-not"], "A'BC + AC'·0 + ABC"),
  L("and-1", "A'BC + AC' + ABC", ["or-1", "and-1", "and-0"], "A'BC + 1 + ABC"),
  L("distributive", "BC(A' + A) + AC'", ["distributive", "absorb", "associative"], "BC(A'A) + AC'"),
  L("or-not", "BC·1 + AC'", ["or-not", "and-not", "or-self"], "BC·0 + AC'"),
  L("and-1", "BC + AC'", ["and-0", "and-1", "or-1"], "1 + AC'"),
];

/** A short one: Σ(0, 2, 3) over A, B gives A + B′ on the map. */
const SHORT: Line[] = [
  L("distributive", "A(B + B') + A'B'", ["absorb", "commutative", "distributive"], "A(BB') + A'B'"),
  L("or-not", "A·1 + A'B'", ["or-not", "and-not", "or-1"], "A·0 + A'B'"),
  L("and-1", "A + A'B'", ["and-0", "or-1", "and-1"], "1 + A'B'"),
  L("absorb-not", "A + B'", ["absorb-not", "absorb", "or-self"], "A"),
];

const SETS: { id: string; vars: string[]; start: string; lines: Line[]; map: string }[] = [
  { id: "a88", vars: ["A", "B", "C", "D"], start: "A'B'C' + B'CD' + A'BCD' + AB'C'", lines: S88, map: "B′C′ + A′CD′ + B′D′" },
  { id: "aex1", vars: ["A", "B", "C"], start: "A'BC + AB'C' + ABC' + ABC", lines: EX1, map: "BC + AC′" },
  { id: "ashort", vars: ["A", "B"], start: "AB + AB' + A'B'", lines: SHORT, map: "A + B′" },
];

const lineMisconceptions: VariantInput["misconceptions"] = [
  { id: "drv.slip", title: "Line not equal to the one before", nudgeKey: "drv.line-not-equivalent", detect: { type: "line-not-equivalent" } },
  { id: "drv.skip", title: "Skipped a step", nudgeKey: "drv.line-skipped", detect: { type: "line-skipped" } },
  { id: "drv.other", title: "Valid, but not this law's step", nudgeKey: "drv.line-other", detect: { type: "line-other" } },
];

function algebraVariant(set: (typeof SETS)[number], k: number): VariantInput {
  const first = set.lines[0].law;
  const other = set.lines[0].lawOptions.find((l) => l !== first)!;
  const choices = k % 2 ? [LAW_NAMES[other], LAW_NAMES[first]] : [LAW_NAMES[first], LAW_NAMES[other]];
  return {
    id: set.id,
    prompt: `The map gave F = ${set.map}. Now reach it by algebra from F = ${show(set.start)}, one law per line: first name the law, then pick the line.`,
    spec: { kind: "derivation", vars: set.vars, start: set.start, lines: set.lines, lineMode: "choose", shift: k },
    hints: [
      { rung: 2, text: "Not yet. Look at the line before: {previous}." },
      { rung: 3, text: "Name the law first, then apply only that law, to one part of the line." },
      { rung: 4, text: "Look for two terms that share most of their letters: factor what they share." },
      { rung: 9, text: "This step uses {lawName}." },
    ],
    misconceptions: lineMisconceptions,
    explanation: [
      { id: "s1", say: "The map groups neighbours; algebra factors the same neighbours. Each line uses one law." },
      {
        id: "s2",
        say: `From ${show(set.start)}, find two terms that differ in one letter.`,
        ask: { prompt: "Which law comes first?", options: choices, correctIndex: choices.indexOf(LAW_NAMES[first]), afterCorrect: `Yes: ${LAW_NAMES[first]}.`, afterWrong: `It is ${LAW_NAMES[first]} first.` },
      },
      { id: "s3", say: "The algebra takes more lines, but it reaches the same F as the map." },
    ],
  };
}

export const byAlgebraTopic: TopicInput = {
  id: "kmap-algebra",
  title: "Same function by algebra",
  summary: "Simplify a function the map already did, one law per line, and reach the same F.",
  preview: "factor → A + A′ = 1 → the map's F",
  concepts: [{ id: "km.algebra", title: "Map and algebra agree", summary: "A K-map group is a factoring that leaves A + A′ = 1; algebra reaches the same minimal F in more steps." }],
  objectives: [{ id: "km.obj.algebra", conceptId: "km.algebra", text: "Simplify a mapped function by algebra and compare it with the map." }],
  activities: [
    {
      id: "kmap-algebra",
      title: "Same function by algebra",
      summary: "One law per line, ending on the map's answer.",
      authority: "DEMO",
      minutes: 15,
      questions: [{ id: "km.q.algebra", label: "By algebra", conceptId: "km.algebra", objectiveId: "km.obj.algebra", variants: SETS.map((s, k) => algebraVariant(s, k)) }],
    },
  ],
};
