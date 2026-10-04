/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 4, multiplexers (#307, content pack ch4 §5): a 4-to-1 mux with selects S1 S0
 * (S1 the MSB). Predict Y for given data and select bits, then which input each select value routes,
 * then the term of Y's equation that does it. Y is evaluated from its equation (Boolean module).
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

function routeVariant(select: number, i: number): VariantInput {
  const options = rotate([0, 1, 2, 3].map((k) => ({ id: `i${k}`, text: `I${k}` })), i + select);
  return {
    id: `r${sel(select)}`,
    prompt: `In a 4-to-1 multiplexer, S1 S0 = ${sel(select).split("").join(" ")}. Which input reaches Y?`,
    spec: { kind: "multiple-choice", options, correctOptionId: `i${select}` },
    hints: [
      { rung: 2, text: "Not yet. Read S1 S0 as a binary number, S1 first." },
      // the rule and the one row no set asks, never the whole table (Pedagogy on #392)
      { rung: 3, text: "Read S1 S0 as a binary number, S1 first: 00 → I0." },
      { rung: 9, text: `${sel(select)} routes I${select} to Y.` },
    ],
    misconceptions: swapSel(select) !== select ? [{ id: "mux.select-reversed", title: "Read the select bits backwards", nudgeKey: "mux.select-reversed", detect: { type: "option", optionId: `i${swapSel(select)}` } }] : [],
    explanation: [
      { id: "s1", say: "The select bits, read as a binary number with S1 first, give the input's number: 00 → I0." },
      {
        id: "s2",
        say: `Here S1 = ${select >> 1} and S0 = ${select & 1}.`,
        ask: { prompt: `${sel(select)} in decimal is…`, options: i % 2 ? [String(slipOf(select)), String(select)] : [String(select), String(slipOf(select))], correctIndex: i % 2, afterCorrect: "Yes.", afterWrong: `S1 is the MSB: ${sel(select)} is ${select}.` },
      },
      { id: "s3", say: `So I${select} reaches Y.` },
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

export const multiplexersTopic: TopicInput = {
  id: "multiplexers",
  title: "Multiplexers",
  summary: "Many inputs, one output: the select bits, read as a number, choose which input reaches Y.",
  preview: "S1 S0 = 0 0 → Y = I0",
  concepts: [{ id: "mx.mux", title: "Multiplexer", summary: "A 4-to-1 mux routes input I(S1 S0) to Y: Y = S1′S0′I0 + S1′S0I1 + S1S0′I2 + S1S0I3." }],
  objectives: [{ id: "mx.obj.mux", conceptId: "mx.mux", text: "Predict a 4-to-1 multiplexer's output and name the input each select value routes." }],
  activities: [muxActivity],
};
