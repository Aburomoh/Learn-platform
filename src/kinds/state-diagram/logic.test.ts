import { describe, expect, it } from "vitest";
import type { VariantOf } from "../types";
import { StateDiagramSpec } from "./spec";
import { arrowSteps, labelOptions, nextOptions, stateCodes, stateDiagram, stateCells, transitions, type StateDiagramAnswer } from "./logic";

type Misconception = VariantOf<StateDiagramSpec>["misconceptions"][number];
// The kind's detectors join the schema when it is registered with its view (Frontend, ADR-0008).
const detector = (type: string) => ({ type }) as unknown as Misconception["detect"];
const TYPES = ["next-wrong-row", "next-is-present", "output-wrong-row", "label-input-wrong", "label-reversed"];

function variant(spec: unknown): VariantOf<StateDiagramSpec> {
  return {
    id: "v1",
    prompt: "Complete the diagram.",
    spec: StateDiagramSpec.parse(spec),
    vars: {},
    hints: [{ rung: 2, text: "Not yet." }],
    explanation: [
      { id: "s1", say: "One." },
      { id: "s2", say: "Two." },
    ],
    misconceptions: TYPES.map((t) => ({ id: t, title: t, nudgeKey: t, detect: detector(t) })),
  };
}

const grade = (v: VariantOf<StateDiagramSpec>, a: Omit<StateDiagramAnswer, "kind">) => stateDiagram.grade(v, { kind: "state-diagram", ...a });
const edges = (v: VariantOf<StateDiagramSpec>) => transitions(v.spec).map((t) => `${t.from} -${t.label}-> ${t.to}`);

// ch5 Part II §2 (s.8–13): A(t+1) = Ax + Bx, B(t+1) = A′x, y = (A + B)x′
const dSpec = { kind: "state-diagram", stateVars: ["A", "B"], input: "x", next: ["Ax + Bx", "A'x"], output: { name: "y", expr: "(A + B)x'" } };
const d = variant(dSpec);

describe("state diagram: transitions from the state equations (ch5 Part II)", () => {
  it("§2 D example: the slide's eight arrows", () => {
    expect(stateCodes(d.spec)).toEqual(["00", "01", "10", "11"]);
    expect(edges(d)).toEqual(["00 -0/0-> 00", "00 -1/0-> 01", "01 -0/1-> 00", "01 -1/0-> 11", "10 -0/1-> 00", "10 -1/0-> 10", "11 -0/1-> 00", "11 -1/0-> 10"]);
  });

  it("§3 JK example: no output, labels are the input only", () => {
    const jk = variant({ kind: "state-diagram", stateVars: ["A", "B"], input: "x", next: ["A'B + AB' + Ax", "B'x' + ABx + A'Bx'"] });
    expect(transitions(jk.spec).map((t) => `${t.from}${t.input}>${t.to}`)).toEqual(["000>01", "001>00", "010>11", "011>10", "100>11", "101>10", "110>00", "111>11"]);
    expect(labelOptions(jk.spec)).toEqual(["0", "1"]);
  });

  it("§5 three JK flip-flops: the pack's sixteen arrows", () => {
    const three = variant({ kind: "state-diagram", stateVars: ["A", "B", "C"], input: "x", next: ["x'A' + AB'", "xAB' + BC'", "AC' + x'C"], output: { name: "y", expr: "x + B'" } });
    expect(edges(three).join("; ")).toBe(
      "000 -0/1-> 100; 000 -1/1-> 000; 001 -0/1-> 101; 001 -1/1-> 000; 010 -0/0-> 110; 010 -1/1-> 010; 011 -0/0-> 101; 011 -1/1-> 000; " +
        "100 -0/1-> 101; 100 -1/1-> 111; 101 -0/1-> 101; 101 -1/1-> 110; 110 -0/0-> 011; 110 -1/1-> 011; 111 -0/0-> 001; 111 -1/1-> 000",
    );
    expect(stateDiagram.steps!.count(three.spec)).toBe(16);
    // eight states: four chips, always with the right one, the other row's state and the present state
    for (let i = 0; i < 16; i++) {
      const t = transitions(three.spec)[i];
      const opts = nextOptions(three.spec, i);
      expect(opts).toHaveLength(4);
      expect(opts).toEqual(expect.arrayContaining([t.to, transitions(three.spec)[i ^ 1].to, t.from]));
    }
  });
});

