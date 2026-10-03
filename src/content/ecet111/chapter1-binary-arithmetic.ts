/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * Follows the method of ECET 111 Chapter 1 "Operations in binary — addition" (the four single-bit
 * rules, then addition column by column, checked in decimal). The slide example 1101 + 0111 is
 * used; other numbers and all wording are original.
 */
import type { z } from "zod";
import type { TopicSchema, HintSchema, VariantSchema } from "../schema";
import { additionResult, additionSteps, complementBits } from "../grade";
import { divideVariant, readVariant } from "./chapter1-number-systems";

type TopicInput = z.input<typeof TopicSchema>;
type HintInput = z.input<typeof HintSchema>;
type VariantInput = z.input<typeof VariantSchema>;
type ExplanationInput = VariantInput["explanation"];

/* ---------- Q1: single-bit rules ---------- */

function ruleVariant(id: string, prompt: string, options: { id: string; text: string; misconceptionId?: string }[], correct: string, why: string): VariantInput {
  return {
    id,
    prompt,
    spec: { kind: "multiple-choice", options, correctOptionId: correct },
    hints: [
      { rung: 2, text: "Not yet. Binary has only two digits, 0 and 1." },
      { rung: 3, text: "When a total reaches 2, it is written 10: a 0 stays, a 1 carries." },
      { rung: 9, text: why },
    ],
    misconceptions: [{ id: "add.wrote-two", title: "Wrote 2 for 1 + 1", nudgeKey: "add.wrote-two", detect: { type: "option", optionId: "two" } }],
    explanation: [
      { id: "s1", say: "Binary has only the digits 0 and 1. Adding works as in decimal, but 2 is already '10'." },
      { id: "s2", say: why },
    ],
  };
}

const rulesQuestions: TopicInput["activities"][number]["questions"] = [
  {
    id: "ba.q.zero",
    label: "0 + 0",
    conceptId: "ba.rules",
    objectiveId: "ba.obj.rules",
    variants: [
      ruleVariant("v-sum", "0 + 0 = ?", [{ id: "zero", text: "0" }, { id: "one", text: "1" }, { id: "ten", text: "10" }], "zero", "0 + 0 = 0, with no carry."),
      ruleVariant("v-carry", "A column holds 0 and 0, with no carry coming in. What do you write?", [{ id: "one", text: "1, carry 0" }, { id: "zero", text: "0, carry 0" }, { id: "ten", text: "0, carry 1" }], "zero", "0 + 0 = 0: write 0, carry nothing."),
    ],
  },
  {
    id: "ba.q.one",
    label: "0 + 1",
    conceptId: "ba.rules",
    objectiveId: "ba.obj.rules",
    variants: [
      ruleVariant("v01", "0 + 1 = ?", [{ id: "zero", text: "0" }, { id: "one", text: "1" }, { id: "ten", text: "10" }], "one", "0 + 1 = 1, with no carry."),
      ruleVariant("v10", "1 + 0 = ?", [{ id: "one", text: "1" }, { id: "ten", text: "10" }, { id: "zero", text: "0" }], "one", "1 + 0 = 1, with no carry: the order does not matter."),
    ],
  },
  {
    id: "ba.q.two",
    label: "1 + 1",
    conceptId: "ba.rules",
    objectiveId: "ba.obj.rules",
    variants: [
      ruleVariant("v-sum", "1 + 1 = ? (in binary)", [{ id: "two", text: "2", misconceptionId: "add.wrote-two" }, { id: "ten", text: "10" }, { id: "one", text: "1" }], "ten", "1 + 1 = 10 in binary: two is written 10."),
      ruleVariant("v-carry", "A column holds 1 and 1, with no carry coming in. What do you write?", [{ id: "ten", text: "0, carry 1" }, { id: "two", text: "2, carry 0", misconceptionId: "add.wrote-two" }, { id: "one", text: "1, carry 1" }], "ten", "1 + 1 = 10: write 0 in this column and carry 1."),
    ],
  },
];

/* ---------- Q2: column by column ---------- */

