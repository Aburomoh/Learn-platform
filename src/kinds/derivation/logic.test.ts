import { describe, expect, it } from "vitest";
import { equivalent, parseBool } from "@/content/boolean";
import type { VariantOf } from "../types";
import { DerivationSpec } from "./spec";
import { canonical, derivation, lineOptions, type DerivationAnswer } from "./logic";

type Misconception = VariantOf<DerivationSpec>["misconceptions"][number];
// The kind's detectors join the schema when it is registered with its view (Frontend, ADR-0008).
const detector = (type: string) => ({ type }) as unknown as Misconception["detect"];

function variant(spec: unknown, misconceptions: Misconception[] = []): VariantOf<DerivationSpec> {
  return {
    id: "v1",
    prompt: "Simplify, one law per line.",
    spec: DerivationSpec.parse(spec),
    vars: {},
    hints: [{ rung: 2, text: "Not yet." }],
    explanation: [
      { id: "s1", say: "One." },
      { id: "s2", say: "Two." },
    ],
    misconceptions,
  };
}

// The pack's F2 (ch2 §10), one law per line: x'y'z + x'yz + xy' → x'z(y' + y) + xy' → x'z·1 + xy' → x'z + xy'
const f2 = {
  kind: "derivation",
  vars: ["x", "y", "z"],
  start: "x'y'z + x'yz + xy'",
  lines: [
    { law: "factor", expr: "x'z(y' + y) + xy'", lawOptions: ["factor", "commutative", "absorb"], wrongLines: [{ id: "w1", expr: "x'(y'z + yz) + xy'", misconceptionId: "dv.wrong-factor" }, { id: "w2", expr: "x'z(y' + y)" }] },
    { law: "or-not", expr: "x'z·1 + xy'", lawOptions: ["or-not", "and-not", "or-1"], wrongLines: [{ id: "w1", expr: "x'z·0 + xy'", misconceptionId: "dv.or-and" }] },
    { law: "and-1", expr: "x'z + xy'", lawOptions: ["and-1", "or-1", "and-0"], wrongLines: [{ id: "w1", expr: "1 + xy'" }] },
  ],
};
const misconceptions: Misconception[] = [
  { id: "dv.wrong-factor", title: "Factored a different common part", nudgeKey: "dv.wrong-factor", detect: detector("line-not-equivalent") },
  { id: "dv.or-and", title: "Used A·A′ = 0 for A + A′", nudgeKey: "dv.or-and", detect: detector("line-skipped") },
  { id: "dv.slip", title: "Algebra slip", nudgeKey: "dv.slip", detect: detector("line-not-equivalent") },
  { id: "dv.skip", title: "Skipped a step", nudgeKey: "dv.skip", detect: detector("line-skipped") },
];
const step = (n: number, a: Omit<DerivationAnswer, "kind" | "step">): DerivationAnswer => ({ kind: "derivation", step: n, ...a });

describe("derivation kind (#221)", () => {
  const v = variant(f2, misconceptions);

  it("has two goals per line: the law, then the line", () => {
    expect(derivation.steps!.count(v.spec)).toBe(6);
    expect([0, 1, 2].map((i) => derivation.steps!.tag(v.spec, i))).toEqual(["law", "line", "law"]);
    expect(derivation.steps!.vars(v.spec, 3)).toMatchObject({ lineNumber: 2, lineCount: 3, previous: "x'z(y' + y) + xy'", lawName: "A + A′ = 1" });
  });

  it("every authored line is equivalent to the one before (the content rule)", () => {
    const lines = [v.spec.start, ...v.spec.lines.map((l) => l.expr)].map((t) => parseBool(t, { vars: v.spec.vars }));
    for (let i = 1; i < lines.length; i++) expect(equivalent(lines[i - 1], lines[i], v.spec.vars)).toBe(true);
  });

  it("choose mode: the law, then the line, partial until the last line", () => {
    expect(derivation.grade(v, step(0, { law: "factor" }))).toMatchObject({ correct: true, partial: true });
    expect(derivation.grade(v, step(0, { law: "absorb" }))).toMatchObject({ correct: false });
    expect(derivation.grade(v, step(1, { line: "right" }))).toMatchObject({ correct: true, partial: true });
    expect(derivation.grade(v, step(1, { line: "w1" }))).toMatchObject({ correct: false, misconceptionId: "dv.wrong-factor" });
    expect(derivation.grade(v, step(5, { line: "right" }))).toMatchObject({ correct: true });
    expect(derivation.grade(v, step(5, { line: "right" })).partial).toBeUndefined();
    expect(lineOptions(v.spec, 1).map((o) => o.id)).toEqual(["w1", "right"]); // the right line is not always first
  });

  it("type mode: graded by structure, so order does not matter but skipping or a slip does", () => {
    const typed = variant({ ...f2, lineMode: "type" }, misconceptions.slice(2));
    expect(derivation.grade(typed, step(1, { line: "xy' + x'z(y + y')" }))).toMatchObject({ correct: true, partial: true });
    expect(derivation.grade(typed, step(1, { line: "x'z + xy'" }))).toMatchObject({ correct: false, misconceptionId: "dv.skip" }); // jumps to the last line
    expect(derivation.grade(typed, step(1, { line: "x'z(y' + y)" }))).toMatchObject({ correct: false, misconceptionId: "dv.slip" }); // dropped xy'
    expect(derivation.grade(typed, step(1, { line: "x'(z" })).correct).toBe(false); // unreadable: no throw
  });

  it("canonical form ignores order and nesting, not content", () => {
    const c = (t: string) => canonical(parseBool(t));
    expect(c("AB + C")).toBe(c("C + BA"));
    expect(c("(A + B) + C")).toBe(c("A + (C + B)"));
    expect(c("AB + C")).not.toBe(c("A(B + C)"));
  });

  it("validates the spec", () => {
    const ok = (s: unknown) => DerivationSpec.safeParse(s).success;
    expect(ok({ ...f2, lines: [{ ...f2.lines[0], lawOptions: ["commutative", "absorb"] }] })).toBe(false); // law not offered
    expect(ok({ ...f2, start: "x + w" })).toBe(false);
    expect(ok({ ...f2, lines: [{ ...f2.lines[0], wrongLines: [] }] })).toBe(false); // choose mode needs options
    expect(ok({ ...f2, lineMode: "type", lines: [{ ...f2.lines[0], wrongLines: [] }] })).toBe(true);
  });
});
