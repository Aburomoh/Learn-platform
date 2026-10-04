import { describe, expect, it } from "vitest";
import { getActivity } from "@/content";
import { VariantSchema, type Activity, type Variant } from "@/content/schema";
import { hasMessage } from "@/tutor";
import { createRunnerReducer, initialRunnerState, type RunnerAction, type RunnerState } from "./runnerReducer";

/** #223: fixtures, not course content; the Chapter 2 activities choose their own nudgeKeys. */
const detectors = [
  { id: "ex.unreadable", title: "Unreadable", nudgeKey: "expr.unreadable", detect: { type: "expression-unreadable" } },
  { id: "ex.form", title: "Wrong form", nudgeKey: "expr.wrong-form", detect: { type: "expression-wrong-form" } },
  { id: "ex.simpler", title: "Not simplified", nudgeKey: "expr.not-simplified", detect: { type: "expression-not-simplified" } },
  { id: "ex.complement", title: "Complement", nudgeKey: "expr.complement", detect: { type: "expression-complement" } },
  { id: "ex.swapped", title: "AND/OR swapped", nudgeKey: "expr.and-or-swapped", detect: { type: "expression-and-or-swapped" } },
];
const make = (id: string, spec: object): Variant =>
  VariantSchema.parse({ id, prompt: "Write F.", spec: { kind: "expression", vars: ["A", "B", "C"], ...spec }, vars: {}, hints: [{ rung: 2, text: "Not yet." }], explanation: [{ id: "s1", say: "One." }, { id: "s2", say: "Two." }], misconceptions: detectors });
// F = AB + AB′C simplifies to A(B + C): in SOP it is AB + AC (4 literals)
const sop = make("v-sop", { target: "AB + AB'C", form: "sop", maxLiterals: 4 });
const product = make("v-ab", { target: "A + B", form: "any" });

function runOn(v: Variant, actions: RunnerAction[]): RunnerState {
  const a = getActivity("ecet111", "number-systems", "decimal-to-binary")!.activity;
  const activity: Activity = { ...a, questions: [{ ...a.questions[0], variants: [v, { ...v, id: `${v.id}-b` }] }] };
  const r = createRunnerReducer(activity);
  return actions.reduce((s, x) => r(s, x), initialRunnerState(activity));
}
const type = (text: string): RunnerAction => ({ type: "SUBMIT", answer: { kind: "expression", text } });
const open: RunnerAction = { type: "OPEN" };
const sentences = (m: string) => m.split(/(?<=[.?!])\s/).length;

describe("#223 expression: every detector has its own short nudge, none gives the answer", () => {
  it("unreadable text", () => {
    const m = runOn(sop, [open, type("A +* (B")]).message;
    expect(m).toBe("I cannot read that. Use only the variables in the question, a prime (') for NOT and + for OR.");
    expect(sentences(m)).toBeLessThanOrEqual(2);
  });

  it("the right function in the wrong form", () => {
    const m = runOn(sop, [open, type("A(B + C)")]).message; // product form of the sum of products
    expect(m).toBe("The function is right, but it is not in the form the question asks for. Look at the form it names.");
  });

  it("the right function, not simplified: the PM's 'Correct function, but it can be simpler'", () => {
    const m = runOn(sop, [open, type("AB + AB'C")]).message;
    expect(m).toBe("Correct function, but it can be simpler. Look for terms you can combine.");
    expect(runOn(sop, [open, type("AB + AB'C")]).completed[0]).toBe(false);
  });

  it("the complement of the function", () => {
    expect(runOn(product, [open, type("A'B'")]).message).toBe("That is the opposite of what is asked. Check where a bar (NOT) is missing or extra.");
  });

  it("AND and OR swapped", () => {
    expect(runOn(product, [open, type("AB")]).message).toBe("Look at the AND and OR signs again. AND needs every part to be 1; OR needs just one.");
  });

  it("the simplified answer is accepted, and every key resolves with no unfilled slot", () => {
    expect(runOn(sop, [open, type("AB + AC")]).completed[0]).toBe(true);
    for (const d of detectors) {
      expect(hasMessage(d.nudgeKey), d.nudgeKey).toBe(true);
    }
  });
});
