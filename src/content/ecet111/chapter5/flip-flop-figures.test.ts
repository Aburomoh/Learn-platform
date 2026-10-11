import { describe, expect, it } from "vitest";
import { getActivity } from "../../index";

const questions = (activity: string) => getActivity("ecet111", "flip-flops", activity)!.activity.questions;

describe("Chapter 5 flip-flop figures (#454)", () => {
  it("row and next-state questions put the prompt's Q and inputs on the symbol", () => {
    const qs = [...questions("flip-flop-tables"), ...questions("flip-flop-equations")].filter((q) => q.id === "ff.q.row" || q.id === "ff.q.next");
    expect(qs).toHaveLength(2);
    for (const v of qs.flatMap((q) => q.variants)) {
      if (v.figure?.type !== "flip-flop" || !v.figure.given) throw new Error("expected a flip-flop with values");
      expect(v.prompt).toContain(`Q(t) = ${v.figure.given.q}`);
      const { ff, given } = v.figure;
      for (const [i, name] of ff.toUpperCase().split("").entries()) expect(v.prompt).toContain(`${name} = ${given.inputs[i]}`);
    }
  });

  it("every table and equation shows its flip-flop", () => {
    for (const q of [...questions("flip-flop-tables"), ...questions("flip-flop-equations")]) {
      for (const v of q.variants) {
        // the equation questions name "this table" (#618), so the table is drawn, with the symbol beside it
        if (q.id.startsWith("ff.q.eq-")) {
          expect(v.figure?.type, `${q.id}/${v.id}`).toBe("table");
          if (v.figure?.type === "table") expect(v.figure.symbol?.ff, `${q.id}/${v.id}`).toBe(q.id.replace("ff.q.eq-", ""));
        } else expect(v.figure?.type, `${q.id}/${v.id}`).toBe("flip-flop");
      }
    }
  });

  it("the table drawn in an equation question is the characteristic table: the 1-rows are the minterms the answer needs", () => {
    for (const q of questions("flip-flop-equations").filter((x) => x.id.startsWith("ff.q.eq-"))) {
      for (const v of q.variants) {
        if (v.figure?.type !== "table" || v.spec.kind !== "expression") throw new Error(`${q.id}/${v.id}: table figure and expression spec expected`);
        const out = v.figure.columns.find((c) => c.role === "output")!;
        const ones = out.values.map((x, r) => (x === 1 ? r : -1)).filter((r) => r >= 0);
        expect(ones, `${q.id}/${v.id}`).toEqual(v.spec.minterms);
        expect(v.prompt).toMatch(/^From this /);
      }
    }
  });
});
