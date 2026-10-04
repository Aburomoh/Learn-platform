import { describe, expect, it } from "vitest";
import type { VariantOf } from "../types";
import { KmapSpec } from "./spec";
import { cellValues, cubeOf, groupCount, kmap, kmapCovers, kmapLayout, productCube, type Cell, type KmapAnswer } from "./logic";
import { formatCube, parseBool } from "@/content/boolean";

type Misconception = VariantOf<KmapSpec>["misconceptions"][number];
// The kind's detectors join the schema when it is registered with its view (Frontend, ADR-0008).
const detector = (type: string) => ({ type }) as unknown as Misconception["detect"];
const TYPES = ["fill-binary-order", "fill-dontcare-as-one", "group-shape", "group-covers-zero", "group-only-dontcares", "group-too-small", "group-not-needed", "term-keeps-changing", "term-wrong-complement", "answer-misses-ones", "answer-not-minimal"];

function variant(spec: unknown): VariantOf<KmapSpec> {
  return {
    id: "v1",
    prompt: "Simplify with the map.",
    spec: KmapSpec.parse(spec),
    vars: {},
    hints: [{ rung: 2, text: "Not yet." }],
    explanation: [
      { id: "s1", say: "One." },
      { id: "s2", say: "Two." },
    ],
    misconceptions: TYPES.map((t) => ({ id: t, title: t, nudgeKey: t, detect: detector(t) })),
  };
}

const grade = (v: VariantOf<KmapSpec>, a: Omit<KmapAnswer, "kind">) => kmap.grade(v, { kind: "kmap", ...a });

// ch3 pack §3 Ex.1 (s.20–25): F(A,B,C) = Σ(3,4,6,7) → BC + AC′, unique
const ex1 = variant({ kind: "kmap", vars: ["A", "B", "C"], minterms: [3, 4, 6, 7] });

describe("kmap layout", () => {
  it("lays out 2-, 3- and 4-variable maps in Gray order, as on the slides", () => {
    expect(kmapLayout(["A", "B"]).grid).toEqual([[0, 1], [2, 3]]);
    expect(kmapLayout(["A", "B", "C"])).toMatchObject({ rowVars: ["A"], colVars: ["B", "C"], grid: [[0, 1, 3, 2], [4, 5, 7, 6]] });
    expect(kmapLayout(["A", "B", "C", "D"]).grid).toEqual([[0, 1, 3, 2], [4, 5, 7, 6], [12, 13, 15, 14], [8, 9, 11, 10]]);
  });

  it("forms cubes from wrapping rectangles only", () => {
    expect(cubeOf([4, 6])).toEqual({ bits: 4, mask: 2 }); // wrap: AC′
    expect(cubeOf([0, 2, 8, 10])).toEqual({ bits: 0, mask: 10 }); // four corners: B′D′
    expect(cubeOf([3, 4])).toBeNull(); // not adjacent
    expect(cubeOf([0, 1, 3])).toBeNull(); // three cells
    expect(cubeOf([0, 1, 5, 7])).toBeNull(); // an L / zig-zag of four
  });

  it("reads a product as a cube", () => {
    const vars = ["A", "B", "C"];
    expect(productCube(parseBool("BC", { vars }), vars)).toEqual({ bits: 3, mask: 4 });
    expect(productCube(parseBool("AC'", { vars }), vars)).toEqual({ bits: 4, mask: 2 });
    expect(productCube(parseBool("BC + A", { vars }), vars)).toBeNull();
    expect(productCube(parseBool("AA'", { vars }), vars)).toBeNull();
  });
});

