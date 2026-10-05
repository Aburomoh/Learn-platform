/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 4, multiplexers (#307, content pack ch4 §5): a 4-to-1 mux with selects S1 S0
 * (S1 the MSB). Predict Y for given data and select bits, then which input each select value routes,
 * then the term of Y's equation that does it (#307); then functions with a MUX, one row pair per goal
 * (#308, pack §6). Y is evaluated from its equation and the pairs from F (Boolean module).
 */
import type { CourseInput, VariantInput } from "../../schema";
import { envFor, evaluate, parseBool } from "../../boolean";

type TopicInput = CourseInput["modules"][number]["topics"][number];
type Activity = TopicInput["activities"][number];
type Bit = 0 | 1;

/** Y of a 4-to-1 mux, as on s.40. */
const Y = "S1'S0'I0 + S1'S0I1 + S1S0'I2 + S1S0I3";
const Y_VARS = ["S1", "S0", "I0", "I1", "I2", "I3"];
const yExpr = parseBool(Y, { vars: Y_VARS });
const TERMS = ["S1'S0'I0", "S1'S0I1", "S1S0'I2", "S1S0I3"];
/** The select products alone, as the 'which term?' options: no I subscript to match (Pedagogy on #392). */
const SELECTS = ["S1'S0'", "S1'S0", "S1S0'", "S1S0"];

const sel = (k: number) => k.toString(2).padStart(2, "0");
const swapSel = (k: number) => ((k & 1) << 1) | (k >> 1); // S1 and S0 read the other way round
/** The wrong number offered beside `k` in a prediction: its swapped reading, or a neighbour for 00 and 11. */
const slipOf = (k: number) => (swapSel(k) === k ? (k + 1) % 4 : swapSel(k));
const show = (t: string) => t.replace(/'/g, "′");

function rotate<T>(xs: T[], k: number): T[] {
  const r = k % xs.length;
  return [...xs.slice(r), ...xs.slice(0, r)];
}

/** Y from the select bits and data, by the mux equation. */
function yOf(select: number, data: Bit[]): Bit {
  const m = [select >> 1, select & 1, ...data].reduce((acc, b) => acc * 2 + b, 0);
  return evaluate(yExpr, envFor(Y_VARS, m));
}

/* ---------- 1. predict one output ---------- */

/** Data chosen so the swapped-select slip lands on an input with the other value. */
const PREDICT_SETS: { id: string; select: number; data: Bit[] }[] = [
  { id: "v10", select: 2, data: [0, 0, 1, 0] },
  { id: "v01", select: 1, data: [1, 0, 1, 1] },
  { id: "v11", select: 3, data: [1, 0, 1, 0] },
];

function predictVariant({ id, select, data }: (typeof PREDICT_SETS)[number], i: number): VariantInput {
  const y = yOf(select, data);
  const options = i % 2 ? [{ id: "y1", text: "Y = 1" }, { id: "y0", text: "Y = 0" }] : [{ id: "y0", text: "Y = 0" }, { id: "y1", text: "Y = 1" }];
  const dataText = data.map((d, k) => `I${k} = ${d}`).join(", ");
  return {
    id,
    prompt: `A 4-to-1 multiplexer has ${dataText}, and S1 S0 = ${sel(select).split("").join(" ")} (S1 is the MSB). What is Y?`,
    spec: { kind: "multiple-choice", options, correctOptionId: `y${y}` },
    // the prompt's data and selects on the pins; the routed path lights only after a correct answer (#454)
    figure: { type: "device", device: "mux", bits: 2, given: select, data, focus: "Y" },
    hints: [
      { rung: 2, text: "Not yet. The select bits pick one input; Y copies it." },
      { rung: 3, text: "Read S1 S0 as a binary number, S1 first: that is the number of the input." },
      { rung: 4, text: `What is ${sel(select)} in decimal?` },
      { rung: 9, text: `${sel(select)} is ${select}, so Y = I${select} = ${y}.` },
    ],
    // the swapped reading only shows when it lands on an input with the other value
    misconceptions: data[swapSel(select)] !== y ? [{ id: "mux.select-reversed", title: "Read the select bits backwards", nudgeKey: "mux.select-reversed", detect: { type: "option", optionId: `y${data[swapSel(select)]}` } }] : [],
    explanation: [
      { id: "s1", say: "A multiplexer connects one of its inputs to Y. The select bits, read as a number, say which." },
      {
        id: "s2",
        say: `S1 S0 = ${sel(select)}.`,
        ask: { prompt: "Which input is that?", options: i % 2 ? [`I${slipOf(select)}`, `I${select}`] : [`I${select}`, `I${slipOf(select)}`], correctIndex: i % 2, afterCorrect: `Yes, I${select}.`, afterWrong: `S1 is the MSB: ${sel(select)} is ${select}, so I${select}.` },
      },
      { id: "s3", say: `I${select} = ${data[select]}, so Y = ${y}.` },
    ],
  };
}

/* ---------- 2. which input reaches Y for each select value ---------- */

const ROUTE_SETS = [1, 2, 3];

/** On the device view (#382): the mux drawn with its select values; the student picks the input that reaches Y. */
function routeVariant(select: number, i: number): VariantInput {
  return {
    id: `r${sel(select)}`,
    prompt: `In a 4-to-1 multiplexer, S1 S0 = ${sel(select).split("").join(" ")}. Which input reaches Y?`,
    spec: { kind: "device", device: "mux", bits: 2, asks: [select] },
    hints: [
      { rung: 2, text: "Not yet. Read S1 S0 as a binary number, S1 first." },
      // the rule and the one row no set asks, never the whole table (Pedagogy on #392)
      { rung: 3, text: "Read S1 S0 as a binary number, S1 first: 00 → I0." },
      { rung: 9, text: `${sel(select)} routes I${select} to Y.` },
    ],
    misconceptions: [
      { id: "mux.select-reversed", title: "Read the select bits backwards", nudgeKey: "mux.select-reversed", detect: { type: "code-reversed" } },
      { id: "dev.counted-from-one", title: "Counted the inputs from 1", nudgeKey: "dev.counted-from-one", detect: { type: "counted-from-one" } },
    ],
    explanation: [
      { id: "s1", say: "The select bits, read as a binary number with S1 first, give the input's number: 00 → I0.", stage: { ask: 0 } },
      {
        id: "s2",
        say: `Here S1 = ${select >> 1} and S0 = ${select & 1}.`,
        stage: { ask: 0 },
        ask: { prompt: `${sel(select)} in decimal is…`, options: i % 2 ? [String(slipOf(select)), String(select)] : [String(select), String(slipOf(select))], correctIndex: i % 2, afterCorrect: "Yes.", afterWrong: `S1 is the MSB: ${sel(select)} is ${select}.` },
      },
      { id: "s3", say: `So I${select} reaches Y.`, stage: { ask: 0, answer: true } },
    ],
  };
}

/* ---------- 3. the term of Y's equation that routes an input ---------- */

const TERM_SETS = [2, 1, 3];

function termVariant(input: number, i: number): VariantInput {
  const options = rotate(SELECTS.map((t, k) => ({ id: `t${k}`, text: show(t) })), i + 1);
  return {
    id: `t${input}`,
    prompt: `Y = ${show(Y)}. Which select product multiplies I${input}, so that it passes I${input} to Y?`,
    spec: { kind: "multiple-choice", options, correctOptionId: `t${input}` },
    hints: [
      { rung: 2, text: `Not yet. Which select value routes I${input}? Write it as S1 S0, then as a product (0 primed, 1 plain).` },
      { rung: 3, text: "Its select part is 1 only for the select value that routes that input." },
      { rung: 9, text: `${show(SELECTS[input])}: it is 1 only when S1 S0 = ${sel(input)}.` },
    ],
    misconceptions: swapSel(input) !== input ? [{ id: "mux.select-reversed", title: "Read the select bits backwards", nudgeKey: "mux.select-reversed", detect: { type: "option", optionId: `t${swapSel(input)}` } }] : [],
    explanation: [
      { id: "s1", say: "Each term pairs one select value with one input: it lets that input through only for that value." },
      {
        id: "s2",
        say: `I${input} is routed when S1 S0 = ${sel(input)}.`,
        ask: { prompt: "Is S0 primed in that term?", options: i % 2 ? ["No", "Yes"] : ["Yes", "No"], correctIndex: (input & 1) === 0 ? (i % 2 ? 1 : 0) : i % 2 ? 0 : 1, afterCorrect: "Right.", afterWrong: `S0 is ${input & 1} there, so it is ${input & 1 ? "plain" : "primed"}.` },
      },
      { id: "s3", say: `The term is ${show(TERMS[input])}.` },
    ],
  };
}

const muxActivity: Activity = {
  id: "multiplexers",
  title: "Multiplexers",
  summary: "Predict Y, then which input each select value routes, then the term that does it.",
  authority: "DEMO",
  minutes: 10,
  questions: [
    { id: "mx.q.predict", label: "Predict Y", conceptId: "mx.mux", objectiveId: "mx.obj.mux", variants: PREDICT_SETS.map((s, i) => predictVariant(s, i)) },
    { id: "mx.q.route", label: "Which input?", conceptId: "mx.mux", objectiveId: "mx.obj.mux", variants: ROUTE_SETS.map((s, i) => routeVariant(s, i)) },
    { id: "mx.q.term", label: "Which term?", conceptId: "mx.mux", objectiveId: "mx.obj.mux", variants: TERM_SETS.map((s, i) => termVariant(s, i)) },
  ],
};

/* ---------- functions with a MUX (#308, pack ch4 §6): first n−1 variables on the selects, the last decides each data input ---------- */

/**
 * The slides' worked functions (s.48–51, s.52–55, s.57–61), and s.56: the same F as s.52–55 with x, y, z
 * on the selects and w on the data inputs (owner-confirmed, DECISIONS A1). `order` is the table's input
 * order when the data variable is not the last one.
 */
const FN_SETS: { id: string; vars: string[]; minterms: number[]; order?: string[] }[] = [
  { id: "f3", vars: ["x", "y", "z"], minterms: [1, 2, 6, 7] },
  { id: "f4", vars: ["w", "x", "y", "z"], minterms: [1, 2, 5, 11, 13] },
  { id: "f4b", vars: ["A", "B", "C", "D"], minterms: [1, 3, 4, 11, 12, 13, 14, 15] },
];
const S56 = { id: "f56", vars: ["w", "x", "y", "z"], minterms: [1, 2, 5, 11, 13], order: ["x", "y", "z", "w"] };

const sigmaText = (ms: number[]) => `Σ(${ms.join(", ")})`;
const muxSize = (n: number) => `${2 ** (n - 1)}-to-1`;

const PROBE = [0, 3, 2, 0];

function pairsVariant(set: (typeof FN_SETS)[number], i: number): VariantInput {
  const { vars, minterms } = set;
  const cols = set.order ?? vars;
  const rows = 2 ** vars.length;
  // F on each table row (in `cols` order), read from the Σ over `vars`
  const fAt = (r: number) => {
    const bits = Object.fromEntries(cols.map((v, j) => [v, (r >> (cols.length - 1 - j)) & 1]));
    return minterms.includes(vars.reduce((m, v) => m * 2 + bits[v], 0)) ? 1 : 0;
  };
  const p = PROBE[i];
  const [f0, f1] = [fAt(2 * p), fAt(2 * p + 1)];
  const data = cols.at(-1)!;
  return {
    id: set.id,
    prompt: `F(${vars.join(", ")}) = ${sigmaText(minterms)} with a ${muxSize(vars.length)} MUX: ${cols.slice(0, -1).join(", ")} on the selects, ${data} on the data inputs. For each pair of rows, what does its data input get: 0, 1, ${data} or ${data}′?`,
    spec: {
      kind: "truth-table",
      inputs: cols,
      mode: "mux-pairs",
      target: "f",
      columns: [{ id: "f", label: "F", values: Array.from({ length: rows }, (_, r) => fAt(r)), given: true }],
    },
    // the mux with this set's selects, the Explain pair's input marked (#454, plan §5)
    figure: { type: "device", device: "mux", bits: cols.length - 1, names: cols.slice(0, -1), given: p, focus: `I${p}` },
    hints: [
      { rung: 2, text: "Not yet. Look only at the two rows of this pair: {dataVar} = 0, then {dataVar} = 1." },
      { rung: 3, text: "F is {pairValues} on this pair. Does F stay the same, or follow {dataVar}?" },
      { rung: 4, text: "0 0 gives 0, 1 1 gives 1, 0 1 gives {dataVar}, and 1 0 gives {dataVar}′." },
      { rung: 9, text: "{inputName} gets {pairChoice}." },
    ],
    misconceptions: [
      { id: "mx.pair-swapped", title: "z and z′ exchanged", nudgeKey: "mx.pair-swapped", detect: { type: "pair-complement-swapped" } },
      { id: "mx.pair-constant", title: "One row's value copied where the pair follows the variable", nudgeKey: "mx.pair-constant", detect: { type: "pair-constant-for-variable" } },
      { id: "mx.pair-variable", title: "A variable where F does not change", nudgeKey: "mx.pair-variable", detect: { type: "pair-variable-for-constant" } },
    ],
    explanation: [
      { id: "s1", say: `The selects take ${cols.slice(0, -1).join(", ")}; each select value picks a pair of rows that differ only in ${data}.`, stage: { step: 0 } },
      {
        id: "s2",
        say: `Take the pair for I${p}: F = ${f0} for ${data} = 0 and F = ${f1} for ${data} = 1.`,
        stage: { step: p },
        ask: { prompt: "Does F change with the data variable there?", options: ["Yes", "No"], correctIndex: f0 !== f1 ? 0 : 1, afterCorrect: "Right.", afterWrong: f0 !== f1 ? `It changes with ${data}, so I${p} gets ${data} or ${data}′.` : `It stays ${f0}, so I${p} gets ${f0}.` },
      },
      { id: "s3", say: `Each pair gives its input 0, 1, ${data} or ${data}′; the input's number is the pair's select bits.` },
    ],
  };
}

/** Which variables go on the selects, highest select first. */
function wiringVariant(set: (typeof FN_SETS)[number], i: number): VariantInput {
  const { vars } = set;
  const n = vars.length;
  const selects = vars.slice(0, -1);
  const names = selects.map((_, k) => `S${n - 2 - k}`);
  const asText = (vs: string[]) => vs.map((v, k) => `${v} → ${names[k]}`).join(", ");
  const choices = [
    { id: "right", text: asText(selects) },
    { id: "reversed", text: asText([...selects].reverse()) },
    { id: "last", text: asText(vars.slice(1)) },
  ];
  return {
    id: set.id,
    prompt: `F(${vars.join(", ")}) = ${sigmaText(set.minterms)} with a ${muxSize(n)} MUX. Which variables go on the select lines?`,
    spec: { kind: "multiple-choice", options: rotate(choices, i + 1), correctOptionId: "right" },
    hints: [
      { rung: 2, text: `Not yet. A ${muxSize(n)} MUX has ${n - 1} select lines, one fewer than the variables.` },
      { rung: 3, text: "The first variables go on the selects, the first one on the highest select; the last variable feeds the data inputs." },
      { rung: 9, text: `${asText(selects)}; ${vars.at(-1)} on the data inputs.` },
    ],
    misconceptions: [
      { id: "mux.select-reversed", title: "Selects in reverse order", nudgeKey: "mux.select-reversed", detect: { type: "option", optionId: "reversed" } },
      { id: "mx.data-first", title: "The first variable used as the data input", nudgeKey: "mx.data-first", detect: { type: "option", optionId: "last" } },
    ],
    explanation: [
      { id: "s1", say: `${n} variables need a ${muxSize(n)} MUX: ${n - 1} selects and one data variable.` },
      {
        id: "s2",
        say: "The first variable is the MSB of the row number.",
        ask: { prompt: `Which select takes ${vars[0]}?`, options: i % 2 ? ["S0", names[0]] : [names[0], "S0"], correctIndex: i % 2, afterCorrect: "Yes, the highest.", afterWrong: `The highest one, ${names[0]}: ${vars[0]} is the MSB.` },
      },
      { id: "s3", say: `So ${asText(selects)}, and ${vars.at(-1)} goes to the data inputs.` },
    ],
  };
}

const muxFunctionsActivity: Activity = {
  id: "mux-functions",
  title: "Functions with a MUX",
  summary: "The first variables on the selects, the last one decides each data input: 0, 1, z or z′, one row pair at a time.",
  authority: "DEMO",
  minutes: 15,
  questions: [
    { id: "mx.q.wiring", label: "Which selects?", conceptId: "mx.function", objectiveId: "mx.obj.function", variants: FN_SETS.map((s, i) => wiringVariant(s, i)) },
    { id: "mx.q.pairs", label: "Each data input", conceptId: "mx.function", objectiveId: "mx.obj.function", variants: [...FN_SETS, S56].map((s, i) => pairsVariant(s, i)) },
  ],
};

export const multiplexersTopic: TopicInput = {
  id: "multiplexers",
  title: "Multiplexers",
  summary: "Many inputs, one output: the select bits, read as a number, choose which input reaches Y.",
  preview: "S1 S0 = 0 0 → Y = I0",
  concepts: [
    { id: "mx.mux", title: "Multiplexer", summary: "A 4-to-1 mux routes input I(S1 S0) to Y: Y = S1′S0′I0 + S1′S0I1 + S1S0′I2 + S1S0I3." },
    { id: "mx.function", title: "Function with a MUX", summary: "n variables: the first n − 1 on the selects, the last decides each data input (0, 1, v or v′) per pair of rows." },
  ],
  objectives: [
    { id: "mx.obj.mux", conceptId: "mx.mux", text: "Predict a 4-to-1 multiplexer's output and name the input each select value routes." },
    { id: "mx.obj.function", conceptId: "mx.function", text: "Implement a function with a multiplexer, one row pair at a time." },
  ],
  activities: [muxActivity, muxFunctionsActivity],
};
