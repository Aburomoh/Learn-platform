/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * Place value and base → decimal (#213), as ECET 111 Chapter 1 teaches it (content pack ch1 §1–3,
 * §7): the weight under each digit, each term (digit × weight), then the sum. Numbers are the
 * pack's fresh sets, not the slides'; every term and sum is computed by the kind (exact, BigInt).
 */
import type { z } from "zod";
import type { TopicSchema, HintSchema, VariantSchema } from "../../schema";
import { exactTerm, exactValue, placeDigits } from "@/kinds/base-to-decimal/logic";

type TopicInput = z.input<typeof TopicSchema>;
type HintInput = z.input<typeof HintSchema>;
type VariantInput = z.input<typeof VariantSchema>;
type Base = 2 | 8 | 10 | 16;

const BASE_NAME: Record<Base, string> = { 2: "binary", 8: "octal", 10: "decimal", 16: "hexadecimal" };

/* ---------- one ladder per goal (ADR-0007 §3); slots are the kind's step vars ---------- */

const weightHints: HintInput[] = [
  { rung: 2, text: "Not yet. Each digit of {number} has a power of {base} under it." },
  { rung: 3, text: "Find the digit with power 0. Is it just left of the point, or at the right end?" },
  { rung: 4, text: "Moving one digit left, does the power go up or down? And past the point to the right?" },
  { rung: 5, text: "Start with the leftmost digit: how many digits sit to its right before the point?", focus: "weight-cell-0", highlight: "weight-cell-0" },
  { rung: 6, text: "Left of the point the powers count up from 0. Right of it they go on down: −1, −2, −3." },
  { rung: 7, text: "In decimal, the hundreds place is 10^2 and the tenths place is 10^−1. Every base works the same way." },
  { rung: 8, text: "{number} has {digitCount} digits. The power drops by 1 at each step to the right." },
  { rung: 9, text: "The weights, left to right: {terms}." },
];

function termHints(hex: boolean): HintInput[] {
  return [
    { rung: 2, text: "Not yet. Each term is the digit times its weight." },
    { rung: 3, text: "Work out the power of {base} first, then multiply by the digit." },
    { rung: 4, text: "A negative power is a fraction: {base}^−1 is 1 ÷ {base}. What is that as a decimal?" },
    { rung: 5, text: "Start with the leftmost term: its digit times its weight.", focus: "weight-cell-0", highlight: "weight-cell-0" },
    { rung: 6, text: hex ? "A letter is worth 10 to 15 (A = 10, F = 15). Multiply by that value." : "A digit 0 gives a term of 0. Keep it as 0." },
    { rung: 8, text: "The terms are {terms}." },
    { rung: 9, text: "The term values are {values}." },
  ];
}

const sumHints: HintInput[] = [
  { rung: 2, text: "Not yet. Add up all the term values." },
  { rung: 3, text: "Add the whole-number terms first, then the fractions." },
  { rung: 4, text: "Line the fractions up by the point before you add them." },
  { rung: 6, text: "The sum is the value of ({number})_{base} written in base 10." },
  { rung: 8, text: "Add {values}." },
  { rung: 9, text: "{values} = {value}." },
];

/* ---------- variants ---------- */

