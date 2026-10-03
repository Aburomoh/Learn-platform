/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 2, laws (commutative, associative, distributive) and rules (A + 0 = A … A + A′B
 * = A + B), recognition level (content pack ch2 §8–9, #228). The slides use A, B, C; the examples
 * here use other letters so a student matches the pattern, not the picture. Every identity and every
 * simplification is checked by the Boolean module in a content test.
 */
import type { z } from "zod";
import type { HintSchema, TopicSchema, VariantSchema } from "../../schema";

type TopicInput = z.input<typeof TopicSchema>;
type HintInput = z.input<typeof HintSchema>;
type VariantInput = z.input<typeof VariantSchema>;

/** Rotate options so the correct one is not always first. */
function rotated<T>(xs: T[], k: number): T[] {
  const r = k % xs.length;
  return [...xs.slice(r), ...xs.slice(0, r)];
}

/* ---------- Q1: which law? ---------- */

const LAWS = [
  { id: "commutative", text: "Commutative: the order can change" },
  { id: "associative", text: "Associative: the brackets can move" },
  { id: "distributive", text: "Distributive: a factor multiplies out" },
] as const;
type Law = (typeof LAWS)[number]["id"];

const lawHints: HintInput[] = [
  { rung: 2, text: "Not yet. Compare the two sides: what changed?" },
  { rung: 3, text: "Same letters in a new order: commutative. Same order, brackets moved: associative. A factor multiplied into a bracket: distributive." },
  { rung: 9, text: "{left} = {right} is the {law} law." },
];

function lawVariant(id: string, left: string, right: string, law: Law, k: number): VariantInput {
  // The real mix-up is commutative ↔ associative; picking that one gets its own nudge.
  const swapped: Law | undefined = law === "commutative" ? "associative" : law === "associative" ? "commutative" : undefined;
  return {
    id,
    prompt: `Which law says ${left} = ${right}?`,
    spec: {
      kind: "multiple-choice",
      options: rotated(LAWS.map((l) => ({ id: l.id, text: l.text, misconceptionId: l.id === swapped ? "law.assoc-commut" : undefined })), k),
      correctOptionId: law,
    },
    vars: { left, right, law },
    hints: lawHints,
    misconceptions: swapped ? [{ id: "law.assoc-commut", title: "Commutative and associative mixed up", nudgeKey: "law.assoc-commut", detect: { type: "option", optionId: swapped } }] : [],
    explanation: [
      { id: "s1", say: "Boolean algebra has the same three laws as ordinary algebra: commutative, associative and distributive." },
      {
        id: "s2",
        say: `Compare ${left} with ${right}.`,
        ask: {
          prompt: "What changed between the two sides?",
          options: ["The order of the terms", "Where the brackets are", "A factor was multiplied into a bracket"],
          correctIndex: law === "commutative" ? 0 : law === "associative" ? 1 : 2,
          afterCorrect: `Yes: that is the ${law} law.`,
          afterWrong: `Look again: ${law === "commutative" ? "only the order changed" : law === "associative" ? "only the brackets moved" : "the factor was multiplied into the bracket"}. That is the ${law} law.`,
        },
      },
    ],
  };
}

/* ---------- Q2: which rule? ---------- */

const RULES = {
  "or-0": "A + 0 = A",
  "or-1": "A + 1 = 1",
  "or-not": "A + A′ = 1",
  "or-self": "A + A = A",
  "and-not": "A · A′ = 0",
  "and-1": "A · 1 = A",
  "and-0": "A · 0 = 0",
  "and-self": "A · A = A",
  "double": "A″ = A",
  "absorb": "A + AB = A",
  "absorb-not": "A + A′B = A + B",
} as const;
type Rule = keyof typeof RULES;

const ruleHints: HintInput[] = [
  { rung: 2, text: "Not yet. Look at the operator (+ or ·) and at what the variable meets: 0, 1, itself, or its complement." },
  { rung: 3, text: "Every rule has an OR form and an AND form. Match the operator first." },
  { rung: 9, text: "{example} uses {ruleText}." },
];

/**
 * `example` uses `rule`; `counterpart` is the same rule's other form (OR ↔ AND), the usual mix-up,
 * and `others` are further rules with a similar look.
 */
function ruleVariant(id: string, example: string, rule: Rule, counterpart: Rule, others: Rule[], tryValue: { name: string; value: 0 | 1; out: 0 | 1; expr: string }, k: number): VariantInput {
  const ids = [rule, counterpart, ...others];
  return {
    id,
    prompt: `${example}. Which rule is this?`,
    spec: {
      kind: "multiple-choice",
      options: rotated(ids.map((r) => ({ id: r, text: RULES[r], misconceptionId: r === counterpart ? "rule.or-and" : undefined })), k),
      correctOptionId: rule,
    },
    vars: { example, ruleText: RULES[rule] },
    hints: ruleHints,
    misconceptions: [{ id: "rule.or-and", title: "Took the OR form for the AND form (or back)", nudgeKey: "rule.or-and", detect: { type: "option", optionId: counterpart } }],
    explanation: [
      { id: "s1", say: `Each rule is written with A, but it works for any variable. Here the variable is ${tryValue.name}.` },
      {
        id: "s2",
        say: `Try a value: let ${tryValue.name} = ${tryValue.value}.`,
        ask: { prompt: `Then ${tryValue.expr} = ?`, options: ["0", "1"], correctIndex: tryValue.out, afterCorrect: `Yes. It matches ${RULES[rule]}.`, afterWrong: `${tryValue.expr} = ${tryValue.out} when ${tryValue.name} = ${tryValue.value}, as ${RULES[rule]} says.` },
      },
    ],
  };
}

/* ---------- Q3: simplify with one rule ---------- */

const simplifyHints: HintInput[] = [
  { rung: 2, text: "Not yet. Which rule from the list fits this expression?" },
  { rung: 3, text: "A + AB = A (absorption), A + A′B = A + B, and A″ = A are the ones with two or more variables." },
  { rung: 9, text: "{expr} = {answer}, by {ruleText}." },
];

function simplifyVariant(id: string, expr: string, answer: string, wrong: string[], rule: Rule, k: number): VariantInput {
  const options = rotated([answer, ...wrong].map((t, i) => ({ id: `o${i}`, text: t })), k);
  return {
    id,
    prompt: `Simplify ${expr} with one rule.`,
    spec: { kind: "multiple-choice", options, correctOptionId: "o0" },
    vars: { expr, answer, ruleText: RULES[rule] },
    hints: simplifyHints,
    explanation: [
      { id: "s1", say: `Look for a rule whose left side has the shape of ${expr}.` },
      {
        id: "s2",
        say: `${expr} has the shape of ${RULES[rule].split(" = ")[0]}.`,
        ask: { prompt: "So it simplifies to…", options: [answer, wrong[0]], correctIndex: 0, afterCorrect: `Yes: ${expr} = ${answer}.`, afterWrong: `By ${RULES[rule]}: ${expr} = ${answer}.` },
      },
    ],
  };
}

export const lawsAndRulesTopic: TopicInput = {
  id: "laws-and-rules",
  title: "Laws and rules",
  summary: "Recognise the laws and rules of Boolean algebra, then use one to simplify.",
  preview: "A + AB → A",
  concepts: [
    { id: "br.laws", title: "Laws", summary: "Commutative, associative and distributive, as in ordinary algebra." },
    { id: "br.rules", title: "Rules", summary: "A + 0 = A, A + 1 = 1, A + A′ = 1, A + A = A, and their AND forms; A″ = A; A + AB = A; A + A′B = A + B." },
  ],
  objectives: [
    { id: "br.obj.law", conceptId: "br.laws", text: "Name the law an identity uses." },
    { id: "br.obj.rule", conceptId: "br.rules", text: "Match an expression to the rule it uses." },
    { id: "br.obj.simplify", conceptId: "br.rules", text: "Simplify a short expression with one rule." },
  ],
  activities: [
    {
      id: "laws-and-rules",
      title: "Laws and rules",
      summary: "Name the law, match the rule, then use a rule to simplify.",
      authority: "DEMO",
      minutes: 8,
      questions: [
        {
          id: "br.q.law",
          label: "Name the law",
          conceptId: "br.laws",
          objectiveId: "br.obj.law",
          variants: [
            lawVariant("vlaw-c", "X + Y", "Y + X", "commutative", 0),
            lawVariant("vlaw-a", "P(QR)", "(PQ)R", "associative", 1),
            lawVariant("vlaw-d", "W(X + Y)", "WX + WY", "distributive", 2),
          ],
        },
        {
          id: "br.q.rule",
          label: "Match the rule",
          conceptId: "br.rules",
          objectiveId: "br.obj.rule",
          variants: [
            ruleVariant("vrule-1", "X + X′ = 1", "or-not", "and-not", ["or-1", "or-self"], { name: "X", value: 0, out: 1, expr: "X + X′" }, 0),
            ruleVariant("vrule-2", "Y · 0 = 0", "and-0", "or-1", ["or-0", "and-1"], { name: "Y", value: 1, out: 0, expr: "Y · 0" }, 1),
            ruleVariant("vrule-3", "Z + Z = Z", "or-self", "and-self", ["or-not", "or-1"], { name: "Z", value: 1, out: 1, expr: "Z + Z" }, 2),
          ],
        },
        {
          id: "br.q.simplify",
          label: "Simplify",
          conceptId: "br.rules",
          objectiveId: "br.obj.simplify",
          variants: [
            simplifyVariant("vsimp-1", "P + P′Q", "P + Q", ["Q", "P", "PQ"], "absorb-not", 0),
            simplifyVariant("vsimp-2", "X + XY", "X", ["X + Y", "XY", "Y"], "absorb", 1),
            simplifyVariant("vsimp-3", "(W′)′", "W", ["W′", "1", "0"], "double", 2),
          ],
        },
      ],
    },
  ],
};
