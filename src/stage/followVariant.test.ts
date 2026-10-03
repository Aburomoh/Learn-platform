import { describe, expect, it } from "vitest";
import { getActivity } from "@/content";
import { createRunnerReducer, currentVariant, initialRunnerState, type RunnerState } from "./runnerReducer";

const activity = getActivity("ecet111", "binary-arithmetic", "binary-addition")!.activity;
const reducer = createRunnerReducer(activity);
const q = (id: string) => activity.questions.findIndex((x) => x.id === id);
const add = q("ba.q.add");

/** State with the addition question open on variant `v`, finished or not. */
function onAddition(v: number, finished: boolean): RunnerState {
  const s = initialRunnerState(activity);
  const vIndex = [...s.vIndex];
  vIndex[add] = v;
  const completed = s.completed.map((_, i) => i < add || (finished && i === add));
  return { ...s, qIndex: add, vIndex, completed };
}

describe("#141: later challenges follow the number set the student worked on", () => {
  it("finishing the addition on the second set makes the checks use the same numbers", () => {
    let s = reducer(onAddition(1, true), { type: "NEXT_QUESTION" });
    expect(s.qIndex).toBe(q("ba.q.check-a"));
    expect(currentVariant(activity, s).id).toBe(currentVariant(activity, onAddition(1, true)).id);
    // and the chain carries on through the following checks
    s = { ...s, completed: s.completed.map((c, i) => c || i === s.qIndex) };
    s = reducer(s, { type: "NEXT_QUESTION" });
    expect(currentVariant(activity, s).id).toBe("v1011");
  });

  it("the first set is kept when the student stayed on it", () => {
    const s = reducer(onAddition(0, true), { type: "NEXT_QUESTION" });
    expect(currentVariant(activity, s).id).toBe("v1101");
  });

  it("an unfinished question passes nothing on", () => {
    const s = reducer(onAddition(1, false), { type: "NEXT_QUESTION" });
    expect(s.vIndex[q("ba.q.check-a")]).toBe(0);
  });

  it("a question with its own variants (the single-bit rules) does not move the addition's numbers", () => {
    const start = initialRunnerState(activity);
    const vIndex = start.vIndex.map((v, i) => (i === add - 1 ? 1 : v));
    const s = reducer({ ...start, qIndex: add - 1, vIndex, completed: start.completed.map((_, i) => i < add) }, { type: "NEXT_QUESTION" });
    expect(s.qIndex).toBe(add);
    expect(currentVariant(activity, s).id).toBe("v1101");
  });
});
