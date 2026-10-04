import { describe, expect, it } from "vitest";
import type { VariantOf } from "../types";
import { ExpressionSpec } from "./spec";
import { expression } from "./logic";

type Misconception = VariantOf<ExpressionSpec>["misconceptions"][number];
// The kind's detectors join the schema when it is registered with its view (Frontend, ADR-0008).
const detector = (type: string) => ({ type }) as unknown as Misconception["detect"];
const detectors: Misconception[] = ["unreadable", "wrong-form", "not-simplified", "complement", "and-or-swapped"].map((t) => ({
  id: `ex.${t}`,
  title: t,
  nudgeKey: `ex.${t}`,
  detect: detector(`expression-${t}`),
}));

function variant(spec: unknown): VariantOf<ExpressionSpec> {
  return {
    id: "v1",
    prompt: "Write F.",
    spec: ExpressionSpec.parse(spec),
    vars: {},
    hints: [{ rung: 2, text: "Not yet." }],
    explanation: [
      { id: "s1", say: "One." },
      { id: "s2", say: "Two." },
    ],
    misconceptions: detectors,
  };
}
const answer = (v: VariantOf<ExpressionSpec>, text: string) => expression.grade(v, { kind: "expression", text });

describe("expression kind (#219)", () => {
  // the slide simplification: x'y'z + x'yz + xy' = x'z + xy' (content pack ch2 §10)
  const simplify = variant({ kind: "expression", vars: ["x", "y", "z"], target: "x'y'z + x'yz + xy'", form: "sop", maxLiterals: 4 });

  it("accepts any equivalent answer in the asked form and size, in any letter case or term order", () => {
    expect(answer(simplify, "x'z + xy'")).toMatchObject({ correct: true, normalized: "x'z + xy'" });
    expect(answer(simplify, "XY' + X'Z")).toMatchObject({ correct: true });
    expect(answer(simplify, "x'·z + x·y'")).toMatchObject({ correct: true });
  });

  it("right function but not simplified, or not in SOP, gets its own nudge", () => {
    expect(answer(simplify, "x'y'z + x'yz + xy'")).toMatchObject({ correct: false, misconceptionId: "ex.not-simplified" });
    expect(answer(simplify, "x'(y'z + yz) + xy'")).toMatchObject({ correct: false, misconceptionId: "ex.wrong-form" });
  });

  it("recognises the complement and AND/OR swapped", () => {
    expect(answer(simplify, "(x'z + xy')'")).toMatchObject({ correct: false, misconceptionId: "ex.complement" });
    expect(answer(simplify, "(x' + z)(x + y')")).toMatchObject({ correct: false, misconceptionId: "ex.and-or-swapped" });
    expect(answer(simplify, "x + y").misconceptionId).toBeUndefined();
  });

  it("explains unreadable input instead of throwing", () => {
    expect(answer(simplify, "x + (y")).toMatchObject({ correct: false, misconceptionId: "ex.unreadable" });
    expect(answer(simplify, "x + w")).toMatchObject({ correct: false, misconceptionId: "ex.unreadable" }); // w is not a variable here
  });

  it("POS form: De Morgan on a sum of products (pack ch2 §11)", () => {
    const pos = variant({ kind: "expression", vars: ["x", "y", "z"], target: "(x'yz' + x'y'z)'", form: "pos" });
    expect(answer(pos, "(x + y' + z)(x + y + z')")).toMatchObject({ correct: true });
    expect(answer(pos, "x + y'z' + yz")).toMatchObject({ correct: false, misconceptionId: "ex.wrong-form" }); // same function, SOP
  });

  it("a function given by minterms and don't-cares (K-map answers)", () => {
    const k = variant({ kind: "expression", vars: ["A", "B", "C"], minterms: [1, 5, 7], dontCares: [0, 3, 6], form: "sop", maxLiterals: 1 });
    expect(answer(k, "C")).toMatchObject({ correct: true });
    expect(answer(k, "A'B'C + AC")).toMatchObject({ correct: false, misconceptionId: "ex.not-simplified" }); // right on the 1s, too long
    expect(answer(k, "C'")).toMatchObject({ correct: false, misconceptionId: "ex.complement" });
  });

  it("validates the spec", () => {
    const ok = (s: unknown) => ExpressionSpec.safeParse(s).success;
    expect(ok({ kind: "expression", vars: ["A"], target: "A", minterms: [1] })).toBe(false);
    expect(ok({ kind: "expression", vars: ["A", "B"], minterms: [4] })).toBe(false);
    expect(ok({ kind: "expression", vars: ["A", "B"], minterms: [1], dontCares: [1] })).toBe(false);
    expect(ok({ kind: "expression", vars: ["A", "B"], target: "A + C" })).toBe(false);
    expect(ok({ kind: "expression", vars: ["A", "B"], target: "a + b" })).toBe(true);
  });
});
