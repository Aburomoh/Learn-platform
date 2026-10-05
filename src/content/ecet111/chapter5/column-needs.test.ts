import { describe, expect, it } from "vitest";
import { getActivity } from "../../index";

const needsOf = (topic: string, activity: string, q = 0, v = 0) => {
  const spec = getActivity("ecet111", topic, activity)!.activity.questions[q].variants[v].spec;
  if (spec.kind !== "truth-table") throw new Error("expected a truth table");
  return Object.fromEntries(spec.columns.filter((c) => c.needs).map((c) => [c.id, c.needs!.join(" ")]));
};

describe("columns name what they are worked out from (#508)", () => {
  it("next state from its own flip-flop inputs; excitation from the next state", () => {
    expect(needsOf("three-jk", "three-jk-table")).toEqual({ na: "ja ka", nb: "jb kb", nc: "jc kc" });
    expect(needsOf("analysis", "analysis-table", 0, 1)).toEqual({ na: "ja ka", nb: "jb kb" });
    expect(needsOf("design", "design-excitation", 0, 0)).toEqual({ ta: "na", tb: "nb" });
    expect(needsOf("design", "design-excitation", 1, 0)).toEqual({ ja: "na", ka: "na", jb: "nb", kb: "nb" });
  });
});
