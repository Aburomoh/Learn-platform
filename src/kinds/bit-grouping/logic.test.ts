import { describe, expect, it } from "vitest";
import type { VariantOf } from "../types";
import { BitGroupingSpec } from "./spec";
import { bitGrouping, computedAnswer, groupsAroundPoint, markedGroups, type BitGroupingAnswer } from "./logic";

type Misconception = VariantOf<BitGroupingSpec>["misconceptions"][number];
const misconceptions: Misconception[] = (["group-from-left", "group-no-padding", "fraction-from-right-end", "bits-unpadded", "bits-reversed", "digit-as-decimal"] as const).map((t) => ({ id: `bg.${t}`, title: t, nudgeKey: `bg.${t}`, detect: { type: t } }));

function variant(spec: Omit<Partial<BitGroupingSpec>, "kind"> & { bits: string; groupSize: 3 | 4; answer: string }): VariantOf<BitGroupingSpec> {
  return {
    id: "v1",
    prompt: "Convert.",
    spec: BitGroupingSpec.parse({ kind: "bit-grouping", ...spec }),
    vars: {},
    hints: [{ rung: 2, text: "Not yet." }],
    explanation: [
      { id: "s1", say: "One." },
      { id: "s2", say: "Two." },
    ],
    misconceptions,
  };
}
const at = (step: number, a: Omit<BitGroupingAnswer, "kind" | "step">): BitGroupingAnswer => ({ kind: "bit-grouping", step, ...a });

describe("bit-grouping: digits → bits (#210, content pack ch1 s.21, s.27)", () => {
  // 246₈ → 010 100 110 and 1A3₁₆ → 0001 1010 0011 (the slide fixtures)
  const oct = variant({ bits: "10100110", groupSize: 3, answer: "246", direction: "to-bits" });
  const hex = variant({ bits: "110100011", groupSize: 4, answer: "1A3", direction: "to-bits" });

  it("is one goal per digit, left to right", () => {
    expect(bitGrouping.steps!.count(oct.spec)).toBe(3);
    expect(bitGrouping.steps!.tag(oct.spec, 0)).toBe("bits");
    expect(bitGrouping.steps!.vars(hex.spec, 1)).toMatchObject({ digit: "A", groupBits: "1010", groupIndex: 2 });
    expect(bitGrouping.grade(oct, at(0, { group: "010" }))).toMatchObject({ correct: true, partial: true });
    expect(bitGrouping.grade(oct, at(2, { group: "110" }))).toMatchObject({ correct: true, partial: false });
    expect(["0001", "1010", "0011"].map((g, i) => bitGrouping.grade(hex, at(i, { group: g })).correct)).toEqual([true, true, true]);
  });

  it("recognises missing leading zeros and reversed bits", () => {
    expect(bitGrouping.grade(oct, at(0, { group: "10" }))).toMatchObject({ correct: false, misconceptionId: "bg.bits-unpadded" });
    expect(bitGrouping.grade(oct, at(2, { group: "011" }))).toMatchObject({ correct: false, misconceptionId: "bg.bits-reversed" });
    expect(bitGrouping.grade(hex, at(2, { group: "0011" })).correct).toBe(true);
    expect(bitGrouping.grade(hex, at(0, { group: "1000" }))).toMatchObject({ misconceptionId: "bg.bits-reversed" });
  });
});

describe("bit-grouping: outward from the binary point (#210, s.22)", () => {
  // 10101011.1₂ → 010 101 011 . 100 → 253.4₈ (the slide fixture)
  const point = variant({ bits: "10101011.1", groupSize: 3, answer: "253.4" });

  it("groups the whole part leftward and the fraction rightward, padding outward", () => {
    expect(groupsAroundPoint("10101011.1", 3)).toEqual({ whole: ["010", "101", "011"], frac: ["100"] });
    expect(markedGroups(point.spec)).toEqual(["010", "101", "011", ".", "100"]);
    expect(computedAnswer(point.spec)).toBe("253.4");
    expect(computedAnswer(variant({ bits: "110111.101", groupSize: 3, answer: "67.5" }).spec)).toBe("67.5"); // no padding (pack set)
    expect(computedAnswer(variant({ bits: "1110001.11", groupSize: 4, answer: "71.C" }).spec)).toBe("71.C");
  });

  it("marks the groups with the point, then one digit per group including the fraction", () => {
    expect(bitGrouping.steps!.count(point.spec)).toBe(5);
    expect(bitGrouping.steps!.vars(point.spec, 0)).toMatchObject({ padCount: 1, fracPadCount: 2, groupCount: 4 });
    expect(bitGrouping.grade(point, at(0, { groups: ["010", "101", "011", ".", "100"] }))).toMatchObject({ correct: true, partial: true });
    expect(bitGrouping.grade(point, at(4, { digit: "4" }))).toMatchObject({ correct: true, partial: false });
  });

  it("recognises a fraction grouped from its right end, and still names whole-part mistakes", () => {
    expect(bitGrouping.grade(point, at(0, { groups: ["010", "101", "011", ".", "001"] }))).toMatchObject({ correct: false, misconceptionId: "bg.fraction-from-right-end" });
    expect(bitGrouping.grade(point, at(0, { groups: ["10", "101", "011", ".", "100"] }))).toMatchObject({ correct: false, misconceptionId: "bg.group-no-padding" });
  });

  it("keeps the original mode unchanged", () => {
    const old = variant({ bits: "11010", groupSize: 4, answer: "1A" });
    expect(bitGrouping.steps!.count(old.spec)).toBe(3);
    expect(bitGrouping.grade(old, at(0, { groups: ["0001", "1010"] }))).toMatchObject({ correct: true, partial: true });
    expect(bitGrouping.grade(old, at(0, { groups: ["1101", "0"] }))).toMatchObject({ misconceptionId: "bg.group-from-left" });
  });

  it("validates the spec", () => {
    const ok = (s: object) => BitGroupingSpec.safeParse({ kind: "bit-grouping", groupSize: 3, ...s }).success;
    expect(ok({ bits: "101.1", answer: "5" })).toBe(false); // point in one, not the other
    expect(ok({ bits: "1.2", answer: "1.2" })).toBe(false);
    expect(ok({ bits: "101.1", answer: "5.4" })).toBe(true);
    expect(ok({ bits: "0011", answer: "3" })).toBe(false); // leading zeros would add a group (QA on #328)
    expect(ok({ bits: "0.101", answer: "0.5" })).toBe(true);
  });
});
