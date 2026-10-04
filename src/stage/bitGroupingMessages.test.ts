import { describe, expect, it } from "vitest";
import { getActivity } from "@/content";
import { VariantSchema, type Activity, type Variant } from "@/content/schema";
import { hasMessage } from "@/tutor";
import { createRunnerReducer, initialRunnerState, type RunnerAction, type RunnerState } from "./runnerReducer";

/** #212: fixtures, not course content; the Chapter 1 activities choose their own nudgeKeys. */
const detectors = [
  { id: "g.unpadded", title: "Bits not padded", nudgeKey: "ns.bits-unpadded", detect: { type: "bits-unpadded" } },
  { id: "g.reversed", title: "Bits reversed", nudgeKey: "ns.bits-reversed", detect: { type: "bits-reversed" } },
  { id: "g.fraction", title: "Fraction from the right end", nudgeKey: "ns.fraction-from-right-end", detect: { type: "fraction-from-right-end" } },
];
const make = (id: string, spec: object): Variant =>
  VariantSchema.parse({ id, prompt: "Group the bits.", spec: { kind: "bit-grouping", ...spec }, vars: {}, hints: [{ rung: 2, text: "Not yet." }], explanation: [{ id: "s1", say: "One." }, { id: "s2", say: "Two." }], misconceptions: detectors });
// octal 26 = 010 110 ; to-bits writes each digit's three bits
const toBits = make("v-bits", { bits: "010110", groupSize: 3, answer: "26", direction: "to-bits" });
// 101.1011 octal: whole 101, fraction grouped from the point (101 100)
const withPoint = make("v-point", { bits: "101.1011", groupSize: 3, answer: "5.54" });

function runOn(v: Variant, actions: RunnerAction[], from?: RunnerState): RunnerState {
  const a = getActivity("ecet111", "number-systems", "decimal-to-binary")!.activity;
  const activity: Activity = { ...a, questions: [{ ...a.questions[0], variants: [v, { ...v, id: `${v.id}-b` }] }] };
  const r = createRunnerReducer(activity);
  return actions.reduce((s, x) => r(s, x), from ?? initialRunnerState(activity));
}
const open: RunnerAction = { type: "OPEN" };
const bits = (step: number, group: string): RunnerAction => ({ type: "SUBMIT", answer: { kind: "bit-grouping", step, group } });
const marked = (groups: string[]): RunnerAction => ({ type: "SUBMIT", answer: { kind: "bit-grouping", step: 0, groups } });
const digit = (step: number, d: string): RunnerAction => ({ type: "SUBMIT", answer: { kind: "bit-grouping", step, digit: d } });
const sentences = (m: string) => m.split(/(?<=[.?!])\s/).length;

describe("#212 bit grouping: step lines", () => {
  it("digits to bits: each correct group names the next digit", () => {
    expect(runOn(toBits, [open, bits(0, "010")]).message).toBe("Good. Now the bits for 6.");
  });

  it("bits to digits: each correct step names the group to convert", () => {
    const s = runOn(withPoint, [open, marked(["101", ".", "101", "100"])]);
    expect(s.message).toBe("Good. Now the digit for 101.");
    expect(runOn(withPoint, [digit(1, "5")], s).message).toBe("Good. Now the digit for 101.");
  });
});

describe("#212 bit grouping: every new detector has its own short nudge, none gives the answer", () => {
  it("bits-unpadded", () => {
    const m = runOn(toBits, [open, bits(0, "10")]).message; // 2 written as 10, not 010
    expect(m).toBe("Right value, but a group of 3 bits keeps its leading zeros. Write all 3 bits.");
    expect(m).not.toContain("010");
    expect(sentences(m)).toBeLessThanOrEqual(2);
  });

  it("bits-reversed", () => {
    const m = runOn(toBits, [open, bits(0, "010"), bits(1, "011")]).message; // 6 = 110 written as 011
    expect(m).toBe("Those bits are in reverse order. The leftmost bit carries the biggest weight.");
    expect(m).not.toContain("110");
  });

  it("fraction-from-right-end", () => {
    const m = runOn(withPoint, [open, marked(["101", ".", "001", "011"])]).message; // fraction padded on the left
    expect(m).toBe("After the point, the groups start at the point and go right. Add zeros on the right if the last group is short.");
  });

  it("every key resolves with no unfilled slot", () => {
    for (const d of detectors) expect(hasMessage(d.nudgeKey), d.nudgeKey).toBe(true);
    for (const k of ["step.next-digit", "step.next-bits"]) expect(hasMessage(k), k).toBe(true);
  });
});
