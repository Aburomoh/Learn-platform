/**
 * Shared content builders (#192 Technical Lead decision): explanation walks and variants that are
 * computed from numbers and reused across topics. Topic files keep their own wording and hints.
 */
import type { z } from "zod";
import type { HintSchema, VariantSchema } from "./schema";
import { additionResult, additionSteps, complementBits, divisionSteps, groupBits } from "./grade";

type HintInput = z.input<typeof HintSchema>;
type VariantInput = z.input<typeof VariantSchema>;
export type ExplanationInput = VariantInput["explanation"];

export const divisionHints: HintInput[] = [
  { rung: 2, text: "Not yet. Do {dividend} ÷ 2 once more, carefully." },
  { rung: 3, text: "Each step: divide by 2. The whole-number result goes in the row below. What is left over (0 or 1) goes beside the number." },
  { rung: 4, text: "Is {dividend} even or odd? What does that tell you about the remainder?" },
  { rung: 5, text: "Work in this column only: {dividend}.", focus: "div-active", highlight: "div-active" },
  { rung: 6, text: "{dividend} = 2 × (result) + remainder. Find the result first: it goes in the row below." },
  { rung: 7, text: "Share {dividend} sweets between two people. Each one gets the result. What cannot be shared is the remainder." },
  { rung: 8, text: "Half of {dividend}, rounded down, goes in the row below. Even numbers leave 0, odd numbers leave 1." },
  { rung: 9, text: "{dividend} ÷ 2 = {quotient}, remainder {remainder}." },
];

export const divisionMisconceptions: VariantInput["misconceptions"] = [
  { id: "div.swapped", title: "Quotient and remainder swapped", nudgeKey: "div.swapped", detect: { type: "division-swapped" } },
  { id: "div.remainder", title: "Wrong remainder", nudgeKey: "div.remainder", detect: { type: "division-remainder" } },
  { id: "div.quotient", title: "Wrong quotient", nudgeKey: "div.quotient", detect: { type: "division-quotient" } },
];

export const readHints: HintInput[] = [
  { rung: 2, text: "Not yet. Use the remainders, in the right order." },
  { rung: 3, text: "The first remainder you found is the LSB (rightmost bit). The last one is the MSB (leftmost bit)." },
  { rung: 4, text: "Which remainder did you find last? That bit is written first." },
  { rung: 5, text: "Look at the remainder column. Start from the bottom.", focus: "div-remainders", highlight: "div-remainders" },
  { rung: 6, text: "Write the bottom remainder first, then move up one remainder at a time." },
  { rung: 7, text: "Like stacking plates: the last one you put down is the first one you pick up." },
  { rung: 8, text: "The first bit is the bottom remainder, {msb}. Continue upward." },
  { rung: 9, text: "({value})_10 = ({answerBits})_2." },
];

/** One explanation step per division, each with a remainder prediction (owner rule: every step a goal). */
export function divisionWalk(value: number): ExplanationInput {
  const steps = divisionSteps(value);
  return [
    { id: "s1", say: "Divide {value} by 2 again and again. Each remainder becomes one bit.", stage: { revealed: 0 } },
    ...steps.map((st, i) => {
      const right = `${st.quotient}, remainder ${st.remainder}`;
      const wrong = `${st.quotient}, remainder ${1 - st.remainder}`;
      const correctIndex = i % 2;
      return {
        id: `s${i + 2}`,
        say: i === 0 ? `Start with ${st.dividend} ÷ 2.` : `${st.dividend} goes in the next row. Now ${st.dividend} ÷ 2.`,
        stage: { revealed: i, attention: i },
        ask: {
          prompt: `${st.dividend} ÷ 2 = ?`,
          options: correctIndex === 0 ? [right, wrong] : [wrong, right],
          correctIndex,
          afterCorrect: st.remainder ? `Yes. ${st.dividend} is odd, so 1 is left over.` : `Yes. ${st.dividend} is even, so nothing is left over.`,
          afterWrong: `${st.dividend} is ${st.remainder ? "odd" : "even"}: ${st.dividend} ÷ 2 = ${right}.`,
        },
      };
    }),
    { id: `s${steps.length + 2}`, say: "The result is 0, so we stop. The remainder column holds the bits.", stage: { revealed: steps.length } },
  ];
}

