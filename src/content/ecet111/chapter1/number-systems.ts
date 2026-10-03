/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * Follows the method of ECET 111 Chapter 1 (repeated division by 2 as a vertical ladder with remainders beside,
 * LSB first / MSB last; grouping by 3 bits for octal and 4 bits for hexadecimal). Questions,
 * numbers and wording here are original; the slides themselves are not reproduced.
 */
import type { z } from "zod";
import type { TopicSchema, HintSchema, VariantSchema } from "../../schema";
import { groupBits } from "../../grade";
import { divideVariant, divisionHints, divisionMisconceptions, exerciseVars, groupingWalk, readHints, readVariant } from "../../generators";

type TopicInput = z.input<typeof TopicSchema>;
type HintInput = z.input<typeof HintSchema>;
type VariantInput = z.input<typeof VariantSchema>;

/* ---------- shared, step-aware hint ladders (slots are filled per step / per variant) ---------- */

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

function groupingVariant(value: number, size: 3 | 4): VariantInput {
  const bits = value.toString(2);
  const answer = value.toString(size === 3 ? 8 : 16).toUpperCase();
  return {
    id: `v${value}`,
    prompt: `({value})_10 = ({answerBits})_2. Write it in ${size === 3 ? "octal" : "hexadecimal"}: first mark groups of ${size === 3 ? "three" : "four"} bits from the right, then write one digit under each group.`,
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
        divideVariant(88, "Exercise: convert ({value})_10 to binary. Divide by 2, one step at a time: the result goes below, the remainder beside it."),
        divideVariant(73, "Now ({value})_10. Divide by 2, one step at a time."),
        divideVariant(108, "And ({value})_10. Divide by 2, one step at a time."),
      ],
    },
    { id: "ns.x.read", label: "Read off", conceptId: "ns.bit-order", objectiveId: "ns.obj.read", variants: [readVariant(88), readVariant(73), readVariant(108)] },
    { id: "ns.x.octal", label: "Octal", conceptId: "ns.octal-grouping", objectiveId: "ns.obj.octal", variants: [groupingVariant(88, 3), groupingVariant(73, 3), groupingVariant(108, 3)] },
    { id: "ns.x.hex", label: "Hex", conceptId: "ns.hex-grouping", objectiveId: "ns.obj.hex", variants: [groupingVariant(88, 4), groupingVariant(73, 4), groupingVariant(108, 4)] },
  ],
};

/* ---------- Check the octal / hex answer back in decimal (#215, slides 38 and 44) ---------- */

/** "3 × 8 + 2 × 1" for the digits of `text` in `base` (place weights from the right). */
function placeTerms(text: string, base: 8 | 16): string {
  return [...text].map((d, i) => `${parseInt(d, 16)} × ${base ** (text.length - 1 - i)}`).join(" + ");
}

const checkBackHints = (base: 8 | 16): HintInput[] => [
  { rung: 2, text: "Not yet. Each digit has a weight: 1, then ×" + base + " for each place to the left." },
  { rung: 3, text: `The place weights in base ${base} are 1, ${base}, ${base * base}, … from the right.` },
  { rung: 4, text: "Multiply each digit by its weight, then add." },
  { rung: 6, text: base === 16 ? "Letter digits count as numbers: A = 10, B = 11, … F = 15." : "Octal digits are 0 to 7, each worth its place weight." },
  { rung: 8, text: "Work out {terms}." },
  { rung: 9, text: "{terms} = {value}, the number we started with." },
];

