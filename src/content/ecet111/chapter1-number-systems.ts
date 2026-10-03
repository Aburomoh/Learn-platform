/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * Follows the method of ECET 111 Chapter 1 (repeated division by 2 as a vertical ladder with remainders beside,
 * LSB first / MSB last; grouping by 3 bits for octal and 4 bits for hexadecimal). Questions,
 * numbers and wording here are original; the slides themselves are not reproduced.
 */
import type { z } from "zod";
import type { TopicSchema, HintSchema, VariantSchema } from "../schema";
import { divisionSteps, groupBits } from "../grade";

type TopicInput = z.input<typeof TopicSchema>;
type HintInput = z.input<typeof HintSchema>;
type VariantInput = z.input<typeof VariantSchema>;

/* ---------- shared, step-aware hint ladders (slots are filled per step / per variant) ---------- */

const divisionHints: HintInput[] = [
  { rung: 2, text: "Not yet. Do {dividend} ÷ 2 once more, carefully." },
  { rung: 3, text: "Each step: divide by 2. The whole-number result goes in the row below. What is left over (0 or 1) goes beside the number." },
  { rung: 4, text: "Is {dividend} even or odd? What does that tell you about the remainder?" },
  { rung: 5, text: "Work in this column only: {dividend}.", focus: "div-active", highlight: "div-active" },
  { rung: 6, text: "{dividend} = 2 × (result) + remainder. Find the result first: it goes in the row below." },
  { rung: 7, text: "Share {dividend} sweets between two people. Each one gets the result. What cannot be shared is the remainder." },
  { rung: 8, text: "Half of {dividend}, rounded down, goes in the row below. Even numbers leave 0, odd numbers leave 1." },
  { rung: 9, text: "{dividend} ÷ 2 = {quotient}, remainder {remainder}." },
];

const divisionMisconceptions: VariantInput["misconceptions"] = [
  { id: "div.swapped", title: "Quotient and remainder swapped", nudgeKey: "div.swapped", detect: { type: "division-swapped" } },
  { id: "div.remainder", title: "Wrong remainder", nudgeKey: "div.remainder", detect: { type: "division-remainder" } },
  { id: "div.quotient", title: "Wrong quotient", nudgeKey: "div.quotient", detect: { type: "division-quotient" } },
];

const readHints: HintInput[] = [
  { rung: 2, text: "Not yet. Use the remainders, in the right order." },
  { rung: 3, text: "The first remainder you found is the LSB (rightmost bit). The last one is the MSB (leftmost bit)." },
  { rung: 4, text: "Which remainder did you find last? That bit is written first." },
  { rung: 5, text: "Look at the remainder column. Start from the bottom.", focus: "div-remainders", highlight: "div-remainders" },
  { rung: 6, text: "Write the bottom remainder first, then move up one remainder at a time." },
  { rung: 7, text: "Like stacking plates: the last one you put down is the first one you pick up." },
  { rung: 8, text: "The first bit is the bottom remainder, {msb}. Continue upward." },
  { rung: 9, text: "({value})₁₀ = ({answerBits})₂." },
];

/* Grouping (#44): step 0 marks the groups, then one digit per group. Ladders are per step (ADR-0007 §3). */
const groupHints: HintInput[] = [
  { rung: 2, text: "Not yet. Start at the right-hand end of {bits}." },
  { rung: 3, text: "Each group has {groupSize} bits. Count {groupSize} bits from the right, then the next {groupSize}." },
  { rung: 4, text: "Look at the bits left over on the left. Is that group shorter than {groupSize}?" },
  { rung: 5, text: "Add zeros on the left until the leftmost group has {groupSize} bits.", focus: "pad-zero", highlight: "pad-zero" },
  { rung: 6, text: "Zeros on the left do not change the value, just as 007 is still 7." },
  { rung: 7, text: "Like writing 1234567 as 1 234 567: you split from the right." },
  { rung: 8, text: "You need {padCount} zero(s) on the left, which makes {groupCount} groups." },
  { rung: 9, text: "The groups are {groups}." },
];

