import { describe, expect, it } from "vitest";
import { getActivity } from "@/content";
import type { Activity, Variant } from "@/content/schema";
import { addition1101 } from "@/content/fixtures/columnAddition";
import { complement100101, complement110010 } from "@/content/fixtures/onesComplement";
import { placeValue45 } from "@/content/fixtures/placeValue45";
import { hasMessage } from "@/tutor";
import { createRunnerReducer, initialRunnerState, type RunnerAction, type RunnerState } from "./runnerReducer";

/** One-question activity around fixture variants (fixtures are not course content). */
function activityOf(...variants: Variant[]): Activity {
  const base = getActivity("ecet111", "number-systems", "decimal-to-binary")!.activity;
  return { ...base, questions: [{ ...base.questions[0], variants }] };
}
function runOn(activity: Activity, actions: RunnerAction[]): RunnerState {
  const r = createRunnerReducer(activity);
  return actions.reduce((s, a) => r(s, a), initialRunnerState(activity));
}
const col = (step: number, sum: number, carry?: number): RunnerAction => ({ type: "SUBMIT", answer: { kind: "column-addition", step, sum, carry } });
const bits = (text: string): RunnerAction => ({ type: "SUBMIT", answer: { kind: "numeric", text } });

describe("#37 column addition: step-aware tutor lines", () => {
  const addition = activityOf(addition1101);

  it("a correct column names the next column and says when a 1 is carried into it", () => {
    // 1101 + 0111: column 0 is 1 + 1 = 0 carry 1
    expect(runOn(addition, [{ type: "OPEN" }, col(0, 0, 1)]).message).toBe("Good. Carry the 1 into the 2s column.");
  });

  it("the last column hands over to the final-carry step", () => {
    const s = runOn(addition, [{ type: "OPEN" }, col(0, 0, 1), col(1, 0, 1), col(2, 1, 1), col(3, 0, 1)]);
    expect(s.message).toContain("Last step");
    expect(s.message).not.toMatch(/\{/);
  });

  it("each detector gets its own short nudge with this column's numbers, and none gives the answer", () => {
    const ignored = runOn(addition, [{ type: "OPEN" }, col(0, 0, 1), col(1, 1, 0)]); // 0 + 1 + carry 1
    expect(ignored.last?.result.misconceptionId).toBe("add.carry-ignored");
    expect(ignored.message).toBe("Remember the carry coming in from the right. This column adds 0 + 1 + 1.");
    const two = runOn(addition, [{ type: "OPEN" }, col(0, 2, 0)]);
    expect(two.last?.result.misconceptionId).toBe("add.wrote-two");
    expect(two.message).toContain("single bit");
    const final = runOn(addition, [{ type: "OPEN" }, col(0, 0, 1), col(1, 0, 1), col(2, 1, 1), col(3, 0, 1), col(4, 0)]);
    expect(final.message).toContain("last step has no bits");
    const swapped = runOn(addition, [{ type: "OPEN" }, col(0, 1, 0)]);
    expect(swapped.last?.result.misconceptionId).toBe("add.swapped");
    expect(swapped.message).toContain("swapped");
    for (const s of [ignored, two, final, swapped]) expect(s.message.split(/(?<=\.)\s/).length).toBeLessThanOrEqual(2);
  });
});

describe("#37 1's complement: nudges", () => {
  const complement = activityOf(complement100101, complement110010);

  it("points at the first bit that was not flipped, without writing the answer", () => {
    const s = runOn(complement, [{ type: "OPEN" }, bits("010010")]); // answer 011010: bit 3 from the left is wrong
    expect(s.last?.result).toMatchObject({ misconceptionId: "c1.first-wrong-bit", wrongBit: 2 });
    expect(s.message).toBe("Look at bit 3 from the left. Each bit flips: a 1 becomes 0 and a 0 becomes 1.");
    expect(s.message).not.toContain("011010");
  });

  it("copied bits and the 2's complement are named", () => {
    expect(runOn(complement, [{ type: "OPEN" }, bits("100101")]).message).toContain("bits you started with");
    expect(runOn(complement, [{ type: "OPEN" }, bits("011011")]).message).toContain("2's complement");
  });
});

describe("#37 catalog integrity for fixtures", () => {
  it("every nudgeKey used by a fixture resolves", () => {
    for (const v of [addition1101, complement100101, complement110010, placeValue45])
      for (const m of v.misconceptions) expect(hasMessage(m.nudgeKey), `${v.id}:${m.nudgeKey}`).toBe(true);
  });
});
