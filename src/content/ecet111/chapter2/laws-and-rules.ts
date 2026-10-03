/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 2, laws (commutative, associative, distributive) and rules (A + 0 = A … A + A′B
 * = A + B), recognition level (content pack ch2 §8–9, #228). The slides use A, B, C; the examples
 * here use other letters so a student matches the pattern, not the picture. Every identity and every
 * simplification is checked by the Boolean module in a content test.
 */
import type { z } from "zod";
import type { HintSchema, TopicSchema, VariantSchema } from "../../schema";
import { evaluate, parseBool, variablesOf } from "../../boolean";

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
  { rung: 3, text: "Did the order of the terms change, did the brackets move, or was a factor multiplied into a bracket?" },
  { rung: 4, text: "Same letters in a new order: commutative. Same order, brackets moved: associative. A factor multiplied into a bracket: distributive." },
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

/** The nudge for picking a rule's look-alike: the other operator, or the other absorption rule. */
const LOOKALIKE = {
  "rule.or-and": "Took the OR form for the AND form (or back)",
  "rule.absorption": "Mixed up A + AB = A and A + A′B = A + B",
} as const;

/**
 * `example` uses `rule`; `counterpart` is its usual look-alike (the other operator's form, or the
 * other absorption rule) and carries a nudge; `others` are further rules with a similar look.
 * Explain Slowly tries a value: every variable 1, then the left side is evaluated.
 */
function ruleVariant(id: string, example: string, rule: Rule, counterpart: { rule: Rule; nudge: keyof typeof LOOKALIKE } | undefined, others: Rule[], k: number): VariantInput {
  const ids = counterpart ? [rule, counterpart.rule, ...others] : [rule, ...others];
  const left = example.split(" = ")[0];
  const expr = parseBool(left);
  const names = variablesOf(expr);
  const env = Object.fromEntries(names.map((n) => [n, 1 as const]));
  const out = evaluate(expr, env);
  return {
    id,
    prompt: `${example}. Which rule is this?`,
    spec: {
      kind: "multiple-choice",
      options: rotated(ids.map((r) => ({ id: r, text: RULES[r], misconceptionId: counterpart && r === counterpart.rule ? counterpart.nudge : undefined })), k),
      correctOptionId: rule,
    },
    vars: { example, ruleText: RULES[rule] },
    hints: ruleHints,
    misconceptions: counterpart ? [{ id: counterpart.nudge, title: LOOKALIKE[counterpart.nudge], nudgeKey: counterpart.nudge, detect: { type: "option", optionId: counterpart.rule } }] : [],
    explanation: [
      { id: "s1", say: `Each rule is written with A, but it works for any variable. Here it is ${names.join(" and ")}.` },
      {
        id: "s2",
        say: `Try a value: let ${names.map((n) => `${n} = 1`).join(", ")}.`,
        ask: { prompt: `Then ${left} = ?`, options: ["0", "1"], correctIndex: out, afterCorrect: `Yes. It matches ${RULES[rule]}.`, afterWrong: `${left} = ${out} there, as ${RULES[rule]} says.` },
      },
    ],
  };
}

/* ---------- Q3: simplify with one rule ---------- */

const simplifyHints: HintInput[] = [
  { rung: 2, text: "Not yet. Which of the rules you just matched fits this expression?" },
  { rung: 3, text: "A + AB = A (absorption), A + A′B = A + B, and A″ = A are the ones with two or more variables." },
  { rung: 9, text: "{expr} = {answer}, by {ruleText}." },
];

/** `wrong[i]` may carry a nudge for a real mix-up; the rest are filler. */
function simplifyVariant(id: string, expr: string, answer: string, wrong: { text: string; nudge?: "rule.absorption" | "rule.dropped-bar" }[], rule: Rule, k: number): VariantInput {
  const options = rotated([{ id: "o0", text: answer }, ...wrong.map((w, i) => ({ id: `o${i + 1}`, text: w.text, misconceptionId: w.nudge }))], k);
  const tagged = wrong.flatMap((w, i) =>
    w.nudge ? [{ id: w.nudge, title: w.nudge === "rule.absorption" ? LOOKALIKE["rule.absorption"] : "Dropped a bar", nudgeKey: w.nudge, detect: { type: "option" as const, optionId: `o${i + 1}` } }] : [],
  );
  // the prediction is rotated like the question, so the right answer is not always first (Pedagogy on #273)
  const predict = rotated([answer, wrong[0].text], k);
  return {
    id,
    prompt: `Simplify ${expr} with one rule.`,
    spec: { kind: "multiple-choice", options, correctOptionId: "o0" },
    vars: { expr, answer, ruleText: RULES[rule] },
    hints: simplifyHints,
    misconceptions: tagged,
    explanation: [
      { id: "s1", say: `Look for a rule whose left side has the shape of ${expr}.` },
      {
        id: "s2",
        say: `${expr} has the shape of ${RULES[rule].split(" = ")[0]}.`,
        ask: { prompt: "So it simplifies to…", options: predict, correctIndex: predict.indexOf(answer), afterCorrect: `Yes: ${expr} = ${answer}.`, afterWrong: `By ${RULES[rule]}: ${expr} = ${answer}.` },
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
      summary: "Name the law, match the OR, AND and other rules, then use a rule to simplify.",
      authority: "DEMO",
      minutes: 12,
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
          id: "br.q.rule-or",
          label: "OR rules",
          conceptId: "br.rules",
          objectiveId: "br.obj.rule",
          variants: [
            ruleVariant("vor-0", "K + 0 = K", "or-0", { rule: "and-0", nudge: "rule.or-and" }, ["or-1", "and-1"], 0),
            ruleVariant("vor-1", "L + 1 = 1", "or-1", { rule: "and-1", nudge: "rule.or-and" }, ["or-0", "or-self"], 1),
            ruleVariant("vor-not", "X + X′ = 1", "or-not", { rule: "and-not", nudge: "rule.or-and" }, ["or-1", "or-self"], 2),
            ruleVariant("vor-self", "Z + Z = Z", "or-self", { rule: "and-self", nudge: "rule.or-and" }, ["or-not", "or-1"], 3),
          ],
        },
        {
          id: "br.q.rule-and",
          label: "AND rules",
          conceptId: "br.rules",
          objectiveId: "br.obj.rule",
          variants: [
            ruleVariant("vand-not", "Y · Y′ = 0", "and-not", { rule: "or-not", nudge: "rule.or-and" }, ["and-0", "and-self"], 0),
            ruleVariant("vand-1", "N · 1 = N", "and-1", { rule: "or-1", nudge: "rule.or-and" }, ["and-0", "or-0"], 1),
            ruleVariant("vand-0", "V · 0 = 0", "and-0", { rule: "or-0", nudge: "rule.or-and" }, ["and-1", "and-not"], 2),
            ruleVariant("vand-self", "U · U = U", "and-self", { rule: "or-self", nudge: "rule.or-and" }, ["and-not", "and-1"], 3),
          ],
        },
        {
          id: "br.q.rule-more",
          label: "More rules",
          conceptId: "br.rules",
          objectiveId: "br.obj.rule",
          variants: [
            ruleVariant("vmore-double", "(T′)′ = T", "double", undefined, ["or-not", "and-not"], 0),
            ruleVariant("vmore-absorb", "M + MN = M", "absorb", { rule: "absorb-not", nudge: "rule.absorption" }, ["or-self"], 1),
            ruleVariant("vmore-absorb-not", "R + R′S = R + S", "absorb-not", { rule: "absorb", nudge: "rule.absorption" }, ["or-not"], 2),
          ],
        },
        {
          id: "br.q.simplify",
          label: "Simplify",
          conceptId: "br.rules",
          objectiveId: "br.obj.simplify",
          variants: [
            simplifyVariant("vsimp-1", "P + P′Q", "P + Q", [{ text: "P", nudge: "rule.absorption" }, { text: "Q" }, { text: "PQ" }], "absorb-not", 0),
            simplifyVariant("vsimp-2", "X + XY", "X", [{ text: "X + Y", nudge: "rule.absorption" }, { text: "XY" }, { text: "Y" }], "absorb", 1),
            simplifyVariant("vsimp-3", "(W′)′", "W", [{ text: "W′", nudge: "rule.dropped-bar" }, { text: "1" }, { text: "0" }], "double", 2),
          ],
        },
      ],
    },
  ],
};
