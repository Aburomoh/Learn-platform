import { describe, expect, it } from "vitest";
import { getActivity } from "../../index";
import { mintermsOf, parseBool } from "../../boolean";
import { columnTruth } from "@/kinds/truth-table/logic";
import { transitions } from "@/kinds/state-diagram/logic";

const COURSE = "ecet111";

describe("Chapter 5 analysis exercises", () => {
  it("analysis exercises (#317): equations, tables and diagrams as machine-worked in the pack (ch5-partii §6)", () => {
    const x = getActivity(COURSE, "analysis", "analysis-exercises")!.activity;
    const [na, nb, table, diagram] = x.questions;
    const sig = (q: typeof na) => q.variants.map(({ spec }) => (spec.kind === "expression" ? mintermsOf(parseBool(spec.target!, { vars: spec.vars }), spec.vars) : []));
    expect(sig(na)).toEqual([[1, 3, 4, 5], [3, 4, 5, 6, 7], [1]]); // JK, T, s.54 (A′B)
    expect(sig(nb)).toEqual([[1, 5, 6, 7], [1, 2, 4, 5], [0]]); // s.54: A′B′
    const next = table.variants.map(({ spec }) => {
      if (spec.kind !== "truth-table") throw new Error("expected a truth table");
      const [a, b] = spec.columns.map((c) => columnTruth(spec, c));
      return a.map((v, r) => `${v}${b[r]}`).join(" ");
    });
    expect(next[0]).toBe("00 11 00 10 10 11 01 01"); // s.32 rows
    expect(next[1]).toBe("00 01 01 10 11 11 10 10"); // s.53 rows
    expect(next[2]).toBe("00 00 11 01 00 00 10 10 00 00 11 01 00 00 11 11"); // s.31 (A B x y)
    const edges = diagram.variants.map(({ spec }) => (spec.kind === "state-diagram" ? transitions(spec).map((t) => `${t.from}-${t.label}-${t.to}`).join(" ") : ""));
    expect(edges[0]).toBe("00-0-00 00-1-11 01-0-00 01-1-10 10-0-10 10-1-11 11-0-01 11-1-01");
  });
});