/** One checked step: the octal or hex answer back to decimal, which must give the starting number. */
function checkBackVariant(value: number, base: 8 | 16): VariantInput {
  const text = value.toString(base).toUpperCase();
  const reversed = [...text].reverse().join("");
  const reversedValue = parseInt(reversed, base);
  const name = base === 8 ? "octal" : "hexadecimal";
  const done = `${value}: the number we started with. The ${name} answer checks out.`;
  const misconceptions: VariantInput["misconceptions"] = [];
  if (/^\d+$/.test(text) && text !== String(value)) misconceptions.push({ id: "ns.copied-digits", title: "Copied the digits", nudgeKey: "ns.copied-digits", detect: { type: "equals", value: text } });
  if (reversedValue !== value) misconceptions.push({ id: "ns.weights-reversed", title: "Weights from the wrong end", nudgeKey: "ba.weights-reversed", detect: { type: "equals", value: String(reversedValue) } });
  return {
    id: `v${value}`,
    prompt: `Check your answer: what is (${text})_${base} in decimal?`,
    spec: { kind: "numeric", base: 10, answer: String(value) },
    vars: { value, answerText: text, terms: placeTerms(text, base) },
    hints: checkBackHints(base),
    misconceptions,
    reactions: { correct: done, correctAfterHints: done },
    explanation: [
      { id: "s1", say: `In base ${base} the place weights are 1, ${base}, ${base * base}, … from the right.` },
      {
        id: "s2",
        say: `Write ${text} as digit × weight.`,
        ask: { prompt: `Which sum is (${text})_${base}?`, options: [placeTerms(text, base), placeTerms(reversed, base)].filter((o, k, all) => all.indexOf(o) === k).concat(reversedValue === value ? [`${[...text].map((d) => parseInt(d, 16)).join(" + ")}`] : []), correctIndex: 0, afterCorrect: `Yes: ${placeTerms(text, base)}.`, afterWrong: `Weights go from the right: ${placeTerms(text, base)}.` },
      },
      { id: "s3", say: `${placeTerms(text, base)} = ${value}: the number we started with.` },
    ],
  };
}

/* ---------- The 0–15 table: decimal, hex digit, 4 bits (#215, slides 23–25) ---------- */

const tableHints: HintInput[] = [
  { rung: 2, text: "Not yet. Hex digits go 0–9, then A = 10, B = 11, C = 12, D = 13, E = 14, F = 15." },
  { rung: 3, text: "Four bits have the weights 8, 4, 2, 1." },
  { rung: 9, text: "{fact}" },
];

function digitOptions(correct: string, wrong: string[]): { id: string; text: string }[] {
  return [correct, ...wrong.filter((w, k, all) => w !== correct && all.indexOf(w) === k)].slice(0, 4).map((t) => ({ id: `o-${t.toLowerCase()}`, text: t }));
}

/** Rotate options so the correct one is not always first. */
function rotated<T>(xs: T[], k: number): T[] {
  const r = k % xs.length;
  return [...xs.slice(r), ...xs.slice(0, r)];
}

function tableVariant(id: string, prompt: string, correct: string, wrong: string[], fact: string, k: number): VariantInput {
  const options = rotated(digitOptions(correct, wrong), k);
  return {
    id,
    prompt,
    spec: { kind: "multiple-choice", options, correctOptionId: `o-${correct.toLowerCase()}` },
    vars: { fact },
    hints: tableHints,
    explanation: [
      { id: "s1", say: "Hex digits go 0–9, then A = 10 up to F = 15. Four bits, with weights 8, 4, 2, 1, cover exactly 0 to 15." },
      { id: "s2", say: fact },
    ],
  };
}

const hex = (n: number) => n.toString(16).toUpperCase();
const bits4 = (n: number) => n.toString(2).padStart(4, "0");

/** Decimal 10–15 → hex digit; wrong: the decimal written as is, the neighbouring letters. */
const decimalToDigit = (n: number, k: number) =>
  tableVariant(`vdec${n}`, `Which hexadecimal digit stands for ${n}?`, hex(n), [String(n), hex(n - 1), hex(Math.min(n + 1, 15))], `${n} is written ${hex(n)} in hexadecimal.`, k);
/** Hex digit → 4 bits; wrong: the bits reversed, the neighbour's bits. */
const digitToBits = (n: number, k: number) =>
  tableVariant(`vhex${n}`, `Which 4 bits stand for the hex digit ${hex(n)}?`, bits4(n), [[...bits4(n)].reverse().join(""), bits4(n - 1), bits4((n + 1) % 16)], `${hex(n)} = ${n} = ${bits4(n)}: ${[8, 4, 2, 1].filter((w) => n & w).join(" + ")}.`, k);
/** 4 bits → hex digit; wrong: the bits read reversed, the decimal value for a letter digit. */
const bitsToDigit = (n: number, k: number) =>
  tableVariant(`vbits${n}`, `Which hex digit is ${bits4(n)}?`, hex(n), [hex(parseInt([...bits4(n)].reverse().join(""), 2)), n >= 10 ? String(n) : hex(n + 1), hex(n ^ 1)], `${bits4(n)} = ${[8, 4, 2, 1].filter((w) => n & w).join(" + ")} = ${n}, written ${hex(n)}.`, k);