describe("state diagram: grading one arrow at a time", () => {
  it("label mode", () => {
    expect(grade(d, { step: 1, label: "1/0" })).toMatchObject({ correct: true, partial: true });
    expect(grade(d, { step: 7, label: " 1 / 0 " })).toMatchObject({ correct: true });
    expect(grade(d, { step: 7, label: "1/0" }).partial).toBeUndefined();
    expect(grade(d, { step: 2, label: "0/0" }).misconceptionId).toBe("output-wrong-row"); // 01 with x = 1 gives y = 0
    expect(grade(d, { step: 2, label: "1/1" }).misconceptionId).toBe("label-input-wrong");
    expect(grade(d, { step: 2, label: "1/0" }).misconceptionId).toBe("label-reversed"); // 0/1 written as 1/0
    expect(stateDiagram.steps!.vars(d.spec, 3)).toMatchObject({ from: "01", to: "11", label: "1/0", arrowCount: 8 });
  });

  it("next mode", () => {
    const n = variant({ ...dSpec, mode: "next" });
    expect(stateDiagram.steps!.tag(n.spec, 0)).toBe("next");
    expect(grade(n, { step: 3, next: "11" })).toMatchObject({ correct: true, partial: true });
    expect(grade(n, { step: 3, next: "00" }).misconceptionId).toBe("next-wrong-row"); // 01 with x = 0 goes to 00
    expect(grade(n, { step: 3, next: "01" }).misconceptionId).toBe("next-is-present");
    expect(grade(n, { step: 3, next: "10" }).misconceptionId).toBeUndefined();
    expect(nextOptions(n.spec, 3)).toEqual(["00", "01", "10", "11"]);
  });

  it("shared arrows: either open label is accepted (Reviewer on #394)", () => {
    // §5: 110 goes to 011 on both inputs, so steps 12 and 13 share one arrow
    const three = variant({ kind: "state-diagram", stateVars: ["A", "B", "C"], input: "x", next: ["x'A' + AB'", "xAB' + BC'", "AC' + x'C"], output: { name: "y", expr: "x + B'" } });
    expect(arrowSteps(three.spec, 12)).toEqual([12, 13]);
    expect(arrowSteps(three.spec, 13)).toEqual([12, 13]);
    expect(arrowSteps(three.spec, 0)).toEqual([0]);
    expect(grade(three, { step: 12, label: "1/1" })).toMatchObject({ correct: true, partial: true }); // row 13's label first
    expect(grade(three, { step: 13, label: "0/0", taken: ["1/1"] }).correct).toBe(true);
    expect(grade(three, { step: 13, label: "1/1", taken: ["1/1"] }).correct).toBe(false); // already on the arrow
    expect(grade(three, { step: 0, label: "1/1" }).correct).toBe(false); // not shared: table order
  });

  it("positions: authored, or table order four per row", () => {
    expect(stateCells(d.spec)).toEqual([[0, 0], [1, 0], [0, 1], [1, 1]]); // 4 states: 2 × 2
    const eight = variant({ kind: "state-diagram", stateVars: ["A", "B", "C"], input: "x", next: ["A", "B", "C"] });
    expect(stateCells(eight.spec)).toEqual([[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1]]);
    const two = variant({ kind: "state-diagram", stateVars: ["A"], input: "x", next: ["x"] });
    expect(stateCells(two.spec)).toEqual([[0, 0], [1, 0]]);
    const placed = variant({ ...dSpec, positions: [[0, 0], [1, 0], [1, 1], [0, 1]] });
    expect(stateCells(placed.spec)).toEqual([[0, 0], [1, 0], [1, 1], [0, 1]]);
    expect(StateDiagramSpec.safeParse({ ...dSpec, positions: [[0, 0], [0, 0], [1, 1], [0, 1]] }).success).toBe(false);
    expect(StateDiagramSpec.safeParse({ ...dSpec, positions: [[0, 0], [1, 0]] }).success).toBe(false);
  });

  it("rejects malformed specs", () => {
    expect(StateDiagramSpec.safeParse({ ...dSpec, next: ["Ax"] }).success).toBe(false);
    expect(StateDiagramSpec.safeParse({ ...dSpec, next: ["Ax + Q", "A'x"] }).success).toBe(false); // unknown variable
    expect(StateDiagramSpec.safeParse({ ...dSpec, input: "A" }).success).toBe(false);
  });
});
