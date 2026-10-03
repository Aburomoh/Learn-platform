import { describe, expect, it } from "vitest";
import { getActivity } from "@/content";
import { createRunnerReducer, initialRunnerState, currentVariant, type RunnerAction, type RunnerState } from "./runnerReducer";

const activity = getActivity("ecet111", "number-systems", "decimal-to-binary")!.activity;
const reducer = createRunnerReducer(activity);
const step = (i: number, quotient: number, remainder: number): RunnerAction => ({ type: "SUBMIT", answer: { kind: "repeated-division", step: i, quotient, remainder } });
/** The whole 26 chain answered correctly. */
const chain26: RunnerAction[] = [step(0, 13, 0), step(1, 6, 1), step(2, 3, 0), step(3, 1, 1), step(4, 0, 1)];

function run(actions: RunnerAction[], start = initialRunnerState(activity)): RunnerState {
  return actions.reduce((s, a) => reducer(s, a), start);
}

describe("runner reducer: walked division", () => {
  it("a correct step opens the next one, with a short tutor reaction naming the next division", () => {
    const s = run([{ type: "OPEN" }, step(0, 13, 0)]);
    expect(s.stepIndex).toBe(1);
    expect(s.completed[0]).toBe(false);
    expect(s.tutor.stage).toBe("await_answer");
    expect(s.expression).toBe("encouraging");
    expect(s.message).toBe("Good. Now 13 ÷ 2.");
    expect(s.attemptSeq).toBe(0); // intermediate steps are not recorded as separate attempts
  });

  it("a wrong step gives a step-specific nudge and does not advance", () => {
    const s = run([{ type: "OPEN" }, step(0, 13, 0), step(1, 6, 0)]);
    expect(s.stepIndex).toBe(1);
    expect(s.last?.result).toMatchObject({ correct: false, misconceptionId: "div.remainder" });
    expect(s.message).toContain("13");
    expect(s.expression).toBe("thinking");
    expect(s.hints).toHaveLength(0);
  });

  it("hints use the current step's numbers and restart on the next step", () => {
    let s = run([{ type: "OPEN" }, step(0, 13, 0), step(1, 9, 9), { type: "HINT" }]);
    expect(s.hints[0].text).toContain("13 ÷ 2");
    s = run([step(1, 6, 1)], s);
    expect(s.stepIndex).toBe(2);
    expect(s.hints).toEqual([]);
    expect(s.tutor.hintLevel).toBe(0);
    expect(s.tutor.hintsEverUsed).toBe(true);
    s = run([step(2, 0, 0), { type: "HINT" }], s);
    expect(s.hints[0].text).toContain("6 ÷ 2");
  });

  it("the last step completes the question; hints used earlier are remembered", () => {
    const clean = run([{ type: "OPEN" }, ...chain26]);
    expect(clean.completed[0]).toBe(true);
    expect(clean.message).toContain("division stops");
    expect(clean.hintsUsedTotal).toBe(0);
    const hinted = run([{ type: "OPEN" }, step(0, 1, 1), { type: "HINT" }, ...chain26]);
    expect(hinted.hintsUsedTotal).toBe(1);
  });

  it("Explain Slowly walks the chain, then resets to step 0 for an independent retry", () => {
    let s = run([{ type: "OPEN" }, step(0, 13, 0), step(1, 0, 0), { type: "EXPLAIN" }]);
    expect(s.explanation).toEqual({ step: 0 });
    s = reducer(s, { type: "CONTINUE" });
    s = reducer(s, { type: "PREDICT", index: 0 });
    expect(s.explanation?.prediction).toMatchObject({ correct: true });
    expect(s.explanation?.prediction?.reveal).toContain("26 ÷ 2 = 13");
    const steps = currentVariant(activity, s).explanation.length;
    for (let i = 1; i < steps; i++) {
      if (currentVariant(activity, s).explanation[s.explanation!.step].ask && !s.explanation!.prediction) s = reducer(s, { type: "PREDICT", index: 0 });
      s = reducer(s, { type: "CONTINUE" });
    }
    expect(s.explanation).toBeNull();
    expect(s.stepIndex).toBe(0);
    expect(s.tutor.stage).toBe("await_retry");
  });

  it("moves through read-off, octal and hex, then finishes", () => {
    let s = run([{ type: "OPEN" }, ...chain26, { type: "NEXT_QUESTION" }]);
    expect(s.qIndex).toBe(1);
    s = reducer(s, { type: "SUBMIT", answer: { kind: "numeric", text: "01011" } });
    expect(s.last?.result.misconceptionId).toBe("ns.read-reversed");
    expect(s.message).toContain("MSB");
    s = run([{ type: "SUBMIT", answer: { kind: "numeric", text: "11010" } }, { type: "NEXT_QUESTION" }, { type: "SUBMIT", answer: { kind: "numeric", text: "32" } }, { type: "NEXT_QUESTION" }, { type: "SUBMIT", answer: { kind: "numeric", text: "1a" } }], s);
    expect(s.done).toBe(false); // feedback and the Finish button are shown first
    s = reducer(s, { type: "NEXT_QUESTION" });
    expect(s.done).toBe(true);
    expect(s.completed).toEqual([true, true, true, true]);
  });

  it("retry variation switches to the 37 chain and resets step state", () => {
    let s = run([{ type: "OPEN" }, ...chain26, { type: "RETRY_VARIANT" }]);
    expect(currentVariant(activity, s).id).toBe("v37");
    expect(s.stepIndex).toBe(0);
    s = reducer(s, step(0, 18, 1));
    expect(s.stepIndex).toBe(1);
    expect(s.message).toBe("Good. Now 18 ÷ 2.");
  });

  it("ignores submissions while explaining or after completion", () => {
    const done = run([{ type: "OPEN" }, ...chain26, step(0, 13, 0)]);
    expect(done.stepIndex).toBe(4);
    const explaining = run([{ type: "OPEN" }, step(0, 1, 1), { type: "EXPLAIN" }, step(0, 13, 0)]);
    expect(explaining.stepIndex).toBe(0);
    expect(explaining.tutor.stage).toBe("explaining");
  });

  it("hesitation unlocks hints before the first attempt", () => {
    const s = run([{ type: "OPEN" }, { type: "HINT" }, { type: "HESITATION", seconds: 60 }, { type: "HINT" }]);
    expect(s.hints).toHaveLength(1);
  });
});
