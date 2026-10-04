/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * Place value and base → decimal (#213), as ECET 111 Chapter 1 teaches it (content pack ch1 §1–3,
 * §7): decimal place value as a short concept check, then binary, octal and hex to decimal in three
 * goals (the weight under each digit, each term, the sum). Numbers are the pack's fresh sets, not
 * the slides'; every term and sum is computed by the kind (exact, BigInt).
 */
import type { z } from "zod";
import type { TopicSchema, HintSchema, VariantSchema } from "../../schema";
import { exactTerm, exactValue, placeDigits } from "@/kinds/base-to-decimal/logic";

type TopicInput = z.input<typeof TopicSchema>;
type HintInput = z.input<typeof HintSchema>;
type VariantInput = z.input<typeof VariantSchema>;
type Base = 2 | 8 | 16;

const BASE_NAME: Record<Base, string> = { 2: "binary", 8: "octal", 16: "hexadecimal" };

function rotate<T>(xs: T[], k: number): T[] {
  const r = k % xs.length;
  return [...xs.slice(r), ...xs.slice(0, r)];
}

/* ---------- decimal place value: a short concept check, not a walk (Pedagogy on #353) ---------- */

const PLACE_NAME: Record<number, string> = { 3: "thousands", 2: "hundreds", 1: "tens", 0: "ones", [-1]: "tenths", [-2]: "hundredths", [-3]: "thousandths" };
const pow = (p: number) => `10^${p < 0 ? `−${-p}` : p}`; // a true minus, as in the hints
const powId = (p: number) => `p${p < 0 ? "m" : ""}${Math.abs(p)}`;

const decimalHints: HintInput[] = [
  { rung: 2, text: "Not yet. Find the decimal point first." },
  { rung: 3, text: "The digit just left of the point is the ones place, 10^0." },
  { rung: 4, text: "Moving left the powers go up: 10^1, 10^2. Moving right they go down: 10^−1, 10^−2." },
  { rung: 6, text: "Places ending in -s (tens, hundreds) are left of the point; places ending in -ths are right of it." },
];

const tensTenths = (optionId: string) => ({ id: "pv.tens-tenths", title: "Tens taken for tenths, or the reverse", nudgeKey: "pv.tens-tenths", detect: { type: "option" as const, optionId } });

function sideAsk(what: string, power: number, k: number) {
  const options = rotate(["left", "right"], k);
  const side = power >= 0 ? "left" : "right";
  return { prompt: `Is ${what} left or right of the point?`, options, correctIndex: options.indexOf(side), afterCorrect: `Yes, ${side}.`, afterWrong: `It is ${side} of the point.` };
}

/** "What is the weight of the {digit} in {number}?" Distractors: one power off each way, and the mirror power across the point. */
function weightVariant(id: string, number: string, digit: string, k: number): VariantInput {
  const point = number.indexOf(".");
  const at = number.indexOf(digit);
  const p = at < point ? point - 1 - at : point - at;
  const powers = [p, p + 1, -p, p - 1];
  return {
    id,
    prompt: `What is the weight of the ${digit} in (${number})_10?`,
    spec: { kind: "multiple-choice", options: rotate(powers.map((q) => ({ id: powId(q), text: pow(q) })), k + 1), correctOptionId: powId(p) },
    hints: [...decimalHints, { rung: 8, text: `The ${digit} is in the ${PLACE_NAME[p]} place.` }, { rung: 9, text: `Its weight is ${pow(p)}.` }],
    misconceptions: [
      { id: "pv.reversed", title: "Powers counted from 1, not 0", nudgeKey: "pv.weights-reversed", detect: { type: "option", optionId: powId(p + 1) } },
      tensTenths(powId(-p)),
    ],
    explanation: [
      { id: "s1", say: "In decimal each place is a power of 10. The ones place, 10^0, is just left of the point." },
      { id: "s2", say: `Find the ${digit} in ${number}.`, ask: sideAsk(`the ${digit}`, p, k) },
      { id: "s3", say: `Counting from the ones place, the ${digit} is in the ${PLACE_NAME[p]} place: its weight is ${pow(p)}.` },
    ],
  };
}

