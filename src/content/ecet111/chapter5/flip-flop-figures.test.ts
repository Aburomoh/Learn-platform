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
    for (const q of [...questions("flip-flop-tables"), ...questions("flip-flop-equations")]) for (const v of q.variants) expect(v.figure?.type, `${q.id}/${v.id}`).toBe("flip-flop");
  });
});
