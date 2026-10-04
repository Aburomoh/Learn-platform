/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 5 Part II, analysis of clocked circuits (content pack ch5-partii §2–5), one stage
 * per activity, as the course map asks. Every set is a worked circuit with its answer on the slides
 * (D s.8–13, JK s.16–23, T s.24–30, three JK s.37–39); the posed JK circuit of s.14–15 waits for the
 * owner (DECISIONS S1). Answers are graded by equivalence (Boolean module), so any correct form counts.
 */
import type { CourseInput, VariantInput } from "../../schema";
import { envFor, evaluate, parseBool } from "../../boolean";

type TopicInput = CourseInput["modules"][number]["topics"][number];
type Activity = TopicInput["activities"][number];

const show = (t: string) => t.replace(/'/g, "′");

/** A worked circuit: its wiring in words, its input and output equations, and its state equations. */
interface Circuit {
  id: string;
  name: string;
  /** State variables then the input, as the table orders them. */
  vars: string[];
  /** The flip-flop inputs, in table order: [label, equation, the wiring in words]. */
  inputs: [string, string, string][];
  output?: [string, string, string];
  /** Next-state equations A(t+1), B(t+1) as on the slides. */
  next: string[];
}

export const CIRCUITS: Circuit[] = [
  {
    id: "cd",
    name: "D flip-flops (s.8–13)",
    vars: ["A", "B", "x"],
    inputs: [
      ["DA", "Ax + Bx", "an OR gate fed by AND(A, x) and AND(B, x)"],
      ["DB", "A'x", "an AND gate fed by A′ and x"],
    ],
    output: ["y", "(A + B)x'", "an AND gate fed by OR(A, B) and x′"],
    next: ["Ax + Bx", "A'x"],
  },
  {
    id: "cjk",
    name: "JK flip-flops (s.16–23)",
    vars: ["A", "B", "x"],
    inputs: [
      ["JA", "B", "the wire from B"],
      ["KA", "Bx'", "an AND gate fed by B and x′"],
      ["JB", "x'", "the input through an inverter, x′"],
      ["KB", "A ⊕ x", "an XOR gate fed by A and x"],
    ],
    next: ["A'B + AB' + Ax", "B'x' + ABx + A'Bx'"],
  },
  {
    id: "ct",
    name: "T flip-flops (s.24–30)",
    vars: ["A", "B", "x"],
    inputs: [
      ["TA", "Bx", "an AND gate fed by B and x"],
      ["TB", "x", "the input x directly"],
    ],
    output: ["y", "AB", "an AND gate fed by A and B"],
    next: ["AB' + Ax' + A'Bx", "x ⊕ B"],
  },
];

/** The three-JK circuit's output (s.37–39), the third set of the output question. */
const THREE_JK_OUTPUT: { vars: string[]; output: [string, string, string] } = { vars: ["A", "B", "C", "x"], output: ["y", "x + B'", "an OR gate fed by x and B′"] };

const wiring = (c: Circuit) => c.inputs.map(([label, , words]) => `${label} comes from ${words}`).join("; ");

/* ---------- stage 1 (#312): input and output equations, read from the circuit ---------- */

/** Which flip-flop input each set asks: not the first, so the student reads past the obvious wire. */
const ASKED_INPUT = [0, 1, 0];

function inputVariant(c: Circuit, i: number): VariantInput {
  const [label, expr, words] = c.inputs[ASKED_INPUT[i]];
  return {
    id: c.id,
    prompt: `A clocked circuit with ${c.name.split(" (")[0]} A and B and input x. ${wiring(c)}. Write the input equation ${label} = …`,
    spec: { kind: "expression", vars: c.vars, target: expr },
    hints: [
      { rung: 2, text: `Not yet. Follow the wire into ${label} back to its gate.` },
      { rung: 3, text: `${label} comes from ${words}. Write that gate's output.` },
      { rung: 4, text: "An AND gate gives a product, an OR gate a sum, an inverter a prime." },
      { rung: 9, text: `${label} = ${show(expr)}.` },
    ],
    misconceptions: [
      { id: "ex.and-or", title: "AND and OR exchanged", nudgeKey: "expr.and-or-swapped", detect: { type: "expression-and-or-swapped" } },
      { id: "ex.unreadable", title: "Unreadable", nudgeKey: "expr.unreadable", detect: { type: "expression-unreadable" } },
    ],
    explanation: [
      { id: "s1", say: "Stage 1 reads each flip-flop input from the gates that drive it: one equation per input." },
      {
        id: "s2",
        say: `${label} comes from ${words}.`,
        ask: { prompt: "Which gate is last before the flip-flop input?", options: i % 2 ? ["not a gate", words.split(" ")[1]] : [words.split(" ")[1], "not a gate"], correctIndex: i % 2, afterCorrect: "Right.", afterWrong: `It is ${words}.` },
      },
      { id: "s3", say: `So ${label} = ${show(expr)}.` },
    ],
  };
}

function outputVariant(set: { id: string; vars: string[]; output: [string, string, string] }, i: number): VariantInput {
  const [label, expr, words] = set.output;
  return {
    id: set.id,
    prompt: `The circuit's output ${label} comes from ${words}. Write ${label} = …`,
    spec: { kind: "expression", vars: set.vars, target: expr },
    hints: [
      { rung: 2, text: `Not yet. Follow ${label} back to its gate, then to that gate's inputs.` },
      { rung: 3, text: "Write the inner gate first, then the outer one around it." },
      { rung: 9, text: `${label} = ${show(expr)}.` },
    ],
    misconceptions: [
      { id: "ex.and-or", title: "AND and OR exchanged", nudgeKey: "expr.and-or-swapped", detect: { type: "expression-and-or-swapped" } },
      { id: "ex.unreadable", title: "Unreadable", nudgeKey: "expr.unreadable", detect: { type: "expression-unreadable" } },
    ],
    explanation: [
      { id: "s1", say: "The output is read the same way: from the gates that drive it." },
      {
        id: "s2",
        say: `${label} comes from ${words}.`,
        ask: { prompt: "Does the output depend on x here?", options: i % 2 ? ["No", "Yes"] : ["Yes", "No"], correctIndex: expr.includes("x") === (i % 2 === 0) ? 0 : 1, afterCorrect: "Right.", afterWrong: expr.includes("x") ? "Yes: x feeds its gate." : "No: only the flip-flops feed it." },
      },
      { id: "s3", say: `So ${label} = ${show(expr)}.` },
    ],
  };
}

const OUTPUT_SETS = [
  { id: "od", vars: CIRCUITS[0].vars, output: CIRCUITS[0].output! },
  { id: "ot", vars: CIRCUITS[2].vars, output: CIRCUITS[2].output! },
  { id: "o3jk", ...THREE_JK_OUTPUT },
];

export const analysisInputsActivity: Activity = {
  id: "analysis-inputs",
  title: "Analysis 1: input and output equations",
  summary: "Read each flip-flop input, and the output, from the gates that drive it.",
  authority: "DEMO",
  minutes: 10,
  questions: [
    { id: "an.q.input", label: "Input equation", conceptId: "an.analysis", objectiveId: "an.obj.inputs", variants: CIRCUITS.map((c, i) => inputVariant(c, i)) },
    { id: "an.q.output", label: "Output equation", conceptId: "an.analysis", objectiveId: "an.obj.inputs", variants: OUTPUT_SETS.map((s, i) => outputVariant(s, i)) },
  ],
};

/* ---------- stage 2 (#313): state equations, by substituting into the characteristic equation ---------- */

const CHAR: Record<string, string> = { D: "Q(t+1) = D", JK: "Q(t+1) = JQ′ + K′Q", T: "Q(t+1) = T ⊕ Q" };
const typeOf = (c: Circuit) => (c.inputs[0][0].startsWith("D") ? "D" : c.inputs[0][0].startsWith("J") ? "JK" : "T");

function stateVariant(c: Circuit, ff: 0 | 1, i: number): VariantInput {
  const v = c.vars[ff];
  const type = typeOf(c);
  const own = c.inputs.filter(([label]) => label.endsWith(v)).map(([label, expr]) => `${label} = ${show(expr)}`).join(", ");
  const others = Object.keys(CHAR).filter((t) => t !== type);
  const choices = [CHAR[type], CHAR[others[i % 2]]];
  const order = i % 2 ? [choices[1], choices[0]] : choices;
  return {
    id: c.id,
    prompt: `${c.name.split(" (")[0]}, with ${own}. Substitute into the characteristic equation and write ${v}(t+1) in A, B and x.`,
    spec: { kind: "expression", vars: c.vars, target: c.next[ff] },
    hints: [
      { rung: 2, text: `Not yet. Start from the ${type} characteristic equation, with ${v} in place of Q.` },
      { rung: 3, text: `${CHAR[type]}: put ${v} for Q and ${own} for the inputs.` },
      { rung: 4, text: type === "JK" ? "Take care with K′: it is the complement of the whole K expression." : type === "T" ? "T ⊕ Q is TQ′ + T′Q; expand it if that helps." : "For D the next state is just the D input." },
      { rung: 9, text: `${v}(t+1) = ${show(c.next[ff])}.` },
    ],
    misconceptions: [
      { id: "ex.complement", title: "The complement of the next state", nudgeKey: "an.next-complement", detect: { type: "expression-complement" } },
      { id: "ex.unreadable", title: "Unreadable", nudgeKey: "expr.unreadable", detect: { type: "expression-unreadable" } },
    ],
    explanation: [
      { id: "s1", say: "Stage 2: each flip-flop's next state is its characteristic equation with its own inputs put in." },
      {
        id: "s2",
        say: `${v} is a ${type} flip-flop.`,
        ask: { prompt: "Which equation do we start from?", options: order, correctIndex: order.indexOf(CHAR[type]), afterCorrect: "Yes.", afterWrong: `For ${type}: ${CHAR[type]}.` },
      },
      { id: "s3", say: `With ${own}: ${v}(t+1) = ${show(c.next[ff])} (any equal form is fine).` },
    ],
  };
}

export const analysisStateActivity: Activity = {
  id: "analysis-state",
  title: "Analysis 2: state equations",
  summary: "Put each flip-flop's input equations into its characteristic equation.",
  authority: "DEMO",
  minutes: 12,
  questions: [
    { id: "an.q.next-a", label: "A(t+1)", conceptId: "an.analysis", objectiveId: "an.obj.state", variants: CIRCUITS.map((c, i) => stateVariant(c, 0, i)) },
    { id: "an.q.next-b", label: "B(t+1)", conceptId: "an.analysis", objectiveId: "an.obj.state", variants: CIRCUITS.map((c, i) => stateVariant(c, 1, i)) },
  ],
};

/* ---------- stage 3 (#314): the state table, one column at a time, groups in the analysis order ---------- */

function tableVariant(c: Circuit): VariantInput {
  const columns = [
    ...c.inputs.map(([label, expr]) => ({ id: label.toLowerCase(), label, expr, group: "Flip-flop inputs" })),
    ...c.next.map((expr, i) => ({ id: `n${c.vars[i].toLowerCase()}`, label: c.vars[i], expr, group: "Next state" })),
    ...(c.output ? [{ id: "out", label: c.output[0], expr: c.output[1], group: "Output" }] : []),
  ];
  const equations = [...c.inputs.map(([l, e]) => `${l} = ${show(e)}`), ...(c.output ? [`${c.output[0]} = ${show(c.output[1])}`] : [])].join(", ");
  return {
    id: c.id,
    prompt: `${c.name.split(" (")[0]} with ${equations}. Fill the state table one column at a time: the flip-flop inputs first, then the next state${c.output ? ", then the output" : ""}.`,
    spec: { kind: "truth-table", inputs: c.vars, columns },
    hints: [
      { rung: 2, text: "Not yet. Work out {columnLabel} on each row from that row's A, B and x." },
      { rung: 3, text: "Use the column's equation, {columnExpr}, one row at a time." },
      { rung: 4, text: "For the next state, use the flip-flop inputs you already have on the same row and the flip-flop's table." },
      { rung: 9, text: "{columnLabel} reads {columnValues}, top to bottom." },
    ],
    misconceptions: [
      { id: "tt.and-or-swapped", title: "AND and OR swapped", nudgeKey: "tt.and-or-swapped", detect: { type: "and-or-swapped" } },
      { id: "tt.not-missing", title: "NOT not applied", nudgeKey: "tt.not-missing", detect: { type: "not-missing" } },
    ],
    explanation: [
      { id: "s1", say: "Each row is one present state with one input. Its flip-flop inputs decide the next state.", stage: { step: 0, revealed: 0 } },
      {
        id: "s2",
        say: `Take the row A B x = 0 1 1.`,
        stage: { step: 0, revealed: 3 },
        ask: { prompt: `What is ${c.inputs[0][0]} on that row?`, options: ["0", "1"], correctIndex: evaluate(parseBool(c.inputs[0][1], { vars: c.vars }), envFor(c.vars, 3)), afterCorrect: "Right.", afterWrong: `Put A = 0, B = 1, x = 1 into ${c.inputs[0][0]} = ${show(c.inputs[0][1])}.` },
      },
      { id: "s3", say: "Fill the inputs column by column, then the next state, row by row in binary order." },
    ],
  };
}

export const analysisTableActivity: Activity = {
  id: "analysis-table",
  title: "Analysis 3: the state table",
  summary: "Present state and input, then the flip-flop inputs, the next state and the output, one column at a time.",
  authority: "DEMO",
  minutes: 15,
  questions: [{ id: "an.q.table", label: "State table", conceptId: "an.analysis", objectiveId: "an.obj.table", variants: CIRCUITS.map(tableVariant) }],
};

export const analysisTopic: TopicInput = {
  id: "analysis",
  title: "Analysing clocked circuits",
  summary: "From a circuit to its behaviour, one stage at a time: input equations, state equations, the state table.",
  preview: "DA = Ax + Bx → A(t+1) = Ax + Bx",
  concepts: [{ id: "an.analysis", title: "Analysis", summary: "Input equations from the gates; state equations from the characteristic equations; the state table row by row." }],
  objectives: [
    { id: "an.obj.inputs", conceptId: "an.analysis", text: "Read the flip-flop input equations and the output equation from a circuit." },
    { id: "an.obj.state", conceptId: "an.analysis", text: "Write the state equations by substituting into the characteristic equations." },
    { id: "an.obj.table", conceptId: "an.analysis", text: "Fill a state table one column at a time: flip-flop inputs, next state, output." },
  ],
  activities: [analysisInputsActivity, analysisStateActivity, analysisTableActivity],
};
