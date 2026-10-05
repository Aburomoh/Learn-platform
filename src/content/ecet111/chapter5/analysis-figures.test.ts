import { describe, expect, it } from "vitest";
import { getActivity } from "../../index";

const question = (activity: string, id: string) => getActivity("ecet111", "analysis", activity)!.activity.questions.find((q) => q.id === id)!;
const summary = (activity: string, id: string) =>
  question(activity, id).variants.map(({ figure: f }) => (f?.type === "sequential" ? `${f.focus}: ${f.flipFlops.map((x) => x.equations.join(", ")).join(" | ")}` : ""));

describe("Chapter 5 analysis figures (#454)", () => {
  it("input-equation questions show the circuit with every input equation still to find, the asked flip-flop in focus", () => {
    expect(summary("analysis-inputs", "an.q.input")).toEqual(["A: DA = ? | DB = ?", "A: JA = ?, KA = ? | JB = ?, KB = ?", "A: TA = ? | TB = ?"]);
  });

  it("state-equation questions show the input equations, the asked flip-flop in focus", () => {
    expect(summary("analysis-state", "an.q.next-a")[0]).toBe("A: DA = Ax + Bx | DB = A′x");
    expect(summary("analysis-state", "an.q.next-b").map((s) => s.split(":")[0])).toEqual(["B", "B", "B"]);
    expect(summary("analysis-state", "an.q.next-b")[1]).toBe("B: JA = B, KA = Bx′ | JB = x′, KB = A ⊕ x");
  });
});