const hexDigitsActivity: TopicInput["activities"][number] = {
  id: "hex-digits",
  title: "Hex digits: 0 to 15",
  summary: "Match decimal, hexadecimal digit and four bits for 0 to 15.",
  authority: "DEMO",
  minutes: 5,
  questions: [
    { id: "ns.t.digit", label: "Decimal → hex", conceptId: "ns.hex-grouping", objectiveId: "ns.obj.hex", variants: [11, 14, 10].map((n, k) => decimalToDigit(n, k)) },
    { id: "ns.t.bits", label: "Hex → 4 bits", conceptId: "ns.hex-grouping", objectiveId: "ns.obj.hex", variants: [13, 3, 11].map((n, k) => digitToBits(n, k + 1)) }, // no palindromes: reversed bits stay a real distractor
    { id: "ns.t.back", label: "4 bits → hex", conceptId: "ns.hex-grouping", objectiveId: "ns.obj.hex", variants: [12, 7, 10].map((n, k) => bitsToDigit(n, k + 2)) },
  ],
};

export const numberSystemsTopic: TopicInput = {
  id: "number-systems",
  title: "Number-base conversions",
  summary: "Decimal to binary by repeated division, then to octal and hexadecimal by grouping bits.",
  preview: "53_10 → 110101_2 → 65_8 → 35_16",
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
      minutes: 12,
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
              prompt: "Convert ({value})_10 to binary. Divide by 2, one step at a time: write the result below and the remainder beside it.",
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
              prompt: "Another one. Convert ({value})_10 to binary by dividing by 2, one step at a time.",
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
            divideVariant(75, "One more. Convert ({value})_10 to binary by dividing by 2, one step at a time."),
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
              prompt: "The division of {value} is finished. Use the remainders to write ({value})_10 in binary.",
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
              prompt: "The division of {value} is finished. Use the remainders to write ({value})_10 in binary.",
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
            readVariant(75),
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
              prompt: "({value})_10 = ({answerBits})_2. Write it in octal: first mark groups of three bits from the right, then write one digit under each group.",
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
                { id: "s5", say: "3 and 2: ({value})_10 = ({answerOct})_8. Check: 3 × 8 + 2 = {value}.", stage: { groups: ["011", "010"], done: true } },
              ],
            },
            {
              id: "v37",
              prompt: "({value})_10 = ({answerBits})_2. Write it in octal: first mark groups of three bits from the right, then write one digit under each group.",
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
                { id: "s5", say: "4 and 5: ({value})_10 = ({answerOct})_8. Check: 4 × 8 + 5 = {value}.", stage: { groups: ["100", "101"], done: true } },
              ],
            },
            groupingVariant(75, 3),
          ],
        },
        { id: "ns.q.octal-check", label: "Octal check", conceptId: "ns.octal-grouping", objectiveId: "ns.obj.octal", variants: [26, 37, 75].map((v) => checkBackVariant(v, 8)) },

        /* ---- Q4: hexadecimal by grouping four bits, one goal at a time (#44) ---- */
        {
          id: "ns.q.hex",
          label: "Hex",
          conceptId: "ns.hex-grouping",
          objectiveId: "ns.obj.hex",
          variants: [
            {
              id: "v26",
              prompt: "({value})_10 = ({answerBits})_2. Write it in hexadecimal: first mark groups of four bits from the right, then write one digit under each group.",
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
                { id: "s5", say: "1 and A: ({value})_10 = ({answerHex})_16. Check: 1 × 16 + 10 = {value}.", stage: { groups: ["0001", "1010"], done: true } },
              ],
            },
            {
              id: "v37",
              prompt: "({value})_10 = ({answerBits})_2. Write it in hexadecimal: first mark groups of four bits from the right, then write one digit under each group.",
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
                { id: "s5", say: "2 and 5: ({value})_10 = ({answerHex})_16. Check: 2 × 16 + 5 = {value}.", stage: { groups: ["0010", "0101"], done: true } },
              ],
            },
            groupingVariant(75, 4),
          ],
        },
        { id: "ns.q.hex-check", label: "Hex check", conceptId: "ns.hex-grouping", objectiveId: "ns.obj.hex", variants: [26, 37, 75].map((v) => checkBackVariant(v, 16)) },
      ],
    },
    hexDigitsActivity,
    conversionExercise,
  ],
};
