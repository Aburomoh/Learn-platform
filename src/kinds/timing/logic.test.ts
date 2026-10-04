import { describe, expect, it } from "vitest";
import type { VariantOf } from "../types";
import { TimingSpec } from "./spec";
import { activeEdges, clockLevels, nextQ, qAfterEdges, qLevels, timing, type TimingAnswer } from "./logic";

type Misconception = VariantOf<TimingSpec>["misconceptions"][number];
// The kind's detectors join the schema when it is registered with its view (Frontend, ADR-0008).
const detector = (type: string) => ({ type }) as unknown as Misconception["detect"];
const TYPES = ["input-after-edge", "jk-toggle-missed", "t-as-d", "inputs-swapped", "held-not-applied", "changed-on-hold"];

function variant(spec: unknown): VariantOf<TimingSpec> {
  return {
    id: "v1",
    prompt: "Draw Q.",
    spec: TimingSpec.parse(spec),
    vars: {},
    hints: [{ rung: 2, text: "Not yet." }],
    explanation: [
      { id: "s1", say: "One." },
      { id: "s2", say: "Two." },
    ],
    misconceptions: TYPES.map((t) => ({ id: t, title: t, nudgeKey: t, detect: detector(t) })),
  };
}

const grade = (v: VariantOf<TimingSpec>, a: Omit<TimingAnswer, "kind">) => timing.grade(v, { kind: "timing", ...a });
type Bit = 0 | 1;
/** Levels per column (1-based ranges high, as the pack lists them). */
const high = (length: number, ...ranges: [number, number][]): Bit[] => Array.from({ length }, (_, c) => (ranges.some(([a, b]) => c + 1 >= a && c + 1 <= b) ? 1 : 0));
/** One level per rising edge, held for the low and the high column around it. */
const perEdge = (values: Bit[]): Bit[] => values.flatMap((v) => [v, v]);

describe("timing: flip-flop truth from the characteristic equations", () => {
  it("matches the slides' tables (s.16, s.26, s.30, s.35)", () => {
    // SR: 00 hold, 10 set, 01 reset; JK adds 11 toggle; D copies; T toggles on 1
    expect([[0, 0], [1, 0], [0, 1]].map(([s, r]) => [nextQ("SR", [s as Bit, r as Bit], 0), nextQ("SR", [s as Bit, r as Bit], 1)])).toEqual([[0, 1], [1, 1], [0, 0]]);
    expect([[0, 0], [1, 0], [0, 1], [1, 1]].map(([j, k]) => [nextQ("JK", [j as Bit, k as Bit], 0), nextQ("JK", [j as Bit, k as Bit], 1)])).toEqual([[0, 1], [1, 1], [0, 0], [1, 0]]);
    expect([nextQ("D", [0], 1), nextQ("D", [1], 0)]).toEqual([0, 1]);
    expect([nextQ("T", [0], 1), nextQ("T", [1], 1), nextQ("T", [1], 0)]).toEqual([1, 0, 1]);
  });
});

describe("timing: the pack's diagrams", () => {
  it("s.17–20 SR, rising, Q0 = 0: Q = 0 1 0 1 1", () => {
    const v = variant({ kind: "timing", flipFlop: "SR", edge: "rising", initialQ: 0, inputs: [{ name: "S", levels: perEdge([0, 1, 0, 1, 1]) }, { name: "R", levels: perEdge([0, 0, 1, 0, 0]) }] });
    expect(clockLevels(v.spec).slice(0, 4)).toEqual([0, 1, 0, 1]);
    expect(activeEdges(v.spec).map((e) => e.column)).toEqual([1, 3, 5, 7, 9]);
    expect(qAfterEdges(v.spec)).toEqual([0, 1, 0, 1, 1]);
    expect(qLevels(v.spec)).toEqual([0, 0, 0, 1, 1, 0, 0, 1, 1, 1]);
  });

  it("s.29 JK, rising, edges 1–16 of 17 (column levels as on the grid)", () => {
    const v = variant({ kind: "timing", flipFlop: "JK", edge: "rising", initialQ: 0, edgeCount: 16, inputs: [{ name: "J", levels: high(34, [3, 8], [17, 26]) }, { name: "K", levels: high(34, [11, 14], [29, 34]) }] });
    expect(activeEdges(v.spec).map((e) => e.before.join("")).join(" ")).toBe("00 10 10 10 00 01 01 00 10 10 10 10 10 00 01 01");
    expect(qAfterEdges(v.spec).join(" ")).toBe("0 1 1 1 1 0 0 0 1 1 1 1 1 1 0 0");
    expect(timing.steps!.count(v.spec)).toBe(16);
  });

  it("s.36 T, falling, edges 1–13 of 16, from Q = 0 and Q = 1", () => {
    const spec = (initialQ: Bit) => ({ kind: "timing", flipFlop: "T", edge: "falling", initialQ, edgeCount: 13, inputs: [{ name: "T", levels: high(34, [4, 9], [16, 25]) }] });
    expect(qAfterEdges(variant(spec(0)).spec).join(" ")).toBe("0 1 0 1 1 1 1 0 1 0 1 0 0");
    expect(qAfterEdges(variant(spec(1)).spec).join(" ")).toBe("1 0 1 0 0 0 0 1 0 1 0 1 1");
  });
});

