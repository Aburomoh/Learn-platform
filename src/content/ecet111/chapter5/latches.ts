/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 5 Part I, latches (#295, content pack ch5-parti §2): the NAND SR latch (Set and
 * Reset active low, 0 0 invalid) and the gated SR latch (En = 0 holds). One output per question;
 * truth from the latch equations through the Boolean module, never authored.
 */
import type { CourseInput, VariantInput } from "../../schema";
import { envFor, evaluate, parseBool } from "../../boolean";

type TopicInput = CourseInput["modules"][number]["topics"][number];
type Activity = TopicInput["activities"][number];
type Bit = 0 | 1;
type Outcome = "q0" | "q1" | "invalid";

/** NAND latch: Set = 0 sets, Reset = 0 resets, 1 1 holds; 0 0 is invalid (both outputs 1, s.9). */
const NAND = parseBool("Set' + Reset·Q", { vars: ["Set", "Reset", "Q"] });
/** Gated SR latch (s.12–13): En = 1 acts as SR (1 0 set, 0 1 reset, 0 0 hold, 1 1 invalid); En = 0 holds. */
const GATED = parseBool("En(S + R'Q) + En'Q", { vars: ["En", "S", "R", "Q"] });

const bitsOf = (bits: Bit[]) => bits.reduce<number>((acc, b) => acc * 2 + b, 0);

export function nandLatch(set: Bit, reset: Bit, q: Bit): Outcome {
  if (set === 0 && reset === 0) return "invalid";
  return evaluate(NAND, envFor(["Set", "Reset", "Q"], bitsOf([set, reset, q]))) ? "q1" : "q0";
}

export function gatedLatch(en: Bit, s: Bit, r: Bit, q: Bit): Outcome {
  if (en === 1 && s === 1 && r === 1) return "invalid";
  return evaluate(GATED, envFor(["En", "S", "R", "Q"], bitsOf([en, s, r, q]))) ? "q1" : "q0";
}

const TEXT: Record<Outcome, string> = { q0: "Q = 0", q1: "Q = 1", invalid: "Invalid" };
const OUTCOMES: Outcome[] = ["q0", "q1", "invalid"];

function rotate<T>(xs: T[], k: number): T[] {
  const r = k % xs.length;
  return [...xs.slice(r), ...xs.slice(0, r)];
}

const outcomeOptions = (k: number) => rotate(OUTCOMES.map((o) => ({ id: o, text: TEXT[o] })), k);

/* ---------- NAND SR latch ---------- */

/** Set, Reset, Q before. Four sets: set, reset, hold, and the invalid 0 0. */
const NAND_SETS: [Bit, Bit, Bit][] = [[0, 1, 0], [1, 0, 1], [1, 1, 0], [0, 0, 1]];

function nandVariant([set, reset, q]: [Bit, Bit, Bit], k: number): VariantInput {
  const right = nandLatch(set, reset, q);
  // the same pair read as an active-high SR latch (1 sets, 1 resets, 0 0 holds, 1 1 invalid)
  const activeHigh: Outcome = set === 1 && reset === 1 ? "invalid" : set === 1 ? "q1" : reset === 1 ? "q0" : q ? "q1" : "q0";
  const misconceptions: VariantInput["misconceptions"] = [];
  if (set === 0 && reset === 0) misconceptions.push({ id: "lt.nand-00-hold", title: "0 0 taken as no change", nudgeKey: "lt.nand-00-hold", detect: { type: "option", optionId: q ? "q1" : "q0" } });
  else if (activeHigh !== right) misconceptions.push({ id: "lt.active-high", title: "Set and Reset read as active high", nudgeKey: "lt.active-high", detect: { type: "option", optionId: activeHigh } });
  return {
    id: `n${set}${reset}${q}`,
    prompt: `A NAND SR latch holds Q = ${q}. Now Set = ${set} and Reset = ${reset}. What happens to Q?`,
    spec: { kind: "multiple-choice", options: outcomeOptions(k + 1), correctOptionId: right },
    hints: [
      { rung: 2, text: "Not yet. On the NAND latch, Set and Reset act when they are 0, not 1." },
      { rung: 3, text: "Set = 0 makes Q = 1; Reset = 0 makes Q = 0; both at 1 keeps Q." },
      { rung: 4, text: "What do both inputs at 0 do to the two NAND outputs?" },
      { rung: 9, text: right === "invalid" ? "Set = Reset = 0 is invalid: both outputs go to 1." : `${TEXT[right]}.` },
    ],
    misconceptions,
    explanation: [
      { id: "s1", say: "A NAND gate outputs 1 whenever one of its inputs is 0. So on this latch a 0 does the work: Set and Reset are active low." },
      {
        id: "s2",
        say: `Here Set = ${set} and Reset = ${reset}.`,
        ask: { prompt: "Is either input at 0?", options: k % 2 ? ["No", "Yes"] : ["Yes", "No"], correctIndex: (set === 0 || reset === 0) === (k % 2 === 0) ? 0 : 1, afterCorrect: "Right.", afterWrong: set === 0 || reset === 0 ? "Yes: at least one input is 0." : "No: both are 1, so nothing acts." },
      },
      { id: "s3", say: right === "invalid" ? "Both at 0 force both outputs to 1, so Q and Q′ are no longer complements: invalid." : set === 1 && reset === 1 ? `Both at 1: no change, Q stays ${q}.` : set === 0 ? "Set = 0 sets the latch: Q = 1." : "Reset = 0 resets the latch: Q = 0." },
    ],
  };
}