/** "Which digit of {number} is in the {place} place?" The mirror place (tens for tenths) is the slip. */
function placeDigitVariant(id: string, number: string, power: number, k: number): VariantInput {
  const point = number.indexOf(".");
  const at = (q: number) => number[q >= 0 ? point - 1 - q : point - q];
  const powers = [power, -power, power > 0 ? power - 1 : power + 1, power > 0 ? -1 - power : power - 1];
  return {
    id,
    prompt: `Which digit of (${number})_10 is in the ${PLACE_NAME[power]} place?`,
    spec: { kind: "multiple-choice", options: rotate(powers.map((q) => ({ id: powId(q), text: at(q) })), k + 1), correctOptionId: powId(power) },
    hints: [...decimalHints, { rung: 8, text: `The ${PLACE_NAME[power]} place has weight ${pow(power)}.` }, { rung: 9, text: `The ${PLACE_NAME[power]} digit is ${at(power)}.` }],
    misconceptions: [tensTenths(powId(-power))],
    explanation: [
      { id: "s1", say: "Places ending in -s (tens, hundreds) are left of the point; places ending in -ths (tenths, hundredths) are right of it." },
      { id: "s2", say: `The ${PLACE_NAME[power]} place has weight ${pow(power)}.`, ask: sideAsk("it", power, k) },
      { id: "s3", say: `So the ${PLACE_NAME[power]} digit of ${number} is ${at(power)}.` },
    ],
  };
}

/* ---------- base → decimal: one ladder per goal (ADR-0007 §3); slots are the kind's step vars ---------- */

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

function placeVariant(id: string, base: Base, number: string, k: number): VariantInput {
  const spec = { kind: "base-to-decimal" as const, base, number };
  const ds = placeDigits(spec);
  const fraction = number.includes(".");
  const hex = /[A-F]/.test(number);
  const weights = ds.map((d) => `${base}^${d.power}`).join(", ");
  const terms = ds.map((d) => `(${d.value} × ${base}^${d.power})`).join(" + ");
  const values = ds.map((d) => exactTerm(d.value, base, d.power)).join(" + ");
  const value = exactValue(spec);
  const zeroAt = ds.findIndex((d) => d.power === 0);
  // predictions before the terms and the sum (Pedagogy on #353); the slip is powers counted from 1
  const lead = ds[0]; // never 0 in these sets
  const whole = ds.filter((d) => d.power >= 0);
  const wholeSum = whole.reduce((acc, d) => acc + d.value * base ** d.power, 0);
  const wholeSlip = whole.reduce((acc, d) => acc + d.value * base ** (d.power + 1), 0);
  const pair = (right: string, slip: string) => (k % 2 ? [slip, right] : [right, slip]);

  const misconceptions: VariantInput["misconceptions"] = [{ id: "pv.reversed", title: "Weights counted from the wrong end", nudgeKey: "pv.weights-reversed", detect: { type: "weights-reversed" } }];
  if (fraction) misconceptions.push({ id: "pv.negative", title: "Powers after the point", nudgeKey: "pv.negative-powers", detect: { type: "negative-powers-wrong" } });
  if (hex) misconceptions.push({ id: "pv.hex-letter", title: "Hex letter used as a small digit", nudgeKey: "pv.hex-letter-value", detect: { type: "hex-letter-as-digit" } });
  const firstAsk = fraction
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
        ask: firstAsk,
      },
      { id: "s2", say: `Counting down from left to right, the weights are ${weights}.`, stage: { revealed: 1 } },
      {
        id: "s3",
        say: `Each term is the digit times its weight: ${terms}.`,
        stage: { revealed: 1 },
        ask: {
          prompt: `What is ${lead.value} × ${base}^${lead.power}?`,
          options: pair(exactTerm(lead.value, base, lead.power), exactTerm(lead.value, base, lead.power + 1)),
          correctIndex: k % 2,
          afterCorrect: `Yes. The terms are ${values}.`,
          afterWrong: `${base}^${lead.power} is ${exactTerm(1, base, lead.power)}, so it is ${exactTerm(lead.value, base, lead.power)}. The terms are ${values}.`,
        },
      },
      {
        id: "s4",
        say: `The terms are ${values}. Now add them.`,
        stage: { revealed: 2 },
        ask: {
          prompt: "What is the whole-number part of the sum?",
          options: pair(String(wholeSum), String(wholeSlip)).reverse(),
          correctIndex: 1 - (k % 2),
          afterCorrect: "Yes. Then add the fractions.",
          afterWrong: `The whole-number terms add to ${wholeSum}. Then add the fractions.`,
        },
      },
      { id: "s5", say: `(${number})_${base} = (${value})_10.`, stage: { revealed: 3 } },
    ],
    reactions: { stepNext: "Good. Now the next line.", correct: "Right: every weight, term and the sum.", correctAfterHints: "Right. Every line is done." },
  };
}

