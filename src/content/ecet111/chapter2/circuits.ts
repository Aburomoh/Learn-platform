/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 2, circuits and expressions (#226, content pack ch2 §5, p.21–25):
 * 1. circuit → expression, one gate output at a time (circuit-predict expression mode);
 * 2. expression → circuit as structural choices: the first gate, the next one, the output gate
 *    (Pedagogy on #226), with AND-before-OR and a misplaced NOT as distractors.
 * Every gate expression is computed from the circuit (`gateExpressions`), never typed by hand.
 */
import type { CourseInput, VariantInput } from "../../schema";
import { evaluateCircuit } from "../../grade";
import { formatBool } from "../../boolean";
import { gateExpressions, gateOrder } from "@/kinds/circuit-predict/logic";
import type { CircuitSpec } from "@/kinds/circuit-predict/spec";

type TopicInput = CourseInput["modules"][number]["topics"][number];
type Activity = TopicInput["activities"][number];
type Gate = CircuitSpec["gates"][number];

const show = (t: string) => t.replace(/'/g, "′");

function rotate<T>(xs: T[], k: number): T[] {
  const r = k % xs.length;
  return [...xs.slice(r), ...xs.slice(0, r)];
}

const INPUTS = [
  { id: "a", label: "A", value: 1 as const },
  { id: "b", label: "B", value: 0 as const },
  { id: "c", label: "C", value: 1 as const },
];

/** p.21–22 (A′ + B)C, p.23–24 (A′ + BC)′, and a fresh AB′ + C. */
const CIRCUITS: { id: string; gates: Gate[] }[] = [
  {
    id: "c21",
    gates: [
      { id: "n1", type: "NOT", from: ["a"] },
      { id: "g1", type: "OR", from: ["n1", "b"] },
      { id: "g2", type: "AND", from: ["g1", "c"], label: "F" },
    ],
  },
  {
    id: "c23",
    gates: [
      { id: "n1", type: "NOT", from: ["a"] },
      { id: "g1", type: "AND", from: ["b", "c"] },
      { id: "g2", type: "OR", from: ["n1", "g1"] },
      { id: "g3", type: "NOT", from: ["g2"], label: "F" },
    ],
  },
  {
    id: "cnew",
    gates: [
      { id: "n1", type: "NOT", from: ["b"] },
      { id: "g1", type: "AND", from: ["a", "n1"] },
      { id: "g2", type: "OR", from: ["g1", "c"], label: "F" },
    ],
  },
];

function circuitSpec(gates: Gate[]): CircuitSpec {
  const spec: CircuitSpec = { kind: "circuit-predict", inputs: INPUTS, gates, outputGateId: gates.at(-1)!.id, answer: 0, inputsToggleable: false, mode: "expression" };
  return { ...spec, answer: evaluateCircuit(spec)[spec.outputGateId] };
}

const exprText = (spec: CircuitSpec, id: string) => show(formatBool(gateExpressions(spec)[id]));

/* ---------- 1. circuit → expression, one gate at a time ---------- */

function readVariant(c: (typeof CIRCUITS)[number], k: number): VariantInput {
  const spec = circuitSpec(c.gates);
  const order = gateOrder(spec);
  const asked: string[] = [];
  const steps = order.map((id, j) => {
    const g = spec.gates.find((x) => x.id === id)!;
    const right = exprText(spec, id);
    // the gate left out: one of its inputs' expressions, as the slip
    const slip = exprText(spec, g.from[0]);
    const options = (k + j) % 2 ? [slip, right] : [right, slip];
    const step = {
      id: `s${j + 2}`,
      say: `The ${g.type} gate takes ${g.from.map((f) => exprText(spec, f)).join(" and ")}.`,
      stage: { lit: [...asked], active: id },
      ask: { prompt: "Its output is…", options, correctIndex: options.indexOf(right), afterCorrect: `Yes: ${right}.`, afterWrong: `The gate acts on its inputs: ${right}.` },
    };
    asked.push(id);
    return step;
  });
  return {
    id: c.id,
    prompt: "Write the expression at each gate's output, one gate at a time, in A, B and C. The last one is F.",
    spec,
    hints: [
      { rung: 2, text: "Not yet. Look only at the {gateName} gate: which expressions arrive on its inputs?" },
      { rung: 3, text: "{gateRule}" },
      { rung: 4, text: "Write its inputs' expressions first, then join them the way this gate does." },
      { rung: 5, text: "This is the gate.", focus: "gate-{gateId}", highlight: "gate-{gateId}" },
      { rung: 6, text: "A NOT puts a prime on what reaches it: on the whole bracket if a whole expression arrives." },
      { rung: 9, text: "Its output is {gateExpression}." },
    ],
    misconceptions: [
      { id: "cx.not-applied", title: "Wrote an input, as if the gate were not there", nudgeKey: "cx.not-applied", detect: { type: "gate-not-applied" } },
      { id: "cx.and-or", title: "AND and OR swapped", nudgeKey: "expr.and-or-swapped", detect: { type: "gate-and-or-swapped" } },
      { id: "cx.bar", title: "Bar on the wrong part", nudgeKey: "cx.bar-misplaced", detect: { type: "gate-bar-misplaced" } },
      { id: "cx.unreadable", title: "Unreadable", nudgeKey: "expr.unreadable", detect: { type: "gate-expression-unreadable" } },
    ],
    explanation: [
      { id: "s1", say: "Read a circuit from the inputs towards F: each gate's output is an expression in the inputs.", stage: { lit: [] } },
      ...steps,
      { id: `s${steps.length + 2}`, say: `So F = ${exprText(spec, spec.outputGateId)}.`, stage: { lit: [...order] } },
    ],
  };
}

/* ---------- 2. expression → circuit, as structural choices ---------- */

/** Each F with its three building steps: [prompt, right, AND-before-OR or bracket slip, NOT-on-the-wrong-part slip, a fourth option]. */
const BUILD: { id: string; f: string; steps: [string, string, string, string, string][] }[] = [
  {
    id: "c21",
    f: "(A' + B)C",
    steps: [
      ["Which gate comes first?", "NOT on A", "AND of B and C", "NOT on B", "OR of A and B"],
      ["Which gate takes A′ next?", "OR of A′ and B", "AND of A′ and B", "OR of A and B", "AND of A′ and C"],
      ["Which gate gives F?", "AND of (A′ + B) and C", "OR of (A′ + B) and C", "NAND of (A′ + B) and C", "AND of A′ and C"],
    ],
  },
  {
    id: "c23",
    f: "(A' + BC)'",
    steps: [
      ["Which gate works on B and C?", "AND of B and C", "OR of B and C", "NAND of B and C", "AND of A and B"],
      ["Which gate joins A′ and BC?", "OR of A′ and BC", "AND of A′ and BC", "NOR of A and BC", "OR of A and BC"],
      ["What finishes F?", "NOT on the whole sum", "NOT on A only", "NOT on BC only", "no gate: F is the sum"],
    ],
  },
  {
    id: "cnew",
    f: "AB' + C",
    steps: [
      ["Which gate comes first?", "NOT on B", "OR of B and C", "NOT on A", "AND of A and B"],
      ["Which gate takes B′ next?", "AND of A and B′", "OR of A and B′", "AND of A and B", "AND of B′ and C"],
      ["Which gate gives F?", "OR of AB′ and C", "AND of AB′ and C", "NOR of AB′ and C", "OR of A and C"],
    ],
  },
];

function buildVariant(set: (typeof BUILD)[number], step: number, k: number): VariantInput {
  const [prompt, right, order, bar, other] = set.steps[step];
  const choices = [
    { id: "right", text: right },
    { id: "order", text: order },
    { id: "bar", text: bar },
    { id: "other", text: other },
  ];
  return {
    id: set.id,
    prompt: `Build F = ${show(set.f)} as a circuit, innermost operation first. ${prompt}`,
    spec: { kind: "multiple-choice", options: rotate(choices, k + step + 1), correctOptionId: "right" },
    hints: [
      { rung: 2, text: "Not yet. Work from the inside out: brackets first, NOT before AND, AND before OR." },
      { rung: 3, text: "A prime on one letter is a NOT on that input only; a bar over a bracket is a NOT after the bracket's gate." },
      { rung: 9, text: `${right}.` },
    ],
    misconceptions: [
      { id: "cx.order", title: "Took the operations in the wrong order (AND before OR, brackets ignored)", nudgeKey: "cx.order", detect: { type: "option", optionId: "order" } },
      { id: "cx.bar-choice", title: "NOT on the wrong part", nudgeKey: "cx.bar-misplaced", detect: { type: "option", optionId: "bar" } },
    ],
    explanation: [
      { id: "s1", say: "Build a circuit the way you would evaluate the expression: the innermost operation first, F last." },
      {
        id: "s2",
        say: `In ${show(set.f)}, find what is evaluated ${step === 0 ? "first" : step === 1 ? "next" : "last"}.`,
        ask: { prompt: "Is it inside a bracket, or does it join the brackets?", options: k % 2 ? ["joins them", "inside"] : ["inside", "joins them"], correctIndex: (step < 2) === (k % 2 === 0) ? 0 : 1, afterCorrect: "Right.", afterWrong: step < 2 ? "It is inside: brackets come first." : "It joins them: that is the last gate." },
      },
      { id: "s3", say: `So: ${right}.` },
    ],
  };
}

const readActivity: Activity = {
  id: "circuit-to-expression",
  title: "Circuit → expression",
  summary: "One gate output at a time, from the inputs to F.",
  authority: "DEMO",
  minutes: 12,
  questions: [{ id: "cx.q.read", label: "Gate by gate", conceptId: "cx.circuits", objectiveId: "cx.obj.read", variants: CIRCUITS.map((c, k) => readVariant(c, k)) }],
};

const buildActivity: Activity = {
  id: "expression-to-circuit",
  title: "Expression → circuit",
  summary: "Choose the gates in the order you would build them: innermost first, F last.",
  authority: "DEMO",
  minutes: 10,
  questions: [
    { id: "cx.q.first", label: "First gate", conceptId: "cx.circuits", objectiveId: "cx.obj.build", variants: BUILD.map((s, k) => buildVariant(s, 0, k)) },
    { id: "cx.q.next", label: "Next gate", conceptId: "cx.circuits", objectiveId: "cx.obj.build", variants: BUILD.map((s, k) => buildVariant(s, 1, k)) },
    { id: "cx.q.last", label: "Output gate", conceptId: "cx.circuits", objectiveId: "cx.obj.build", variants: BUILD.map((s, k) => buildVariant(s, 2, k)) },
  ],
};

export const circuitsTopic: TopicInput = {
  id: "circuits-expressions",
  title: "Circuits and expressions",
  summary: "Read a circuit as an expression one gate at a time, then build a circuit from an expression, innermost gate first.",
  preview: "gate → expression → F",
  concepts: [{ id: "cx.circuits", title: "Circuit ↔ expression", summary: "Each gate's output is an expression of what reaches it; a circuit is built innermost operation first." }],
  objectives: [
    { id: "cx.obj.read", conceptId: "cx.circuits", text: "Write the expression at each gate output of a small circuit." },
    { id: "cx.obj.build", conceptId: "cx.circuits", text: "Choose the gates that build an expression, innermost first." },
  ],
  activities: [readActivity, buildActivity],
};

