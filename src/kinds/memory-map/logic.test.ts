import { describe, expect, it } from "vitest";
import { VariantSchema, type Variant } from "@/content/schema";
import { goals, memoryMap, type MemoryMapAnswer } from "./logic";
import type { MemoryMapSpec } from "./spec";

const base = {
  prompt: "Place the jobs.",
  hints: [{ rung: 2, text: "Not yet." }],
  explanation: [
    { id: "s1", say: "One." },
    { id: "s2", say: "Two." },
  ],
};
const detectors = ["block-too-small", "first-fit-as-best", "best-fit-as-first", "waits-though-fits", "waste-as-size", "largest-hole-only", "no-merge", "partial-merge", "merge-wrong-start", "merged-busy", "gap-left", "register-sign", "register-unit"];
const misconceptions = detectors.map((type) => ({ id: type, title: type, nudgeKey: type, detect: { type } }));

const variant = (spec: Record<string, unknown>): Variant => VariantSchema.parse({ id: "v", spec: { kind: "memory-map", ...spec }, misconceptions, ...base });
const answer = (step: number, a: Omit<MemoryMapAnswer, "kind" | "step">): MemoryMapAnswer => ({ kind: "memory-map", step, ...a });
const grade = (v: Variant, step: number, a: Omit<MemoryMapAnswer, "kind" | "step">) => memoryMap.grade(v as never, answer(step, a));

// Ch2 s.12: fixed 100, 25, 25, 50; J1 30, J2 50, J3 30, J4 25 → J1 → 100, J2 → 50, J3 waits, J4 → first 25
const fixedFirst = variant({ scheme: "fixed", fit: "first", os: 10, partitions: [100, 25, 25, 50], jobs: [{ id: "J1", size: 30 }, { id: "J2", size: 50 }, { id: "J3", size: 30 }, { id: "J4", size: 25 }], events: [{ place: "J1" }, { place: "J2" }, { place: "J3" }, { place: "J4" }, { fragmentation: true }] });

// Ch2 s.19–20: blocks 30, 15, 50, 20; J1 10, J2 20, J3 30, J4 10
const s19 = (fit: "first" | "best") => variant({ scheme: "fixed", fit, os: 10, partitions: [30, 15, 50, 20], jobs: [{ id: "J1", size: 10 }, { id: "J2", size: 20 }, { id: "J3", size: 30 }, { id: "J4", size: 10 }], events: [{ place: "J1" }, { place: "J2" }, { place: "J3" }, { place: "J4" }, { fragmentation: true }] });

describe("memory-map goals: placing (Ch2 s.12, s.19–21)", () => {
  it("first-fit, fixed: J3 waits although 70 K is free inside partition 1; waste column 70, 0, 0", () => {
    const g = goals(fixedFirst.spec as MemoryMapSpec);
    expect(g.map((x) => x.tag)).toEqual(["place", "place", "place", "place", "waste"]);
    expect(g.slice(0, 4).map((x) => (x.tag === "place" ? x.blockIndex : null))).toEqual([0, 3, null, 1]);
    const waste = g[4];
    if (waste.tag !== "waste") throw new Error();
    expect(waste.values).toEqual([70, 0, null, 0]);
    expect(g[4].before.map((r) => `${r.start}:${r.job ?? "free"}`)).toEqual(["10:J1", "110:J4", "135:free", "160:J2"]);
  });

  it("s.19 first-fit: J1 → 30 K, J2 → 50 K, J3 waits, J4 → 15 K; s.20 best-fit places all four", () => {
    const first = goals(s19("first").spec as MemoryMapSpec).slice(0, 4).map((x) => (x.tag === "place" ? x.blockIndex : null));
    expect(first).toEqual([0, 2, null, 1]);
    const best = goals(s19("best").spec as MemoryMapSpec).slice(0, 4).map((x) => (x.tag === "place" ? x.blockIndex : null));
    expect(best).toEqual([1, 3, 0, 2]);
  });

  it("grades a pick: the policy's block is right and partial; too small, the other policy's block and a wrong wait are named", () => {
    const v = s19("first");
    expect(grade(v, 0, { block: 0 })).toMatchObject({ correct: true, partial: true });
  });
});