describe("timing: grading one edge at a time", () => {
  const jk = variant({ kind: "timing", flipFlop: "JK", edge: "rising", initialQ: 0, inputs: [{ name: "J", levels: [1, 1, 1, 0, 1, 1, 0, 0] }, { name: "K", levels: [0, 0, 1, 1, 1, 1, 0, 1] }] });
  // edges at columns 1, 3, 5, 7 read columns 0, 2, 4, 6: JK = 10, 11, 11, 00 → Q = 1, 0, 1, 1

  it("partial until the last edge, then done", () => {
    expect(qAfterEdges(jk.spec)).toEqual([1, 0, 1, 1]);
    expect(grade(jk, { step: 0, q: 1 })).toMatchObject({ correct: true, partial: true });
    expect(grade(jk, { step: 3, q: 1 })).toMatchObject({ correct: true });
    expect(grade(jk, { step: 3, q: 1 }).partial).toBeUndefined();
    expect(timing.steps!.vars(jk.spec, 1)).toMatchObject({ edgeNumber: 2, edgeCount: 4, inputsAtEdge: "J = 1, K = 1", qBefore: 1, qAfter: 0 });
  });

  it("names the slip", () => {
    expect(grade(jk, { step: 1, q: 1 }).misconceptionId).toBe("jk-toggle-missed"); // 11 held
    expect(grade(jk, { step: 0, q: 0 }).misconceptionId).toBe("inputs-swapped"); // 10 read as reset
    const held = variant({ kind: "timing", flipFlop: "D", edge: "rising", initialQ: 0, inputs: [{ name: "D", levels: [1, 1, 0, 0] }] });
    expect(grade(held, { step: 0, q: 0 }).misconceptionId).toBe("held-not-applied"); // D = 1 should set
    const t = variant({ kind: "timing", flipFlop: "T", edge: "rising", initialQ: 1, inputs: [{ name: "T", levels: [1, 1, 0, 0] }] });
    expect(grade(t, { step: 0, q: 1 }).misconceptionId).toBe("t-as-d"); // T = 1 copied, not toggled
    // the level changes right at the edge: read after it
    const d = variant({ kind: "timing", flipFlop: "D", edge: "rising", initialQ: 0, inputs: [{ name: "D", levels: [0, 1, 1, 1] }] });
    expect(grade(d, { step: 0, q: 1 }).misconceptionId).toBe("input-after-edge");
    const sr = variant({ kind: "timing", flipFlop: "SR", edge: "rising", initialQ: 1, inputs: [{ name: "S", levels: [0, 0, 0, 0] }, { name: "R", levels: [0, 0, 1, 1] }] });
    expect(grade(sr, { step: 0, q: 0 }).misconceptionId).toBe("changed-on-hold"); // 00 holds
    const sr2 = variant({ kind: "timing", flipFlop: "SR", edge: "rising", initialQ: 1, inputs: [{ name: "S", levels: [0, 0, 0, 0] }, { name: "R", levels: [1, 1, 0, 0] }] });
    expect(grade(sr2, { step: 0, q: 1 }).misconceptionId).toBe("inputs-swapped"); // R = 1 read as set
    expect(grade(jk, { step: 0 })).toMatchObject({ correct: false, normalized: "edge1:" });
  });

  it("rejects malformed specs", () => {
    const base = { kind: "timing", flipFlop: "SR", edge: "rising", initialQ: 0 };
    expect(TimingSpec.safeParse({ ...base, inputs: [{ name: "J", levels: [0, 0, 0] }, { name: "K", levels: [0, 0, 0] }] }).success).toBe(false);
    expect(TimingSpec.safeParse({ ...base, inputs: [{ name: "S", levels: [1, 1, 0] }, { name: "R", levels: [1, 1, 0] }] }).success).toBe(false); // S = R = 1
    expect(TimingSpec.safeParse({ ...base, inputs: [{ name: "S", levels: [0, 0, 0] }, { name: "R", levels: [0, 0] }] }).success).toBe(false);
    expect(TimingSpec.safeParse({ ...base, edgeCount: 5, inputs: [{ name: "S", levels: [0, 0, 0, 0] }, { name: "R", levels: [0, 0, 0, 0] }] }).success).toBe(false);
  });
});
