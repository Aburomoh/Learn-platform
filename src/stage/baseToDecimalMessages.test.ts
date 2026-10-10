import { describe, expect, it } from "vitest";
import { getActivity } from "@/content";
import { VariantSchema, type Activity, type Variant } from "@/content/schema";
import { hasMessage } from "@/tutor";
import { createRunnerReducer, initialRunnerState, type RunnerAction, type RunnerState } from "./runnerReducer";

/** #212: fixtures, not course content; the Chapter 1 base-to-decimal activity gets its own PR. */
const detectors = [
  { id: "b2d.rev", title: "Weights reversed", nudgeKey: "pv.weights-reversed", detect: { type: "weights-reversed" } },
  { id: "b2d.neg", title: "Negative powers wrong", nudgeKey: "pv.negative-powers", detect: { type: "negative-powers-wrong" } },
  { id: "b2d.hex", title: "Hex letter as a digit", nudgeKey: "pv.hex-letter-value", detect: { type: "hex-letter-as-digit" } },
];
const make = (id: string, base: number, number: string): Variant =>
  VariantSchema.parse({
    id,
    prompt: "Convert to decimal.",
    spec: { kind: "base-to-decimal", base, number },
    vars: {},
    hints: [{ rung: 2, text: "Not yet." }],
    explanation: [{ id: "s1", say: "One." }, { id: "s2", say: "Two." }],
    misconceptions: detectors,
  });
const binary = make("v-bin", 2, "101.101");
const hex = make("v-hex", 16, "1A3");

function runOn(v: Variant, actions: RunnerAction[]): RunnerState {
  const a = getActivity("ecet111", "number-systems", "decimal-to-binary")!.activity;
  const activity: Activity = { ...a, questions: [{ ...a.questions[0], variants: [v, { ...v, id: `${v.id}-b` }] }] };
  const r = createRunnerReducer(activity);
  return actions.reduce((s, x) => r(s, x), initialRunnerState(activity));
}
const open: RunnerAction = { type: "OPEN" };
const powers = (p: number[]): RunnerAction => ({ type: "SUBMIT", answer: { kind: "base-to-decimal", step: 0, powers: p } });
const terms = (t: string[]): RunnerAction => ({ type: "SUBMIT", answer: { kind: "base-to-decimal", step: 1, digits: t } });
const sum = (x: string): RunnerAction => ({ type: "SUBMIT", answer: { kind: "base-to-decimal", step: 2, sum: x } });
const goodPowers = [2, 1, 0, -1, -2, -3];
const goodTerms = ["1", "0", "1", "1", "0", "1"]; // the digit values (#597)
const sentences = (m: string) => m.split(/(?<=[.?!])\s/).length;

describe("#212 base to decimal: step lines", () => {
  it("each correct goal names the next one", () => {
    expect(runOn(binary, [open, powers(goodPowers)]).message).toBe("Good. Now each digit times its weight.");
    expect(runOn(binary, [open, powers(goodPowers), terms(goodTerms)]).message).toBe("Good. Now add the terms to get the value.");
  });

  it("a wrong weight or term points at the marked cell for that goal", () => {
    expect(runOn(binary, [open, powers([2, 1, 1, -1, -2, -3])]).message).toBe("Weights not right yet: 1. Check the marked one first: count the places from the point.");
    expect(runOn(binary, [open, powers(goodPowers), terms(["1", "0", "2", "1", "0", "1"])]).message).toBe("Terms not right yet: 1. Check the marked one first: the digit times its weight.");
  });

  it("a wrong sum adds up step by step, without the value", () => {
    const m = runOn(binary, [open, powers(goodPowers), terms(goodTerms), sum("5.5")]).message;
    expect(m).toBe("Not quite. Add the terms one by one, and keep the point where it is.");
    expect(m).not.toContain("5.625");
  });
});

describe("#212 base to decimal: every detector has its own nudge, none gives the answer", () => {
  it("weights-reversed", () => {
    const m = runOn(binary, [open, powers([-3, -2, -1, 0, 1, 2])]).message;
    expect(m).toBe("Power 0 sits just left of the point, or at the right end. The powers grow as you move left.");
    expect(sentences(m)).toBeLessThanOrEqual(2);
  });

  it("negative-powers-wrong asks a question instead of listing the powers", () => {
    const m = runOn(binary, [open, powers([2, 1, 0, 1, 2, 3])]).message;
    expect(m).toBe("After the point the powers keep counting down below 0. Which power comes right after 0?");
  });

  it("hex-letter-as-digit", () => {
    const m = runOn(hex, [open, powers([2, 1, 0]), terms(["1", "1", "3"])]).message; // A used as 1
    expect(m).toBe("The letters A to F stand for 10 to 15. Use that value in the term.");
    expect(m).not.toContain("160");
  });

  it("every nudge and step key resolves", () => {
    for (const d of detectors) expect(hasMessage(d.nudgeKey), d.nudgeKey).toBe(true);
    for (const k of ["wrong.cell.weights", "wrong.cell.terms", "wrong.first.sum", "step.next-terms", "step.next-sum"]) expect(hasMessage(k), k).toBe(true);
  });
});