function placeVariant(id: string, base: Base, number: string): VariantInput {
  const spec = { kind: "base-to-decimal" as const, base, number };
  const ds = placeDigits(spec);
  const fraction = number.includes(".");
  const hex = /[A-F]/.test(number);
  const weights = ds.map((d) => `${base}^${d.power}`).join(", ");
  const terms = ds.map((d) => `(${d.value} × ${base}^${d.power})`).join(" + ");
  const values = ds.map((d) => exactTerm(d.value, base, d.power)).join(" + ");
  const zeroAt = ds.findIndex((d) => d.power === 0);
  const misconceptions: VariantInput["misconceptions"] = [{ id: "pv.reversed", title: "Weights counted from the wrong end", nudgeKey: "pv.weights-reversed", detect: { type: "weights-reversed" } }];
  if (fraction) misconceptions.push({ id: "pv.negative", title: "Powers after the point", nudgeKey: "pv.negative-powers", detect: { type: "negative-powers-wrong" } });
  if (hex) misconceptions.push({ id: "pv.hex-letter", title: "Hex letter used as a small digit", nudgeKey: "pv.hex-letter-value", detect: { type: "hex-letter-as-digit" } });
  const ask = fraction
    ? { prompt: "What power sits just right of the point?", options: ["1", "−1", "0"], correctIndex: 1, afterCorrect: "Yes: −1, then −2, −3.", afterWrong: "It is −1: the powers keep counting down past 0." }
    : { prompt: "What power sits under the rightmost digit?", options: ["1", "0", `${ds.length}`], correctIndex: 1, afterCorrect: "Yes: 0, so it counts ones.", afterWrong: "It is 0: the rightmost digit counts ones." };
  return {
    id,
    prompt: `Write (${number})_${base} in decimal: first the weight under each digit, then each term, then the sum.`,
    spec,
    hints: weightHints,
    hintsByStep: { weights: weightHints, terms: termHints(hex), sum: sumHints },
    misconceptions,
    explanation: [
      {
        id: "s1",
        say: `In ${BASE_NAME[base]}, each digit's weight is a power of ${base}. Power 0 sits under the ${fraction ? "digit just left of the point" : "rightmost digit"}, digit ${zeroAt + 1} here.`,
        stage: { revealed: 0 },
        ask,
      },
      { id: "s2", say: `Counting down from left to right, the weights are ${weights}.`, stage: { revealed: 1 } },
      { id: "s3", say: `Each term is the digit times its weight: ${terms}, which is ${values}.`, stage: { revealed: 2 } },
      { id: "s4", say: `Add them: (${number})_${base} = (${exactValue(spec)})_10.`, stage: { revealed: 3 } },
    ],
    reactions: { stepNext: "Good. Now the next line.", correct: "Right: every weight, term and the sum.", correctAfterHints: "Right. Every line is done." },
  };
}

/** Three sets per question, the pack's fresh numbers (ch1 §1–3, §7); binary has a fourth. */
const DECIMAL = ["276.384", "908.125", "731.062"];
const BINARY = ["110.011", "111.001", "100.110", "110.101"];
const OCTAL = ["263.540", "317.420", "106.350"];
const HEX = ["2C5", "3E1", "1B7"];

const variants = (prefix: string, base: Base, numbers: string[]) => numbers.map((n, i) => placeVariant(`${prefix}-${i + 1}`, base, n));

export const placeValueTopic: TopicInput = {
  id: "place-value",
  title: "Place value",
  summary: "Every digit has a weight, a power of the base. Weights, then terms, then the sum: decimal, binary, octal and hex to decimal.",
  preview: "(101.101)_2 → 4 + 1 + 0.5 + 0.125 → (5.625)_10",
  concepts: [
    { id: "pv.weights", title: "Place value", summary: "A digit's weight is a power of the base: 0 just left of the point, rising to the left, negative after the point." },
    { id: "pv.to-decimal", title: "Base → decimal", summary: "Multiply each digit by its weight and add the terms." },
  ],
  objectives: [
    { id: "pv.obj.decimal", conceptId: "pv.weights", text: "Write a decimal number as its digits times powers of 10." },
    { id: "pv.obj.binary", conceptId: "pv.to-decimal", text: "Convert a binary number with a fraction to decimal." },
    { id: "pv.obj.octal", conceptId: "pv.to-decimal", text: "Convert an octal number with a fraction to decimal." },
    { id: "pv.obj.hex", conceptId: "pv.to-decimal", text: "Convert a hex number to decimal, a letter by its value." },
  ],
  activities: [
    {
      id: "place-value",
      title: "Place value and base → decimal",
      summary: "Weights, terms and the sum, one line at a time.",
      authority: "DEMO",
      minutes: 15,
      questions: [
        { id: "pv.q.decimal", label: "Decimal weights", conceptId: "pv.weights", objectiveId: "pv.obj.decimal", variants: variants("vd", 10, DECIMAL) },
        { id: "pv.q.binary", label: "Binary → decimal", conceptId: "pv.to-decimal", objectiveId: "pv.obj.binary", variants: variants("vb", 2, BINARY) },
        { id: "pv.q.octal", label: "Octal → decimal", conceptId: "pv.to-decimal", objectiveId: "pv.obj.octal", variants: variants("vo", 8, OCTAL) },
        { id: "pv.q.hex", label: "Hex → decimal", conceptId: "pv.to-decimal", objectiveId: "pv.obj.hex", variants: variants("vh", 16, HEX) },
      ],
    },
  ],
};