/** Three sets per question, the pack's fresh numbers (ch1 §1–3, §7); binary has a fourth. */
const BINARY = ["110.011", "111.001", "100.110", "110.101"];
const OCTAL = ["263.540", "317.420", "106.320"]; // not 106.350: its 5/64 term has six decimals (Pedagogy on #353)
const HEX = ["2C5", "3E1", "1B7"];

const variants = (prefix: string, base: Base, numbers: string[]) => numbers.map((n, i) => placeVariant(`${prefix}-${i + 1}`, base, n, i));

export const placeValueTopic: TopicInput = {
  id: "place-value",
  title: "Place value",
  summary: "Every digit has a weight, a power of the base. Decimal places first, then binary, octal and hex to decimal: weights, terms, sum.",
  preview: "(101.101)_2 → 4 + 1 + 0.5 + 0.125 → (5.625)_10",
  concepts: [
    { id: "pv.weights", title: "Place value", summary: "A digit's weight is a power of the base: 0 just left of the point, rising to the left, negative after the point." },
    { id: "pv.to-decimal", title: "Base → decimal", summary: "Multiply each digit by its weight and add the terms." },
  ],
  objectives: [
    { id: "pv.obj.decimal", conceptId: "pv.weights", text: "Name the weight of a decimal digit, and the digit in a named place." },
    { id: "pv.obj.binary", conceptId: "pv.to-decimal", text: "Convert a binary number with a fraction to decimal." },
    { id: "pv.obj.octal", conceptId: "pv.to-decimal", text: "Convert an octal number with a fraction to decimal." },
    { id: "pv.obj.hex", conceptId: "pv.to-decimal", text: "Convert a hex number to decimal, a letter by its value." },
  ],
  activities: [
    {
      id: "place-value",
      title: "Place value and base → decimal",
      summary: "Decimal places, then weights, terms and the sum, one line at a time.",
      authority: "DEMO",
      minutes: 15,
      questions: [
        {
          id: "pv.q.weight",
          label: "Weight of a digit",
          conceptId: "pv.weights",
          objectiveId: "pv.obj.decimal",
          variants: [weightVariant("vd-1", "276.384", "7", 0), weightVariant("vd-2", "908.125", "2", 1), weightVariant("vd-3", "731.062", "7", 2)],
        },
        {
          id: "pv.q.place",
          label: "Digit in a place",
          conceptId: "pv.weights",
          objectiveId: "pv.obj.decimal",
          variants: [placeDigitVariant("vd-1", "276.384", -1, 0), placeDigitVariant("vd-2", "908.125", -2, 1), placeDigitVariant("vd-3", "731.062", 1, 2)],
        },
        { id: "pv.q.binary", label: "Binary → decimal", conceptId: "pv.to-decimal", objectiveId: "pv.obj.binary", variants: variants("vb", 2, BINARY) },
        { id: "pv.q.octal", label: "Octal → decimal", conceptId: "pv.to-decimal", objectiveId: "pv.obj.octal", variants: variants("vo", 8, OCTAL) },
        { id: "pv.q.hex", label: "Hex → decimal", conceptId: "pv.to-decimal", objectiveId: "pv.obj.hex", variants: variants("vh", 16, HEX) },
      ],
    },
  ],
};
