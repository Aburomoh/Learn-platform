import { describe, expect, it } from "vitest";
import { getActivity } from "@/content";
import { createRunnerReducer, initialRunnerState, currentVariant, type RunnerAction, type RunnerState } from "./runnerReducer";

const activity = getActivity("ecet111", "logic-gates", "predict-gate-output")!.activity;
const reducer = createRunnerReducer(activity);
const gate = (step: number, output: 0 | 1): RunnerAction => ({ type: "SUBMIT", answer: { kind: "circuit-predict", step, output } });

function run(actions: RunnerAction[], start = initialRunnerState(activity)): RunnerState {
  return actions.reduce((s, a) => reducer(s, a), start);
}

describe("runner reducer: gate-by-gate circuit walk", () => {
  it("a correct gate opens the next one and names it", () => {
    const s = run([{ type: "OPEN" }, gate(0, 1)]);
    expect(s.stepIndex).toBe(1);
    expect(s.last).toBeUndefined();
    expect(s.message).toBe("Good. Now the AND gate.");
    expect(s.tutor.stage).toBe("await_answer");
    expect(s.completed[0]).toBe(false);
  });

  it("a wrong gate gets a nudge about that gate and only that gate is retried", () => {
    let s = run([{ type: "OPEN" }, gate(0, 1), gate(1, 0)]);
    expect(s.stepIndex).toBe(1);
    expect(s.last?.result).toMatchObject({ correct: false, misconceptionId: "lg.rule-and" });
    expect(s.message).toBe("Look at the AND gate again. It needs both inputs to be 1.");
    s = run([gate(1, 1)], s);
    expect(s.stepIndex).toBe(2);
  });

  it("hints describe the gate being asked and point at it, without giving later gates away", () => {
    let s = run([{ type: "OPEN" }, gate(0, 1), gate(1, 0), { type: "HINT" }, { type: "HINT" }, { type: "HINT" }, { type: "HINT" }]);
    expect(s.hints.map((h) => h.rung)).toEqual([2, 3, 4, 5]);
    expect(s.hints[1].text).toBe("AND gives 1 only when both inputs are 1.");
    expect(s.hints[3].text).toBe("This is the gate. Its inputs are A = 1 and the NOT output = 1.");
    expect(s.effects).toContainEqual({ type: "HIGHLIGHT", target: "gate-g1" });
    expect(s.hints.map((h) => h.text).join(" ")).not.toMatch(/OR|Y =/);
    // the ladder restarts on the next gate
    s = run([gate(1, 1), gate(2, 0), { type: "HINT" }], s);
    expect(s.hints).toHaveLength(1);
    expect(s.hints[0].text).toContain("OR gate");
  });

  it("the output gate completes the question", () => {
    const s = run([{ type: "OPEN" }, gate(0, 1), gate(1, 1), gate(2, 1)]);
    expect(s.tutor.stage).toBe("complete");
    expect(s.completed[0]).toBe(true);
    expect(s.hintsUsedTotal).toBe(0);
  });

  it("the retry variant walks the same order with its own values", () => {
    let s = run([{ type: "OPEN" }, gate(0, 1), gate(1, 1), gate(2, 1), { type: "RETRY_VARIANT" }]);
    expect(currentVariant(activity, s).id).toBe("v000");
    expect(s.stepIndex).toBe(0);
    s = run([gate(0, 1), gate(1, 0), gate(2, 0)], s);
    expect(s.tutor.stage).toBe("complete");
  });

  it("Explain Slowly resets the walk to the first gate", () => {
    let s = run([{ type: "OPEN" }, gate(0, 1), gate(1, 0), { type: "EXPLAIN" }]);
    const steps = currentVariant(activity, s).explanation.length;
    for (let i = 0; i < steps; i++) {
      if (currentVariant(activity, s).explanation[s.explanation!.step].ask && !s.explanation!.prediction) s = reducer(s, { type: "PREDICT", index: 0 });
      s = reducer(s, { type: "CONTINUE" });
    }
    expect(s.explanation).toBeNull();
    expect(s.stepIndex).toBe(0);
  });
});
