/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 2, De Morgan (#230, content pack ch2 §11): the two identities, then a function's
 * complement one step at a time, breaking the outer bar first (Example 2.2's method). Each De Morgan
 * step and each double bar is its own line. The derivation spec checks every line is equivalent to
 * the one before; a content test checks every wrong line is not.
 */
import type { z } from "zod";
import type { HintSchema, TopicSchema, VariantSchema } from "../../schema";
import type { LawId } from "@/kinds/derivation/spec";

type TopicInput = z.input<typeof TopicSchema>;
type HintInput = z.input<typeof HintSchema>;
type VariantInput = z.input<typeof VariantSchema>;
type Line = { law: LawId; expr: string; lawOptions: LawId[]; wrongLines: { id: string; expr: string; misconceptionId?: string }[] };

const show = (t: string) => t.replace(/''/g, "″").replace(/'/g, "′");
const rotate = <T,>(xs: T[], k: number) => [...xs.slice(k % xs.length), ...xs.slice(0, k % xs.length)];

/* ---------- Q1: the identities (p.55–57) ---------- */

function identityVariant(id: string, expr: string, right: string, kept: string, other: string, k: number): VariantInput {
  const options = rotate(
    [
      { id: "right", text: show(right) },
      { id: "kept", text: show(kept), misconceptionId: "dm.operator-kept" },
      { id: "other", text: show(other) },
    ],
    k,
  );
  return {
    id,
    prompt: `By De Morgan, ${show(expr)} = ?`,
    spec: { kind: "multiple-choice", options, correctOptionId: "right" },
    hints: [
      { rung: 2, text: "Not yet. Breaking the bar changes two things." },
      { rung: 3, text: "What happens to each letter, and what happens to the operator between them?" },
      { rung: 4, text: "Each letter gets its own bar, and AND becomes OR (or OR becomes AND)." },
      { rung: 9, text: `${show(expr)} = ${show(right)}.` },
    ],
    misconceptions: [{ id: "dm.operator-kept", title: "Bar split but operator kept", nudgeKey: "dm.operator-kept", detect: { type: "option", optionId: "kept" } }],
    explanation: [
      { id: "s1", say: "De Morgan: break the bar, give each part its own bar, and swap the operator." },
      {
        id: "s2",
        say: `In ${show(expr)} the operator under the bar is ${expr.includes("+") ? "OR" : "AND"}.`,
        ask: { prompt: "After breaking the bar it becomes…", options: rotate(["AND", "OR"], k), correctIndex: rotate(["AND", "OR"], k).indexOf(expr.includes("+") ? "AND" : "OR"), afterCorrect: "Yes: the operator swaps.", afterWrong: "It swaps: AND ↔ OR." },
      },
    ],
  };
}

/* ---------- Q2: complement step by step (Example 2.2) ---------- */

const lineHints: HintInput[] = [
  { rung: 2, text: "Not yet. Look at the line before: {previous}." },
  { rung: 3, text: "Break the outermost bar first; then deal with each part's bar, one at a time." },
  { rung: 4, text: "Is the next step breaking a bar (De Morgan) or removing a double bar?" },
  { rung: 6, text: "A double bar cancels: X″ = X. Breaking a bar swaps the operator under it." },
  { rung: 9, text: "This step uses {lawName}." },
];

function stepsVariant(id: string, vars: string[], start: string, lines: Line[], k: number): VariantInput {
  return {
    id,
    prompt: `Find the complement F′ = ${show(start)} one step at a time: name the law, then pick the line.`,
    spec: { kind: "derivation", vars, start, lines, lineMode: "choose", shift: k },
    hints: lineHints,
    misconceptions: [
      { id: "dm.operator-kept", title: "Bar split but operator kept", nudgeKey: "dm.operator-kept", detect: { type: "line-not-equivalent" } },
      { id: "dm.bar-dropped", title: "A bar dropped or added", nudgeKey: "dm.bar-dropped", detect: { type: "line-skipped" } },
    ],
    explanation: [
      { id: "s1", say: "Break the outermost bar first: a bar over a sum becomes a product of barred terms." },
      { id: "s2", say: "Then break each term's bar the same way, and cancel double bars as they appear." },
    ],
  };
}

const dm = (expr: string, kept: string): Line => ({ law: "de-morgan", expr, lawOptions: ["de-morgan", "double", "distributive"], wrongLines: [{ id: "w1", expr: kept, misconceptionId: "dm.operator-kept" }] });
const dbl = (expr: string, dropped: string): Line => ({ law: "double", expr, lawOptions: ["or-not", "de-morgan", "double"], wrongLines: [{ id: "w1", expr: dropped, misconceptionId: "dm.bar-dropped" }] });

// the slide's F1′ (Example 2.2), then two fresh functions of the same shape
const F1: Line[] = [
  dm("(x'yz')'(x'y'z)'", "(x'yz')' + (x'y'z)'"),
  dm("(x'' + y' + z'')(x'y'z)'", "(x''y'z'')(x'y'z)'"),
  dbl("(x + y' + z)(x'y'z)'", "(x' + y' + z')(x'y'z)'"),
  dm("(x + y' + z)(x'' + y'' + z')", "(x + y' + z)(x''y''z')"),
  dbl("(x + y' + z)(x + y + z')", "(x + y' + z)(x' + y' + z')"),
];
const FA: Line[] = [
  dm("(AB')'(A'C)'", "(AB')' + (A'C)'"),
  dm("(A' + B'')(A'C)'", "(A'B'')(A'C)'"),
  dbl("(A' + B)(A'C)'", "(A' + B')(A'C)'"),
  dm("(A' + B)(A'' + C')", "(A' + B)(A''C')"),
  dbl("(A' + B)(A + C')", "(A' + B)(A' + C')"),
];
const FX: Line[] = [
  dm("(xy)'(x'z)'", "(xy)' + (x'z)'"),
  dm("(x' + y')(x'z)'", "(x'y')(x'z)'"),
  dm("(x' + y')(x'' + z')", "(x' + y')(x''z')"),
  dbl("(x' + y')(x + z')", "(x' + y')(x' + z')"),
];

export const deMorganTopic: TopicInput = {
  id: "de-morgan",
  title: "De Morgan",
  summary: "Break a bar the De Morgan way, then complement a whole function one step at a time.",
  preview: "(A·B)′ → A′ + B′",
  concepts: [
    { id: "dm.rule", title: "De Morgan's theorem", summary: "(A·B)′ = A′ + B′ and (A + B)′ = A′·B′: break the bar, bar each part, swap the operator." },
    { id: "dm.complement", title: "Complement of a function", summary: "Break the outermost bar first, then each term's, cancelling double bars." },
  ],
  objectives: [
    { id: "dm.obj.rule", conceptId: "dm.rule", text: "Apply De Morgan to a product or a sum." },
    { id: "dm.obj.complement", conceptId: "dm.complement", text: "Find a function's complement one step at a time." },
  ],
  activities: [
    {
      id: "de-morgan",
      title: "De Morgan, step by step",
      summary: "The two identities, then a complement one law per line.",
      authority: "DEMO",
      minutes: 15,
      questions: [
        {
          id: "dm.q.rule",
          label: "De Morgan",
          conceptId: "dm.rule",
          objectiveId: "dm.obj.rule",
          variants: [
            identityVariant("vdm-and", "(A·B)'", "A' + B'", "A'·B'", "A + B", 1),
            identityVariant("vdm-or", "(A + B)'", "A'·B'", "A' + B'", "A·B", 2),
            identityVariant("vdm-3", "(A·B·C)'", "A' + B' + C'", "A'·B'·C'", "A + B + C", 0),
          ],
        },
        {
          id: "dm.q.steps",
          label: "Complement, step by step",
          conceptId: "dm.complement",
          objectiveId: "dm.obj.complement",
          variants: [
            stepsVariant("vdc-1", ["x", "y", "z"], "(x'yz' + x'y'z)'", F1, 0),
            stepsVariant("vdc-2", ["A", "B", "C"], "(AB' + A'C)'", FA, 1),
            stepsVariant("vdc-3", ["x", "y", "z"], "(xy + x'z)'", FX, 2),
          ],
        },
      ],
    },
  ],
};
