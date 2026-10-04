import { describe, expect, it } from "vitest";
import type { VariantOf } from "../types";
import { TruthTableSpec } from "./spec";
import { truthTable, columnTruth, goals, inputColumn, rowLabel, type TruthTableAnswer } from "./logic";

type Misconception = VariantOf<TruthTableSpec>["misconceptions"][number];
// The kind's detectors join the schema when it is registered with its view (Frontend, ADR-0008).
const detector = (type: string) => ({ type }) as unknown as Misconception["detect"];

function variant(spec: unknown, misconceptions: Misconception[] = []): VariantOf<TruthTableSpec> {
  return {
    id: "v1",
    prompt: "Fill the table.",
    spec: TruthTableSpec.parse(spec),
    vars: {},
    hints: [{ rung: 2, text: "Not yet." }],
    explanation: [
      { id: "s1", say: "One." },
      { id: "s2", say: "Two." },
    ],
    misconceptions,
  };
}

const detectors: Misconception[] = [
  { id: "tt.and-or", title: "AND and OR swapped", nudgeKey: "tt.and-or", detect: detector("and-or-swapped") },
  { id: "tt.not", title: "NOT not applied", nudgeKey: "tt.not", detect: detector("not-missing") },
  { id: "tt.order", title: "Rows out of order", nudgeKey: "tt.order", detect: detector("rows-out-of-order") },
  { id: "tt.inverted", title: "Picked the 0-rows", nudgeKey: "tt.inverted", detect: detector("rows-inverted") },
];

const fill = (step: number, values: string): TruthTableAnswer => ({ kind: "truth-table", step, values: [...values].map((c) => (c === "X" ? "X" : (Number(c) as 0 | 1))) });

// XOR as AB′ + A′B, filled column by column (content pack ch2: A′, B′, products, F)
const xor = variant(
  {
    kind: "truth-table",
    inputs: ["A", "B"],
    columns: [
      { id: "na", label: "A′", expr: "A'" },
      { id: "nb", label: "B′", expr: "B'" },
      { id: "p1", label: "AB′", expr: "AB'" },
      { id: "p2", label: "A′B", expr: "A'B" },
      { id: "f", label: "F", expr: "AB' + A'B" },
    ],
  },
  detectors,
);

describe("truth-table kind: fill one column per goal", () => {
  it("computes every column from its expression, rows in ascending binary", () => {
    expect(xor.spec.columns.map((c) => columnTruth(xor.spec, c).join(""))).toEqual(["1100", "1010", "0010", "0100", "0110"]);
    expect(inputColumn(xor.spec, 0).join("")).toBe("0011");
    expect(rowLabel(xor.spec, 2)).toBe("1 0");
  });

  it("is one step per column, partial until the output", () => {
    expect(truthTable.steps!.count(xor.spec)).toBe(5);
    expect(truthTable.steps!.vars(xor.spec, 2)).toMatchObject({ columnLabel: "AB′", columnExpr: "AB'", stepNumber: 3, columnCount: 5, rowCount: 4 });
    expect(truthTable.grade(xor, fill(0, "1100"))).toMatchObject({ correct: true, partial: true, normalized: "na=1100" });
    expect(truthTable.grade(xor, fill(4, "0110"))).toMatchObject({ correct: true, partial: false });
  });

  it("marks only the first wrong row and counts the wrong cells (UX §1)", () => {
    expect(truthTable.grade(xor, fill(4, "0111"))).toMatchObject({ correct: false, wrongCells: { first: 3, count: 1 } });
    expect(truthTable.grade(xor, fill(4, "1001"))).toMatchObject({ correct: false, wrongCells: { first: 0, count: 4 } });
  });

  it("recognises AND/OR swapped and a missing NOT", () => {
    const t = variant(
      {
        kind: "truth-table",
        inputs: ["A", "B"],
        columns: [
          { id: "and", label: "AB", expr: "AB" },
          { id: "nand", label: "(AB)′", expr: "(AB)'" },
          { id: "or", label: "A + B", expr: "A + B" },
        ],
      },
      detectors,
    );
    expect(truthTable.grade(t, fill(0, "0111"))).toMatchObject({ correct: false, misconceptionId: "tt.and-or" }); // OR written for AND
    expect(truthTable.grade(t, fill(1, "0001"))).toMatchObject({ correct: false, misconceptionId: "tt.not" }); // AND written for NAND
    expect(truthTable.grade(t, fill(2, "0001"))).toMatchObject({ correct: false, misconceptionId: "tt.and-or" });
    expect(truthTable.grade(t, fill(2, "0011")).misconceptionId).toBeUndefined();
  });

  it("with fillInputs the input columns come first, and a swapped significance is caught", () => {
    const t = variant({ kind: "truth-table", inputs: ["A", "B", "C"], fillInputs: true, columns: [{ id: "f", label: "F", expr: "AB + C" }] }, detectors);
    expect(goals(t.spec).map((g) => g.type)).toEqual(["input", "input", "input", "column"]);
    expect(truthTable.steps!.tag(t.spec, 0)).toBe("inputs");
    expect(truthTable.grade(t, fill(0, "00001111"))).toMatchObject({ correct: true, partial: true });
    expect(truthTable.grade(t, fill(0, "01010101"))).toMatchObject({ correct: false, misconceptionId: "tt.order" }); // C's column under A
  });

  it("supports given columns and authored X values (Chapters 4–5)", () => {
    const t = variant({
      kind: "truth-table",
      inputs: ["Q", "N"],
      columns: [
        { id: "q", label: "Q⁺", expr: "N", given: true, group: "Next state" },
        { id: "j", label: "J", values: [0, 1, "X", "X"], group: "Flip-flop inputs" },
        { id: "k", label: "K", values: ["X", "X", 1, 0], group: "Flip-flop inputs" },
      ],
    });
    expect(goals(t.spec).map((g) => (g.type === "column" ? g.column.id : ""))).toEqual(["j", "k"]);
    expect(truthTable.grade(t, fill(0, "01XX"))).toMatchObject({ correct: true, partial: true });
    expect(truthTable.grade(t, fill(0, "0100")).correct).toBe(false); // an X is not a 0
  });
});

