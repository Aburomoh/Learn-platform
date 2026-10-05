import { describe, expect, it } from "vitest";
import { getActivity } from "../../index";

const question = (activity: string, id: string) => getActivity("ecet111", "analysis", activity)!.activity.questions.find((q) => q.id === id)!;
const summary = (activity: string, id: string) =>
  question(activity, id).variants.map(({ figure: f }) => (f?.type === "sequential" ? `${f.focus}: ${f.flipFlops.map((x) => x.equations.join(", ")).join(" | ")}` : ""));

describe("Chapter 5 analysis figures (#454)", () => {
  it("input- and output-equation questions draw the gates that drive the asked pin (#489)", () => {
    const gates = (id: string) => question("analysis-inputs", id).variants.map(({ figure: f, spec }) => (f?.type === "gates" && spec.kind === "expression" && f.expr === spec.target ? `${f.output} = ${f.expr}` : ""));
    expect(gates("an.q.input")).toEqual(["DA = Ax + Bx", "KA = Bx'", "TA = Bx"]);
    expect(gates("an.q.output")).toEqual(["y = (A + B)x'", "y = AB", "y = x + B'"]);
  });

  it("state-equation questions show the input equations, the asked flip-flop in focus", () => {
    expect(summary("analysis-state", "an.q.next-a")[0]).toBe("A: DA = Ax + Bx | DB = A′x");
    expect(summary("analysis-state", "an.q.next-b").map((s) => s.split(":")[0])).toEqual(["B", "B", "B"]);
    expect(summary("analysis-state", "an.q.next-b")[1]).toBe("B: JA = B, KA = Bx′ | JB = x′, KB = A ⊕ x");
  });
});