describe("memory-map grading detail", () => {
  const v = s19("first");
  it("first-fit: picking the tightest block is first-fit-as-best; a block too small; waiting though a block fits", () => {
    expect(grade(v, 0, { block: 1 })).toMatchObject({ correct: false, misconceptionId: "first-fit-as-best" });
    // J2 (20): first-fit takes the 50 K block (index 2); the 15 K block is too small
    const g = goals(v.spec as MemoryMapSpec);
    expect(g[1].tag === "place" && g[1].blockIndex).toBe(2);
    expect(grade(v, 1, { block: 1 })).toMatchObject({ correct: false, misconceptionId: "block-too-small" });
    expect(grade(v, 1, { block: "waits" })).toMatchObject({ correct: false, misconceptionId: "waits-though-fits" });
    // J3 (30) waits: no free block (15, 20) is large enough
    expect(grade(v, 2, { block: "waits" })).toMatchObject({ correct: true, partial: true });
    expect(grade(v, 2, { block: 1 })).toMatchObject({ correct: false, misconceptionId: "block-too-small" });
  });

  it("best-fit: taking the first block that fits is best-fit-as-first", () => {
    expect(grade(s19("best"), 0, { block: 0 })).toMatchObject({ correct: false, misconceptionId: "best-fit-as-first" });
  });

  it("waste column: only busy partitions count; the first wrong cell is reported; a job size written is waste-as-size", () => {
    // after J1 → 30, J2 → 50, J3 waits, J4 → 15: waste 20, 5, 30, free
    expect(grade(v, 4, { values: [20, 5, 30, null] })).toMatchObject({ correct: true, partial: false });
    expect(grade(v, 4, { values: [20, 5, 30, 99] })).toMatchObject({ correct: true });
    expect(grade(v, 4, { values: [10, 5, 30, null] })).toMatchObject({ correct: false, misconceptionId: "waste-as-size", wrongCells: { first: 0, count: 1 } });
    expect(grade(v, 4, { values: [20, 7, 31, null] })).toMatchObject({ correct: false, wrongCells: { first: 1, count: 2 } });
  });

  it("step vars name the job, the fit and the block list; the last step is not partial", () => {
    const vars = memoryMap.steps!.vars(v.spec as MemoryMapSpec, 0);
    expect(vars).toMatchObject({ jobId: "J1", jobSize: 10, fitName: "first-fit", blockList: "30, 15, 50, 20", stepNumber: 1, stepCount: 5, partitionNumber: 1 });
    expect(memoryMap.steps!.tag(v.spec as MemoryMapSpec, 4)).toBe("waste");
  });
});

// Ch2 s.15: OS 0–10, one 95 K block; J1 10, J2 15, J3 20, J4 50; then J1, J4 end; J5 5, J6 30; J3 ends; J7 10, J8 30 waits
const dynamic = variant({
  scheme: "dynamic",
  fit: "first",
  os: 10,
  partitions: [95],
  jobs: [{ id: "J1", size: 10 }, { id: "J2", size: 15 }, { id: "J3", size: 20 }, { id: "J4", size: 50 }, { id: "J5", size: 5 }, { id: "J6", size: 30 }, { id: "J7", size: 10 }, { id: "J8", size: 30 }],
  events: [{ place: "J1" }, { place: "J2" }, { place: "J3" }, { place: "J4" }, { release: "J1" }, { release: "J4" }, { place: "J5" }, { place: "J6" }, { release: "J3" }, { place: "J7" }, { place: "J8" }, { fragmentation: true }],
});