function digitHints(weights: string, extra: string): HintInput[] {
  return [
    { rung: 2, text: "Not yet. Look only at group {groupIndex}: {groupBits}." },
    { rung: 3, text: `Inside a group the weights are ${weights}.${extra}` },
    { rung: 4, text: "Which weights sit under the 1s in {groupBits}?" },
    { rung: 5, text: "Add the weights of the 1s in {groupBits}.", focus: "group-digit", highlight: "group-digit" },
    { rung: 6, text: "A 0 adds nothing. Only the 1s count." },
    { rung: 8, text: "The total of the weights is one digit. Write that digit in the slot." },
    { rung: 9, text: "{groupBits} is {groupValue}, so the digit is {digit}." },
  ];
}

const octalDigitHints = digitHints("4, 2, 1", "");
const hexDigitHints = digitHints("8, 4, 2, 1", " Values 10 to 15 are written A to F.");

const groupingMisconceptions: VariantInput["misconceptions"] = [
  { id: "ns.group-from-left", title: "Grouped from the left", nudgeKey: "ns.group-from-left", detect: { type: "group-from-left" } },
  { id: "ns.group-no-padding", title: "Short group not padded", nudgeKey: "ns.group-no-padding", detect: { type: "group-no-padding" } },
  { id: "ns.wrong-group-size", title: "Wrong group size", nudgeKey: "ns.wrong-group-size", detect: { type: "group-wrong-size" } },
  { id: "ns.hex-digit-decimal", title: "Wrote the decimal value instead of a hex digit", nudgeKey: "ns.hex-letter", detect: { type: "digit-as-decimal" } },
];

const groupingReactions = { stepNext: "Good. Now the next goal.", correct: "Good. Every group has its digit.", correctAfterHints: "Right. Every group has its digit." };

const steps26 = [
  { dividend: 26, quotient: 13, remainder: 0 as const },
  { dividend: 13, quotient: 6, remainder: 1 as const },
  { dividend: 6, quotient: 3, remainder: 0 as const },
  { dividend: 3, quotient: 1, remainder: 1 as const },
  { dividend: 1, quotient: 0, remainder: 1 as const },
];
const steps37 = [
  { dividend: 37, quotient: 18, remainder: 1 as const },
  { dividend: 18, quotient: 9, remainder: 0 as const },
  { dividend: 9, quotient: 4, remainder: 1 as const },
  { dividend: 4, quotient: 2, remainder: 0 as const },
  { dividend: 2, quotient: 1, remainder: 0 as const },
  { dividend: 1, quotient: 0, remainder: 1 as const },
];

const vars26 = { value: 26, answerBits: "11010", msb: 1, answerOct: "32", answerHex: "1A" };
const vars37 = { value: 37, answerBits: "100101", msb: 1, answerOct: "45", answerHex: "25" };

/* ---------- Exercise 88 and 73 (#43): same walked steps, no worked example first ---------- */

type ExplanationInput = VariantInput["explanation"];

/** One explanation step per division, each with a remainder prediction (owner rule: every step a goal). */
function divisionWalk(value: number): ExplanationInput {
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
function optionsWith(correct: string, distractors: string[], rotate: number): { options: string[]; correctIndex: number } {
  const all = [correct, ...distractors.filter((d, i, a) => d !== correct && a.indexOf(d) === i)].slice(0, 4);
  const k = rotate % all.length;
  const options = [...all.slice(k), ...all.slice(0, k)];
  return { options, correctIndex: options.indexOf(correct) };
}

/** Grouping walk: padding as a prediction, then each group's digit as a prediction, then the check. */
function groupingWalk(bits: string, size: 3 | 4): ExplanationInput {
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
    { id: `s${groups.length + 3}`, say: `So ({value})₁₀ = (${answer})${base === 8 ? "₈" : "₁₆"}.`, stage: { groups, done: true } },
  ];
}

