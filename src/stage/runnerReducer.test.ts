import { describe, expect, it } from "vitest";
import { getActivity } from "@/content";
import { createRunnerReducer, initialRunnerState, resumeRunnerState, currentVariant, type RunnerAction, type RunnerState } from "./runnerReducer";
import type { Activity } from "@/content/schema";

const activity = getActivity("ecet111", "number-systems", "decimal-to-binary")!.activity;
const reducer = createRunnerReducer(activity);
const step = (i: number, quotient: number, remainder: number): RunnerAction => ({ type: "SUBMIT", answer: { kind: "repeated-division", step: i, quotient, remainder } });
/** The whole 26 chain answered correctly. */
const chain26: RunnerAction[] = [step(0, 13, 0), step(1, 6, 1), step(2, 3, 0), step(3, 1, 1), step(4, 0, 1)];

function run(actions: RunnerAction[], start = initialRunnerState(activity)): RunnerState {
  return actions.reduce((s, a) => reducer(s, a), start);
}

/** Walks a running Explain Slowly to its end, answering each prediction. */
function explainAll(s: RunnerState, r = reducer, a: Activity = activity): RunnerState {
  while (s.explanation) {
    const ask = currentVariant(a, s).explanation[s.explanation.step].ask;
    if (ask && !s.explanation.prediction) s = r(s, { type: "PREDICT", index: ask.correctIndex });
    s = r(s, { type: "CONTINUE" });
  }
  return s;
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

  it("Explain Slowly walks the chain, then retries on new numbers from step 0", () => {
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
    expect(s.vIndex[0]).toBe(1);
    expect(currentVariant(activity, s).id).toBe("v37");
    expect(s.tutor).toMatchObject({ stage: "await_answer", attempts: 0, hintLevel: 0, hintsEverUsed: true });
    expect(s.hints).toEqual([]);
    expect(s.message).toContain("new numbers");
  });

  it("#42: the explained numbers cannot complete the question after Explain Slowly", () => {
    let s = run([{ type: "OPEN" }, step(0, 1, 1), { type: "EXPLAIN" }]);
    while (s.explanation) {
      const ask = currentVariant(activity, s).explanation[s.explanation.step].ask;
      if (ask && !s.explanation.prediction) s = reducer(s, { type: "PREDICT", index: ask.correctIndex });
      s = reducer(s, { type: "CONTINUE" });
    }
    // Type back the walked 26 chain: the first step is already wrong for the new number.
    s = run(chain26, s);
    expect(s.completed[0]).toBe(false);
    expect(s.last?.result.correct).toBe(false);
    expect(s.stepIndex).toBe(0);
  });

  it("#80: explaining twice never retries on the variant explained last", () => {
    let s = explainAll(run([{ type: "OPEN" }, step(0, 1, 1), { type: "EXPLAIN" }]));
    expect(currentVariant(activity, s).id).toBe("v37");
    s = explainAll(run([step(0, 1, 1), { type: "EXPLAIN" }], s));
    expect(s.explained[0]).toEqual(["v26", "v37"]);
    expect(currentVariant(activity, s).id).toBe("v26"); // all explained: still switches
  });

  it("#80: with three variants, an unexplained one is always preferred", () => {
    const q = activity.questions[0];
    const three: Activity = { ...activity, questions: [{ ...q, variants: [...q.variants, { ...q.variants[0], id: "v26b" }] }, ...activity.questions.slice(1)] };
    const r = createRunnerReducer(three);
    const go = (s: RunnerState, actions: RunnerAction[]) => actions.reduce((x, a) => r(x, a), s);
    const finish = (s: RunnerState) => explainAll(s, r, three);
    const id = (s: RunnerState) => currentVariant(three, s).id;
    // explain v26 → v37; skip ahead to v26b; explain v26b → v37 (not yet explained), not v26
    let s = finish(go(initialRunnerState(three), [{ type: "OPEN" }, step(0, 1, 1), { type: "EXPLAIN" }]));
    expect(id(s)).toBe("v37");
    s = go(s, [{ type: "RETRY_VARIANT" }]);
    expect(id(s)).toBe("v26b");
    s = finish(go(s, [step(0, 1, 1), { type: "EXPLAIN" }]));
    expect(id(s)).toBe("v37");
    s = finish(go(s, [step(0, 1, 1), { type: "EXPLAIN" }]));
    expect(s.explained[0].sort()).toEqual(["v26", "v26b", "v37"]);
  });

  it("moves through read-off, octal and hex, then finishes", () => {
    let s = run([{ type: "OPEN" }, ...chain26, { type: "NEXT_QUESTION" }]);
    expect(s.qIndex).toBe(1);
    s = reducer(s, { type: "SUBMIT", answer: { kind: "numeric", text: "01011" } });
    expect(s.last?.result.misconceptionId).toBe("ns.read-reversed");
    expect(s.message).toContain("MSB");
    s = run([{ type: "SUBMIT", answer: { kind: "numeric", text: "11010" } }, { type: "NEXT_QUESTION" }], s);
    // Octal and hex are walked one goal at a time (#44): mark the groups, then one digit per group.
    const grouping = (step: number, input: { groups?: string[]; digit?: string }): RunnerAction => ({ type: "SUBMIT", answer: { kind: "bit-grouping", step, ...input } });
    s = reducer(s, grouping(0, { groups: ["110", "10"] }));
    expect(s.last?.result.misconceptionId).toBe("ns.group-from-left");
    s = run([grouping(0, { groups: ["011", "010"] })], s);
    expect(s.stepIndex).toBe(1);
    s = run([grouping(1, { digit: "3" }), grouping(2, { digit: "2" }), { type: "NEXT_QUESTION" }], s);
    s = run([grouping(0, { groups: ["0001", "1010"] }), grouping(1, { digit: "1" }), grouping(2, { digit: "a" })], s);
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

describe("resume at the first unfinished challenge (#119)", () => {
  const ids = activity.questions.map((q) => q.id);

  it("starts at challenge 1 with nothing finished", () => {
    expect(resumeRunnerState(activity, [])).toEqual(initialRunnerState(activity));
  });

  it("keeps finished challenges and opens the first unfinished one, on its first variant and step", () => {
    const s = resumeRunnerState(activity, ids.slice(0, 2));
    expect(s.qIndex).toBe(2);
    expect(s.completed).toEqual(ids.map((_, i) => i < 2));
    expect(s.vIndex).toEqual(ids.map(() => 0));
    expect(s.stepIndex).toBe(0);
    expect(s.done).toBe(false);
    // the tutor opens the challenge as usual and the runner carries on to the end from there
    const opened = reducer(s, { type: "OPEN" });
    expect(opened.tutor.stage).toBe("await_answer");
    expect(currentVariant(activity, opened).id).toBe(activity.questions[2].variants[0].id);
  });

  it("resumes past a gap: an earlier unfinished challenge comes first", () => {
    expect(resumeRunnerState(activity, [ids[0], ids[2]]).qIndex).toBe(1);
    // challenge 1 unfinished, 2 and 3 finished: resume at 1, and after it go straight to 4
    let s = resumeRunnerState(activity, [ids[1], ids[2]]);
    expect(s.qIndex).toBe(0);
    expect(s.completed).toEqual([false, true, true, false]);
    s = run([{ type: "OPEN" }, ...chain26, { type: "NEXT_QUESTION" }], s);
    expect(s.qIndex).toBe(3);
    expect(s.done).toBe(false);
  });

  it("with everything finished, or unknown ids, it is a fresh start (Review)", () => {
    expect(resumeRunnerState(activity, ids)).toEqual(initialRunnerState(activity));
    expect(resumeRunnerState(activity, ["not-a-question"])).toEqual(initialRunnerState(activity));
  });
});