describe("memory-map: dynamic partitions (Ch2 s.15), release and fragmentation", () => {
  it("follows the slide: J8 waits although 35 K are free in three holes", () => {
    const g = goals(dynamic.spec as MemoryMapSpec);
    const last = g[g.length - 1];
    if (last.tag !== "holes") throw new Error();
    expect(last.value).toBe(35);
    expect(last.before.filter((r) => r.job === null).map((r) => `${r.start}+${r.size}`)).toEqual(["15+5", "45+10", "85+20"]);
    const j8 = g[10];
    expect(j8.tag === "place" && j8.blockIndex).toBeNull();
    expect(grade(dynamic, 11, { value: 35 })).toMatchObject({ correct: true, partial: false });
    expect(grade(dynamic, 11, { value: 20 })).toMatchObject({ correct: false, misconceptionId: "largest-hole-only" });
  });

  it("a release between busy neighbours is case 3: J1 (10–20) and J3 (35–55, between J2 and J6) stay as they are", () => {
    const g = goals(dynamic.spec as MemoryMapSpec);
    const r1 = g[4];
    if (r1.tag !== "release") throw new Error();
    expect(r1.result).toEqual({ start: 10, size: 10 });
    expect(memoryMap.steps!.vars(dynamic.spec as MemoryMapSpec, 4)).toMatchObject({ neighbourCase: 3, releasedStart: 10, releasedSize: 10 });
    const r3 = g[8];
    if (r3.tag !== "release") throw new Error();
    expect(r3.result).toEqual({ start: 35, size: 20 });
    expect(r3.after.filter((r) => r.job === null).map((r) => `${r.start}+${r.size}`)).toEqual(["15+5", "35+20", "85+20"]);
    expect(grade(dynamic, 8, { start: 35, size: 20 })).toMatchObject({ correct: true });
  });

  it("a release beside a free block (case 1) merges: no-merge and merge-wrong-start are named; the first wrong field is marked", () => {
    // the s.25 shape: busy 7600 (200) released next to free 7800 (5) → 7600, 205
    const v = variant({ scheme: "dynamic", fit: "first", os: 7000, layout: [{ size: 600, job: "A" }, { size: 200, job: "B" }, { size: 5 }, { size: 500, job: "C" }], jobs: [{ id: "A", size: 600 }, { id: "B", size: 200 }, { id: "C", size: 500 }], events: [{ release: "B" }] });
    expect(memoryMap.steps!.vars(v.spec as MemoryMapSpec, 0)).toMatchObject({ neighbourCase: 1, resultStart: 7600, resultSize: 205 });
    expect(grade(v, 0, { start: 7600, size: 205 })).toMatchObject({ correct: true });
    expect(grade(v, 0, { start: 7600, size: 200 })).toMatchObject({ correct: false, misconceptionId: "no-merge", wrongCells: { first: 1, count: 1 } });
    const below = variant({ scheme: "dynamic", fit: "first", os: 10, layout: [{ size: 10 }, { size: 20, job: "B" }, { size: 50, job: "C" }], jobs: [{ id: "B", size: 20 }, { id: "C", size: 50 }], events: [{ release: "B" }] });
    expect(grade(below, 0, { start: 20, size: 30 })).toMatchObject({ correct: false, misconceptionId: "merge-wrong-start", wrongCells: { first: 0, count: 1 } });
    expect(grade(below, 0, { start: 10, size: 30 })).toMatchObject({ correct: true });
  });
});

// Ch2 s.27–28 (case 2): free 7560 (20), busy 7580 (20), free 7600 (205), busy 7805 (1000) → releasing the 20 gives 7560, 245
const case2 = variant({
  scheme: "dynamic",
  fit: "first",
  os: 7560,
  layout: [{ size: 20 }, { size: 20, job: "P1" }, { size: 205 }, { size: 1000, job: "P2" }],
  jobs: [{ id: "P1", size: 20 }, { id: "P2", size: 1000 }],
  events: [{ release: "P1" }],
});

describe("memory-map: release case 2 from a given layout (Ch2 s.27–28)", () => {
  it("joins three: 7560, 245; one side only is partial-merge; into the busy neighbour is merged-busy", () => {
    expect(grade(case2, 0, { start: 7560, size: 245 })).toMatchObject({ correct: true, partial: false });
    expect(grade(case2, 0, { start: 7560, size: 40 })).toMatchObject({ correct: false, misconceptionId: "partial-merge" });
    expect(grade(case2, 0, { start: 7580, size: 225 })).toMatchObject({ correct: false, misconceptionId: "partial-merge" });
    expect(grade(case2, 0, { start: 7560, size: 1245 })).toMatchObject({ correct: false, misconceptionId: "merged-busy" });
    expect(memoryMap.steps!.vars(case2.spec as MemoryMapSpec, 0)).toMatchObject({ neighbourCase: 2, resultStart: 7560, resultSize: 245 });
  });

  it("fixed scheme: a release is a single pick of the job's partition", () => {
    const v = variant({ scheme: "fixed", fit: "first", os: 10, layout: [{ size: 30, job: "P1" }, { size: 20 }], jobs: [{ id: "P1", size: 15 }], events: [{ release: "P1" }] });
    expect(memoryMap.steps!.tag(v.spec as MemoryMapSpec, 0)).toBe("release");
    expect(grade(v, 0, { block: 0 })).toMatchObject({ correct: true });
    expect(grade(v, 0, { block: 1 })).toMatchObject({ correct: false });
  });
});

