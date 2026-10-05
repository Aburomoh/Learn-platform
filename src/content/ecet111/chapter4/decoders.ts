/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 4, decoders and encoders (#305, #306, content pack ch4 §3–4): predict one output of a
 * 3-to-8 decoder, read each output as its minterm, fill decoder columns; then the 8-to-3 encoder's
 * code for one active input and the OR behind each output bit; then functions built from a decoder. Truth is computed (Boolean module).
 */
import type { CourseInput, VariantInput } from "../../schema";
import { parseSigma } from "../../boolean";

type TopicInput = CourseInput["modules"][number]["topics"][number];
type Activity = TopicInput["activities"][number];

const VARS = ["x", "y", "z"];
const bits = (k: number) => k.toString(2).padStart(3, "0");
const reversed = (k: number) => parseInt([...bits(k)].reverse().join(""), 2);
const spaced = (k: number) => bits(k).split("").join(" ");
/** Minterm k over x, y, z in course notation: 6 → xyz′. */
const minterm = (k: number) => VARS.map((v, i) => (bits(k)[i] === "1" ? v : `${v}'`)).join("");
const show = (t: string) => t.replace(/'/g, "′");

function rotate<T>(xs: T[], k: number): T[] {
  const r = k % xs.length;
  return [...xs.slice(r), ...xs.slice(0, r)];
}

/** The device kind's slips: the code read backwards (the given nudge) and lines counted from 1. */
const deviceMisconceptions = (reversedKey: string): VariantInput["misconceptions"] => [
  { id: reversedKey, title: "Read the code backwards", nudgeKey: reversedKey, detect: { type: "code-reversed" } },
  { id: "dev.counted-from-one", title: "Counted the lines from 1", nudgeKey: "dev.counted-from-one", detect: { type: "counted-from-one" } },
];

/* ---------- decoder ---------- */

/** Non-palindromic codes, so reading the bits backwards is always a different output. */
const DEC_SETS = [6, 3, 4];

/** On the device view (#381): the decoder drawn with its input code; the student picks the active output line. */
function predictVariant(k: number, set: number): VariantInput {
  return {
    id: `v${k}`,
    prompt: `A 3-to-8 decoder has inputs x y z = ${spaced(k)} (x is the MSB). Which output is 1?`,
    spec: { kind: "device", device: "decoder", bits: 3, asks: [k] },
    hints: [
      { rung: 2, text: "Not yet. A decoder makes exactly one output 1: the one numbered by the input." },
      { rung: 3, text: "Read x y z as a binary number, x first." },
      { rung: 4, text: `What is ${bits(k)} in decimal?` },
      { rung: 9, text: `${bits(k)} is ${k}, so D${k} = 1 and every other output is 0.` },
    ],
    misconceptions: deviceMisconceptions("dec.read-reversed"),
    explanation: [
      { id: "s1", say: "A decoder turns an input code into one active output: input number k makes Dk = 1, all others 0.", stage: { ask: 0 } },
      {
        id: "s2",
        say: `The inputs read ${bits(k)}, with x as the MSB.`,
        stage: { ask: 0 },
        ask: { prompt: `${bits(k)} in decimal is…`, options: set % 2 ? [String(reversed(k)), String(k)] : [String(k), String(reversed(k))], correctIndex: set % 2, afterCorrect: `Yes, ${k}.`, afterWrong: `x is the MSB: ${bits(k)} is ${k}.` },
      },
      { id: "s3", say: `So D${k} is the only output at 1.`, stage: { ask: 0, answer: true } },
    ],
  };
}

function mintermVariant(k: number, set: number): VariantInput {
  // the prediction asks about a 0-letter or a 1-letter, alternating by set
  const probe = set % 2 ? bits(k).indexOf("1") : bits(k).indexOf("0");
  const primed = bits(k)[probe] === "0";
  return {
    id: `v${k}`,
    prompt: `D${k} is 1 only for x y z = ${spaced(k)}. Write D${k} as one product of x, y and z.`,
    spec: { kind: "expression", vars: VARS, minterms: [k], form: "minterms" },
    // the prompt already gives the code; the figure puts it on the inputs and points at Dk (#454)
    figure: { type: "device", device: "decoder", bits: 3, given: k, focus: `D${k}` },
    hints: [
      { rung: 2, text: `Not yet. D${k} is the minterm that is 1 only on the row ${bits(k)}.` },
      { rung: 3, text: "Use every letter once: a 1 gives the plain letter, a 0 the primed one." },
      { rung: 4, text: `In ${bits(k)}, which letters are 0?` },
      { rung: 9, text: `D${k} = ${show(minterm(k))}.` },
    ],
    misconceptions: [
      { id: "ex.complement", title: "Primed the 1s instead of the 0s", nudgeKey: "sp.zero-rows", detect: { type: "expression-complement" } },
      { id: "ex.unreadable", title: "Unreadable", nudgeKey: "expr.unreadable", detect: { type: "expression-unreadable" } },
    ],
    explanation: [
      { id: "s1", say: "Each decoder output is one minterm of its inputs: Dk is mk." },
      {
        id: "s2",
        say: `For ${bits(k)}, a 0 gives a primed letter.`,
        ask: { prompt: `Is ${VARS[probe]} primed in D${k}?`, options: ["Yes", "No"], correctIndex: primed ? 0 : 1, afterCorrect: `Right: it is ${primed ? 0 : 1} on that row.`, afterWrong: `It is ${primed ? 0 : 1} on that row, so it is ${primed ? "" : "not "}primed.` },
      },
      { id: "s3", say: `D${k} = ${show(minterm(k))}.` },
    ],
  };
}

/** Two decoder columns to fill per set; the other six are shown. */
const TABLE_SETS: [string, number[]][] = [["vt1", [1, 4]], ["vt2", [2, 7]], ["vt3", [5, 0]]];

function tableVariant(id: string, asked: number[], set: number): VariantInput {
  const slip = bits(reversed(asked[0]) === asked[0] ? (asked[0] + 1) % 8 : reversed(asked[0]));
  const rowChoices = set % 2 ? [slip, bits(asked[0])] : [bits(asked[0]), slip];
  return {
    id,
    prompt: `Here is the 3-to-8 decoder's table. Fill the ${asked.map((k) => `D${k}`).join(" and ")} columns.`,
    spec: {
      kind: "truth-table",
      inputs: VARS,
      columns: Array.from({ length: 8 }, (_, k) => ({ id: `d${k}`, label: `D${k}`, expr: minterm(k), given: !asked.includes(k) })),
    },
    // the decoder on a shown column's code, never an asked one (#454)
    figure: { type: "device", device: "decoder", bits: 3, given: [0, 1, 2, 3, 4, 5, 6, 7].find((k) => !asked.includes(k) && k !== reversed(asked[0]))! },
    hints: [
      { rung: 2, text: "Not yet. Each output column has exactly one 1." },
      { rung: 3, text: "{columnLabel} is 1 on the row whose number is its index, and 0 everywhere else." },
      { rung: 4, text: "Look at the columns already shown: where does each one's 1 sit?" },
      { rung: 9, text: "The 1 of Dk sits on row k, counting the rows from 0." },
    ],
    misconceptions: [],
    explanation: [
      { id: "s1", say: "On each row exactly one output is 1: the one numbered by x y z.", stage: { step: 0, revealed: 0 } },
      {
        id: "s2",
        say: `Find the row for D${asked[0]}.`,
        stage: { step: 0, revealed: asked[0] },
        ask: { prompt: `Which row has D${asked[0]} = 1?`, options: rowChoices, correctIndex: set % 2, afterCorrect: "Yes.", afterWrong: `Row ${bits(asked[0])}, number ${asked[0]}.` },
      },
      { id: "s3", say: "Every other cell in that column is 0.", stage: { step: 0, revealed: 8 } },
    ],
  };
}

/* ---------- encoder ---------- */

const ENC_SETS = [6, 1, 3];

/** On the device view (#381): the encoder drawn with one active input; the student picks the output code. */
function codeVariant(k: number, set: number): VariantInput {
  return {
    id: `e${k}`,
    prompt: `An 8-to-3 encoder: only I${k} is 1. What code x y z comes out (x is the MSB)?`,
    spec: { kind: "device", device: "encoder", bits: 3, asks: [k] },
    hints: [
      { rung: 2, text: "Not yet. An encoder does the reverse of a decoder: it writes the number of the active input." },
      { rung: 3, text: `Write ${k} as three bits, x first.` },
      { rung: 9, text: `I${k} gives ${bits(k)}.` },
    ],
    misconceptions: deviceMisconceptions("enc.code-reversed"),
    explanation: [
      { id: "s1", say: "An encoder has one active input; its output is that input's number in binary.", stage: { ask: 0 } },
      {
        id: "s2",
        say: `I${k} is the active input.`,
        stage: { ask: 0 },
        ask: { prompt: `${k} in three bits is…`, options: set % 2 ? [bits(reversed(k)), bits(k)] : [bits(k), bits(reversed(k))], correctIndex: set % 2, afterCorrect: "Yes.", afterWrong: `${k} = ${bits(k)}, x first.` },
      },
      { id: "s3", say: `So x y z = ${spaced(k)}.`, stage: { ask: 0, answer: true } },
    ],
  };
}

/** Which inputs each output bit's OR collects: the k whose code has that bit set. */
const orOf = (bit: number) => [0, 1, 2, 3, 4, 5, 6, 7].filter((k) => bits(k)[bit] === "1");
const orText = (ks: number[]) => ks.map((k) => `I${k}`).join(" + ");

function orVariant(bit: number, set: number): VariantInput {
  const name = VARS[bit];
  const choices = [
    { id: "x", text: orText(orOf(0)) },
    { id: "y", text: orText(orOf(1)) },
    { id: "z", text: orText(orOf(2)) },
    { id: "low", text: orText([0, 1, 2, 3]) },
  ];
  const mirror = VARS[2 - bit];
  return {
    id: `o${name}`,
    prompt: `Inside the 8-to-3 encoder each output bit is one OR gate. Which inputs does the OR for ${name} collect?`,
    spec: { kind: "multiple-choice", options: rotate(choices, set + 1), correctOptionId: name },
    // the encoder with the pack's I6 active, the asked output bit in focus (#454)
    figure: { type: "device", device: "encoder", bits: 3, given: 6, focus: name },
    hints: [
      { rung: 2, text: `Not yet. ${name} must be 1 for every input whose code has ${name} = 1.` },
      { rung: 3, text: "Write the codes 0 to 7 in binary and look at one bit position." },
      { rung: 9, text: `${name} = ${orText(orOf(bit))}.` },
    ],
    misconceptions: mirror !== name ? [{ id: "enc.or-reversed", title: "Read the other end of the code", nudgeKey: "enc.or-reversed", detect: { type: "option", optionId: mirror } }] : [],
    explanation: [
      { id: "s1", say: `${name} is 1 exactly when the active input's code has a 1 in ${name}'s place.` },
      {
        id: "s2",
        say: `${name} is bit ${bit + 1} of x y z, counting from the left.`,
        ask: set % 2
          ? { prompt: `Is ${name} = 1 in the code of I0 (000)?`, options: ["Yes", "No"], correctIndex: 1, afterCorrect: "Right: every bit of 000 is 0.", afterWrong: "000 has every bit at 0." }
          : { prompt: `Is ${name} = 1 in the code of I7 (111)?`, options: ["Yes", "No"], correctIndex: 0, afterCorrect: "Yes, every bit of 111 is 1.", afterWrong: "111 has every bit at 1." },
      },
      { id: "s3", say: `The codes with ${name} = 1 are those of ${orText(orOf(bit))}.` },
    ],
  };
}

const decoderActivity: Activity = {
  id: "decoders",
  title: "Decoders",
  summary: "Predict the active output, read each output as a minterm, then fill decoder columns.",
  authority: "DEMO",
  minutes: 12,
  questions: [
    { id: "dc.q.predict", label: "Which output?", conceptId: "dc.decoder", objectiveId: "dc.obj.decoder", variants: DEC_SETS.map((k, i) => predictVariant(k, i)) },
    { id: "dc.q.minterm", label: "Dk as a product", conceptId: "dc.decoder", objectiveId: "dc.obj.decoder", variants: DEC_SETS.map((k, i) => mintermVariant(k, i)) },
    { id: "dc.q.table", label: "Decoder columns", conceptId: "dc.decoder", objectiveId: "dc.obj.decoder", variants: TABLE_SETS.map(([id, asked], i) => tableVariant(id, asked, i)) },
  ],
};

const encoderActivity: Activity = {
  id: "encoders",
  title: "Encoders",
  summary: "The code for one active input, then the OR behind each output bit.",
  authority: "DEMO",
  minutes: 8,
  questions: [
    { id: "dc.q.code", label: "Which code?", conceptId: "dc.encoder", objectiveId: "dc.obj.encoder", variants: ENC_SETS.map((k, i) => codeVariant(k, i)) },
    { id: "dc.q.or", label: "Each bit's OR", conceptId: "dc.encoder", objectiveId: "dc.obj.encoder", variants: [0, 1, 2].map((b, i) => orVariant(b, i)) },
  ],
};

/* ---------- functions with a decoder (#306, pack ch4 §4): one OR per function, fed by its minterms ---------- */

const FN_VARS = ["A", "B", "Ci"];

/** Three functions: the full adder's S and Co (as on s.37), and a fresh one; all as Σ, so the goal is only picking the lines (Pedagogy on #390). */
const FN_SETS: { id: string; name: string; given: string; vars: string[] }[] = [
  { id: "fs", name: "S", given: "Σ(1, 2, 4, 7)", vars: FN_VARS },
  { id: "fco", name: "Co", given: "Σ(3, 5, 6, 7)", vars: FN_VARS },
  { id: "ff", name: "F", given: "Σ(2, 3, 4, 6)", vars: ["A", "B", "C"] },
];

/** The minterms of a set, read from its Σ list. */
function fnMinterms(set: (typeof FN_SETS)[number]): number[] {
  return parseSigma(set.given).minterms;
}

const outputsText = (ks: number[]) => ks.map((k) => `D${k}`).join(", ");

function fnVariant(set: (typeof FN_SETS)[number], i: number): VariantInput {
  const ones = fnMinterms(set);
  const zeros = [0, 1, 2, 3, 4, 5, 6, 7].filter((k) => !ones.includes(k));
  const reversedOnes = [...new Set(ones.map(reversed))].sort((a, b) => a - b);
  const choices = [
    { id: "right", text: outputsText(ones) },
    { id: "zeros", text: outputsText(zeros) },
    { id: "short", text: outputsText(ones.slice(0, -1)) },
    { id: "reversed", text: outputsText(reversedOnes) },
  ].filter((c, j, all) => all.findIndex((d) => d.text === c.text) === j);
  const vars = set.vars.join(", ");
  return {
    id: set.id,
    prompt: `A 3-to-8 decoder takes ${vars} (${set.vars[0]} is the MSB). ${set.name}(${vars}) = ${show(set.given)} is one OR gate fed by decoder outputs. Which outputs?`,
    spec: { kind: "multiple-choice", options: rotate(choices, i + 1), correctOptionId: "right" },
    hints: [
      { rung: 2, text: `Not yet. Each decoder output Dk is minterm k; the OR needs exactly the minterms of ${set.name}.` },
      { rung: 3, text: "The numbers in the Σ list are the outputs to connect." },
      { rung: 4, text: `Is D0 one of ${set.name}'s minterms?` },
      { rung: 9, text: `${set.name} = ${outputsText(ones).replace(/, /g, " + ")}.` },
    ],
    misconceptions: [
      { id: "dec.fn-zero-rows", title: "Connected the 0-rows", nudgeKey: "fa.sigma-zero-rows", detect: { type: "option", optionId: "zeros" } },
      { id: "dec.fn-missed-one", title: "Missed one minterm", nudgeKey: "dec.fn-missed-one", detect: { type: "option", optionId: "short" } },
      ...(choices.some((c) => c.id === "reversed") ? [{ id: "dec.read-reversed", title: "Read the minterm numbers backwards", nudgeKey: "dec.read-reversed", detect: { type: "option" as const, optionId: "reversed" } }] : []),
    ],
    explanation: [
      { id: "s1", say: "A decoder makes every minterm of its inputs, one per output. A function is the OR of its own minterms." },
      {
        id: "s2",
        say: `${set.name} = ${set.given}.`,
        ask: { prompt: `Does ${set.name} use D${ones[0]}?`, options: i % 2 ? ["No", "Yes"] : ["Yes", "No"], correctIndex: i % 2 ? 1 : 0, afterCorrect: `Yes: m${ones[0]} is one of its minterms.`, afterWrong: `m${ones[0]} is one of its minterms, so D${ones[0]} feeds the OR.` },
      },
      { id: "s3", say: `So the OR takes ${outputsText(ones)}; the other outputs are left unconnected.` },
    ],
  };
}

const decoderFunctionsActivity: Activity = {
  id: "decoder-functions",
  title: "Functions with a decoder",
  summary: "One OR gate per function, fed by the decoder outputs of its minterms.",
  authority: "DEMO",
  minutes: 8,
  questions: [{ id: "dc.q.function", label: "Which outputs?", conceptId: "dc.decoder", objectiveId: "dc.obj.function", variants: FN_SETS.map((s, i) => fnVariant(s, i)) }],
};

export const decodersTopic: TopicInput = {
  id: "decoders-encoders",
  title: "Decoders and encoders",
  summary: "A decoder makes one output active for each input code; an encoder writes the code of its one active input.",
  preview: "x y z = 1 0 1 → D5 = 1",
  concepts: [
    { id: "dc.decoder", title: "Decoder", summary: "N inputs, up to 2^N outputs; input number k makes Dk = 1, so each output is one minterm." },
    { id: "dc.encoder", title: "Encoder", summary: "One active input Ik gives the code of k; each output bit is an OR of the inputs whose code has that bit." },
  ],
  objectives: [
    { id: "dc.obj.decoder", conceptId: "dc.decoder", text: "Give a 3-to-8 decoder's active output and read each output as a minterm." },
    { id: "dc.obj.encoder", conceptId: "dc.encoder", text: "Give an 8-to-3 encoder's code and the OR behind each output bit." },
    { id: "dc.obj.function", conceptId: "dc.decoder", text: "Build a function from a decoder: one OR fed by its minterm outputs." },
  ],
  activities: [decoderActivity, encoderActivity, decoderFunctionsActivity],
};
