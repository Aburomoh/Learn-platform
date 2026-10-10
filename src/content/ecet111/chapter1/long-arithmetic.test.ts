import { describe, expect, it } from "vitest";
import { getActivity } from "../../index";
import { additionResult } from "../../grade";

const COURSE = "ecet111";
const get = (id: string) => getActivity(COURSE, "binary-arithmetic", id)!.activity;

describe("longer arithmetic (#580 a)", () => {
  it("8-bit sums: four sets, 8-bit operands, with and without an end carry, and a full carry chain", () => {
    const add = get("binary-addition-8bit").questions.find((q) => q.id === "ba8.q.add")!;
    expect(add.variants).toHaveLength(4);
    const sums = add.variants.map((v) => {
      if (v.spec.kind !== "column-addition") throw new Error("column-addition expected");
      expect(v.spec.a).toHaveLength(8);
      expect(v.spec.b).toHaveLength(8);
      return additionResult(v.spec.a, v.spec.b);
    });
    const endCarries = sums.map((s) => s[0]);
    expect(endCarries).toContain("1");
    expect(endCarries).toContain("0");
    // 255 + 1: every column carries, the sum is 1 0000 0000
    expect(sums.some((s) => s === "100000000")).toBe(true);
  });

  it("the decimal check of each long sum equals the sum of the decimal operands", () => {
    const add = get("binary-addition-8bit").questions.find((q) => q.id === "ba8.q.add")!;
    const check = get("binary-addition-8bit").questions.find((q) => q.id === "ba8.q.check-sum")!;
    check.variants.forEach((v, i) => {
      const a = add.variants[i].spec;
      if (a.kind !== "column-addition" || v.spec.kind !== "numeric") throw new Error("unexpected kinds");
      expect(v.spec.answer).toBe(String(parseInt(a.a, 2) + parseInt(a.b, 2)));
    });
  });

  it("8-bit subtraction: positive sets end with an end carry of 1, negative sets with 0 and the right size", () => {
    const sets: [string, number[], number[]][] = [
      ["subtraction-8bit-positive", [200, 150, 99], [75, 38, 41]],
      ["subtraction-8bit-negative", [45, 17, 60], [120, 96, 180]],
    ];
    for (const [id, as, bs] of sets) {
      const act = get(id);
      const endQ = act.questions.find((q) => q.id.endsWith(".q.end-carry"))!;
      expect(endQ.variants).toHaveLength(3);
      endQ.variants.forEach((v, i) => {
        const positive = as[i] >= bs[i];
        if (v.spec.kind !== "multiple-choice") throw new Error("multiple-choice expected");
        const { options, correctOptionId } = v.spec;
        const right = options.find((o) => o.id === correctOptionId)!;
        expect(right.text, `${id} ${as[i]} - ${bs[i]}`).toMatch(positive ? /positive/i : /negative/i);
      });
    }
    const size = get("subtraction-8bit-negative").questions.find((q) => q.id === "sb8n.q.size")!;
    size.variants.forEach((v, i) => {
      if (v.spec.kind !== "numeric") throw new Error("numeric expected");
      expect(v.spec.answer).toBe(String([120 - 45, 96 - 17, 180 - 60][i]));
    });
  });
});
