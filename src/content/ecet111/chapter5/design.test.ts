import { describe, expect, it } from "vitest";
import { getActivity } from "../../index";
import { formatCube } from "../../boolean";
import { kmapCovers } from "@/kinds/kmap/logic";
import { statesAfterEdges } from "@/kinds/timing/logic";

const COURSE = "ecet111";

describe("Chapter 5 design problem", () => {
  it("design problem (#293): covers and the trace from 000 as in the pack (ch5-partiii §2, owner S2 and A2)", () => {
    const x = getActivity(COURSE, "design", "design-problem")!.activity;
    const [, maps, trace] = x.questions;
    const covers = maps.variants.map(({ spec }) => (spec.kind === "kmap" ? kmapCovers(spec).map((c) => c.map((q) => formatCube(q, spec.vars)).sort().join(" + ")).sort() : []));
    expect(covers.slice(0, 3)).toEqual([["A'BX + ABX' + CX"], ["B'C'X + BC'X' + BCX"], ["A'BX' + AX + CX'"]]); // DA, DB, DC
    expect(covers[3]).toHaveLength(4); // Y has four minimal covers, all accepted
    const t = trace.variants[0].spec;
    if (t.kind !== "timing") throw new Error("expected timing");
    expect(statesAfterEdges(t).map((s) => s.join("")).join(" ")).toBe("000 010 100 011 110 110 110 110 001 100");
  });
});
