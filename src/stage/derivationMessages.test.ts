import { describe, expect, it } from "vitest";
import { getActivity } from "@/content";
import { VariantSchema, type Activity, type Variant } from "@/content/schema";
import { hasMessage } from "@/tutor";
import { createRunnerReducer, initialRunnerState, type RunnerAction, type RunnerState } from "./runnerReducer";

/** #223: fixtures, not course content; the Chapter 2 activities choose their own nudgeKeys. */
const detectors = [
  { id: "d.slip", title: "Algebra slip", nudgeKey: "drv.line-not-equivalent", detect: { type: "line-not-equivalent" } },
  { id: "d.skip", title: "Skipped a step", nudgeKey: "drv.line-skipped", detect: { type: "line-skipped" } },
  { id: "d.other", title: "Another path", nudgeKey: "drv.line-other", detect: { type: "line-other" } },
];
const make = (id: string, lineMode: string): Variant =>
  VariantSchema.parse({
    id,
    prompt: "Simplify.",
    spec: {
      kind: "derivation",
      vars: ["A", "B"],
      start: "A + A'B",
      lineMode,
      // A + A′B → (A + A′)(A + B) → 1(A + B) → A + B   (distributive, or-not, and-1)
      lines: [
        { law: "distributive", expr: "(A + A')(A + B)", lawOptions: ["distributive", "absorb", "de-morgan"], wrongLines: [{ id: "w1", expr: "AA' + AB" }] },
        { law: "or-not", expr: "1(A + B)", lawOptions: ["or-not", "or-self", "and-not"], wrongLines: [{ id: "w2", expr: "0(A + B)" }] },
        { law: "and-1", expr: "A + B", lawOptions: ["and-1", "and-0", "or-1"], wrongLines: [{ id: "w3", expr: "A" }] },
      ],
    },
    vars: {},
    hints: [{ rung: 2, text: "Not yet." }],
    explanation: [{ id: "s1", say: "One." }, { id: "s2", say: "Two." }],
    misconceptions: detectors,
  });
const typed = make("v-type", "type");
const choose = make("v-choose", "choose");

function runOn(v: Variant, actions: RunnerAction[], from?: RunnerState): RunnerState {
  const a = getActivity("ecet111", "number-systems", "decimal-to-binary")!.activity;
  const activity: Activity = { ...a, questions: [{ ...a.questions[0], variants: [v, { ...v, id: `${v.id}-b` }] }] };
  const r = createRunnerReducer(activity);
  return actions.reduce((s, x) => r(s, x), from ?? initialRunnerState(activity));
}
const open: RunnerAction = { type: "OPEN" };
const law = (step: number, l: string): RunnerAction => ({ type: "SUBMIT", answer: { kind: "derivation", step, law: l as never } });
const line = (step: number, text: string): RunnerAction => ({ type: "SUBMIT", answer: { kind: "derivation", step, line: text } });
const sentences = (m: string) => m.split(/(?<=[.?!])\s/).length;

describe("#223 derivation: step lines", () => {
  it("after the law, the line it gives; after the line, the next law", () => {
    const afterLaw = runOn(typed, [open, law(0, "distributive")]);
    expect(afterLaw.message).toBe("Good. Now the line that law gives.");
    expect(runOn(typed, [line(1, "(A + A')(A + B)")], afterLaw).message).toBe("Good. Now the law for the next line.");
  });

  it("a wrong law without a detector asks which part changed, without naming the law", () => {
    const m = runOn(typed, [open, law(0, "absorb")]).message;
    expect(m).toBe("Not quite. Compare the line before with the next line: which part changed?");
    expect(m.toLowerCase()).not.toContain("distributive");
  });

  it("a wrong chosen line without a misconception id applies just the named law", () => {
    const s = runOn(choose, [open, law(0, "distributive")]);
    expect(runOn(choose, [line(1, "w1")], s).message).toBe("Not quite. Apply just the law you named to the line before.");
  });
});

describe("#223 derivation: every detector has its own short nudge, none gives the line", () => {
  const atLine = () => runOn(typed, [open, law(0, "distributive")]);
  const typeLine = (text: string) => runOn(typed, [line(1, text)], atLine()).message;

  it("line-not-equivalent (an algebra slip)", () => {
    const m = typeLine("A + B'");
    expect(m).toBe("That line does not equal the line before it. Check the law you applied.");
    expect(sentences(m)).toBeLessThanOrEqual(2);
  });

  it("line-skipped (equivalent, but a later line)", () => {
    expect(typeLine("1(A + B)")).toBe("That is true, but it skips a step. Apply only this one law to the line before.");
  });

  it("line-other (valid algebra, not this law's step)", () => {
    expect(typeLine("A + A'B")).toBe("That is valid algebra, but it is not the step this law gives. Apply only the law you named.");
  });

  it("every key resolves", () => {
    for (const d of detectors) expect(hasMessage(d.nudgeKey), d.nudgeKey).toBe(true);
    for (const k of ["wrong.first.law", "wrong.first.line", "step.next-line", "step.next-law"]) expect(hasMessage(k), k).toBe(true);
  });
});
