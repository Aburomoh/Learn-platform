/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 5 Part I, timing diagrams (#298, content pack ch5-parti §4). One goal per active
 * edge: Q just after it. Initial Q is always stated, and no input changes on an asked edge (the
 * slides' exercises break both rules, so the platform uses its own short diagrams; DECISIONS S3).
 * The slides' two worked diagrams (s.17–20 SR, s.32–33 D) are used as given. Q is computed by the
 * timing kind from the characteristic equations.
 */
import type { CourseInput, VariantInput } from "../../schema";

type TopicInput = CourseInput["modules"][number]["topics"][number];
type Activity = TopicInput["activities"][number];
type Bit = 0 | 1;
type FlipFlop = "SR" | "JK" | "D" | "T";

const INPUT_NAMES: Record<FlipFlop, string[]> = { SR: ["S", "R"], JK: ["J", "K"], D: ["D"], T: ["T"] };

/**
 * Column levels from one value per active edge, held so nothing changes on an active edge.
 * Rising edges start columns 1, 3, 5 …: each value fills a (low, high) pair. Falling edges start
 * columns 2, 4 …: the first column is low, then each value fills a (high, low) pair.
 */
function levels(edge: "rising" | "falling", perEdge: Bit[]): Bit[] {
  const pairs = perEdge.flatMap((v) => [v, v]);
  return edge === "rising" ? pairs : [perEdge[0], ...pairs];
}

interface TimingSet {
  id: string;
  ff: FlipFlop;
  edge: "rising" | "falling";
  initialQ: Bit;
  /** One row per input, one value per active edge. */
  perEdge: Bit[][];
  source?: string;
}

const RISING: TimingSet[] = [
  { id: "sr17", ff: "SR", edge: "rising", initialQ: 0, perEdge: [[0, 1, 0, 1, 1], [0, 0, 1, 0, 0]], source: "s.17–20" },
  { id: "d32", ff: "D", edge: "rising", initialQ: 1, perEdge: [[0, 1, 0, 1, 1, 0, 0]], source: "s.32–33" },
  { id: "jkr", ff: "JK", edge: "rising", initialQ: 0, perEdge: [[1, 1, 0, 1, 0], [0, 1, 1, 1, 0]] },
];

const FALLING: TimingSet[] = [
  { id: "df", ff: "D", edge: "falling", initialQ: 0, perEdge: [[1, 1, 0, 1, 0]] },
  { id: "tf", ff: "T", edge: "falling", initialQ: 1, perEdge: [[1, 0, 1, 1, 0]] },
  { id: "jkf", ff: "JK", edge: "falling", initialQ: 1, perEdge: [[0, 1, 1, 0, 1], [1, 1, 0, 0, 0]] },
];

const RULE: Record<FlipFlop, string> = {
  SR: "S = 1 sets Q, R = 1 resets it, and 0 0 keeps it.",
  JK: "J = 1 sets Q, K = 1 resets it, 1 1 complements it, and 0 0 keeps it.",
  D: "Q takes the value of D.",
  T: "T = 1 complements Q; T = 0 keeps it.",
};

function timingVariant(set: TimingSet, k: number): VariantInput {
  const edgeWord = set.edge === "rising" ? "rising (0 → 1)" : "falling (1 → 0)";
  return {
    id: set.id,
    prompt: `A ${set.edge === "rising" ? "positive" : "negative"}-edge ${set.ff} flip-flop starts with Q = ${set.initialQ}. At each ${edgeWord} clock edge, give Q just after the edge.`,
    spec: {
      kind: "timing",
      edge: set.edge,
      flipFlop: set.ff,
      initialQ: set.initialQ,
      inputs: INPUT_NAMES[set.ff].map((name, i) => ({ name, levels: levels(set.edge, set.perEdge[i]) })),
    },
    hints: [
      { rung: 2, text: "Not yet. Look only at edge {edgeNumber}: what were the inputs just before it?" },
      { rung: 3, text: RULE[set.ff] },
      { rung: 4, text: "What was Q just before this edge? Start from that." },
      { rung: 5, text: "The inputs at this edge: {inputsAtEdge}.", focus: "inputs-at-edge", highlight: "inputs-at-edge" },
      { rung: 6, text: "Only active edges change Q; between them it holds." },
      { rung: 9, text: "Before the edge {stateBefore}; after it {stateAfter}." },
    ],
    misconceptions: [
      { id: "tm.wrong-edge", title: "Read the inputs at the other edge", nudgeKey: "tm.wrong-edge", detect: { type: "wrong-edge" } },
      { id: "tm.input-after-edge", title: "Read the inputs after the edge", nudgeKey: "tm.input-after-edge", detect: { type: "input-after-edge" } },
      { id: "tm.jk-toggle-missed", title: "JK 1 1 held instead of toggling", nudgeKey: "tm.jk-toggle-missed", detect: { type: "jk-toggle-missed" } },
      { id: "tm.t-as-d", title: "T copied into Q", nudgeKey: "ff.t-as-d", detect: { type: "t-as-d" } },
      { id: "tm.inputs-swapped", title: "Set and reset swapped", nudgeKey: "tm.inputs-swapped", detect: { type: "inputs-swapped" } },
      { id: "tm.held", title: "Q held when the inputs change it", nudgeKey: "tm.held-not-applied", detect: { type: "held-not-applied" } },
      { id: "tm.changed", title: "Q changed on a hold", nudgeKey: "tm.changed-on-hold", detect: { type: "changed-on-hold" } },
    ],
    explanation: [
      { id: "s1", say: `Circle the ${set.edge} edges first: only they change Q. Between them, Q holds.`, stage: { revealed: 0 } },
      {
        id: "s2",
        say: "At each active edge, read the inputs just before it and apply the table to the Q you have.",
        stage: { revealed: 0 },
        ask: { prompt: "Does Q change on the falling edges?", options: k % 2 ? ["Yes", "No"] : ["No", "Yes"], correctIndex: (set.edge === "rising") === (k % 2 === 0) ? 0 : 1, afterCorrect: "Right.", afterWrong: set.edge === "rising" ? "No: this flip-flop acts on rising edges only." : "Yes: this one acts on falling edges." },
      },
      { id: "s3", say: `${RULE[set.ff]} Edge by edge, Q builds up from Q = ${set.initialQ}.`, stage: { revealed: 1 } },
    ],
  };
}

const timingActivity: Activity = {
  id: "timing-diagrams",
  title: "Timing diagrams",
  summary: "Q after each active edge: rising edges first, then falling.",
  authority: "DEMO",
  minutes: 20,
  questions: [
    { id: "tm.q.rising", label: "Rising edges", conceptId: "tm.timing", objectiveId: "tm.obj.timing", variants: RISING.map((s, k) => timingVariant(s, k)) },
    { id: "tm.q.falling", label: "Falling edges", conceptId: "tm.timing", objectiveId: "tm.obj.timing", variants: FALLING.map((s, k) => timingVariant(s, k)) },
  ],
};

export const timingTopic: TopicInput = {
  id: "timing",
  title: "Timing diagrams",
  summary: "Draw Q under a clock: at each active edge read the inputs just before it, apply the flip-flop's table, and hold Q until the next active edge.",
  preview: "edge ↑ → read inputs → Q",
  concepts: [{ id: "tm.timing", title: "Timing diagram", summary: "Q changes only at active edges (rising or falling), from the inputs just before the edge; it holds in between." }],
  objectives: [{ id: "tm.obj.timing", conceptId: "tm.timing", text: "Give Q after each active clock edge for SR, JK, D and T flip-flops, rising and falling." }],
  activities: [timingActivity],
};