const columnHints: HintInput[] = [
  { rung: 2, text: "Not yet. Add the bits in the {place}s column, plus the carry coming in." },
  { rung: 3, text: "0 + 0 = 0, 0 + 1 = 1, 1 + 1 = 0 carry 1, and 1 + 1 + 1 = 1 carry 1." },
  { rung: 4, text: "This column adds {aBit} + {bBit} + {carryIn}. What is the total?" },
  { rung: 5, text: "Look at the {place}s column only.", focus: "add-sum", highlight: "add-sum" },
  { rung: 6, text: "A total of 2 is 10 in binary: write 0 here and carry 1. A total of 3 is 11: write 1 and carry 1." },
  { rung: 7, text: "Like decimal, where a column total of 10 or more leaves one digit and carries the rest." },
  { rung: 8, text: "Count the 1s in this column: one 1 gives 1; two give 0 carry 1; three give 1 carry 1." },
  { rung: 9, text: "{aBit} + {bBit} + {carryIn}: write {sum}, carry {carryOut}." },
];

const lastCarryHints: HintInput[] = [
  { rung: 2, text: "Not yet. This last step has no bits of its own." },
  { rung: 3, text: "Look at the carry that came out of the leftmost column." },
  { rung: 5, text: "That carry becomes the leftmost bit of the sum.", focus: "add-result", highlight: "add-result" },
  { rung: 9, text: "Bring the carry down: the leftmost bit is {sum}." },
];

const additionMisconceptions: VariantInput["misconceptions"] = [
  { id: "add.wrote-two", title: "Wrote 2 or 3 in a column", nudgeKey: "add.wrote-two", detect: { type: "addition-wrote-two" } },
  { id: "add.carry-ignored", title: "Carry not added in", nudgeKey: "add.carry-ignored", detect: { type: "addition-carry-ignored" } },
  { id: "add.swapped", title: "Sum and carry swapped", nudgeKey: "add.swapped", detect: { type: "addition-swapped" } },
];

