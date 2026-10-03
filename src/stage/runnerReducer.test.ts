import { describe, expect, it } from "vitest";
import { getActivity } from "@/content";
import { createRunnerReducer, initialRunnerState, currentVariant, type RunnerAction, type RunnerState } from "./runnerReducer";

const activity = getActivity("digital-logic-demo", "number-systems", "decimal-to-binary")!.activity;
const reducer = createRunnerReducer(activity);

function run(actions: RunnerAction[], start = initialRunnerState(activity)): RunnerState {
  return actions.reduce((s, a) => reducer(s, a), start);
}

describe("runner reducer", () => {
  it("grades against content and routes the result through the tutor", () => {
    const s = run([{ type: "OPEN" }, { type: "SUBMIT", answer: { kind: "place-value", digits: [0, 0, 1, 1, 0, 1] } }]);
    expect(s.last?.result).toMatchObject({ correct: false, misconceptionId: "ns.skip-largest" });
    expect(s.tutor.attempts).toBe(1);
    expect(s.expression).toBe("thinking");
    expect(s.message).toContain("32");
    expect(s.hints).toHaveLength(0);
    expect(s.attemptSeq).toBe(1);
  });

  it("collects revealed hints and emits focus effects", () => {
    const s = run([
      { type: "OPEN" },
      { type: "SUBMIT", answer: { kind: "place-value", digits: [0, 0, 0, 0, 0, 0] } },
      { type: "HINT" },
      { type: "HINT" },
      { type: "HINT" },
      { type: "HINT" },
    ]);
    expect(s.hints.map((h) => h.rung)).toEqual([2, 3, 4, 5]);
    expect(s.effects.map((e) => e.type)).toEqual(expect.arrayContaining(["FOCUS", "HIGHLIGHT", "PULSE"]));
    expect(s.effectSeq).toBeGreaterThan(0);
  });

  it("runs Explain Slowly: steps, prediction reveal, then resets for an independent retry", () => {
    let s = run([{ type: "OPEN" }, { type: "SUBMIT", answer: { kind: "place-value", digits: [0, 0, 0, 0, 0, 0] } }, { type: "EXPLAIN" }]);
    expect(s.explanation).toEqual({ step: 0 });
    expect(s.last).toBeUndefined();
    s = reducer(s, { type: "CONTINUE" });
    expect(s.explanation?.step).toBe(1);
    s = reducer(s, { type: "PREDICT", index: 0 });
    expect(s.explanation?.prediction).toMatchObject({ chosenIndex: 0, correct: true });
    expect(s.explanation?.prediction?.reveal).toContain("13 remains");
    expect(s.explanation?.prediction?.reveal).not.toMatch(/\{/);
    s = reducer(s, { type: "PREDICT", index: 1 }); // second prediction ignored
    expect(s.explanation?.prediction?.chosenIndex).toBe(0);
    const steps = currentVariant(activity, s).explanation.length;
    for (let i = 1; i < steps; i++) s = reducer(s, { type: "CONTINUE" });
    expect(s.explanation).toBeNull();
    expect(s.tutor.stage).toBe("await_retry");
    expect(s.interactionKey).toBe(1);
    expect(s.message).toContain("Now you try");
  });

  it("completes a question, moves to the next, and finishes the activity", () => {
    let s = run([{ type: "OPEN" }, { type: "SUBMIT", answer: { kind: "place-value", digits: [1, 0, 1, 1, 0, 1] } }]);
    expect(s.completed).toEqual([true, false]);
    expect(s.done).toBe(false);
    s = reducer(s, { type: "NEXT_QUESTION" });
    expect(s.qIndex).toBe(1);
    expect(s.tutor.attempts).toBe(0);
    s = reducer(s, { type: "SUBMIT", answer: { kind: "numeric", text: "2d" } });
    expect(s.done).toBe(true);
    expect(s.hintsUsedTotal).toBe(0);
  });

  it("retry variation switches to the next variant and resets per-variant state", () => {
    let s = run([{ type: "OPEN" }, { type: "SUBMIT", answer: { kind: "place-value", digits: [0, 0, 0, 0, 0, 0] } }, { type: "HINT" }]);
    s = reducer(s, { type: "RETRY_VARIANT" });
    expect(currentVariant(activity, s).id).toBe("v29");
    expect(s.hints).toEqual([]);
    expect(s.tutor.attempts).toBe(0);
    expect(s.message).toContain("similar");
    // the new variant grades against its own answer
    s = reducer(s, { type: "SUBMIT", answer: { kind: "place-value", digits: [0, 1, 1, 1, 0, 1] } });
    expect(s.last?.result.correct).toBe(true);
  });

  it("ignores submissions while explaining or after completion", () => {
    const done = run([{ type: "OPEN" }, { type: "SUBMIT", answer: { kind: "place-value", digits: [1, 0, 1, 1, 0, 1] } }, { type: "SUBMIT", answer: { kind: "place-value", digits: [0, 0, 0, 0, 0, 0] } }]);
    expect(done.attemptSeq).toBe(1);
    const explaining = run([{ type: "OPEN" }, { type: "SUBMIT", answer: { kind: "place-value", digits: [0, 0, 0, 0, 0, 0] } }, { type: "EXPLAIN" }, { type: "SUBMIT", answer: { kind: "place-value", digits: [1, 0, 1, 1, 0, 1] } }]);
    expect(explaining.attemptSeq).toBe(1);
  });

  it("hesitation unlocks hints before the first attempt", () => {
    const s = run([{ type: "OPEN" }, { type: "HINT" }, { type: "HESITATION", seconds: 60 }, { type: "HINT" }]);
    expect(s.hints).toHaveLength(1);
    expect(s.expression).toBe("neutral");
  });
});