/* ---------- gated SR latch ---------- */

/** En, S, R, Q before: En = 0 holds whatever S says; then a set and a reset. */
const GATED_SETS: [Bit, Bit, Bit, Bit][] = [[0, 1, 0, 0], [1, 1, 0, 0], [1, 0, 1, 1]];

function gatedVariant([en, s, r, q]: [Bit, Bit, Bit, Bit], k: number): VariantInput {
  const right = gatedLatch(en, s, r, q);
  const ignored = gatedLatch(1, s, r, q); // the inputs applied as if En were 1
  return {
    id: `g${en}${s}${r}${q}`,
    prompt: `A gated SR latch holds Q = ${q}. Now En = ${en}, S = ${s} and R = ${r}. What is Q?`,
    spec: { kind: "multiple-choice", options: outcomeOptions(k + 2), correctOptionId: right },
    hints: [
      { rung: 2, text: "Not yet. Look at En first." },
      { rung: 3, text: "En = 0 blocks S and R: the latch keeps its value. En = 1 lets them act: S sets, R resets." },
      { rung: 9, text: `${TEXT[right]}.` },
    ],
    misconceptions: en === 0 && ignored !== right ? [{ id: "lt.enable-ignored", title: "S and R applied while En = 0", nudgeKey: "lt.enable-ignored", detect: { type: "option", optionId: ignored } }] : [],
    explanation: [
      { id: "s1", say: "The two front NAND gates pass S and R to the latch only while En = 1." },
      {
        id: "s2",
        say: `En = ${en}.`,
        ask: { prompt: "Can S and R change the latch now?", options: k % 2 ? ["No", "Yes"] : ["Yes", "No"], correctIndex: (en === 1) === (k % 2 === 0) ? 0 : 1, afterCorrect: "Right.", afterWrong: en ? "Yes: En = 1 lets them through." : "No: En = 0 blocks them." },
      },
      { id: "s3", say: en === 0 ? `So Q stays ${q}.` : s === 1 ? "S = 1 sets it: Q = 1." : "R = 1 resets it: Q = 0." },
    ],
  };
}

const latchActivity: Activity = {
  id: "latches",
  title: "Latches",
  summary: "The NAND SR latch, where 0 does the work, then the gated latch, where En decides.",
  authority: "DEMO",
  minutes: 10,
  questions: [
    { id: "lt.q.nand", label: "NAND latch", conceptId: "lt.latch", objectiveId: "lt.obj.latch", variants: NAND_SETS.map((s, k) => nandVariant(s, k)) },
    { id: "lt.q.gated", label: "Gated latch", conceptId: "lt.latch", objectiveId: "lt.obj.latch", variants: GATED_SETS.map((s, k) => gatedVariant(s, k)) },
  ],
};

export const latchesTopic: TopicInput = {
  id: "latches",
  title: "Latches",
  summary: "A latch stores one bit. On the NAND SR latch a 0 sets or resets, and 0 0 is invalid; a gated latch listens only while En = 1.",
  preview: "Set = 0 → Q = 1",
  concepts: [{ id: "lt.latch", title: "SR latch", summary: "NAND latch: Set = 0 → Q = 1, Reset = 0 → Q = 0, 1 1 no change, 0 0 invalid. Gated: En = 0 holds." }],
  objectives: [{ id: "lt.obj.latch", conceptId: "lt.latch", text: "Give the output of a NAND SR latch and a gated SR latch for an input pair, invalid input included." }],
  activities: [latchActivity],
};
