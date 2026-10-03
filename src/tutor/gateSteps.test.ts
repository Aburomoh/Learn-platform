import { describe, expect, it } from "vitest";
import { getActivity } from "@/content";
import type { CircuitSpec, Variant } from "@/content/schema";
import { reduce } from "./engine/reduce";
import { initialTutorState, type TutorState } from "./engine/state";
import type { LearningEvent } from "./engine/events";
import type { TutorAction } from "./engine/actions";
import { contextFromVariant } from "./context";
import { gateVars } from "./gateVars";
import { en } from "./messages/en";
import { resolveMessage } from "./messages";

const [v101] = getActivity("ecet111", "logic-gates", "predict-gate-output")!.activity.questions[0].variants;
const spec = v101.spec as CircuitSpec;

/** The circuit variant as a gate walk authors it: step hints that point at the active gate. */
const walk: Variant = {
  ...v101,
  reactions: undefined,
  hints: [
    { rung: 3, text: "{gateRule}", focus: "gate-{gateId}" },
    { rung: 5, text: "Its inputs are {gateInputs}.", focus: "gate-{gateId}", highlight: "gate-{gateId}" },
  ],
};
/** Step vars the stage supplies for gate `i` of n1 → g1 → g2. */
const step = (i: number) => ({ stepNumber: i + 1, gateCount: 3, gateId: ["n1", "g1", "g2"][i], gateName: ["NOT", "AND", "OR"][i] });

function run(events: LearningEvent[], ctx = contextFromVariant(walk, "en", step(1)), start: TutorState = initialTutorState) {
  let state = start;
  const actions: TutorAction[] = [];
  for (const e of events) {
    const r = reduce(state, e, ctx);
    state = r.state;
    actions.push(...r.actions);
  }
  return { state, actions };
}
const says = (a: TutorAction[]) => a.filter((x): x is Extract<TutorAction, { type: "SAY" }> => x.type === "SAY");

describe("gate walk: localised gate wording", () => {
  it("describes the active gate's rule and inputs from the spec", () => {
    expect(gateVars(spec, "n1")).toEqual({ gateRule: en["gate.rule.NOT"], gateAnalogy: en["gate.analogy.NOT"], gateInputs: "B = 0" });
    expect(gateVars(spec, "g1").gateInputs).toBe("A = 1 and the NOT output = 1");
    expect(gateVars(spec, "g2").gateInputs).toBe("the AND output = 1 and C = 1");
    expect(gateVars(spec, "nope")).toEqual({});
  });

  it("adds gate wording to the context only for a circuit step", () => {
    expect(contextFromVariant(walk, "en", step(1)).vars).toMatchObject({ gateId: "g1", gateRule: en["gate.rule.AND"] });
    expect(contextFromVariant(walk).vars).not.toHaveProperty("gateRule");
  });
});

describe("gate walk: step-aware rules", () => {
  it("points hints and the second-wrong focus at the active gate", () => {
    const { actions } = run([{ type: "ANSWER_SUBMITTED", correct: false }, { type: "ANSWER_SUBMITTED", correct: false }, { type: "HINT_REQUESTED" }]);
    expect(actions).toContainEqual({ type: "FOCUS", target: "gate-g1" });
    expect(actions).toContainEqual({ type: "HIGHLIGHT", target: "gate-g1" });
    expect(actions).toContainEqual({ type: "PULSE", target: "gate-g1" });
    expect(actions.some((a) => "target" in a && a.target.includes("{"))).toBe(false);
    expect(says(actions).map((s) => s.text)).toContain("Its inputs are A = 1 and the NOT output = 1.");
  });

  it("names the next gate after a correct gate, and says when it is the last", () => {
    const next = run([{ type: "STEP_COMPLETED" }], contextFromVariant(walk, "en", step(1)));
    expect(says(next.actions).at(-1)).toMatchObject({ messageKey: "step.next-gate", text: "Good. Now the AND gate." });
    const last = run([{ type: "STEP_COMPLETED" }], contextFromVariant(walk, "en", step(2)));
    expect(says(last.actions).at(-1)?.messageKey).toBe("step.last-gate");
    expect(says(last.actions).at(-1)?.text).toContain("OR gate");
  });

  it("keeps a content-authored step reaction, and plain steps keep the generic line", () => {
    const authored = { ...walk, reactions: { stepNext: "Now {gateName}." } };
    expect(says(run([{ type: "STEP_COMPLETED" }], contextFromVariant(authored, "en", step(1))).actions).at(-1)?.text).toBe("Now AND.");
    expect(says(run([{ type: "STEP_COMPLETED" }], contextFromVariant(walk)).actions).at(-1)?.messageKey).toBe("step.next");
  });

  it("a whole walk leaves no unfilled slots", () => {
    let state: TutorState = initialTutorState;
    const all: TutorAction[] = [];
    for (let i = 0; i < 3; i++) {
      const ctx = contextFromVariant(walk, "en", step(i));
      const events: LearningEvent[] = [{ type: "ANSWER_SUBMITTED", correct: false }, { type: "ANSWER_SUBMITTED", correct: false }, { type: "HINT_REQUESTED" }];
      const r = run(i < 2 ? events : [...events, { type: "ANSWER_SUBMITTED", correct: true }], ctx, state);
      all.push(...r.actions);
      state = i < 2 ? run([{ type: "STEP_COMPLETED" }], contextFromVariant(walk, "en", step(i + 1)), r.state).state : r.state;
    }
    expect(state.stage).toBe("complete");
    for (const s of says(all)) expect(s.text, s.messageKey).not.toMatch(/\{[a-zA-Z0-9_]+\}|missing message/);
  });
});

describe("catalog locale fallback", () => {
  it("an unknown locale or missing key falls back to en", () => {
    expect(resolveMessage("gate.rule.AND", {}, "xx")).toBe(en["gate.rule.AND"]);
    expect(gateVars(spec, "g1", "xx").gateRule).toBe(en["gate.rule.AND"]);
  });
});
