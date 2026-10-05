/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 5 Part II, three JK flip-flops (#316, content pack ch5-partii §5, s.37–52): the
 * 16-row state table one column at a time, the 8-state diagram, then the timing trace. Each stage is
 * its own activity (Pedagogy). The circuit: JA = x′, KA = B; JB = Ax, KB = C; JC = A, KC = x;
 * y = x + B′. Every column, arrow and trace is computed from these equations; the diagram and the
 * trace are machine-worked (owner A2: approved, QA recomputes each; the trace starts at 000).
 */
import type { CourseInput, VariantInput } from "../../schema";

/** The eight states on a ring in count order, 000 at the top left, clockwise (UX, #394/#468): most arrows join neighbours. */
const RING: [number, number][] = [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [1, 2], [0, 2], [0, 1]];

type TopicInput = CourseInput["modules"][number]["topics"][number];
type Activity = TopicInput["activities"][number];
type Bit = 0 | 1;

const VARS = ["A", "B", "C", "x"];
/** Flip-flop input equations (s.38–39), in the deck's column order. */
const INPUT_EQS: [string, string][] = [["JA", "x'"], ["KA", "B"], ["JB", "Ax"], ["KB", "C"], ["JC", "A"], ["KC", "x"]];
/** State equations (s.39): JQ′ + K′Q with the inputs put in. */
const NEXT = ["x'A' + AB'", "xAB' + BC'", "AC' + x'C"];
const OUTPUT: [string, string] = ["y", "x + B'"];

const show = (t: string) => t.replace(/'/g, "′");

/* ---------- 1. the 16-row table, one column at a time (analysis order: inputs, next state, output) ---------- */

const tableVariant: VariantInput = {
  id: "t3jk",
  prompt: `Three JK flip-flops: ${INPUT_EQS.map(([l, e]) => `${l} = ${show(e)}`).join(", ")}; ${OUTPUT[0]} = ${show(OUTPUT[1])}. Fill the state table one column at a time: the flip-flop inputs, then the next state, then y.`,
  spec: {
    kind: "truth-table",
    inputs: VARS,
    inputGroups: [{ label: "Present state", span: 3 }, { label: "Input", span: 1 }],
    columns: [
      ...INPUT_EQS.map(([l, e]) => ({ id: l.toLowerCase(), label: l, expr: e, group: "Flip-flop inputs" })),
      // each next state is worked out from its own J and K (#508)
      ...NEXT.map((e, i) => ({ id: `n${VARS[i].toLowerCase()}`, label: VARS[i], expr: e, group: "Next state", needs: INPUT_EQS.filter(([l]) => l.endsWith(VARS[i])).map(([l]) => l.toLowerCase()) })),
      { id: "y", label: OUTPUT[0], expr: OUTPUT[1], group: "Output" },
    ],
  },
  hints: [
    { rung: 2, text: "Not yet. Work out {columnLabel} on each row from that row's A, B, C and x." },
    { rung: 3, text: "Use the column's equation, {columnExpr}, one row at a time." },
    { rung: 4, text: "For a next-state column, use that flip-flop's J and K on the same row: 0 0 keeps, 1 0 sets, 0 1 resets, 1 1 toggles." },
    { rung: 9, text: "{columnLabel} reads {columnValues}, top to bottom." },
  ],
  misconceptions: [
    { id: "tt.and-or-swapped", title: "AND and OR swapped", nudgeKey: "tt.and-or-swapped", detect: { type: "and-or-swapped" } },
    { id: "tt.not-missing", title: "NOT not applied", nudgeKey: "tt.not-missing", detect: { type: "not-missing" } },
  ],
  explanation: [
    { id: "s1", say: "Sixteen rows: three flip-flops and one input. Fill the flip-flop inputs first, then the next state, then y.", stage: { step: 0, revealed: 0 } },
    {
      id: "s2",
      say: "Take the first row, A B C x = 0 0 0 0.",
      stage: { step: 0, revealed: 0 },
      ask: { prompt: "What is JA = x′ there?", options: ["1", "0"], correctIndex: 0, afterCorrect: "Yes: x = 0, so x′ = 1.", afterWrong: "x = 0, so x′ = 1." },
    },
    { id: "s3", say: "Each next-state bit then follows its own J and K on the same row.", stage: { step: 0, revealed: 0 } },
  ],
};

/* ---------- 2. the 8-state diagram ---------- */

const diagramVariant: VariantInput = {
  id: "d3jk",
  prompt: "The same circuit's state diagram is drawn from its table, one arrow per row. Label each arrow x/y, in table order.",
  spec: { kind: "state-diagram", stateVars: ["A", "B", "C"], input: "x", next: NEXT, output: { name: OUTPUT[0], expr: OUTPUT[1] }, mode: "label", positions: RING },
  hints: [
    { rung: 2, text: "Not yet. Find the table row for this arrow: present state {from}, going to {to}." },
    { rung: 3, text: "The label is the row's input, a slash, then the row's output." },
    { rung: 9, text: "This arrow is labelled {label}." },
  ],
  misconceptions: [
    { id: "sd.output-wrong-row", title: "The output of the other row", nudgeKey: "sd.output-wrong-row", detect: { type: "output-wrong-row" } },
    { id: "sd.label-input-wrong", title: "The wrong input value", nudgeKey: "sd.label-input-wrong", detect: { type: "label-input-wrong" } },
    { id: "sd.label-reversed", title: "Output/input instead of input/output", nudgeKey: "sd.label-reversed", detect: { type: "label-reversed" } },
  ],
  explanation: [
    { id: "s1", say: "Eight states, two arrows each: sixteen arrows, one per table row.", stage: { revealed: 0 } },
    {
      id: "s2",
      say: "y = x + B′ is 1 whenever x = 1.",
      stage: { revealed: 0 },
      ask: { prompt: "So every arrow with x = 1 is labelled…", options: ["1/1", "1/0"], correctIndex: 0, afterCorrect: "Yes: 1/1.", afterWrong: "x = 1 makes y = 1, so 1/1." },
    },
    { id: "s3", say: "With x = 0, y = B′: read B in the present state.", stage: { revealed: 1 } },
  ],
};

/* ---------- 3. the timing trace from 000 (three input sequences) ---------- */

/** x at each rising edge: s.52's sequence, then two computed ones; the trace starts at 000 (owner A2). */
const TRACES: { id: string; x: Bit[] }[] = [
  { id: "x52", x: [0, 1, 1, 1, 1, 0, 0, 0, 1, 1] },
  { id: "xa", x: [1, 0, 0, 1, 1, 0, 1, 0] },
  { id: "xb", x: [0, 0, 1, 0, 1, 1, 0, 1] },
];

function traceVariant({ id, x }: (typeof TRACES)[number], k: number): VariantInput {
  return {
    id,
    prompt: "The same circuit, positive-edge triggered, starting at A B C = 0 0 0. At each rising edge give A, B and C just after it.",
    spec: {
      kind: "timing",
      edge: "rising",
      inputs: [{ name: "x", levels: x.flatMap((v) => [v, v]) }],
      machine: { stateVars: ["A", "B", "C"], next: NEXT, initial: [0, 0, 0] },
    },
    hints: [
      { rung: 2, text: "Not yet. Look only at edge {edgeNumber}: what was x just before it?" },
      { rung: 3, text: "Use the state before the edge and x: each flip-flop follows its own J and K." },
      { rung: 5, text: "The input at this edge: {inputsAtEdge}.", focus: "inputs-at-edge", highlight: "inputs-at-edge" },
      { rung: 9, text: "Before the edge {stateBefore}; after it {stateAfter}." },
    ],
    misconceptions: [
      { id: "tm.held", title: "A flip-flop held when its inputs change it", nudgeKey: "tm.held-not-applied", detect: { type: "held-not-applied" } },
      { id: "tm.changed", title: "A flip-flop changed on a hold", nudgeKey: "tm.changed-on-hold", detect: { type: "changed-on-hold" } },
      { id: "tm.wrong-edge", title: "Read x at the other edge", nudgeKey: "tm.wrong-edge", detect: { type: "wrong-edge" } },
      { id: "tm.input-after-edge", title: "Read x after the edge", nudgeKey: "tm.input-after-edge", detect: { type: "input-after-edge" } },
    ],
    explanation: [
      { id: "s1", say: "Each rising edge moves the circuit one row of its state table: present state and x in, next state out.", stage: { revealed: 0 } },
      {
        id: "s2",
        say: `At the first edge the state is 000 and x = ${x[0]}.`,
        stage: { revealed: 0 },
        ask: { prompt: "Does A change at that edge?", options: k % 2 ? ["No", "Yes"] : ["Yes", "No"], correctIndex: (x[0] === 0) === (k % 2 === 0) ? 0 : 1, afterCorrect: "Right.", afterWrong: x[0] === 0 ? "JA = x′ = 1 and KA = B = 0: A sets to 1." : "JA = x′ = 0 and KA = B = 0: A holds at 0." },
      },
      { id: "s3", say: "Then the next edge starts from the new state, and so on.", stage: { revealed: 1 } },
    ],
  };
}

/* ---------- topic ---------- */

const tableActivity: Activity = {
  id: "three-jk-table",
  title: "Three JK: the state table",
  summary: "Sixteen rows, one column at a time: flip-flop inputs, next state, output.",
  authority: "DEMO",
  minutes: 20,
  // one worked circuit, walked once (s.37–48): exempt from the three-set rule
  questions: [{ id: "j3.q.table", label: "State table", conceptId: "j3.circuit", objectiveId: "j3.obj.table", variants: [tableVariant] }],
};

const diagramActivity: Activity = {
  id: "three-jk-diagram",
  title: "Three JK: the state diagram",
  summary: "Eight states, sixteen arrows: label each x/y.",
  authority: "DEMO",
  minutes: 15,
  // the same circuit's one diagram: exempt from the three-set rule
  questions: [{ id: "j3.q.diagram", label: "State diagram", conceptId: "j3.circuit", objectiveId: "j3.obj.diagram", variants: [diagramVariant] }],
};

const traceActivity: Activity = {
  id: "three-jk-timing",
  title: "Three JK: the timing trace",
  summary: "From 000, A, B and C after each rising edge.",
  authority: "DEMO",
  minutes: 15,
  questions: [{ id: "j3.q.timing", label: "Timing trace", conceptId: "j3.circuit", objectiveId: "j3.obj.timing", variants: TRACES.map((t, k) => traceVariant(t, k)) }],
};

export const threeJkTopic: TopicInput = {
  id: "three-jk",
  title: "Three JK flip-flops",
  summary: "A full analysis of a three-flip-flop circuit: the 16-row state table, the 8-state diagram, and the timing trace.",
  preview: "table → diagram → trace",
  concepts: [{ id: "j3.circuit", title: "Three-flip-flop analysis", summary: "Input equations give the state table row by row; the table gives the diagram's arrows and the trace edge by edge." }],
  objectives: [
    { id: "j3.obj.table", conceptId: "j3.circuit", text: "Fill a 16-row state table one column at a time." },
    { id: "j3.obj.diagram", conceptId: "j3.circuit", text: "Label an 8-state diagram from the table." },
    { id: "j3.obj.timing", conceptId: "j3.circuit", text: "Trace A, B and C edge by edge from a stated start." },
  ],
  activities: [tableActivity, diagramActivity, traceActivity],
};
