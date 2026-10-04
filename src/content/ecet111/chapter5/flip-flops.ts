/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 5 Part I, flip-flops (content pack ch5-parti §3): characteristic tables for SR,
 * JK, D and T, one row first (#296). Q(t+1) is computed from the characteristic equations with the
 * Boolean module (JQ′ + K′Q, D, T ⊕ Q; SR as S + R′Q with S = R = 1 not allowed).
 */
import type { CourseInput, VariantInput } from "../../schema";
import { envFor, evaluate, parseBool } from "../../boolean";

type TopicInput = CourseInput["modules"][number]["topics"][number];
type Activity = TopicInput["activities"][number];
type Bit = 0 | 1;
type FlipFlop = "SR" | "JK" | "D" | "T";

const INPUTS: Record<FlipFlop, string[]> = { SR: ["S", "R"], JK: ["J", "K"], D: ["D"], T: ["T"] };
/** The characteristic equations as the slides write them (s.26, s.30, s.35); SR has none in the deck. */
export const EQUATION: Record<FlipFlop, string> = { SR: "S + R'Q", JK: "JQ' + K'Q", D: "D", T: "T ⊕ Q" };

/** Q(t+1) from the inputs and Q(t); undefined for SR with S = R = 1 (not allowed, s.16). */
export function nextQ(ff: FlipFlop, inputs: Bit[], q: Bit): Bit | undefined {
  if (ff === "SR" && inputs[0] === 1 && inputs[1] === 1) return undefined;
  const vars = [...INPUTS[ff], "Q"];
  return evaluate(parseBool(EQUATION[ff], { vars }), envFor(vars, [...inputs, q].reduce<number>((a, b) => a * 2 + b, 0)));
}

function rotate<T>(xs: T[], k: number): T[] {
  const r = k % xs.length;
  return [...xs.slice(r), ...xs.slice(0, r)];
}

/** Each flip-flop's rule in words, as its table states it (s.16, s.26, s.30, s.35). */
const RULE: Record<FlipFlop, string> = {
  SR: "0 0 keeps Q, 1 0 sets it, 0 1 resets it, and 1 1 is not allowed (X).",
  JK: "0 0 keeps Q, 1 0 sets it, 0 1 resets it, and 1 1 complements it.",
  D: "Q(t+1) is whatever D is.",
  T: "T = 0 keeps Q, T = 1 complements it.",
};

const inputText = (ff: FlipFlop, inputs: Bit[]) => INPUTS[ff].map((n, i) => `${n} = ${inputs[i]}`).join(", ");

/* ---------- one row first (predict before the table) ---------- */

/** Type, inputs, Q(t): JK 1 1 toggles, T = 1 complements, an SR set, a D copy. */
const ROW_SETS: [FlipFlop, Bit[], Bit][] = [["JK", [1, 1], 0], ["T", [1], 1], ["SR", [1, 0], 0], ["D", [0], 1]];

function rowVariant([ff, inputs, q]: [FlipFlop, Bit[], Bit], k: number): VariantInput {
  const next = nextQ(ff, inputs, q)!;
  const options = rotate([{ id: "q0", text: "Q(t+1) = 0" }, { id: "q1", text: "Q(t+1) = 1" }, { id: "invalid", text: "Not allowed" }], k + 1);
  const misconceptions: VariantInput["misconceptions"] = [];
  if (ff === "JK" && inputs[0] === 1 && inputs[1] === 1) misconceptions.push({ id: "ff.jk-11-invalid", title: "JK 1 1 taken as not allowed (that is SR)", nudgeKey: "ff.jk-11-invalid", detect: { type: "option", optionId: "invalid" } });
  if (ff === "T" && inputs[0] !== next) misconceptions.push({ id: "ff.t-as-d", title: "T copied into Q, as a D flip-flop", nudgeKey: "ff.t-as-d", detect: { type: "option", optionId: `q${inputs[0]}` } });
  return {
    id: `r${ff.toLowerCase()}`,
    prompt: `A ${ff} flip-flop has Q(t) = ${q}. At the active clock edge ${inputText(ff, inputs)}. What is Q(t+1)?`,
    spec: { kind: "multiple-choice", options, correctOptionId: `q${next}` },
    hints: [
      { rung: 2, text: `Not yet. Recall the ${ff} table: what does this input combination do?` },
      { rung: 3, text: ff === "JK" ? "JK: 0 0 no change, 1 0 set, 0 1 reset, 1 1 toggle." : ff === "T" ? "T: 0 keeps Q, 1 complements it." : ff === "SR" ? "SR: 0 0 no change, 1 0 set, 0 1 reset, 1 1 not allowed." : "D: Q(t+1) is whatever D is." },
      { rung: 9, text: `Q(t+1) = ${next}.` },
    ],
    misconceptions,
    explanation: [
      { id: "s1", say: "At the active edge the flip-flop looks at its inputs and its present Q, and moves to Q(t+1)." },
      {
        id: "s2",
        say: `${ff}, with ${inputText(ff, inputs)}.`,
        ask: { prompt: "Does Q change on this edge?", options: k % 2 ? ["No", "Yes"] : ["Yes", "No"], correctIndex: (next !== q) === (k % 2 === 0) ? 0 : 1, afterCorrect: "Right.", afterWrong: next !== q ? "Yes, it changes." : "No, it stays." },
      },
      { id: "s3", say: `So Q goes from ${q} to ${next}.` },
    ],
  };
}

/* ---------- the tables, Q(t+1) one column ---------- */

function tableVariant(ff: FlipFlop): VariantInput {
  const vars = [...INPUTS[ff], "Q"];
  const rows = 2 ** vars.length;
  const values = Array.from({ length: rows }, (_, r) => {
    const bits = vars.map((_, i) => ((r >> (vars.length - 1 - i)) & 1) as Bit);
    return nextQ(ff, bits.slice(0, -1), bits.at(-1)!) ?? ("X" as const);
  });
  return {
    id: `t${ff.toLowerCase()}`,
    prompt: `Fill the ${ff} flip-flop's characteristic table: Q(t+1) for each row of ${vars.join(", ")}${ff === "SR" ? " (X where S = R = 1 is not allowed)" : ""}.`,
    spec: { kind: "truth-table", inputs: vars, columns: [{ id: "next", label: "Q(t+1)", values }] },
    hints: [
      { rung: 2, text: "Not yet. Go row by row: read the inputs, then the present Q." },
      { rung: 3, text: ff === "JK" ? "0 0 keeps Q, 1 0 gives 1, 0 1 gives 0, 1 1 gives Q′." : ff === "T" ? "T = 0 keeps Q; T = 1 gives Q′." : ff === "SR" ? "0 0 keeps Q, 1 0 gives 1, 0 1 gives 0; 1 1 is X." : "Q(t+1) copies D, whatever Q was." },
      { rung: 4, text: "Look at the rows in pairs: Q = 0, then Q = 1, for the same inputs." },
      { rung: 9, text: `Q(t+1) reads ${values.join(" ")}, top to bottom.` },
    ],
    misconceptions: [],
    explanation: [
      { id: "s1", say: "Each row is one clock edge: the inputs and Q(t) before it, Q(t+1) after it.", stage: { step: 0, revealed: 0 } },
      {
        id: "s2",
        say: `Take the row ${INPUTS[ff].map(() => 1).join(" ")} with Q = 0.`,
        // one table, one set: the walk never fills rows, so a retry is never copying (Pedagogy on #406)
        stage: { step: 0, revealed: 0 },
        ask: (() => {
          const v = values[rows - 2];
          const opts = ["0", "1", "X"].filter((o) => ff === "SR" || o !== "X");
          return { prompt: "What is Q(t+1) on that row?", options: opts, correctIndex: opts.indexOf(String(v)), afterCorrect: "Yes.", afterWrong: `It is ${v}.` };
        })(),
      },
      { id: "s3", say: `Now each row the same way: ${RULE[ff]}`, stage: { step: 0, revealed: 0 } },
    ],
  };
}

export const flipFlopTablesActivity: Activity = {
  id: "flip-flop-tables",
  title: "Characteristic tables",
  summary: "SR, JK, D and T: one row first, then each table, one clock edge per row.",
  authority: "DEMO",
  minutes: 15,
  questions: [
    { id: "ff.q.row", label: "One row first", conceptId: "ff.flip-flop", objectiveId: "ff.obj.table", variants: ROW_SETS.map((s, k) => rowVariant(s, k)) },
    // each flip-flop has one fixed table: exempt from the three-set rule (content.test)
    ...(["SR", "JK", "D", "T"] as FlipFlop[]).map((ff) => ({ id: `ff.q.${ff.toLowerCase()}`, label: `${ff} table`, conceptId: "ff.flip-flop", objectiveId: "ff.obj.table", variants: [tableVariant(ff)] })),
  ],
};

export const flipFlopsTopic: TopicInput = {
  id: "flip-flops",
  title: "Flip-flops",
  summary: "Edge-triggered SR, JK, D and T flip-flops: what each does at the active edge, as a table and as an equation.",
  preview: "J K = 1 1 → Q toggles",
  concepts: [{ id: "ff.flip-flop", title: "Flip-flop", summary: "At the active clock edge Q(t+1) follows the inputs: SR set/reset, JK adds toggle, D copies, T complements on 1." }],
  objectives: [{ id: "ff.obj.table", conceptId: "ff.flip-flop", text: "Give Q(t+1) of SR, JK, D and T flip-flops for every input and present state." }],
  activities: [flipFlopTablesActivity],
};
