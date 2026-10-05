/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 5 Part III, designing a counter (#290–#292, content pack ch5-partiii §1), one stage
 * per activity: 1 the state table from the word spec; 2 the flip-flop input columns from the
 * excitation tables (X where it does not matter); 3 one K-map per flip-flop input, then its equation.
 * Two flip-flops A, B and an input X: X = 0 holds, X = 1 steps through the sequence. The slides'
 * counter (00 → 01 → 11 → 10) is the first set; the others are computed the same way. Every column,
 * excitation entry and Σ is computed here, never typed (owner A2: QA recomputes each).
 */
import type { CourseInput, VariantInput } from "../../schema";
import { kmapVariant } from "../chapter3/kmap-variant";
import { kmapCovers } from "@/kinds/kmap/logic";
import { formatCover } from "../../boolean";

type TopicInput = CourseInput["modules"][number]["topics"][number];
type Activity = TopicInput["activities"][number];
type Bit = 0 | 1;
type Cell = Bit | "X";
type HintInput = NonNullable<VariantInput["hints"]>[number];

/** A counter: the state sequence X = 1 steps through (2-bit codes). */
const COUNTERS: { id: string; name: string; seq: number[] }[] = [
  { id: "gray", name: "00 → 01 → 11 → 10", seq: [0, 1, 3, 2] }, // the slides' counter (s.5)
  { id: "up", name: "00 → 01 → 10 → 11", seq: [0, 1, 2, 3] },
  { id: "down", name: "00 → 11 → 10 → 01", seq: [0, 3, 2, 1] },
];

const VARS = ["A", "B", "X"];
const ROWS = Array.from({ length: 8 }, (_, m) => m); // m = A B X, A the MSB
const bit = (v: number, i: number) => ((v >> i) & 1) as Bit;
const code = (s: number) => s.toString(2).padStart(2, "0");

/** Next state of row m: X = 0 holds, X = 1 moves to the next code in the sequence. */
function nextState(seq: number[], m: number): number {
  const state = m >> 1;
  return m & 1 ? seq[(seq.indexOf(state) + 1) % seq.length] : state;
}

/** Excitation (s.12, s.16): T = Q_t ⊕ Q_t+1; JK: 0→0 is 0X, 0→1 is 1X, 1→0 is X1, 1→1 is X0. */
const tOf = (q: Bit, q1: Bit): Bit => (q ^ q1) as Bit;
const jOf = (q: Bit, q1: Bit): Cell => (q === 0 ? q1 : "X");
const kOf = (q: Bit, q1: Bit): Cell => (q === 1 ? ((1 - q1) as Bit) : "X");

/** Flip-flop `ff` (0 = A, 1 = B): its present bit and next bit on row m. */
function bits(seq: number[], m: number, ff: 0 | 1): [Bit, Bit] {
  const shift = ff === 0 ? 1 : 0;
  return [bit(m >> 1, shift), bit(nextState(seq, m), shift)];
}

const column = (seq: number[], ff: 0 | 1, f: (q: Bit, q1: Bit) => Cell): Cell[] => ROWS.map((m) => f(...bits(seq, m, ff)));
/** The same column read the wrong way round: Q_t+1 taken as the present bit (the requirements' slip). */
const reversed = (seq: number[], ff: 0 | 1, f: (q: Bit, q1: Bit) => Cell): Cell[] => ROWS.map((m) => { const [q, q1] = bits(seq, m, ff); return f(q1, q); });

const nextColumns = (seq: number[], given: boolean) =>
  ([0, 1] as const).map((ff) => ({ id: `n${VARS[ff].toLowerCase()}`, label: VARS[ff], group: "Next state", values: ROWS.map((m) => bits(seq, m, ff)[1]), given }));

const INPUT_GROUPS = [{ label: "Present state", span: 2 }, { label: "Input", span: 1 }];

const columnMisconceptions: VariantInput["misconceptions"] = [
  { id: "dz.dontcare-as-zero", title: "X written as 0", nudgeKey: "dz.dontcare-as-zero", detect: { type: "dontcare-as-zero" } },
  { id: "dz.excitation-reversed", title: "Excitation read the wrong way", nudgeKey: "dz.excitation-reversed", detect: { type: "excitation-reversed" } },
];

/* ---------- stage 1 (#290): the state table from the word spec ---------- */

function stateTableVariant(c: (typeof COUNTERS)[number], k: number): VariantInput {
  const row = 3; // A B X = 0 1 1
  const nxt = code(nextState(c.seq, row));
  const held = code(row >> 1);
  return {
    id: c.id,
    prompt: `Design a counter with flip-flops A, B and input X: X = 0 holds the state; X = 1 steps ${c.name} and back to 00. Fill the next-state columns, A then B.`,
    spec: { kind: "truth-table", inputs: VARS, inputGroups: INPUT_GROUPS, columns: nextColumns(c.seq, false) },
    hints: [
      { rung: 2, text: "Not yet. Each row is a present state A B with an input X. Where does it go?" },
      { rung: 3, text: "X = 0: the next state is the present state. X = 1: the next code in the sequence." },
      { rung: 4, text: `In ${c.name}, which code comes after the present one?` },
      { rung: 9, text: "{columnLabel} reads {columnValues}, top to bottom." },
    ],
    misconceptions: [],
    explanation: [
      { id: "s1", say: "Design starts from the specification: every present state and input gives one next state.", stage: { step: 0, revealed: 0 } },
      {
        id: "s2",
        say: "Take the row A B X = 0 1 1: present state 01, X = 1.",
        stage: { step: 0, revealed: 0 },
        ask: { prompt: "Its next state is…", options: k % 2 ? [held, nxt] : [nxt, held], correctIndex: k % 2, afterCorrect: `Yes, ${nxt}.`, afterWrong: `X = 1 steps on: after 01 comes ${nxt}.` },
      },
      { id: "s3", say: "Rows with X = 0 keep their state; rows with X = 1 step once along the sequence.", stage: { step: 0, revealed: 0 } },
    ],
  };
}

/* ---------- stage 2 (#291): the flip-flop input columns from the excitation table ---------- */

const T_REMINDER = "T excitation: Q(t) → Q(t+1) = 0 → 0 needs T = 0, 0 → 1 needs 1, 1 → 0 needs 1, 1 → 1 needs 0.";
const JK_REMINDER = "JK excitation: 0 → 0 is J K = 0 X, 0 → 1 is 1 X, 1 → 0 is X 1, 1 → 1 is X 0.";

const excitationHints = (reminder: string): HintInput[] => [
  { rung: 2, text: "Not yet. On each row, compare the flip-flop's present bit with its next bit." },
  { rung: 3, text: reminder },
  { rung: 4, text: "Read the change from the present state to the next state, never the other way round." },
  { rung: 6, text: "X means either value works: keep it as X, it helps the K-map later." },
  { rung: 9, text: "{columnLabel} reads {columnValues}, top to bottom." },
];

function excitationVariant(c: (typeof COUNTERS)[number], ff: "T" | "JK", k: number): VariantInput {
  const cols =
    ff === "T"
      ? ([0, 1] as const).map((f) => ({ id: `t${VARS[f].toLowerCase()}`, label: `T${VARS[f]}`, group: "Flip-flop inputs", values: column(c.seq, f, tOf), needs: [`n${VARS[f].toLowerCase()}`] }))
      : ([0, 1] as const).flatMap((f) => [
          { id: `j${VARS[f].toLowerCase()}`, label: `J${VARS[f]}`, group: "Flip-flop inputs", values: column(c.seq, f, jOf), slipValues: { excitationReversed: reversed(c.seq, f, jOf) }, needs: [`n${VARS[f].toLowerCase()}`] },
          { id: `k${VARS[f].toLowerCase()}`, label: `K${VARS[f]}`, group: "Flip-flop inputs", values: column(c.seq, f, kOf), slipValues: { excitationReversed: reversed(c.seq, f, kOf) }, needs: [`n${VARS[f].toLowerCase()}`] },
        ]);
  const reminder = ff === "T" ? T_REMINDER : JK_REMINDER;
  const [q, q1] = bits(c.seq, 3, 0); // flip-flop A on the row 0 1 1
  const right = ff === "T" ? String(tOf(q, q1)) : `${jOf(q, q1)} ${kOf(q, q1)}`;
  const slip = ff === "T" ? String(1 - tOf(q, q1)) : `${jOf(q1, q)} ${kOf(q1, q)}` === right ? "X X" : `${jOf(q1, q)} ${kOf(q1, q)}`;
  return {
    id: c.id,
    prompt: `The ${c.name} counter, with ${ff} flip-flops: the next state is filled. Fill the flip-flop input columns${ff === "JK" ? ", flip-flop A first (JA, KA), then B" : ""}, using X where either value works.`,
    spec: { kind: "truth-table", inputs: VARS, inputGroups: INPUT_GROUPS, columns: [...nextColumns(c.seq, true), ...cols] },
    hints: excitationHints(reminder),
    misconceptions: columnMisconceptions,
    explanation: [
      { id: "s1", say: `${reminder} Read it from the present bit to the next bit.`, stage: { step: 0, revealed: 0 } },
      {
        id: "s2",
        say: `Take the row 0 1 1: A goes from ${q} to ${q1}.`,
        stage: { step: 0, revealed: 0 },
        ask: { prompt: ff === "T" ? "So TA is…" : "So JA KA is…", options: k % 2 ? [slip, right] : [right, slip], correctIndex: k % 2, afterCorrect: `Yes: ${right}.`, afterWrong: `${q} → ${q1} needs ${right}.` },
      },
      { id: "s3", say: "Every row the same way, one column at a time.", stage: { step: 0, revealed: 0 } },
    ],
  };
}

/* ---------- stage 3 (#292): one K-map per flip-flop input, then its equation ---------- */

const ones = (cells: Cell[]) => ROWS.filter((m) => cells[m] === 1);
const xs = (cells: Cell[]) => ROWS.filter((m) => cells[m] === "X");
const GRAY = COUNTERS[0].seq;

/** The slides' counter: DA, DB (s.9–10), TA (computed), and the JK inputs of A and B with their Xs (computed). */
const D_T_MAPS = [
  { id: "da", label: "DA", cells: column(GRAY, 0, (_q, q1) => q1) },
  { id: "db", label: "DB", cells: column(GRAY, 1, (_q, q1) => q1) },
  { id: "ta", label: "TA", cells: column(GRAY, 0, tOf) },
];
const JK_MAPS = [
  { id: "ja", label: "JA", cells: column(GRAY, 0, jOf) },
  { id: "ka", label: "KA", cells: column(GRAY, 0, kOf) },
  { id: "jb", label: "JB", cells: column(GRAY, 1, jOf) },
];

const mapVariant = (m: { id: string; label: string; cells: Cell[] }, k: number): VariantInput =>
  kmapVariant({ id: m.id, vars: VARS, minterms: ones(m.cells), dontCares: xs(m.cells), given: `${m.label}(A, B, X) for the ${COUNTERS[0].name} counter = Σ(${ones(m.cells).join(", ")})${xs(m.cells).length ? ` + d(${xs(m.cells).join(", ")})` : ""}` }, k);

/* ---------- design problem (#293, s.28–34): three flip-flops, practice ---------- */

/**
 * The s.28–29 state diagram as a table: present A B C → [next on X = 0, Y, next on X = 1, Y].
 * 011 on X = 1 goes to 110 with Y = 0 (owner S2: the 011 → 000 arrow on s.34 is a slide error).
 * The unused states 101 and 111 are don't-cares.
 */
const PROBLEM: Record<number, [number, Bit, number, Bit]> = {
  0b000: [0b000, 1, 0b010, 1],
  0b001: [0b001, 1, 0b100, 1],
  0b010: [0b011, 1, 0b100, 1],
  0b011: [0b001, 0, 0b110, 0],
  0b100: [0b000, 0, 0b011, 1],
  0b110: [0b110, 1, 0b001, 0],
};
const P_VARS = ["A", "B", "C", "X"];
const P_ROWS = Array.from({ length: 16 }, (_, m) => m); // m = A B C X

/** Next-state bit `ff` (0 = A … 2 = C) or the output, per row; X on unused states. */
function problemColumn(which: 0 | 1 | 2 | "Y"): Cell[] {
  return P_ROWS.map((m) => {
    const row = PROBLEM[m >> 1];
    if (!row) return "X";
    const [n0, y0, n1, y1] = row;
    if (which === "Y") return m & 1 ? y1 : y0;
    return bit(m & 1 ? n1 : n0, 2 - which);
  });
}
const P_ONES = (cells: Cell[]) => P_ROWS.filter((m) => cells[m] === 1);
const P_XS = (cells: Cell[]) => P_ROWS.filter((m) => cells[m] === "X");

const problemTable: VariantInput = {
  id: "p3",
  prompt: "Design problem (s.28): flip-flops A, B, C, input X, output Y, from the state diagram. Fill the state table: next A, B, C, then Y. The unused states 101 and 111 are X.",
  spec: {
    kind: "truth-table",
    inputs: P_VARS,
    inputGroups: [{ label: "Present state", span: 3 }, { label: "Input", span: 1 }],
    columns: [
      ...([0, 1, 2] as const).map((ff) => ({ id: `n${P_VARS[ff].toLowerCase()}`, label: P_VARS[ff], group: "Next state", values: problemColumn(ff) })),
      { id: "y", label: "Y", group: "Output", values: problemColumn("Y") },
    ],
  },
  hints: [
    { rung: 2, text: "Not yet. For each row, find its present state on the diagram and follow the arrow for this X." },
    { rung: 3, text: "The arrow's label is X/Y: its X picks the arrow, its Y is the output." },
    { rung: 4, text: "States 101 and 111 never occur: every entry on their rows is X." },
    { rung: 9, text: "{columnLabel} reads {columnValues}, top to bottom." },
  ],
  misconceptions: [{ id: "dz.dontcare-as-zero", title: "X written as 0", nudgeKey: "dz.dontcare-as-zero", detect: { type: "dontcare-as-zero" } }],
  explanation: [
    { id: "s1", say: "Each row is one arrow of the diagram: present state and X in, next state and Y out.", stage: { step: 0, revealed: 0 } },
    { id: "s2", say: "Rows of an unused state are don't-cares: the circuit never reaches them.", stage: { step: 0, revealed: 0 } },
  ],
};

/** K-maps of the D design (s.29), and Y: four sets, don't-cares 10, 11, 14, 15 in each. */
const PROBLEM_MAPS = [
  { id: "pda", label: "DA", cells: problemColumn(0) },
  { id: "pdb", label: "DB", cells: problemColumn(1) },
  { id: "pdc", label: "DC", cells: problemColumn(2) },
  { id: "py", label: "Y", cells: problemColumn("Y") },
];

const problemMapVariant = (m: (typeof PROBLEM_MAPS)[number], k: number): VariantInput =>
  kmapVariant({ id: m.id, vars: P_VARS, minterms: P_ONES(m.cells), dontCares: P_XS(m.cells), given: `${m.label}(A, B, C, X) = Σ(${P_ONES(m.cells).join(", ")}) + d(${P_XS(m.cells).join(", ")})` }, k);

/** Timing (s.34): X at the rising edges, from 000 (owner A2). The D equations drive the trace. */
const PROBLEM_X: Bit[] = [0, 1, 1, 1, 1, 0, 0, 0, 1, 1];
/** The D equations, computed: one minimal cover of each next-state column (don't-cares included). */
const D_EQS = ([0, 1, 2] as const).map((ff) => {
  const cells = problemColumn(ff);
  return formatCover(kmapCovers({ kind: "kmap", vars: P_VARS, minterms: P_ONES(cells), dontCares: P_XS(cells), fill: true })[0], P_VARS);
});

const problemTrace: VariantInput = {
  id: "pt",
  prompt: "The same design, positive-edge triggered, starting at A B C = 0 0 0. At each rising edge give A, B and C just after it.",
  spec: { kind: "timing", edge: "rising", inputs: [{ name: "X", levels: PROBLEM_X.flatMap((v) => [v, v]) }], machine: { stateVars: ["A", "B", "C"], next: D_EQS, initial: [0, 0, 0] } },
  hints: [
    { rung: 2, text: "Not yet. Look only at edge {edgeNumber}: what was X just before it?" },
    { rung: 3, text: "Follow the state diagram: from the state before the edge, take the arrow for this X." },
    { rung: 5, text: "The input at this edge: {inputsAtEdge}.", focus: "inputs-at-edge", highlight: "inputs-at-edge" },
    { rung: 9, text: "Before the edge {stateBefore}; after it {stateAfter}." },
  ],
  misconceptions: [
    { id: "tm.held", title: "A flip-flop held when it should change", nudgeKey: "tm.held-not-applied", detect: { type: "held-not-applied" } },
    { id: "tm.changed", title: "A flip-flop changed on a hold", nudgeKey: "tm.changed-on-hold", detect: { type: "changed-on-hold" } },
    { id: "tm.wrong-edge", title: "Read X at the other edge", nudgeKey: "tm.wrong-edge", detect: { type: "wrong-edge" } },
  ],
  explanation: [
    { id: "s1", say: "Each rising edge follows one arrow of the state diagram, starting from 000.", stage: { revealed: 0 } },
    { id: "s2", say: "X = 0 at the first edge: 000 stays at 000.", stage: { revealed: 1 } },
  ],
};

const problemActivity: Activity = {
  id: "design-problem",
  title: "Design problem: three flip-flops",
  summary: "Practice from the slides: the state table with unused states, K-maps with don't-cares, the timing trace.",
  authority: "DEMO",
  minutes: 30,
  questions: [
    // one fixed problem (s.28–29): exempt from the three-set rule
    { id: "dz.q.problem-table", label: "State table", conceptId: "dz.design", objectiveId: "dz.obj.problem", variants: [problemTable] },
    { id: "dz.q.problem-maps", label: "K-maps", conceptId: "dz.design", objectiveId: "dz.obj.problem", variants: PROBLEM_MAPS.map((m, k) => problemMapVariant(m, k)) },
    { id: "dz.q.problem-trace", label: "Timing trace", conceptId: "dz.design", objectiveId: "dz.obj.problem", variants: [problemTrace] },
  ],
};

/* ---------- topic ---------- */

const stage1: Activity = {
  id: "design-state-table",
  title: "Design 1: the state table",
  summary: "From the specification to the next-state columns.",
  authority: "DEMO",
  minutes: 10,
  questions: [{ id: "dz.q.state-table", label: "Next state", conceptId: "dz.design", objectiveId: "dz.obj.table", variants: COUNTERS.map((c, k) => stateTableVariant(c, k)) }],
};

const stage2: Activity = {
  id: "design-excitation",
  title: "Design 2: flip-flop inputs",
  summary: "Fill each flip-flop input column from its excitation table, with X where either value works.",
  authority: "DEMO",
  minutes: 15,
  questions: [
    { id: "dz.q.t-inputs", label: "T inputs", conceptId: "dz.design", objectiveId: "dz.obj.excitation", variants: COUNTERS.map((c, k) => excitationVariant(c, "T", k)) },
    { id: "dz.q.jk-inputs", label: "JK inputs", conceptId: "dz.design", objectiveId: "dz.obj.excitation", variants: COUNTERS.map((c, k) => excitationVariant(c, "JK", k)) },
  ],
};

const stage3: Activity = {
  id: "design-maps",
  title: "Design 3: one K-map per input",
  summary: "Map each flip-flop input (Xs included), group, and write its equation.",
  authority: "DEMO",
  minutes: 20,
  questions: [
    { id: "dz.q.dt-maps", label: "D and T maps", conceptId: "dz.design", objectiveId: "dz.obj.maps", variants: D_T_MAPS.map((m, k) => mapVariant(m, k)) },
    { id: "dz.q.jk-maps", label: "JK maps", conceptId: "dz.design", objectiveId: "dz.obj.maps", variants: JK_MAPS.map((m, k) => mapVariant(m, k)) },
  ],
};

export const designTopic: TopicInput = {
  id: "design",
  title: "Designing a counter",
  summary: "From a specification to flip-flop equations: the state table, the flip-flop input columns, then one K-map per input.",
  preview: "spec → state table → excitation → K-map → equation",
  concepts: [{ id: "dz.design", title: "Sequential design", summary: "State table from the spec; flip-flop inputs from the excitation table (X where either works); one K-map per input gives its equation." }],
  objectives: [
    { id: "dz.obj.table", conceptId: "dz.design", text: "Fill a state table from a counter's specification." },
    { id: "dz.obj.excitation", conceptId: "dz.design", text: "Fill T and JK input columns from the excitation tables, with don't-cares." },
    { id: "dz.obj.maps", conceptId: "dz.design", text: "Simplify each flip-flop input with a K-map and write its equation." },
    { id: "dz.obj.problem", conceptId: "dz.design", text: "Work a three-flip-flop design problem: state table, K-maps with don't-cares, timing." },
  ],
  activities: [stage1, stage2, stage3, problemActivity],
};