/** One prediction per column, then the end carry unless it is dropped (owner rule: every step a goal). */
function additionWalk(a: string, b: string, endCarry = true): ExplanationInput {
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

function additionVariant(a: string, b: string, prompt: string): VariantInput {
  return {
    id: `v${a}`,
    prompt,
    spec: { kind: "column-addition", a, b, answer: additionResult(a, b) },
    vars: { a, b, result: additionResult(a, b) },
    hints: columnHints,
    hintsByStep: { column: columnHints, carry: lastCarryHints },
    misconceptions: additionMisconceptions,
    explanation: additionWalk(a, b),
  };
}

/* ---------- Q3: check in decimal, one number at a time (pedagogy on #38) ---------- */

const checkHints: HintInput[] = [
  { rung: 2, text: "Not yet. Each bit has a weight: 1, 2, 4, 8, 16, … from the right." },
  { rung: 3, text: "Add the weights of the bits that are 1. A 0 adds nothing." },
  { rung: 4, text: "Which weights sit under the 1s in {checkBits}?" },
  { rung: 5, text: "Find {checkBits} in the finished addition.", focus: "add-result", highlight: "add-result" },
  { rung: 8, text: "The leftmost 1 is worth {topWeight}. Add the others to it." },
  { rung: 9, text: "{checkBits} = {checkSum} = {checkValue}." },
];

function weightSum(bits: string): string {
  return [...bits].map((d, i) => (d === "1" ? 2 ** (bits.length - 1 - i) : 0)).filter(Boolean).join(" + ");
}

function checkVariant(a: string, b: string, which: "a" | "b" | "sum"): VariantInput {
  const bits = which === "a" ? a : which === "b" ? b : additionResult(a, b);
  const value = parseInt(bits, 2);
  const reversed = parseInt([...bits].reverse().join(""), 2);
  const misconceptions: VariantInput["misconceptions"] = [{ id: "ba.copied-bits", title: "Copied the bits", nudgeKey: "ba.copied-bits", detect: { type: "equals", value: bits.replace(/^0+(?=.)/, "") } }];
  if (reversed !== value) misconceptions.push({ id: "ba.weights-reversed", title: "Weights from the wrong end", nudgeKey: "ba.weights-reversed", detect: { type: "equals", value: String(reversed) } });
  const [x, y, s] = [parseInt(a, 2), parseInt(b, 2), parseInt(additionResult(a, b), 2)];
  const done = which === "sum" ? `${x} + ${y} = ${s}. The binary sum checks out.` : undefined;
  return {
    id: `v${a}`,
    prompt: which === "sum" ? `Last check: what is the sum ${bits} in decimal?` : `Check the addition in decimal. What is ${bits} in decimal?`,
    spec: { kind: "numeric", base: 10, answer: String(value), context: { type: "addition", operands: { a, b } } },
    vars: { checkBits: bits, checkValue: value, checkSum: weightSum(bits), topWeight: 2 ** (bits.replace(/^0+/, "").length - 1) },
    hints: checkHints,
    misconceptions,
    reactions: done ? { correct: done, correctAfterHints: done } : undefined,
    explanation: [
      { id: "s1", say: "Each bit has a weight: 1, 2, 4, 8, 16, … from the right. Add the weights of the 1s." },
      {
        id: "s2",
        say: `Look at ${bits}.`,
        // Distractor: weights read from the wrong end, or (when that reads the same) weights starting at 2.
        ask: { prompt: `Which weights are switched on in ${bits}?`, options: [weightSum(bits), reversed !== value ? weightSum([...bits].reverse().join("")) : weightSum(bits + "0")], correctIndex: 0, afterCorrect: `Yes: ${weightSum(bits)} = ${value}.`, afterWrong: `Read the weights from the right: ${weightSum(bits)} = ${value}.` },
      },
    ],
  };
}

/* ---------- 1's and 2's complement (#39): flip, concept check, then + 1 column by column ---------- */

const onesHints: HintInput[] = [
  { rung: 2, text: "Not yet. Check each bit against the one above it." },
  { rung: 3, text: "The 1's complement flips every bit: a 1 becomes 0 and a 0 becomes 1." },
  { rung: 4, text: "Look at the first bit of {bits}. What does it become?" },
  { rung: 5, text: "Work from the left, one cell at a time.", focus: "bit-row", highlight: "bit-row" },
  { rung: 6, text: "Nothing is added or moved: each answer cell is the opposite of the bit above it." },
  { rung: 7, text: "Like a light switch for every bit: on becomes off, off becomes on." },
  { rung: 8, text: "Write the opposite under each bit, left to right, until all {width} cells are filled." },
  { rung: 9, text: "The 1's complement of {bits} is {ones}." },
];

const ruleHints: HintInput[] = [
  { rung: 2, text: "Not yet. The 2's complement starts from the 1's complement." },
  { rung: 3, text: "First flip every bit (1's complement), then add one more step." },
  { rung: 9, text: "2's complement = 1's complement + 1." },
];

function complementVars(bits: string) {
  const ones = complementBits(bits);
  const twos = additionResult(ones, "1".padStart(bits.length, "0"), false);
  // `value` names the number set, so later challenges follow the one the student worked on (#141).
  return { value: parseInt(bits, 2), bits, ones, twos, width: bits.length };
}

/** One prediction per bit (owner rule: every step a goal). */
function flipWalk(bits: string): ExplanationInput {
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

function onesVariant(bits: string, id = `v${bits}`): VariantInput {
  const v = complementVars(bits);
  return {
    id,
    prompt: "Write the 1's complement of {bits}: change each 1 to 0 and each 0 to 1.",
    spec: { kind: "numeric", base: 2, answer: v.ones, context: { type: "bit-row", bits } },
    vars: v,
    hints: onesHints,
    misconceptions: [
      { id: "c1.copied", title: "Copied the bits unchanged", nudgeKey: "c1.copied", detect: { type: "equals", value: bits } },
      { id: "c1.gave-twos", title: "Gave the 2's complement", nudgeKey: "c1.gave-twos", detect: { type: "equals", value: v.twos } },
      { id: "c1.first-wrong-bit", title: "A bit not flipped", nudgeKey: "c1.first-wrong-bit", detect: { type: "first-wrong-bit" } },
    ],
    explanation: flipWalk(bits),
  };
}

function ruleVariant2s(bits: string): VariantInput {
  const v = complementVars(bits);
  return {
    id: `v${bits}`,
    prompt: "The 1's complement of {bits} is {ones}. How do you get the 2's complement?",
    spec: {
      kind: "multiple-choice",
      options: [
        { id: "add-one", text: "Add 1 to the 1's complement" },
        { id: "add-original", text: "Add 1 to the original number" },
        { id: "flip-again", text: "Flip the bits again" },
        { id: "minus-one", text: "Subtract 1 from the 1's complement" },
      ],
      correctOptionId: "add-one",
    },
    vars: v,
    hints: ruleHints,
    explanation: [
      { id: "s1", say: "There are two complements. The 1's complement flips every bit." },
      {
        id: "s2",
        say: "The 2's complement goes one step further, starting from the 1's complement.",
        ask: { prompt: "Which number do we add 1 to?", options: ["The 1's complement", "The original number"], correctIndex: 0, afterCorrect: "Yes: 2's complement = 1's complement + 1.", afterWrong: "We add 1 to the 1's complement: 2's complement = 1's complement + 1." },
      },
    ],
  };
}

function plusOneVariant(bits: string, id = `v${bits}`): VariantInput {
  const v = complementVars(bits);
  const one = "1".padStart(bits.length, "0");
  const done = `So the 2's complement of ${bits} is ${v.twos}.`;
  return {
    id,
    prompt: `Add 1 to the 1's complement, one column at a time: ${v.ones} + ${one}.`,
    // A complement keeps its width, so there is no end-carry step (Pedagogy on #150).
    spec: { kind: "column-addition", a: v.ones, b: one, answer: v.twos, endCarry: "drop" },
    vars: v,
    hints: columnHints,
    hintsByStep: { column: columnHints, carry: lastCarryHints },
    misconceptions: additionMisconceptions,
    reactions: { correct: done, correctAfterHints: done },
    explanation: additionWalk(v.ones, one, false),
  };
}

const COMPLEMENT_SETS = ["100101", "110010"]; // the two slide examples: walk one, retry the other

const complementsActivity: TopicInput["activities"][number] = {
  id: "complements",
  title: "1's and 2's complement",
  summary: "Flip every bit for the 1's complement, then add 1 for the 2's complement.",
  authority: "DEMO",
  minutes: 10,
  questions: [
    { id: "ba.q.ones", label: "1's complement", conceptId: "ba.complement", objectiveId: "ba.obj.ones", variants: COMPLEMENT_SETS.map((b) => onesVariant(b)) },
    { id: "ba.q.twos-rule", label: "2's rule", conceptId: "ba.complement", objectiveId: "ba.obj.twos", variants: COMPLEMENT_SETS.map(ruleVariant2s) },
    { id: "ba.q.plus-one", label: "Add 1", conceptId: "ba.complement", objectiveId: "ba.obj.twos", variants: COMPLEMENT_SETS.map((b) => plusOneVariant(b)) },
  ],
};

/* ---------- Subtraction by 2's complement, positive results (#40): A − B = A + 2's complement of B ---------- */

interface SubtractionSet {
  id: string;
  a: number;
  b: number;
}

/** Bit strings for A − B at a fixed width: B, its complements, A + 2's complement, and the result. */
function subtractionBits({ a, b }: SubtractionSet, width = 4) {
  const A = a.toString(2).padStart(width, "0");
  const B = b.toString(2).padStart(width, "0");
  const twos = additionResult(complementBits(B), "1".padStart(width, "0"), false);
  const sum = additionResult(A, twos);
  const result = sum.slice(1);
  // No end carry: negative, and the size is the 2's complement of the four sum bits (#41).
  const magnitude = additionResult(complementBits(result), "1".padStart(width, "0"), false);
  return { A, B, twos, sum, result, endCarry: sum[0], magnitude };
}

const endCarryHints: HintInput[] = [
  { rung: 2, text: "Not yet. Look at the leftmost bit of the sum: the end carry." },
  { rung: 3, text: "In A − B by 2's complement, an end carry of 1 means positive: discard it. No end carry means negative." },
  { rung: 6, text: "A negative result is stored as a 2's complement: complement the four sum bits again to read its size." },
  { rung: 9, text: "Read the end carry: 1 means positive (discard it); 0 means negative (re-complement the sum bits)." },
];

const resultHints: HintInput[] = [
  { rung: 2, text: "Not yet. Leave out the end carry, then read the remaining bits." },
  { rung: 3, text: "The weights are 8, 4, 2, 1 from the left of the four bits." },
  { rung: 9, text: "{resultBits} = {resultValue}, and {a} − {b} = {resultValue}." },
];

function subtractionVars(set: SubtractionSet) {
  const s = subtractionBits(set);
  // `value` is B: it names the number set across the practice (#141) and drives the B-in-binary steps.
  return { value: set.b, a: set.a, b: set.b, aBits: s.A, bBits: s.B, twos: s.twos, sumBits: s.sum, resultBits: s.result, resultValue: parseInt(s.result, 2) };
}

function addTwosVariant(set: SubtractionSet): VariantInput {
  const s = subtractionBits(set);
  return {
    id: set.id,
    prompt: `Now add A and the 2's complement of B, one column at a time: ${s.A} + ${s.twos}.`,
    spec: { kind: "column-addition", a: s.A, b: s.twos, answer: s.sum },
    vars: subtractionVars(set),
    hints: columnHints,
    hintsByStep: { column: columnHints, carry: lastCarryHints },
    misconceptions: additionMisconceptions,
    explanation: additionWalk(s.A, s.twos),
  };
}

function endCarryVariant(set: SubtractionSet): VariantInput {
  const s = subtractionBits(set);
  const positive = s.endCarry === "1";
  return {
    id: set.id,
    prompt: `${s.A} + ${s.twos} = ${s.sum}. The end carry is ${s.endCarry}. What does it tell you?`,
    spec: {
      kind: "multiple-choice",
      options: [
        { id: "positive", text: "The result is positive: discard the carry", misconceptionId: positive ? undefined : "sub.missed-negative" },
        { id: "keep", text: `Keep the carry: the answer is ${s.sum}`, misconceptionId: "sub.kept-carry" },
        { id: "negative", text: "The result is negative: take the 2's complement of the sum for its size" },
      ],
      correctOptionId: positive ? "positive" : "negative",
      context: { type: "addition", operands: { a: s.A, b: s.twos } },
    },
    vars: subtractionVars(set),
    hints: endCarryHints,
    misconceptions: [
      { id: "sub.kept-carry", title: "Kept the end carry", nudgeKey: "sub.kept-carry", detect: { type: "option", optionId: "keep" } },
      ...(positive ? [] : [{ id: "sub.missed-negative", title: "Read a negative result as positive", nudgeKey: "sub.missed-negative", detect: { type: "option" as const, optionId: "positive" } }]),
    ],
    explanation: [
      { id: "s1", say: "We added A and the 2's complement of B. The sum has one more bit than the numbers: the end carry." },
      {
        id: "s2",
        say: `Here the end carry is ${s.endCarry}.`,
        ask: positive
          ? { prompt: "An end carry of 1 means the result is…", options: ["Positive: discard the carry", "Negative"], correctIndex: 0, afterCorrect: "Yes. Discard it and keep the other four bits.", afterWrong: "An end carry of 1 means positive. Discard it and keep the other four bits." }
          : { prompt: "No end carry (0) means the result is…", options: ["Positive", "Negative: re-complement for its size"], correctIndex: 1, afterCorrect: "Yes. The four bits are the 2's complement of the answer, so we complement them again.", afterWrong: "No end carry means negative. The four bits are the 2's complement of the answer, so we complement them again." },
      },
    ],
  };
}

function resultVariant(set: SubtractionSet): VariantInput {
  const s = subtractionBits(set);
  const v = subtractionVars(set);
  const done = `${set.a} − ${set.b} = ${v.resultValue}. The subtraction checks out.`;
  return {
    id: set.id,
    prompt: `Discard the end carry. What is ${s.result} in decimal?`,
    spec: { kind: "numeric", base: 10, answer: String(v.resultValue), context: { type: "addition", operands: { a: s.A, b: s.twos } } },
    vars: v,
    hints: resultHints,
    misconceptions: [
      { id: "sub.kept-carry", title: "Kept the end carry", nudgeKey: "sub.kept-carry", detect: { type: "equals", value: String(parseInt(s.sum, 2)) } },
      { id: "ba.copied-bits", title: "Copied the bits", nudgeKey: "ba.copied-bits", detect: { type: "equals", value: s.result.replace(/^0+(?=.)/, "") } },
    ],
    reactions: { correct: done, correctAfterHints: done },
    explanation: [
      { id: "s1", say: `Without the end carry the bits are ${s.result}. The weights are 8, 4, 2, 1.` },
      {
        id: "s2",
        say: `Look at ${s.result}.`,
        ask: { prompt: `Which weights are switched on in ${s.result}?`, options: [weightSum(s.result), weightSum(s.sum)], correctIndex: 0, afterCorrect: `Yes: ${weightSum(s.result)} = ${v.resultValue}.`, afterWrong: `Leave out the end carry: ${weightSum(s.result)} = ${v.resultValue}.` },
      },
    ],
  };
}

const SUBTRACTION_SETS: SubtractionSet[] = [
  { id: "v13-9", a: 13, b: 9 }, // the slide example
  { id: "v12-6", a: 12, b: 6 },
];

const subtractionActivity: TopicInput["activities"][number] = {
  id: "subtraction-positive",
  title: "Subtraction by 2's complement",
  summary: "A − B = A + the 2's complement of B: one small step at a time, for a positive result.",
  authority: "DEMO",
  minutes: 15,
  questions: [
    {
      id: "sub.q.divide",
      label: "B: divide by 2",
      conceptId: "ba.subtraction",
      objectiveId: "ba.obj.subtract",
      variants: SUBTRACTION_SETS.map((s) => divideVariant(s.b, `${s.a} − ${s.b}: first write B = ({value})₁₀ in binary. Divide by 2, one step at a time.`, s.id)),
    },
    { id: "sub.q.read", label: "B: read off", conceptId: "ba.subtraction", objectiveId: "ba.obj.subtract", variants: SUBTRACTION_SETS.map((s) => readVariant(s.b, s.id)) },
    { id: "sub.q.ones", label: "1's complement", conceptId: "ba.subtraction", objectiveId: "ba.obj.subtract", variants: SUBTRACTION_SETS.map((s) => onesVariant(subtractionBits(s).B, s.id)) },
    { id: "sub.q.plus-one", label: "Add 1", conceptId: "ba.subtraction", objectiveId: "ba.obj.subtract", variants: SUBTRACTION_SETS.map((s) => plusOneVariant(subtractionBits(s).B, s.id)) },
    { id: "sub.q.add", label: "A + 2's complement", conceptId: "ba.subtraction", objectiveId: "ba.obj.subtract", variants: SUBTRACTION_SETS.map(addTwosVariant) },
    { id: "sub.q.end-carry", label: "End carry", conceptId: "ba.subtraction", objectiveId: "ba.obj.subtract", variants: SUBTRACTION_SETS.map(endCarryVariant) },
    { id: "sub.q.result", label: "Result", conceptId: "ba.subtraction", objectiveId: "ba.obj.subtract", variants: SUBTRACTION_SETS.map(resultVariant) },
  ],
};

/* ---------- Subtraction exercises (#41): 15 − 4 (positive) and 10 − 14 (negative), no worked example first ---------- */

/** A complement step inside a subtraction: names A and B up front and keeps the practice's number set (#141). */
function inSubtraction(variant: VariantInput, set: SubtractionSet, lead: string): VariantInput {
  return { ...variant, id: set.id, prompt: `${lead} ${variant.prompt}`, vars: { ...variant.vars, value: set.b } };
}

function setLead(set: SubtractionSet): string {
  const s = subtractionBits(set);
  return `${set.a} − ${set.b}, with A = ${s.A} and B = ${s.B}.`;
}

/** Negative result: the size is the 2's complement of the four sum bits. */
function magnitudeVariant(set: SubtractionSet): VariantInput {
  const s = subtractionBits(set);
  const size = parseInt(s.magnitude, 2);
  const done = `${set.a} − ${set.b} = −${size}. The subtraction checks out.`;
  return {
    id: set.id,
    prompt: `The result is negative and its size is ${s.magnitude}. What is ${s.magnitude} in decimal?`,
    spec: { kind: "numeric", base: 10, answer: String(size), context: { type: "addition", operands: { a: complementBits(s.result), b: "0001", endCarry: "drop" } } },
    vars: subtractionVars(set),
    hints: [
      { rung: 2, text: "Not yet. Read the re-complemented bits, not the sum bits." },
      { rung: 3, text: "The weights are 8, 4, 2, 1 from the left of the four bits." },
      { rung: 9, text: `${s.magnitude} = ${size}, so ${set.a} − ${set.b} = −${size}.` },
    ],
    misconceptions: [
      { id: "sub.missed-negative", title: "Read the sum bits as the answer", nudgeKey: "sub.missed-negative", detect: { type: "equals", value: String(parseInt(s.result, 2)) } },
      { id: "ba.copied-bits", title: "Copied the bits", nudgeKey: "ba.copied-bits", detect: { type: "equals", value: s.magnitude.replace(/^0+(?=.)/, "") } },
    ],
    reactions: { correct: done, correctAfterHints: done },
    explanation: [
      { id: "s1", say: `Re-complementing ${s.result} gave ${s.magnitude}. The weights are 8, 4, 2, 1.` },
      {
        id: "s2",
        say: `Look at ${s.magnitude}.`,
        ask: { prompt: `Which weights are switched on in ${s.magnitude}?`, options: [weightSum(s.magnitude), weightSum(s.result)], correctIndex: 0, afterCorrect: `Yes: ${weightSum(s.magnitude)} = ${size}, so the answer is −${size}.`, afterWrong: `Use the re-complemented bits: ${weightSum(s.magnitude)} = ${size}, so the answer is −${size}.` },
      },
    ],
  };
}

const POSITIVE_EXERCISE: SubtractionSet[] = [
  { id: "v15-4", a: 15, b: 4 }, // slide exercise
  { id: "v14-5", a: 14, b: 5 },
];
const NEGATIVE_EXERCISE: SubtractionSet[] = [
  { id: "v10-14", a: 10, b: 14 }, // slide exercise
  { id: "v7-12", a: 7, b: 12 },
];

const complementSteps = (sets: SubtractionSet[], prefix: string): TopicInput["activities"][number]["questions"] => [
  { id: `${prefix}.q.ones`, label: "1's complement of B", conceptId: "ba.subtraction", objectiveId: "ba.obj.subtract", variants: sets.map((s) => inSubtraction(onesVariant(subtractionBits(s).B), s, setLead(s))) },
  { id: `${prefix}.q.plus-one`, label: "Add 1", conceptId: "ba.subtraction", objectiveId: "ba.obj.subtract", variants: sets.map((s) => inSubtraction(plusOneVariant(subtractionBits(s).B), s, `${s.a} − ${s.b}.`)) },
  { id: `${prefix}.q.add`, label: "A + 2's complement", conceptId: "ba.subtraction", objectiveId: "ba.obj.subtract", variants: sets.map(addTwosVariant) },
  { id: `${prefix}.q.end-carry`, label: "End carry", conceptId: "ba.subtraction", objectiveId: "ba.obj.subtract", variants: sets.map(endCarryVariant) },
];

const subtractionExercisePositive: TopicInput["activities"][number] = {
  id: "subtraction-exercise-positive",
  title: "Exercise: 15 − 4",
  summary: "Subtract by adding the 2's complement, on your own: the end carry tells you the sign.",
  authority: "DEMO",
  minutes: 10,
  questions: [
    ...complementSteps(POSITIVE_EXERCISE, "subx"),
    { id: "subx.q.result", label: "Result", conceptId: "ba.subtraction", objectiveId: "ba.obj.subtract", variants: POSITIVE_EXERCISE.map(resultVariant) },
  ],
};

const subtractionExerciseNegative: TopicInput["activities"][number] = {
  id: "subtraction-exercise-negative",
  title: "Exercise: 10 − 14",
  summary: "A smaller number minus a larger one: no end carry, so the result is negative.",
  authority: "DEMO",
  minutes: 12,
  questions: [
    ...complementSteps(NEGATIVE_EXERCISE, "subn"),
    {
      id: "subn.q.re-ones",
      label: "Re-complement: flip",
      conceptId: "ba.subtraction",
      objectiveId: "ba.obj.negative",
      variants: NEGATIVE_EXERCISE.map((s) => inSubtraction(onesVariant(subtractionBits(s).result), s, `The result is negative. Find its size from the sum bits ${subtractionBits(s).result}.`)),
    },
    {
      id: "subn.q.re-plus-one",
      label: "Re-complement: add 1",
      conceptId: "ba.subtraction",
      objectiveId: "ba.obj.negative",
      variants: NEGATIVE_EXERCISE.map((s) => inSubtraction(plusOneVariant(subtractionBits(s).result), s, "Finish the re-complement.")),
    },
    { id: "subn.q.size", label: "Result", conceptId: "ba.subtraction", objectiveId: "ba.obj.negative", variants: NEGATIVE_EXERCISE.map(magnitudeVariant) },
  ],
};

/* ---------- topic ---------- */

const SLIDE: [string, string] = ["1101", "0111"];
const RETRY: [string, string] = ["1011", "0110"];

export const binaryArithmeticTopic: TopicInput = {
  id: "binary-arithmetic",
  title: "Binary arithmetic",
  summary: "Add binary numbers one column at a time, then check the result in decimal.",
  preview: "1000 + 1000 → 10000",
  concepts: [
    { id: "ba.rules", title: "Single-bit addition", summary: "0 + 0 = 0, 0 + 1 = 1, 1 + 1 = 10 (write 0, carry 1)." },
    { id: "ba.columns", title: "Column addition", summary: "Add from the right, one column at a time, carrying 1 into the next column." },
    { id: "ba.check", title: "Checking in decimal", summary: "Convert both numbers and the sum to decimal; the decimal sum must match." },
    { id: "ba.complement", title: "1's and 2's complement", summary: "The 1's complement flips every bit; the 2's complement is the 1's complement + 1." },
    { id: "ba.subtraction", title: "Subtraction by 2's complement", summary: "A − B = A + the 2's complement of B. An end carry of 1 means a positive result: discard it." },
  ],
  objectives: [
    { id: "ba.obj.rules", conceptId: "ba.rules", text: "State the sum and carry for any two bits." },
    { id: "ba.obj.columns", conceptId: "ba.columns", text: "Add two 4-bit numbers one column at a time, including the end carry." },
    { id: "ba.obj.check", conceptId: "ba.check", text: "Check a binary sum by converting each number to decimal." },
    { id: "ba.obj.ones", conceptId: "ba.complement", text: "Write the 1's complement of a binary number." },
    { id: "ba.obj.twos", conceptId: "ba.complement", text: "Form the 2's complement by adding 1 to the 1's complement, one column at a time." },
    { id: "ba.obj.subtract", conceptId: "ba.subtraction", text: "Subtract by adding the 2's complement, and read a positive result after discarding the end carry." },
    { id: "ba.obj.negative", conceptId: "ba.subtraction", text: "Recognise a negative result (no end carry) and find its size by re-complementing." },
  ],
  activities: [
    {
      id: "binary-addition",
      title: "Binary addition",
      summary: "The four rules, then 1101 + 0111 column by column, then a check in decimal.",
      authority: "DEMO",
      minutes: 12,
      questions: [
        ...rulesQuestions,
        {
          id: "ba.q.add",
          label: "Column by column",
          conceptId: "ba.columns",
          objectiveId: "ba.obj.columns",
          variants: [
            additionVariant(...SLIDE, "Add 1101 + 0111 one column at a time, starting from the right. Write the bit under the line and the carry above the next column."),
            additionVariant(...RETRY, "Another one: add 1011 + 0110 one column at a time, from the right."),
          ],
        },
        { id: "ba.q.check-a", label: "First number", conceptId: "ba.check", objectiveId: "ba.obj.check", variants: [checkVariant(...SLIDE, "a"), checkVariant(...RETRY, "a")] },
        { id: "ba.q.check-b", label: "Second number", conceptId: "ba.check", objectiveId: "ba.obj.check", variants: [checkVariant(...SLIDE, "b"), checkVariant(...RETRY, "b")] },
        { id: "ba.q.check-sum", label: "The sum", conceptId: "ba.check", objectiveId: "ba.obj.check", variants: [checkVariant(...SLIDE, "sum"), checkVariant(...RETRY, "sum")] },
      ],
    },
    complementsActivity,
    subtractionActivity,
    subtractionExercisePositive,
    subtractionExerciseNegative,
  ],
};