function exerciseVars(value: number) {
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
    prompt: "The division of {value} is finished. Use the remainders to write ({value})₁₀ in binary.",
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

function groupingVariant(value: number, size: 3 | 4): VariantInput {
  const bits = value.toString(2);
  const answer = value.toString(size === 3 ? 8 : 16).toUpperCase();
  return {
    id: `v${value}`,
    prompt: `({value})₁₀ = ({answerBits})₂. Write it in ${size === 3 ? "octal" : "hexadecimal"}: first mark groups of ${size === 3 ? "three" : "four"} bits from the right, then write one digit under each group.`,
    spec: { kind: "bit-grouping", bits, groupSize: size, answer },
    vars: { ...exerciseVars(value), groups: groupBits(bits, size).join(" ") },
    hints: groupHints,
    hintsByStep: { group: groupHints, digit: size === 3 ? octalDigitHints : hexDigitHints },
    misconceptions: groupingMisconceptions,
    reactions: groupingReactions,
    explanation: groupingWalk(bits, size),
  };
}

const conversionExercise: TopicInput["activities"][number] = {
  id: "conversion-exercise",
  title: "Exercise: 88 and 73",
  summary: "The same four steps on new numbers: divide, read off, then octal and hexadecimal by grouping.",
  authority: "DEMO",
  minutes: 12,
  questions: [
    {
      id: "ns.x.divide",
      label: "Divide by 2",
      conceptId: "ns.repeated-division",
      objectiveId: "ns.obj.divide",
      variants: [
        divideVariant(88, "Exercise: convert ({value})₁₀ to binary. Divide by 2, one step at a time: the result goes below, the remainder beside it."),
        divideVariant(73, "Now ({value})₁₀. Divide by 2, one step at a time."),
      ],
    },
    { id: "ns.x.read", label: "Read off", conceptId: "ns.bit-order", objectiveId: "ns.obj.read", variants: [readVariant(88), readVariant(73)] },
    { id: "ns.x.octal", label: "Octal", conceptId: "ns.octal-grouping", objectiveId: "ns.obj.octal", variants: [groupingVariant(88, 3), groupingVariant(73, 3)] },
    { id: "ns.x.hex", label: "Hex", conceptId: "ns.hex-grouping", objectiveId: "ns.obj.hex", variants: [groupingVariant(88, 4), groupingVariant(73, 4)] },
  ],
};

export const numberSystemsTopic: TopicInput = {
  id: "number-systems",
  title: "Number-base conversions",
  summary: "Decimal to binary by repeated division, then to octal and hexadecimal by grouping bits.",
  preview: "53₁₀ → 110101₂ → 65₈ → 35₁₆",
  concepts: [
    { id: "ns.repeated-division", title: "Repeated division by 2", summary: "Divide by 2 until the result is 0. Each remainder is one bit." },
    { id: "ns.bit-order", title: "LSB and MSB", summary: "The first remainder is the least significant bit; the last remainder is the most significant bit." },
    { id: "ns.octal-grouping", title: "Octal grouping", summary: "Each group of three bits, counted from the right, is one octal digit." },
    { id: "ns.hex-grouping", title: "Hexadecimal grouping", summary: "Each group of four bits, counted from the right, is one hexadecimal digit; 10–15 are A–F." },
  ],
  objectives: [
    { id: "ns.obj.divide", conceptId: "ns.repeated-division", text: "Carry out the divide-by-2 steps for a decimal number, one step at a time." },
    { id: "ns.obj.read", conceptId: "ns.bit-order", text: "Read the remainders in the correct order to write the binary number." },
    { id: "ns.obj.octal", conceptId: "ns.octal-grouping", text: "Convert a binary number to octal by grouping three bits." },
    { id: "ns.obj.hex", conceptId: "ns.hex-grouping", text: "Convert a binary number to hexadecimal by grouping four bits." },
  ],
  activities: [
    {
      id: "decimal-to-binary",
      title: "Decimal → binary → octal → hexadecimal",
      summary: "Divide by 2 one step at a time, read the bits in the right order, then group them.",
      authority: "DEMO",
      minutes: 10,
      questions: [
        /* ---- Q1: the division chain, one checked step at a time ---- */
        {
          id: "ns.q.divide",
          label: "Divide by 2",
          conceptId: "ns.repeated-division",
          objectiveId: "ns.obj.divide",
          variants: [
            {
              id: "v26",
              prompt: "Convert ({value})₁₀ to binary. Divide by 2, one step at a time: write the result below and the remainder beside it.",
              spec: { kind: "repeated-division", value: 26, base: 2, steps: steps26 },
              vars: vars26,
              hints: divisionHints,
              misconceptions: divisionMisconceptions,
              reactions: { stepNext: "Good. Now {dividend} ÷ 2.", correct: "Good. The result is 0, so the division stops.", correctAfterHints: "Right. The result is 0, so the division stops." },
              explanation: [
                { id: "s1", say: "To convert {value} to binary we divide by 2 again and again. Every remainder becomes one bit.", stage: { revealed: 0 } },
                {
                  id: "s2",
                  say: "Start with {value} ÷ 2. {value} is an even number.",
                  stage: { revealed: 0, attention: 0 },
                  ask: { prompt: "What is the remainder of 26 ÷ 2?", options: ["0", "1"], correctIndex: 0, afterCorrect: "Yes. 26 ÷ 2 = 13, remainder 0.", afterWrong: "Even numbers divide exactly, so the remainder is 0. 26 ÷ 2 = 13." },
                },
                {
                  id: "s3",
                  say: "13 goes in the row below, and the remainder 0 goes beside 26. Next: 13 ÷ 2 = 6.",
                  stage: { revealed: 1, attention: 1 },
                  ask: { prompt: "13 ÷ 2 = 6 with what remainder?", options: ["0", "1"], correctIndex: 1, afterCorrect: "Yes. 13 is odd, so 1 is left over.", afterWrong: "2 × 6 = 12, and 13 − 12 = 1. The remainder is 1." },
                },
                {
                  id: "s4",
                  say: "6 goes in the row below, and the remainder 1 goes beside 13. Next: 6 ÷ 2.",
                  stage: { revealed: 2, attention: 2 },
                  ask: { prompt: "6 ÷ 2 = ?", options: ["3, remainder 0", "3, remainder 1"], correctIndex: 0, afterCorrect: "Yes. 6 is even, so nothing is left over.", afterWrong: "6 is even: 6 ÷ 2 = 3, remainder 0." },
                },
                {
                  id: "s5",
                  say: "3 goes in the row below, and the remainder 0 goes beside 6. Next: 3 ÷ 2.",
                  stage: { revealed: 3, attention: 3 },
                  ask: { prompt: "3 ÷ 2 = 1 with what remainder?", options: ["0", "1"], correctIndex: 1, afterCorrect: "Yes. 3 is odd, so 1 is left over.", afterWrong: "2 × 1 = 2, and 3 − 2 = 1. The remainder is 1." },
                },
                {
                  id: "s6",
                  say: "One number is left: 1.",
                  stage: { revealed: 4, attention: 4 },
                  ask: { prompt: "What is 1 ÷ 2?", options: ["0, remainder 1", "1, remainder 0"], correctIndex: 0, afterCorrect: "Right. 2 does not fit into 1, so the result is 0 and the 1 is left over.", afterWrong: "2 does not fit into 1. The result is 0 and the 1 is left over." },
                },
                { id: "s7", say: "The result is 0, so we stop. The remainder column holds the bits. Now you do it.", stage: { revealed: 5 } },
              ],
            },
            {
              id: "v37",
              prompt: "Another one. Convert ({value})₁₀ to binary by dividing by 2, one step at a time.",
              spec: { kind: "repeated-division", value: 37, base: 2, steps: steps37 },
              vars: vars37,
              hints: divisionHints,
              misconceptions: divisionMisconceptions,
              reactions: { stepNext: "Good. Now {dividend} ÷ 2.", correct: "Good. The result is 0, so the division stops.", correctAfterHints: "Right. The result is 0, so the division stops." },
              explanation: [
                { id: "s1", say: "Same method: divide by 2, write the result below and the remainder beside it.", stage: { revealed: 0 } },
                {
                  id: "s2",
                  say: "{value} is an odd number.",
                  stage: { revealed: 0, attention: 0 },
                  ask: { prompt: "What is the remainder of 37 ÷ 2?", options: ["0", "1"], correctIndex: 1, afterCorrect: "Yes. 37 ÷ 2 = 18, remainder 1.", afterWrong: "Odd numbers always leave 1. 37 ÷ 2 = 18, remainder 1." },
                },
                { id: "s3", say: "18 ÷ 2 = 9 remainder 0. Then 9 ÷ 2 = 4 remainder 1.", stage: { revealed: 3, attention: 2 } },
                {
                  id: "s4",
                  say: "Now 4 ÷ 2.",
                  stage: { revealed: 3, attention: 3 },
                  ask: { prompt: "4 ÷ 2 = ?", options: ["2, remainder 0", "2, remainder 1"], correctIndex: 0, afterCorrect: "Yes, 4 is even.", afterWrong: "4 is even, so nothing is left over: 2, remainder 0." },
                },
                { id: "s5", say: "2 ÷ 2 = 1 remainder 0, and 1 ÷ 2 = 0 remainder 1. The result is 0, so we stop. Now you do it.", stage: { revealed: 6 } },
              ],
            },
          ],
        },

        /* ---- Q2: reading the remainders in the right order ---- */
        {
          id: "ns.q.read",
          label: "Read off",
          conceptId: "ns.bit-order",
          objectiveId: "ns.obj.read",
          variants: [
            {
              id: "v26",
              prompt: "The division of {value} is finished. Use the remainders to write ({value})₁₀ in binary.",
              spec: { kind: "numeric", base: 2, answer: "11010", context: { type: "division-chain", value: 26, steps: steps26 } },
              vars: vars26,
              hints: readHints,
              misconceptions: [{ id: "ns.read-reversed", title: "Read LSB first", nudgeKey: "ns.read-reversed", detect: { type: "equals", value: "01011" } }],
              explanation: [
                { id: "s1", say: "The first remainder is the least significant bit, LSB. The last remainder is the most significant bit, MSB.", stage: { showOrder: true } },
                {
                  id: "s2",
                  say: "A number is written with its most significant digit on the left.",
                  stage: { showOrder: true, attention: 4 },
                  ask: { prompt: "Which bit do we write first, on the left?", options: ["The last remainder (MSB)", "The first remainder (LSB)"], correctIndex: 0, afterCorrect: "Yes. Start from the last remainder.", afterWrong: "The MSB goes on the left, and the MSB is the last remainder." },
                },
                { id: "s3", say: "Read from MSB back to LSB: {answerBits}. Now you type it.", stage: { showOrder: true } },
              ],
            },
            {
              id: "v37",
              prompt: "The division of {value} is finished. Use the remainders to write ({value})₁₀ in binary.",
              spec: { kind: "numeric", base: 2, answer: "100101", context: { type: "division-chain", value: 37, steps: steps37 } },
              vars: vars37,
              hints: readHints,
              misconceptions: [{ id: "ns.read-reversed", title: "Read LSB first", nudgeKey: "ns.read-reversed", detect: { type: "equals", value: "101001" } }],
              explanation: [
                { id: "s1", say: "First remainder = LSB. Last remainder = MSB.", stage: { showOrder: true } },
                {
                  id: "s2",
                  say: "The MSB is written on the left.",
                  stage: { showOrder: true, attention: 5 },
                  ask: { prompt: "Which remainder is the MSB?", options: ["The last one", "The first one"], correctIndex: 0, afterCorrect: "Yes.", afterWrong: "The last remainder is the MSB." },
                },
                { id: "s3", say: "Read from MSB back to LSB: {answerBits}. Now you type it.", stage: { showOrder: true } },
              ],
            },
          ],
        },

        /* ---- Q3: octal by grouping three bits, one goal at a time (#44) ---- */
        {
          id: "ns.q.octal",
          label: "Octal",
          conceptId: "ns.octal-grouping",
          objectiveId: "ns.obj.octal",
          variants: [
            {
              id: "v26",
              prompt: "({value})₁₀ = ({answerBits})₂. Write it in octal: first mark groups of three bits from the right, then write one digit under each group.",
              spec: { kind: "bit-grouping", bits: "11010", groupSize: 3, answer: "32" },
              vars: { ...vars26, groups: "011 010" },
              hints: groupHints,
              hintsByStep: { group: groupHints, digit: octalDigitHints },
              misconceptions: groupingMisconceptions,
              reactions: groupingReactions,
              explanation: [
                { id: "s1", say: "One octal digit stands for three bits. We split {answerBits} from the right.", stage: { groups: [] } },
                {
                  id: "s2",
                  say: "From the right: 010 is one group. Two bits are left over: 11.",
                  stage: { groups: [], attention: 0 },
                  ask: { prompt: "The left group 11 has only two bits. What do we do?", options: ["Add one 0 on its left: 011", "Add one 0 on its right: 110", "Leave it as 11"], correctIndex: 0, afterCorrect: "Yes. A zero on the left does not change the value.", afterWrong: "Add the zero on the left: 011. A zero there does not change the value." },
                },
                {
                  id: "s3",
                  say: "The groups are 011 and 010. Take the left group first.",
                  stage: { groups: ["011", "010"], attention: 0 },
                  ask: { prompt: "What is 011 as a number?", options: ["3", "6", "11"], correctIndex: 0, afterCorrect: "Yes: 2 + 1 = 3.", afterWrong: "The weights are 4, 2, 1. 011 is 2 + 1 = 3." },
                },
                {
                  id: "s4",
                  say: "Now the right group, 010.",
                  stage: { groups: ["011", "010"], attention: 1 },
                  ask: { prompt: "What is 010 as a number?", options: ["2", "1", "10"], correctIndex: 0, afterCorrect: "Yes: only the 2 is on.", afterWrong: "The weights are 4, 2, 1. Only the middle bit, 2, is on." },
                },
                { id: "s5", say: "3 and 2: ({value})₁₀ = ({answerOct})₈. Check: 3 × 8 + 2 = {value}.", stage: { groups: ["011", "010"], done: true } },
              ],
            },
            {
              id: "v37",
              prompt: "({value})₁₀ = ({answerBits})₂. Write it in octal: first mark groups of three bits from the right, then write one digit under each group.",
              spec: { kind: "bit-grouping", bits: "100101", groupSize: 3, answer: "45" },
              vars: { ...vars37, groups: "100 101" },
              hints: groupHints,
              hintsByStep: { group: groupHints, digit: octalDigitHints },
              misconceptions: groupingMisconceptions,
              reactions: groupingReactions,
              explanation: [
                { id: "s1", say: "Split {answerBits} into threes from the right.", stage: { groups: [] } },
                {
                  id: "s2",
                  say: "Six bits make exactly two groups of three.",
                  stage: { groups: ["100", "101"] },
                  ask: { prompt: "Do we need to add zeros?", options: ["No, both groups have three bits", "Yes, one zero on the left"], correctIndex: 0, afterCorrect: "Right. Both groups are full.", afterWrong: "6 bits = 2 × 3, so both groups are already full." },
                },
                {
                  id: "s3",
                  say: "Take the left group first.",
                  stage: { groups: ["100", "101"], attention: 0 },
                  ask: { prompt: "What is 100 as a number?", options: ["4", "1", "100"], correctIndex: 0, afterCorrect: "Yes, 4.", afterWrong: "The weights are 4, 2, 1. Only the 4 is on." },
                },
                {
                  id: "s4",
                  say: "Now the right group, 101.",
                  stage: { groups: ["100", "101"], attention: 1 },
                  ask: { prompt: "What is 101 as a number?", options: ["5", "2", "101"], correctIndex: 0, afterCorrect: "Yes: 4 + 1 = 5.", afterWrong: "The weights are 4, 2, 1. 101 is 4 + 1 = 5." },
                },
                { id: "s5", say: "4 and 5: ({value})₁₀ = ({answerOct})₈. Check: 4 × 8 + 5 = {value}.", stage: { groups: ["100", "101"], done: true } },
              ],
            },
          ],
        },

        /* ---- Q4: hexadecimal by grouping four bits, one goal at a time (#44) ---- */
        {
          id: "ns.q.hex",
          label: "Hex",
          conceptId: "ns.hex-grouping",
          objectiveId: "ns.obj.hex",
          variants: [
            {
              id: "v26",
              prompt: "({value})₁₀ = ({answerBits})₂. Write it in hexadecimal: first mark groups of four bits from the right, then write one digit under each group.",
              spec: { kind: "bit-grouping", bits: "11010", groupSize: 4, answer: "1A" },
              vars: { ...vars26, groups: "0001 1010" },
              hints: groupHints,
              hintsByStep: { group: groupHints, digit: hexDigitHints },
              misconceptions: groupingMisconceptions,
              reactions: groupingReactions,
              explanation: [
                { id: "s1", say: "One hexadecimal digit stands for four bits. From the right: 1010 is one group, and 1 is left over.", stage: { groups: [] } },
                {
                  id: "s2",
                  say: "The left group has only one bit.",
                  stage: { groups: [], attention: 0 },
                  ask: { prompt: "How many zeros do we add on its left?", options: ["3", "1", "0"], correctIndex: 0, afterCorrect: "Yes: 0001 has four bits.", afterWrong: "A group needs four bits. 1 becomes 0001: three zeros." },
                },
                {
                  id: "s3",
                  say: "The groups are 0001 and 1010. 1010 is 8 + 2 = 10, and hexadecimal writes 10 as one digit.",
                  stage: { groups: ["0001", "1010"], attention: 1 },
                  ask: { prompt: "Which hexadecimal digit is 10?", options: ["A", "B", "10"], correctIndex: 0, afterCorrect: "Yes, A.", afterWrong: "After 9 comes A = 10, then B = 11, up to F = 15." },
                },
                {
                  id: "s4",
                  say: "Now the left group, 0001.",
                  stage: { groups: ["0001", "1010"], attention: 0 },
                  ask: { prompt: "What is 0001 as a number?", options: ["1", "8", "0001"], correctIndex: 0, afterCorrect: "Yes, 1.", afterWrong: "The weights are 8, 4, 2, 1. Only the 1 is on." },
                },
                { id: "s5", say: "1 and A: ({value})₁₀ = ({answerHex})₁₆. Check: 1 × 16 + 10 = {value}.", stage: { groups: ["0001", "1010"], done: true } },
              ],
            },
            {
              id: "v37",
              prompt: "({value})₁₀ = ({answerBits})₂. Write it in hexadecimal: first mark groups of four bits from the right, then write one digit under each group.",
              spec: { kind: "bit-grouping", bits: "100101", groupSize: 4, answer: "25" },
              vars: { ...vars37, groups: "0010 0101" },
              hints: groupHints,
              hintsByStep: { group: groupHints, digit: hexDigitHints },
              misconceptions: groupingMisconceptions,
              reactions: groupingReactions,
              explanation: [
                { id: "s1", say: "From the right: 0101 is one group, and 10 is left over.", stage: { groups: [] } },
                {
                  id: "s2",
                  say: "The left group has two bits.",
                  stage: { groups: [], attention: 0 },
                  ask: { prompt: "How many zeros do we add on its left?", options: ["2", "1", "0"], correctIndex: 0, afterCorrect: "Yes: 0010.", afterWrong: "A group needs four bits. 10 becomes 0010: two zeros." },
                },
                {
                  id: "s3",
                  say: "The groups are 0010 and 0101. Take the right group.",
                  stage: { groups: ["0010", "0101"], attention: 1 },
                  ask: { prompt: "What is 0101 as a number?", options: ["5", "10", "101"], correctIndex: 0, afterCorrect: "Yes: 4 + 1 = 5.", afterWrong: "The weights are 8, 4, 2, 1. 0101 is 4 + 1 = 5." },
                },
                {
                  id: "s4",
                  say: "Now the left group, 0010.",
                  stage: { groups: ["0010", "0101"], attention: 0 },
                  ask: { prompt: "What is 0010 as a number?", options: ["2", "4", "10"], correctIndex: 0, afterCorrect: "Yes: only the 2 is on.", afterWrong: "The weights are 8, 4, 2, 1. Only the 2 is on." },
                },
                { id: "s5", say: "2 and 5: ({value})₁₀ = ({answerHex})₁₆. Check: 2 × 16 + 5 = {value}.", stage: { groups: ["0010", "0101"], done: true } },
              ],
            },
          ],
        },
      ],
    },
    conversionExercise,
  ],
};
