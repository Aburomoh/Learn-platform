/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * One K-map question set (kind `kmap`): fill from Σ, then mark and name each group, then F. Hints
 * per goal, every K-map nudge, and an Explain Slowly that shows the groups of one minimal cover
 * (computed, `kmapCovers`), asks about the first, and ends on F. Shared by the Chapter 3 topics.
 */
import type { VariantInput } from "../../schema";
import { kmapCovers } from "@/kinds/kmap/logic";
import { formatCube, sigma, type Cube } from "../../boolean";

type HintInput = NonNullable<VariantInput["hints"]>[number];

const fillHints: HintInput[] = [
  { rung: 2, text: "Not yet. Each minterm number in {sigma} is one cell: put 1 there and 0 everywhere else." },
  { rung: 3, text: "Find a cell by its number: the row bits ({rowVars}) then the column bits ({colVars}) make its minterm number." },
  { rung: 4, text: "Read the column labels: 00, 01, 11, 10. Which cell is 3, and which is 2?" },
  { rung: 5, text: "Start with the first number in the list.", focus: "kmap", highlight: "kmap" },
  { rung: 9, text: "Every number in {sigma} is a 1; the other cells are 0." },
];

const groupHints: HintInput[] = [
  { rung: 2, text: "Not yet. Group {groupNumber} of {groupCount}: a rectangle of 1, 2, 4 or 8 cells, only 1s (and Xs)." },
  { rung: 3, text: "Make it as large as it can be. The edges touch: the end columns are neighbours, and so are the top and bottom rows." },
  { rung: 4, text: "Is there a 1 that no group covers yet? Start from it and grow." },
  { rung: 6, text: "Largest groups, fewest groups: a 1 that can only join one group decides that group." },
];

const termHints: HintInput[] = [
  { rung: 2, text: "Not yet. Look along the group: which variables stay the same in every cell?" },
  { rung: 3, text: "A variable that changes drops out. One that stays 1 is plain; one that stays 0 gets a prime." },
  { rung: 4, text: "Read the bars beside the map: is the whole group inside a variable's bar, or outside it?" },
];

const answerHints: HintInput[] = [
  { rung: 2, text: "Not yet. F is the sum of your group terms." },
  { rung: 3, text: "Join the terms with +, one per group." },
  { rung: 9, text: "F = {answer}." },
];

export const kmapMisconceptions: VariantInput["misconceptions"] = [
  { id: "km.fill-binary-order", title: "Columns in binary order", nudgeKey: "km.fill-binary-order", detect: { type: "fill-binary-order" } },
  { id: "km.fill-dontcare-as-one", title: "Don't-cares written as 1", nudgeKey: "km.fill-dontcare-as-one", detect: { type: "fill-dontcare-as-one" } },
  { id: "km.group-shape", title: "Not a rectangle of 2^k cells", nudgeKey: "km.group-shape", detect: { type: "group-shape" } },
  { id: "km.group-covers-zero", title: "Group takes in a 0", nudgeKey: "km.group-covers-zero", detect: { type: "group-covers-zero" } },
  { id: "km.group-only-dontcares", title: "Group of only don't-cares", nudgeKey: "km.group-only-dontcares", detect: { type: "group-only-dontcares" } },
  { id: "km.group-too-small", title: "A larger group fits", nudgeKey: "km.group-too-small", detect: { type: "group-too-small" } },
  { id: "km.group-not-needed", title: "Group not needed", nudgeKey: "km.group-not-needed", detect: { type: "group-not-needed" } },
  { id: "km.term-keeps-changing", title: "Kept a changing variable", nudgeKey: "km.term-keeps-changing", detect: { type: "term-keeps-changing" } },
  { id: "km.term-wrong-complement", title: "Complement on the wrong variable", nudgeKey: "km.term-wrong-complement", detect: { type: "term-wrong-complement" } },
  { id: "km.answer-misses-ones", title: "Some 1 not covered", nudgeKey: "km.answer-misses-ones", detect: { type: "answer-misses-ones" } },
  { id: "km.answer-not-minimal", title: "Not minimal", nudgeKey: "km.answer-not-minimal", detect: { type: "answer-not-minimal" } },
];

const cellsOf = (c: Cube, n: number) => Array.from({ length: 2 ** n }, (_, m) => m).filter((m) => (m & ~c.mask) === c.bits);
const show = (t: string) => t.replace(/'/g, "′");

export interface KmapSet {
  id: string;
  vars: string[];
  minterms: number[];
  dontCares?: number[];
  /** The prompt's opening, e.g. "F(A, B, C) = Σ(3, 4, 6, 7)". Default: F(vars) = Σ(…). */
  given?: string;
  /** Show the map filled (no fill goal). */
  filled?: boolean;
}

/** One question set: fill (unless `filled`), groups, terms, F. `k` is the set's index (alternates the prediction). */
export function kmapVariant(set: KmapSet, k: number): VariantInput {
  const dontCares = set.dontCares ?? [];
  const spec = { kind: "kmap" as const, vars: set.vars, minterms: set.minterms, dontCares, fill: !set.filled };
  const cover = kmapCovers({ ...spec, fill: !set.filled })[0];
  const n = set.vars.length;
  const groups = cover.map((c) => cellsOf(c, n));
  const first = groups[0];
  const size = first.length;
  const wrongSize = size >= 4 ? size / 2 : size * 2;
  const given = set.given ?? `F(${set.vars.join(", ")}) = ${sigma(set.minterms, dontCares)}`;
  return {
    id: set.id,
    prompt: `${given}. ${set.filled ? "The map is filled." : "Fill the map,"} then group the 1s one group at a time, name each group's term, and write F as a minimal sum.`,
    spec,
    hints: groupHints,
    hintsByStep: { fill: fillHints, group: groupHints, term: termHints, answer: answerHints },
    misconceptions: kmapMisconceptions,
    explanation: [
      { id: "s1", say: "Largest groups, fewest groups: every 1 in some group, each group a rectangle of 1, 2, 4 or 8 cells, and the edges touch.", stage: { groups: [] } },
      {
        id: "s2",
        say: `Here the first group takes cells ${first.map((m) => `m${m}`).join(", ")}.`,
        stage: { groups: [first], active: 0 },
        ask: { prompt: `${size} cells: how many variables stay in its term?`, options: k % 2 ? [String(n - Math.log2(wrongSize)), String(n - Math.log2(size))] : [String(n - Math.log2(size)), String(n - Math.log2(wrongSize))], correctIndex: k % 2, afterCorrect: `Yes: ${n - Math.log2(size)}.`, afterWrong: `${size} cells drop ${Math.log2(size)} variable${size === 2 ? "" : "s"}, so ${n - Math.log2(size)} stay.` },
      },
      { id: "s3", say: `Its term is ${show(formatCube(cover[0], set.vars))}.`, stage: { groups: [first], active: 0, term: true } },
      { id: "s4", say: `With the other group${groups.length > 2 ? "s" : ""}, F = ${show(cover.map((c) => formatCube(c, set.vars)).join(" + "))}.`, stage: { groups, answer: true } },
    ],
  };
}
