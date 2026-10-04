/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 5 Part I, flip-flops (content pack ch5-parti §3): characteristic tables for SR,
 * JK, D and T, one row first (#296). Q(t+1) is computed from the characteristic equations with the
 * Boolean module (JQ′ + K′Q, D, T ⊕ Q; SR as S + R′Q with S = R = 1 not allowed); then the
 * characteristic equations read from the tables and used on one edge (#297).
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
        stage: { step: 0, revealed: rows - 2 },
        ask: (() => {
          const v = values[rows - 2];
          const opts = ["0", "1", "X"].filter((o) => ff === "SR" || o !== "X");
          return { prompt: "What is Q(t+1) on that row?", options: opts, correctIndex: opts.indexOf(String(v)), afterCorrect: "Yes.", afterWrong: `It is ${v}.` };
        })(),
      },
      { id: "s3", say: `${ff}: Q(t+1) = ${EQUATION[ff].replace(/'/g, "′")}${ff === "SR" ? ", with S = R = 1 not allowed" : ""}.`, stage: { step: 0, revealed: rows } },
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

/* ---------- characteristic equations (#297): read Q(t+1) from the table, then use it on one edge ---------- */

/** Each equation as an expression question over its inputs and Q; the minterms are the table's 1-rows. */
function equationVariant(ff: Exclude<FlipFlop, "SR">): VariantInput {
  const vars = [...INPUTS[ff], "Q"];
  const ones = Array.from({ length: 2 ** vars.length }, (_, r) => r).filter((r) => {
    const bits = vars.map((_, i) => ((r >> (vars.length - 1 - i)) & 1) as Bit);
    return nextQ(ff, bits.slice(0, -1), bits.at(-1)!) === 1;
  });
  const shown = EQUATION[ff].replace(/'/g, "′");
  return {
    id: `e${ff.toLowerCase()}`,
    prompt: `From the ${ff} table, write Q(t+1) as an expression in ${vars.join(", ")}, as simple as you can.`,
    spec: ff === "JK" ? { kind: "expression", vars, minterms: ones, form: "sop", maxLiterals: 4 } : { kind: "expression", vars, minterms: ones },
    hints: [
      { rung: 2, text: "Not yet. Look at the rows where Q(t+1) = 1." },
      { rung: 3, text: ff === "JK" ? "Q(t+1) is 1 when J sets a Q that was 0, or when K does not reset a Q that was 1." : ff === "T" ? "Q(t+1) is 1 when exactly one of T and Q is 1." : "Q(t+1) is 1 exactly when D is 1." },
      { rung: 4, text: ff === "JK" ? "Write one product for 'Q was 0 and J = 1', one for 'Q was 1 and K = 0'." : ff === "T" ? "Which gate gives 1 when its two inputs differ?" : "Does Q(t) matter at all?" },
      { rung: 9, text: `Q(t+1) = ${shown}.` },
    ],
    misconceptions: [
      { id: "ex.complement", title: "Wrote the 0-rows", nudgeKey: "sp.zero-rows", detect: { type: "expression-complement" } },
      { id: "ex.unreadable", title: "Unreadable", nudgeKey: "expr.unreadable", detect: { type: "expression-unreadable" } },
      ...(ff === "JK" ? [{ id: "ex.not-simplified", title: "Right function, not simplified", nudgeKey: "ff.not-simplified", detect: { type: "expression-not-simplified" as const } }] : []),
    ],
    explanation: [
      { id: "s1", say: `The table's 1-rows are where Q(t+1) = 1. Read them in words first.` },
      {
        id: "s2",
        say: ff === "JK" ? "With Q = 0, J decides; with Q = 1, K decides (K = 1 resets)." : ff === "T" ? "T = 1 flips Q; T = 0 keeps it." : "Q(t+1) copies D on every row.",
        ask: ff === "JK"
          ? { prompt: "With Q(t) = 1, which input value keeps Q at 1?", options: ["K = 0", "K = 1"], correctIndex: 0, afterCorrect: "Yes: K′Q.", afterWrong: "K = 0 keeps it: that is K′Q." }
          : ff === "T"
            ? { prompt: "With T = 1 and Q = 1, what is Q(t+1)?", options: ["1", "0"], correctIndex: 1, afterCorrect: "Yes, it flips to 0.", afterWrong: "T = 1 flips it: 0." }
            : { prompt: "With D = 1 and Q = 0, what is Q(t+1)?", options: ["0", "1"], correctIndex: 1, afterCorrect: "Yes: D.", afterWrong: "It copies D: 1." },
      },
      { id: "s3", say: `So Q(t+1) = ${shown}.` },
    ],
  };
}

/**
 * Next state from the equation: type, inputs, Q(t). With J ≠ K the swapped form (JQ + KQ′) differs
 * only when Q = 0, so every JK set has Q = 0 and the slip is always its own answer (Reviewer on #408).
 */
const NEXT_SETS: [FlipFlop, Bit[], Bit][] = [["JK", [1, 0], 0], ["T", [1], 0], ["JK", [0, 1], 0]];
const SWAPPED = parseBool("JQ + KQ'", { vars: ["J", "K", "Q"] });

function nextVariant([ff, inputs, q]: [FlipFlop, Bit[], Bit], k: number): VariantInput {
  const next = nextQ(ff, inputs, q)!;
  const swapped = ff === "JK" ? evaluate(SWAPPED, envFor(["J", "K", "Q"], [...inputs, q].reduce<number>((a, b) => a * 2 + b, 0))) : undefined;
  const options = k % 2 ? [{ id: "q1", text: "1" }, { id: "q0", text: "0" }] : [{ id: "q0", text: "0" }, { id: "q1", text: "1" }];
  return {
    id: `x${ff.toLowerCase()}${inputs.join("")}${q}`,
    prompt: `Q(t+1) = ${EQUATION[ff].replace(/'/g, "′")}. With ${inputText(ff, inputs)} and Q(t) = ${q}, what is Q(t+1)?`,
    spec: { kind: "multiple-choice", options, correctOptionId: `q${next}` },
    hints: [
      { rung: 2, text: "Not yet. Put the values into the equation, one term at a time." },
      { rung: 3, text: `Q(t) = ${q}, so Q′ = ${1 - q}.` },
      { rung: 9, text: `Q(t+1) = ${next}.` },
    ],
    misconceptions: swapped !== undefined && swapped !== next ? [{ id: "ff.equation-swapped", title: "Used JQ + KQ′", nudgeKey: "ff.equation-swapped", detect: { type: "option", optionId: `q${swapped}` } }] : [],
    explanation: [
      { id: "s1", say: "Substitute the inputs and Q(t) into the equation; each term is 0 or 1." },
      {
        id: "s2",
        say: ff === "JK" ? `JQ′ = ${inputs[0]}·${1 - q}.` : `T ⊕ Q = ${inputs[0]} ⊕ ${q}.`,
        ask: ff === "JK"
          ? { prompt: "What is JQ′?", options: k % 2 ? ["1", "0"] : ["0", "1"], correctIndex: (inputs[0] & (1 - q)) === (k % 2 ? 1 : 0) ? 0 : 1, afterCorrect: "Right.", afterWrong: `${inputs[0]}·${1 - q} = ${inputs[0] & (1 - q)}.` }
          : { prompt: `What is ${inputs[0]} ⊕ ${q}?`, options: k % 2 ? ["1", "0"] : ["0", "1"], correctIndex: (inputs[0] ^ q) === (k % 2 ? 1 : 0) ? 0 : 1, afterCorrect: "Right.", afterWrong: `They differ, so ${inputs[0] ^ q}.` },
      },
      { id: "s3", say: `So Q(t+1) = ${next}.` },
    ],
  };
}

export const flipFlopEquationsActivity: Activity = {
  id: "flip-flop-equations",
  title: "Characteristic equations",
  summary: "Read Q(t+1) from each table as an equation, then use it on one edge.",
  authority: "DEMO",
  minutes: 12,
  questions: [
    // one fixed equation per flip-flop: exempt from the three-set rule (content.test)
    ...(["JK", "T", "D"] as const).map((ff) => ({ id: `ff.q.eq-${ff.toLowerCase()}`, label: `${ff} equation`, conceptId: "ff.flip-flop", objectiveId: "ff.obj.equation", variants: [equationVariant(ff)] })),
    { id: "ff.q.next", label: "Next state", conceptId: "ff.flip-flop", objectiveId: "ff.obj.equation", variants: NEXT_SETS.map((s, k) => nextVariant(s, k)) },
  ],
};

export const flipFlopsTopic: TopicInput = {
  id: "flip-flops",
  title: "Flip-flops",
  summary: "Edge-triggered SR, JK, D and T flip-flops: what each does at the active edge, as a table and as an equation.",
  preview: "J K = 1 1 → Q toggles",
  concepts: [{ id: "ff.flip-flop", title: "Flip-flop", summary: "At the active clock edge Q(t+1) follows the inputs: SR set/reset, JK adds toggle, D copies, T complements on 1." }],
  objectives: [
    { id: "ff.obj.table", conceptId: "ff.flip-flop", text: "Give Q(t+1) of SR, JK, D and T flip-flops for every input and present state." },
    { id: "ff.obj.equation", conceptId: "ff.flip-flop", text: "Write the JK, D and T characteristic equations and use them for one edge." },
  ],
  activities: [flipFlopTablesActivity, flipFlopEquationsActivity],
};