// Ch2 s.36: OS 8; J1 8/22; hole 15; J3 45/25; hole 15; J2 85/15; top 100 → J1 8, J3 30, J2 55; registers J3 −15360, J2 −30720
const compaction = variant({
  scheme: "relocatable",
  fit: "first",
  os: 8,
  layout: [{ size: 22, job: "J1" }, { size: 15 }, { size: 25, job: "J3" }, { size: 15 }, { size: 15, job: "J2" }],
  jobs: [{ id: "J1", size: 22 }, { id: "J2", size: 15 }, { id: "J3", size: 25 }],
  events: [{ compact: true }],
});

describe("memory-map: compaction (Ch2 s.36)", () => {
  it("one move per job in address order, then a register per moved job; the free block ends at 70–100", () => {
    const g = goals(compaction.spec as MemoryMapSpec);
    expect(g.map((x) => x.tag)).toEqual(["move", "move", "move", "register", "register"]);
    expect(g.slice(0, 3).map((x) => (x.tag === "move" ? [x.job.id, x.relocation.newStart] : null))).toEqual([["J1", 8], ["J3", 30], ["J2", 55]]);
    expect(g[0].after.map((r) => `${r.start}+${r.size}:${r.job ?? "free"}`)).toEqual(["8+22:J1", "30+25:J3", "55+15:J2", "70+30:free"]);
    expect(grade(compaction, 0, { start: 8 })).toMatchObject({ correct: true, partial: true });
    expect(grade(compaction, 1, { start: 30 })).toMatchObject({ correct: true });
    expect(grade(compaction, 1, { start: 45 })).toMatchObject({ correct: false, misconceptionId: "gap-left" });
    expect(grade(compaction, 3, { value: -15360 })).toMatchObject({ correct: true, partial: true });
    expect(grade(compaction, 3, { value: 15360 })).toMatchObject({ correct: false, misconceptionId: "register-sign" });
    expect(grade(compaction, 3, { value: -15 })).toMatchObject({ correct: false, misconceptionId: "register-unit" });
    expect(grade(compaction, 4, { value: -30720 })).toMatchObject({ correct: true, partial: false });
    expect(memoryMap.steps!.vars(compaction.spec as MemoryMapSpec, 4)).toMatchObject({ jobId: "J2", oldStart: 85, newStart: 55, deltaUnits: -30, register: -30720 });
  });

  it("registers in KB when the spec asks for them", () => {
    const v = variant({ ...(compaction.spec as object), registerUnit: "KB" });
    expect(grade(v, 3, { value: -15 })).toMatchObject({ correct: true });
    expect(grade(v, 3, { value: -15360 })).toMatchObject({ correct: false, misconceptionId: "register-unit" });
  });
});

describe("memory-map spec", () => {
  it("rejects a release before a place, compaction outside the relocatable scheme, and a layout job of the wrong size", () => {
    const bad = (spec: Record<string, unknown>) => expect(() => variant(spec)).toThrow();
    bad({ scheme: "dynamic", fit: "first", os: 10, partitions: [90], jobs: [{ id: "J1", size: 10 }], events: [{ release: "J1" }] });
    bad({ scheme: "dynamic", fit: "first", os: 10, partitions: [90], jobs: [{ id: "J1", size: 10 }], events: [{ place: "J1" }, { compact: true }] });
    bad({ scheme: "dynamic", fit: "first", os: 10, layout: [{ size: 20, job: "J1" }], jobs: [{ id: "J1", size: 10 }], events: [{ fragmentation: true }] });
  });
});
