import { describe, expect, it } from "vitest";
import { formatBool } from "@/content/boolean";
import type { VariantOf } from "../types";
import { CircuitSpec } from "./spec";
import { circuitPredict, gateExpressions, gateOrder, type CircuitAnswer } from "./logic";

type Misconception = VariantOf<CircuitSpec>["misconceptions"][number];
const misconceptions: Misconception[] = (["gate-not-applied", "gate-and-or-swapped", "gate-bar-misplaced", "gate-expression-unreadable"] as const).map((t) => ({ id: `ce.${t}`, title: t, nudgeKey: `ce.${t}`, detect: { type: t } }));

function variant(spec: unknown): VariantOf<CircuitSpec> {
  return {
    id: "v1",
    prompt: "Write the expression at each gate output.",
    spec: CircuitSpec.parse(spec),
    vars: {},
    hints: [{ rung: 2, text: "Not yet." }],
    explanation: [
      { id: "s1", say: "One." },
      { id: "s2", say: "Two." },
    ],
    misconceptions,
  };
}

// content pack ch2 §5: F = (A′ + B)C — NOT A, then OR with B, then AND with C
const slide = variant({
  kind: "circuit-predict",
  mode: "expression",
  inputs: [
    { id: "a", label: "A", value: 0 },
    { id: "b", label: "B", value: 0 },
    { id: "c", label: "C", value: 1 },
  ],
  gates: [
    { id: "n1", type: "NOT", from: ["a"] },
    { id: "g1", type: "OR", from: ["n1", "b"] },
    { id: "g2", type: "AND", from: ["g1", "c"], label: "F" },
  ],
  outputGateId: "g2",
  answer: 1,
});
const at = (step: number, expression: string): CircuitAnswer => ({ kind: "circuit-predict", step, expression });

describe("circuit-predict, expression mode (#226)", () => {
  it("builds every gate's expression from the inputs, innermost first", () => {
    const e = gateExpressions(slide.spec);
    expect(gateOrder(slide.spec).map((id) => formatBool(e[id]))).toEqual(["A'", "A' + B", "(A' + B)C"]);
    expect(circuitPredict.steps!.vars(slide.spec, 2)).toMatchObject({ gateName: "AND", gateExpression: "(A' + B)C" });
  });

  it("grades each gate output by meaning, partial until the last gate", () => {
    expect(circuitPredict.grade(slide, at(0, "a'"))).toMatchObject({ correct: true, partial: true }); // any case (#258)
    expect(circuitPredict.grade(slide, at(1, "B + A'"))).toMatchObject({ correct: true, partial: true });
    expect(circuitPredict.grade(slide, at(2, "A'C + BC"))).toMatchObject({ correct: true, partial: false }); // multiplied out is the same function
  });

  it("names the gate left out, AND/OR swapped, and unreadable text", () => {
    expect(circuitPredict.grade(slide, at(2, "A' + B"))).toMatchObject({ correct: false, misconceptionId: "ce.gate-not-applied" });
    expect(circuitPredict.grade(slide, at(1, "A'B"))).toMatchObject({ correct: false, misconceptionId: "ce.gate-and-or-swapped" });
    expect(circuitPredict.grade(slide, at(2, "A' + B + C"))).toMatchObject({ correct: false, misconceptionId: "ce.gate-and-or-swapped" });
    expect(circuitPredict.grade(slide, at(0, "A + D"))).toMatchObject({ correct: false, misconceptionId: "ce.gate-expression-unreadable" });
    expect(circuitPredict.grade(slide, at(1, "A + B")).misconceptionId).toBeUndefined();
  });

  it("handles NAND/NOR outputs (p.25: OR + NOT as one NOR)", () => {
    const nor = variant({
      kind: "circuit-predict",
      mode: "expression",
      inputs: [
        { id: "a", label: "A", value: 1 },
        { id: "b", label: "B", value: 0 },
        { id: "c", label: "C", value: 0 },
      ],
      gates: [
        { id: "n1", type: "NOT", from: ["a"] },
        { id: "g1", type: "AND", from: ["b", "c"] },
        { id: "g2", type: "NOR", from: ["n1", "g1"], label: "F" },
      ],
      outputGateId: "g2",
      answer: 1,
    });
    expect(formatBool(gateExpressions(nor.spec).g2)).toBe("(A' + BC)'");
    expect(circuitPredict.grade(nor, at(2, "(A' + BC)'")).correct).toBe(true);
    expect(circuitPredict.grade(nor, at(2, "(A'BC)'"))).toMatchObject({ misconceptionId: "ce.gate-and-or-swapped" }); // NAND for NOR
    // the bar on the wrong part (Pedagogy on #226, p.23–25): over A instead of the whole sum
    expect(circuitPredict.grade(nor, at(2, "A + BC"))).toMatchObject({ misconceptionId: "ce.gate-bar-misplaced" });
    expect(circuitPredict.grade(nor, at(2, "A' + (BC)'"))).toMatchObject({ misconceptionId: "ce.gate-bar-misplaced" });
  });

  it("leaves predict mode unchanged", () => {
    const predict = variant({ ...slide.spec, mode: undefined });
    expect(circuitPredict.grade(predict, { kind: "circuit-predict", step: 0, output: 1 })).toMatchObject({ correct: true });
  });
});
