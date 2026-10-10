import { describe, expect, it } from "vitest";
import type { VariantOf } from "../types";
import { BaseToDecimalSpec } from "./spec";
import { baseToDecimal, exactTerm, exactValue, normaliseDecimal, placeDigits, type BaseToDecimalAnswer } from "./logic";

type Misconception = VariantOf<BaseToDecimalSpec>["misconceptions"][number];
// The kind's detectors join the schema when it is registered with its view (Frontend, ADR-0008).
const detector = (type: string) => ({ type }) as unknown as Misconception["detect"];
const misconceptions: Misconception[] = ["weights-reversed", "negative-powers-wrong", "hex-letter-as-digit"].map((t) => ({ id: `bd.${t}`, title: t, nudgeKey: `bd.${t}`, detect: detector(t) }));

function variant(base: number, number: string): VariantOf<BaseToDecimalSpec> {
  return {
    id: "v1",
    prompt: "Convert to decimal.",
    spec: BaseToDecimalSpec.parse({ kind: "base-to-decimal", base, number }),
    vars: {},
    hints: [{ rung: 2, text: "Not yet." }],
    explanation: [
      { id: "s1", say: "One." },
      { id: "s2", say: "Two." },
    ],
    misconceptions,
  };
}
const at = (step: number, a: Omit<BaseToDecimalAnswer, "kind" | "step">): BaseToDecimalAnswer => ({ kind: "base-to-decimal", step, ...a });

describe("base-to-decimal kind (#208): the slide examples, exact", () => {
  // restated from content pack ch1 §1–3, §7
  it.each([
    [10, "543.451", "500 + 40 + 3 + 0.4 + 0.05 + 0.001", "543.451"],
    [2, "101.101", "4 + 0 + 1 + 0.5 + 0 + 0.125", "5.625"],
    [8, "124.160", "64 + 16 + 4 + 0.125 + 0.09375 + 0", "84.21875"],
    [8, "263.540", "128 + 48 + 3 + 0.625 + 0.0625 + 0", "179.6875"],
    [16, "1A3", "256 + 160 + 3", "419"],
  ])("(%s) %s", (base, number, terms, value) => {
    const v = variant(base, number);
    expect(placeDigits(v.spec).map((d) => exactTerm(d.value, base, d.power)).join(" + ")).toBe(terms);
    expect(exactValue(v.spec)).toBe(value);
    expect(baseToDecimal.steps!.vars(v.spec, 0)).toMatchObject({ values: terms, value });
  });

  it("stays exact where floating point would not", () => {
    expect(exactTerm(1, 8, -3)).toBe("0.001953125");
    expect(exactValue(variant(16, "FFFFFF.FFF").spec)).toBe("16777215.999755859375");
  });
});

describe("base-to-decimal kind: three goals", () => {
  const bin = variant(2, "101.101");
  const hex = variant(16, "1A3");

  it("weights, then terms, then the sum; partial until the sum", () => {
    expect(baseToDecimal.steps!.count(bin.spec)).toBe(3);
    expect([0, 1, 2].map((i) => baseToDecimal.steps!.tag(bin.spec, i))).toEqual(["weights", "terms", "sum"]);
    expect(baseToDecimal.grade(bin, at(0, { powers: [2, 1, 0, -1, -2, -3] }))).toMatchObject({ correct: true, partial: true });
    expect(baseToDecimal.grade(bin, at(1, { digits: ["1", "0", "1", "1", "0", "01"] }))).toMatchObject({ correct: true, partial: true });
    expect(baseToDecimal.grade(bin, at(1, { digits: ["1", "0", "1", "1", "0", "0"] }))).toMatchObject({ correct: false, wrongCells: { first: 5, count: 1 } });
    expect(baseToDecimal.steps!.vars(bin.spec, 1)).toMatchObject({ digitValues: "1, 0, 1, 1, 0, 1" });
    expect(baseToDecimal.grade(bin, at(2, { sum: "5.625" }))).toMatchObject({ correct: true });
    expect(baseToDecimal.grade(bin, at(2, { sum: "05.6250" })).correct).toBe(true);
    expect(baseToDecimal.grade(bin, at(2, { sum: "5.62" })).correct).toBe(false);
  });

  it("recognises weights from the wrong end, and wrong negative powers", () => {
    expect(baseToDecimal.grade(bin, at(0, { powers: [-3, -2, -1, 0, 1, 2] }))).toMatchObject({ correct: false, misconceptionId: "bd.weights-reversed" });
    expect(baseToDecimal.grade(bin, at(0, { powers: [2, 1, 0, 1, 2, 3] }))).toMatchObject({ correct: false, misconceptionId: "bd.negative-powers-wrong", wrongCells: { first: 3, count: 3 } });
    expect(baseToDecimal.grade(bin, at(0, { powers: [3, 2, 1, 0, -1, -2] })).misconceptionId).toBeUndefined();
  });

  it("recognises a hex letter used as a small digit or as 0", () => {
    expect(baseToDecimal.grade(hex, at(1, { digits: ["1", "10", "3"] })).correct).toBe(true);
    expect(baseToDecimal.grade(hex, at(1, { digits: ["1", "1", "3"] }))).toMatchObject({ correct: false, misconceptionId: "bd.hex-letter-as-digit", wrongCells: { first: 1, count: 1 } }); // A as 1
    expect(baseToDecimal.grade(hex, at(1, { digits: ["1", "0", "3"] }))).toMatchObject({ misconceptionId: "bd.hex-letter-as-digit" });
    expect(baseToDecimal.grade(hex, at(1, { digits: ["1", "11", "3"] })).misconceptionId).toBeUndefined();
  });

  it("normalises decimals and validates the spec", () => {
    expect(["0050.500", ".5", "3", "3.", "0"].map(normaliseDecimal)).toEqual(["50.5", "0.5", "3", "3", "0"]);
    expect(normaliseDecimal("1/2")).toBe("1/2"); // not a decimal: never matches
    const ok = (base: number, number: string) => BaseToDecimalSpec.safeParse({ kind: "base-to-decimal", base, number }).success;
    expect(ok(2, "102")).toBe(false);
    expect(ok(8, "1234567")).toBe(false); // 7 whole digits
    expect(ok(16, "1.ABCD")).toBe(false); // 4 fraction digits
    expect(ok(16, "1a3")).toBe(false); // uppercase hex only
    expect(ok(10, "999999.999")).toBe(true);
  });
});