describe("truth-table kind: row-select", () => {
  // canonical form by table (content pack ch2 §12): F = A′ + AB′ → Σ(0, 1, 2)
  const canon = variant(
    {
      kind: "truth-table",
      inputs: ["A", "B"],
      mode: "row-select",
      target: "f",
      mintermColumn: "right",
      columns: [
        { id: "na", label: "A′", expr: "A'", given: true },
        { id: "nb", label: "B′", expr: "B'", given: true },
        { id: "p", label: "AB′", expr: "AB'", given: true },
        { id: "f", label: "F", expr: "A' + AB'", given: true },
      ],
    },
    detectors,
  );
  const pick = (rows: number[]): TruthTableAnswer => ({ kind: "truth-table", step: 0, rows });

  it("is one goal: pick the 1-rows", () => {
    expect(truthTable.steps!.count(canon.spec)).toBe(1);
    expect(truthTable.steps!.vars(canon.spec, 0)).toMatchObject({ columnLabel: "F", rowCount: 4 });
    expect(truthTable.grade(canon, pick([2, 0, 1]))).toMatchObject({ correct: true, normalized: "rows:0,1,2" });
  });

  it("recognises the 0-rows picked instead, and counts wrong rows", () => {
    expect(truthTable.grade(canon, pick([3]))).toMatchObject({ correct: false, misconceptionId: "tt.inverted" });
    expect(truthTable.grade(canon, pick([0, 1]))).toMatchObject({ correct: false, wrongCells: { first: 2, count: 1 } });
  });
});

describe("truth-table spec", () => {
  const bad = (spec: unknown) => TruthTableSpec.safeParse(spec).success;
  it("rejects unknown variables, wrong lengths, missing targets and nothing to fill", () => {
    expect(bad({ kind: "truth-table", inputs: ["A", "B"], columns: [{ id: "f", label: "F", expr: "A + C" }] })).toBe(false);
    expect(bad({ kind: "truth-table", inputs: ["A", "B"], columns: [{ id: "f", label: "F", values: [0, 1, 1] }] })).toBe(false);
    expect(bad({ kind: "truth-table", inputs: ["A"], columns: [{ id: "f", label: "F", expr: "A", values: [0, 1] }] })).toBe(false);
    expect(bad({ kind: "truth-table", inputs: ["A"], mode: "row-select", columns: [{ id: "f", label: "F", expr: "A" }] })).toBe(false);
    expect(bad({ kind: "truth-table", inputs: ["A"], columns: [{ id: "f", label: "F", expr: "A", given: true }] })).toBe(false);
    expect(bad({ kind: "truth-table", inputs: ["A", "B", "C", "D", "E"], columns: [{ id: "f", label: "F", expr: "A" }] })).toBe(false);
    expect(bad({ kind: "truth-table", inputs: ["a", "b"], columns: [{ id: "f", label: "F", expr: "A + b" }] })).toBe(true); // case-insensitive (#258)
  });
});