/** Distinct options, correct first in the authored list, then shuffled by a fixed rotation. */
export function optionsWith(correct: string, distractors: string[], rotate: number): { options: string[]; correctIndex: number } {
  const all = [correct, ...distractors.filter((d, i, a) => d !== correct && a.indexOf(d) === i)].slice(0, 4);
  const k = rotate % all.length;
  const options = [...all.slice(k), ...all.slice(0, k)];
  return { options, correctIndex: options.indexOf(correct) };
}

/** Grouping walk: padding as a prediction, then each group's digit as a prediction, then the check. */
export function groupingWalk(bits: string, size: 3 | 4): ExplanationInput {
  const groups = groupBits(bits, size);
  const pad = groups.length * size - bits.length;
  const base = size === 3 ? 8 : 16;
  const padAsk = optionsWith(String(pad), [String(pad + 1), "0", "1"].filter((d) => d !== String(pad)).slice(0, 2), 0);
  const zeros = (n: number) => `${n} bit${n === 1 ? "" : "s"}`;
  const digitOf = (g: string) => parseInt(g, 2).toString(16).toUpperCase();
  const answer = groups.map(digitOf).join("");
  return [
    { id: "s1", say: `One ${size === 3 ? "octal" : "hexadecimal"} digit stands for ${size} bits. Split {answerBits} from the right.`, stage: { groups: [] } },
    {
      id: "s2",
      say: pad ? `The leftmost group is short by ${zeros(pad)}.` : `${bits.length} bits split exactly into groups of ${size}.`,
      stage: { groups: [], attention: 0 },
      ask: {
        prompt: "How many zeros do we add on the left?",
        ...padAsk,
        afterCorrect: pad ? `Yes: the groups are ${groups.join(" ")}.` : "Right, none: every group is already full.",
        afterWrong: `Each group needs ${size} bits, so we add ${pad}: ${groups.join(" ")}.`,
      },
    },
    ...groups.map((g, i) => {
      const value = parseInt(g, 2);
      const reversed = String(parseInt([...g].reverse().join(""), 2));
      const ones = String([...g].filter((b) => b === "1").length);
      const asDecimal = g.replace(/^0+(?=.)/, "");
      const digit = digitOf(g);
      // Real misreadings: weights from the wrong end, counting the 1s, bits read as decimal, decimal value for a hex letter.
      // A group such as 000 reads the same every way; only then do neighbouring values fill in.
      const real = [String(value), reversed, ones, asDecimal].filter((d) => d !== digit);
      const ask = optionsWith(digit, real.length ? real : [String(value + 1), String(value + 2)], i + 1);
      return {
        id: `s${i + 3}`,
        say: `Group ${i + 1}: ${g}.`,
        stage: { groups, attention: i },
        ask: {
          prompt: `Which digit is ${g}?`,
          ...ask,
          afterCorrect: `Yes: ${g} is ${value}${value >= 10 ? `, written ${digit}` : ""}.`,
          afterWrong: `The weights are ${size === 3 ? "4, 2, 1" : "8, 4, 2, 1"}. ${g} is ${value}${value >= 10 ? `, written ${digit}` : ""}.`,
        },
      };
    }),
    { id: `s${groups.length + 3}`, say: `So ({value})_10 = (${answer})${base === 8 ? "_8" : "_16"}.`, stage: { groups, done: true } },
  ];
}

export function exerciseVars(value: number) {
  const bits = value.toString(2);
  return { value, answerBits: bits, msb: 1, answerOct: value.toString(8), answerHex: value.toString(16).toUpperCase() };
}

/** Also used by subtraction (B in binary), with that practice's variant id (#141). */
export function divideVariant(value: number, prompt: string, id = `v${value}`): VariantInput {
  return {
    id,
    prompt,
    spec: { kind: "repeated-division", value, base: 2, steps: divisionSteps(value) },
    vars: exerciseVars(value),
    hints: divisionHints,
    misconceptions: divisionMisconceptions,
    reactions: { stepNext: "Good. Now {dividend} ÷ 2.", correct: "Good. The result is 0, so the division stops.", correctAfterHints: "Right. The result is 0, so the division stops." },
    explanation: divisionWalk(value),
  };
}