describe("kmap grading (ch3 pack)", () => {
  it("has a fixed step count: fill, two goals per group, then F", () => {
    expect(groupCount(ex1.spec)).toBe(2);
    expect(kmap.steps!.count(ex1.spec)).toBe(6);
    expect([0, 1, 2, 3, 4, 5].map((i) => kmap.steps!.tag(ex1.spec, i))).toEqual(["fill", "group", "term", "group", "term", "answer"]);
    const given = variant({ kind: "kmap", vars: ["A", "B", "C"], minterms: [3, 4, 6, 7], fill: false });
    expect(kmap.steps!.count(given.spec)).toBe(5);
    expect(kmap.steps!.vars(ex1.spec, 3)).toMatchObject({ groupNumber: 2, groupCount: 2, answer: "AC' + BC" });
  });

  it("fill: right map, binary order slip, don't-cares as 1", () => {
    const truth = cellValues(ex1.spec);
    expect(grade(ex1, { step: 0, cells: truth })).toMatchObject({ correct: true, partial: true });
    // binary order: the values of columns 10 and 11 swapped (m2↔m3, m6↔m7)
    const slip: Cell[] = [...truth];
    [slip[2], slip[3], slip[6], slip[7]] = [truth[3], truth[2], truth[7], truth[6]];
    const r = grade(ex1, { step: 0, cells: slip });
    expect(r).toMatchObject({ correct: false, misconceptionId: "fill-binary-order" });
    expect(r.wrongCells).toEqual({ first: 3, count: 2 }); // reading order: m3 comes before m2
    const dc = variant({ kind: "kmap", vars: ["A", "B", "C"], minterms: [1, 5, 7], dontCares: [0, 3, 6] });
    expect(grade(dc, { step: 0, cells: cellValues(dc.spec).map((v) => (v === "X" ? 1 : v)) }).misconceptionId).toBe("fill-dontcare-as-one");
  });

  it("group: any group of a minimal cover; named slips otherwise", () => {
    expect(grade(ex1, { step: 1, group: [3, 7] })).toMatchObject({ correct: true, partial: true });
    expect(grade(ex1, { step: 1, group: [6, 4] })).toMatchObject({ correct: true }); // the wrap, any order
    expect(grade(ex1, { step: 3, group: [4, 6], previous: [[3, 7]] })).toMatchObject({ correct: true });
    expect(grade(ex1, { step: 3, group: [3, 7], previous: [[3, 7]] }).misconceptionId).toBe("group-not-needed"); // the same group twice
    expect(grade(ex1, { step: 1, group: [3, 4] }).misconceptionId).toBe("group-shape");
    expect(grade(ex1, { step: 1, group: [2, 3] }).misconceptionId).toBe("group-covers-zero");
    expect(grade(ex1, { step: 1, group: [7] }).misconceptionId).toBe("group-too-small");
    expect(grade(ex1, { step: 1, group: [6, 7] }).misconceptionId).toBe("group-not-needed"); // AB is prime, but no minimal cover uses it
    const dc = variant({ kind: "kmap", vars: ["A", "B", "C"], minterms: [1, 5, 7], dontCares: [0, 3, 6] });
    expect(grade(dc, { step: 1, group: [0] }).misconceptionId).toBe("group-only-dontcares");
    expect(grade(dc, { step: 1, group: [1, 3, 5, 7] })).toMatchObject({ correct: true }); // C, taking m3 as 1 (s.97–101)
  });

  it("group: every minimal cover is accepted, but groups must come from one cover (s.40)", () => {
    const s40 = variant({ kind: "kmap", vars: ["x", "y", "z"], minterms: [1, 2, 3, 4, 6] });
    expect(kmapCovers(s40.spec).map((c) => c.map((x) => formatCube(x, ["x", "y", "z"])).sort().join(" + ")).sort()).toEqual(["x'y + x'z + xz'", "x'z + xz' + yz'"]);
    expect(grade(s40, { step: 1, group: [2, 3] }).correct).toBe(true); // x′y
    expect(grade(s40, { step: 1, group: [2, 6] }).correct).toBe(true); // yz′
    expect(grade(s40, { step: 3, group: [2, 6], previous: [[2, 3]] }).misconceptionId).toBe("group-not-needed");
  });

  it("term: the variables that stay constant", () => {
    expect(grade(ex1, { step: 2, group: [3, 7], term: "BC" })).toMatchObject({ correct: true, partial: true });
    expect(grade(ex1, { step: 2, group: [3, 7], term: "CB" }).correct).toBe(true);
    expect(grade(ex1, { step: 2, group: [3, 7], term: "ABC" }).misconceptionId).toBe("term-keeps-changing");
    expect(grade(ex1, { step: 2, group: [3, 7], term: "B'C" }).misconceptionId).toBe("term-wrong-complement");
    expect(grade(ex1, { step: 2, group: [3, 7], term: "B +" })).toMatchObject({ correct: false, normalized: "B +" });
  });

  it("F: any minimal SOP; named slips otherwise", () => {
    expect(grade(ex1, { step: 5, expr: "BC + AC'" })).toMatchObject({ correct: true });
    expect(grade(ex1, { step: 5, expr: "AC' + CB" }).correct).toBe(true);
    expect(grade(ex1, { step: 5, expr: "BC + AC' + AB" }).misconceptionId).toBe("answer-not-minimal");
    expect(grade(ex1, { step: 5, expr: "BC" }).misconceptionId).toBe("answer-misses-ones");
    expect(grade(ex1, { step: 5, expr: "A + B" }).misconceptionId).toBeUndefined();
    const s40 = variant({ kind: "kmap", vars: ["x", "y", "z"], minterms: [1, 2, 3, 4, 6] });
    expect(grade(s40, { step: 7, expr: "x'z + xz' + x'y" }).correct).toBe(true);
    expect(grade(s40, { step: 7, expr: "x'z + xz' + yz'" }).correct).toBe(true);
    // don't-cares free: s.102 Σ(2,4,6,7) + d(1,5) → A + BC′
    const s102 = variant({ kind: "kmap", vars: ["A", "B", "C"], minterms: [2, 4, 6, 7], dontCares: [1, 5] });
    expect(grade(s102, { step: 5, expr: "A + BC'" }).correct).toBe(true);
  });

  it("matches the pack's minimal covers (s.44, s.105, s.107)", () => {
    const text = (vars: string[], minterms: number[], dontCares: number[] = []) =>
      kmapCovers(KmapSpec.parse({ kind: "kmap", vars, minterms, dontCares })).map((c) => c.map((x) => formatCube(x, vars)).join(" + "));
    expect(text(["A", "B", "C", "D"], [3, 5, 8, 9, 10, 11, 12, 13, 14, 15])).toEqual(["A + BC'D + B'CD"]);
    expect(text(["A", "B", "C", "D"], [1, 3, 8, 9, 10, 11, 12, 14, 15], [0, 6, 7, 13])).toEqual(["A + B'D"]);
    expect(text(["A", "B", "C", "D"], [3, 4, 6, 7, 8, 9, 11, 12, 14, 15], [0, 1, 5]).length).toBe(2);
  });

  it("rejects malformed specs", () => {
    expect(KmapSpec.safeParse({ kind: "kmap", vars: ["A", "B", "C"], minterms: [8] }).success).toBe(false);
    expect(KmapSpec.safeParse({ kind: "kmap", vars: ["A", "B", "C"], minterms: [1], dontCares: [1] }).success).toBe(false);
    expect(KmapSpec.safeParse({ kind: "kmap", vars: ["A", "B", "C"], minterms: [] }).success).toBe(false);
    expect(KmapSpec.safeParse({ kind: "kmap", vars: ["A"], minterms: [1] }).success).toBe(false);
  });
});