export function readVariant(value: number, id = `v${value}`): VariantInput {
  const bits = value.toString(2);
  const reversed = [...bits].reverse().join("");
  return {
    id,
    prompt: "The division of {value} is finished. Use the remainders to write ({value})_10 in binary.",
    spec: { kind: "numeric", base: 2, answer: bits, context: { type: "division-chain", value, steps: divisionSteps(value) } },
    vars: exerciseVars(value),
    hints: readHints,
    // A palindrome (73 = 1001001) reads the same both ways, so there is no reversed-order mistake to detect.
    misconceptions: reversed === bits ? [] : [{ id: "ns.read-reversed", title: "Read LSB first", nudgeKey: "ns.read-reversed", detect: { type: "equals", value: reversed } }],
    explanation: [
      { id: "s1", say: "The first remainder is the LSB. The last remainder is the MSB.", stage: { showOrder: true } },
      {
        id: "s2",
        say: "The MSB is written on the left.",
        stage: { showOrder: true, attention: divisionSteps(value).length - 1 },
        ask: { prompt: "Which remainder do we write first?", options: ["The bottom one (MSB)", "The top one (LSB)"], correctIndex: 0, afterCorrect: "Yes. Read from the bottom up.", afterWrong: "The MSB goes on the left, and it is the bottom remainder." },
      },
    ],
  };
}

/** One prediction per column, then the end carry unless it is dropped (owner rule: every step a goal). */
export function additionWalk(a: string, b: string, endCarry = true): ExplanationInput {
  const steps = additionSteps(a, b, endCarry);
  return [
    { id: "s1", say: `Add ${a} + ${b} one column at a time, starting from the right.`, stage: { revealed: 0 } },
    ...steps.map((st, i) => {
      const say = st.final ? "No bits are left, only the carry." : `The ${2 ** st.column}s column: ${st.a} + ${st.b}${st.carryIn ? " + the carry 1" : ""}.`;
      if (st.final)
        return {
          id: `s${i + 2}`,
          say,
          stage: { revealed: i, attention: i },
          ask: { prompt: "What is the leftmost bit of the sum?", options: [String(st.sum), String(1 - st.sum)], correctIndex: 0, afterCorrect: "Yes. The carry comes down as the leftmost bit.", afterWrong: `The carry out of the last column was ${st.sum}; it comes down as the leftmost bit.` },
        };
      const right = `${st.sum}, carry ${st.carryOut}`;
      const total = st.a + st.b + st.carryIn;
      // Real mistakes: the decimal total, forgetting the carry in, swapping sum and carry.
      const wrong = [total >= 2 ? `${total}, carry 0` : "", st.carryIn ? `${(st.a + st.b) % 2}, carry ${(st.a + st.b) >> 1}` : "", `${st.carryOut}, carry ${st.sum}`].filter((w, k, all) => w && w !== right && all.indexOf(w) === k);
      const options = [right, ...(wrong.length ? wrong : [`${1 - st.sum}, carry ${st.carryOut}`])].slice(0, 3);
      const k = i % options.length;
      const rotated = [...options.slice(k), ...options.slice(0, k)];
      return {
        id: `s${i + 2}`,
        say,
        stage: { revealed: i, attention: i },
        ask: {
          prompt: `${st.a} + ${st.b}${st.carryIn ? " + 1" : ""} = ?`,
          options: rotated,
          correctIndex: rotated.indexOf(right),
          afterCorrect: `Yes: write ${st.sum}${st.carryOut ? " and carry 1" : ""}.`,
          afterWrong: `The total is ${total}, which is ${total.toString(2)} in binary: write ${st.sum}${st.carryOut ? " and carry 1" : ""}.`,
        },
      };
    }),
    { id: `s${steps.length + 2}`, say: `So ${a} + ${b} = ${additionResult(a, b, endCarry)}.`, stage: { revealed: steps.length } },
  ];
}

export function weightSum(bits: string): string {
  return [...bits].map((d, i) => (d === "1" ? 2 ** (bits.length - 1 - i) : 0)).filter(Boolean).join(" + ");
}

/** One prediction per bit (owner rule: every step a goal). */
export function flipWalk(bits: string): ExplanationInput {
  const ones = complementBits(bits);
  return [
    { id: "s1", say: "The 1's complement flips every bit. We go from the left, one bit at a time.", stage: { revealed: 0 } },
    ...[...bits].map((b, i) => ({
      id: `s${i + 2}`,
      say: `Bit ${i + 1} is ${b}.`,
      stage: { revealed: i, attention: i },
      ask: {
        prompt: `What does ${b} become?`,
        options: ["0", "1"],
        correctIndex: Number(ones[i]),
        afterCorrect: `Yes: ${b} flips to ${ones[i]}.`,
        afterWrong: `It flips: ${b} becomes ${ones[i]}.`,
      },
    })),
    { id: `s${bits.length + 2}`, say: `So the 1's complement of ${bits} is ${ones}.`, stage: { revealed: bits.length } },
  ];
}
