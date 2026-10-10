import { describe, expect, it } from "vitest";
import { VariantSchema, type Variant } from "@/content/schema";
import { cpuSchedule, goals, type CpuScheduleAnswer } from "./logic";
import type { CpuScheduleSpec } from "./spec";

const base = {
  prompt: "Build the Gantt chart.",
  hints: [{ rung: 2, text: "Not yet." }],
  explanation: [
    { id: "s1", say: "One." },
    { id: "s2", say: "Two." },
  ],
};
const detectors = ["arrival-ignored", "fcfs-under-sjn", "longest-first", "not-preempted", "preempted-nonpreemptive", "end-past-remaining", "priority-reversed", "rr-queue-order", "turnaround-as-finish", "average-wrong-count"];
const misconceptions = detectors.map((type) => ({ id: type, title: type, nudgeKey: type, detect: { type } }));
const variant = (spec: Record<string, unknown>): Variant => VariantSchema.parse({ id: "v", spec: { kind: "cpu-schedule", ...spec }, misconceptions, ...base });
const grade = (v: Variant, step: number, a: Omit<CpuScheduleAnswer, "kind" | "step">) => cpuSchedule.grade(v as never, { kind: "cpu-schedule", step, ...a });
const J = (list: [string, number, number, number?][]) => list.map(([id, arrival, cpu, priority]) => (priority === undefined ? { id, arrival, cpu } : { id, arrival, cpu, priority }));

// Ch4 s.21: SJN A(0,6) B(1,3) C(2,1) D(3,4) → A 0–6, C –7, B –10, D –14; finish 6, 10, 7, 14; TAT 6, 9, 5, 11; avg 7.75
const sjn = variant({ policy: "sjn", jobs: J([["A", 0, 6], ["B", 1, 3], ["C", 2, 1], ["D", 3, 4]]) });

describe("cpu-schedule goals (Ch4 s.21, SJN)", () => {
  it("two goals per segment, then finish, turnaround, average", () => {
    const g = goals(sjn.spec as CpuScheduleSpec);
    expect(g.map((x) => x.tag)).toEqual(["job", "end", "job", "end", "job", "end", "job", "end", "column", "column", "average"]);
    expect(g.filter((x) => x.tag === "job").map((x) => (x.tag === "job" ? [x.job, x.time, x.ready.join("")] : null))).toEqual([
      ["A", 0, "A"],
      ["C", 6, "BCD"],
      ["B", 7, "BD"],
      ["D", 10, "D"],
    ]);
    expect(g[8]).toMatchObject({ column: "finish", values: [6, 10, 7, 14] });
    expect(g[9]).toMatchObject({ column: "turnaround", values: [6, 9, 5, 11] });
    expect(g[10]).toMatchObject({ value: 7.75, sum: 31 });
  });

  it("grades the job: the right one is partial; too early, the earliest and the longest are named", () => {
    expect(grade(sjn, 2, { job: "C" })).toMatchObject({ correct: true, partial: true });
    expect(grade(sjn, 2, { job: "B" })).toMatchObject({ correct: false, misconceptionId: "fcfs-under-sjn" });
    expect(grade(sjn, 2, { job: "D" })).toMatchObject({ correct: false, misconceptionId: "longest-first" });
    expect(grade(sjn, 0, { job: "B" })).toMatchObject({ correct: false, misconceptionId: "arrival-ignored" }); // B arrives at 1
    expect(grade(sjn, 0, { job: "idle" })).toMatchObject({ correct: false, misconceptionId: "arrival-ignored" });
  });

  it("grades the end: a job stopped early under a non-preemptive policy", () => {
    expect(grade(sjn, 1, { end: 6 })).toMatchObject({ correct: true, partial: true });
    expect(grade(sjn, 1, { end: 1 })).toMatchObject({ correct: false, misconceptionId: "preempted-nonpreemptive" });
    expect(grade(sjn, 1, { end: 8 })).toMatchObject({ correct: false, misconceptionId: undefined });
  });

  it("grades the columns and the average: first wrong row; turnaround as finish; wrong count", () => {
    expect(grade(sjn, 8, { values: [6, 10, 7, 14] })).toMatchObject({ correct: true, partial: true });
    expect(grade(sjn, 8, { values: [6, 9, 7, 13] })).toMatchObject({ correct: false, wrongCells: { first: 1, count: 2 } });
    expect(grade(sjn, 9, { values: [6, 10, 7, 14] })).toMatchObject({ correct: false, misconceptionId: "turnaround-as-finish" });
    expect(grade(sjn, 10, { value: 7.75 })).toMatchObject({ correct: true, partial: false });
    expect(grade(sjn, 10, { value: 10.33 })).toMatchObject({ correct: false, misconceptionId: "average-wrong-count" }); // 31 / 3
    const vars = cpuSchedule.steps!.vars(sjn.spec as CpuScheduleSpec, 10);
    expect(vars).toMatchObject({ averageExpression: "(6 + 9 + 5 + 11) / 4", average: "7.75", policyName: "Shortest Job Next" });
  });
});

// Ch4 s.25: SRT A(0,2) B(1,4) C(2,1) D(4,2) → A 0–2, C –3, B –4, D –6, B –9; avg 3.25
const srt = variant({ policy: "srt", jobs: J([["A", 0, 2], ["B", 1, 4], ["C", 2, 1], ["D", 4, 2]]) });
// Ch4 s.31: RR q = 4, A(0,7) B(2,4) C(4,3) D(6,5) → A 0–4, B –8, C –11, A –14, D –18, D –19; avg 10
const rr = variant({ policy: "rr", quantum: 4, jobs: J([["A", 0, 7], ["B", 2, 4], ["C", 4, 3], ["D", 6, 5]]) });
// Ch4 s.27: priority A(9,5,9) B(3,2,3) C(6,4,6) D(5,4,5) E(6,3,6) → B 0–2? No: B arrives at 3; idle 0–3 first
const priority = variant({ policy: "priority", jobs: J([["A", 9, 5, 9], ["B", 3, 2, 3], ["C", 6, 4, 6], ["D", 5, 4, 5], ["E", 6, 3, 6]]) });

describe("cpu-schedule: preemptive and priority policies", () => {
  it("SRT (s.25): B does not preempt A at 1; D preempts B at 4; not-preempted and the reverse are named", () => {
    const g = goals(srt.spec as CpuScheduleSpec);
    const segs = g.filter((x) => x.tag === "end").map((x) => (x.tag === "end" ? `${x.job}${x.time}-${x.end}` : ""));
    expect(segs).toEqual(["A0-2", "C2-3", "B3-4", "D4-6", "B6-9"]);
    // segment 4 at t = 4: B is running (3 left), D arrives with 2: picking B again is not-preempted
    expect(grade(srt, 6, { job: "B" })).toMatchObject({ correct: false, misconceptionId: "not-preempted" });
    expect(grade(srt, 6, { job: "D" })).toMatchObject({ correct: true });
    // segment 3 (B from 3): running to the finish (7) instead of stopping at 4
    expect(grade(srt, 5, { end: 7 })).toMatchObject({ correct: false, misconceptionId: "not-preempted" });
    expect(grade(srt, 5, { end: 4 })).toMatchObject({ correct: true });
    expect(g[g.length - 1]).toMatchObject({ value: 3.25 });
  });

  it("RR (s.31): the slide's segments; a full quantum with less left; the quantum ignored", () => {
    const g = goals(rr.spec as CpuScheduleSpec);
    const segs = g.filter((x) => x.tag === "end").map((x) => (x.tag === "end" ? `${x.job}${x.time}-${x.end}` : ""));
    expect(segs).toEqual(["A0-4", "B4-8", "C8-11", "A11-14", "D14-18", "D18-19"]);
    // segment 3 (C from 8, 3 left): a full quantum to 12 is end-past-remaining
    expect(grade(rr, 5, { end: 12 })).toMatchObject({ correct: false, misconceptionId: "end-past-remaining" });
    // segment 1 (A from 0, 7 left): running to 7 ignores the quantum
    expect(grade(rr, 1, { end: 7 })).toMatchObject({ correct: false, misconceptionId: "not-preempted" });
    // segment 2 at t = 4: C arrives as A's quantum expires and goes ahead of A; picking A is the queue-order slip
    expect(grade(rr, 2, { job: "B" })).toMatchObject({ correct: true });
    expect(grade(rr, 4, { job: "A" })).toMatchObject({ correct: false, misconceptionId: "rr-queue-order" });
    expect(g[g.length - 1]).toMatchObject({ value: 10 });
  });

  it("Priority (s.27): smaller number first; the reversed direction is named; an idle gap when nothing has arrived", () => {
    const g = goals(priority.spec as CpuScheduleSpec);
    const segs = g.filter((x) => x.tag === "end").map((x) => (x.tag === "end" ? `${x.job ?? "idle"}${x.time}-${x.end}` : ""));
    expect(segs).toEqual(["idle0-3", "B3-5", "D5-9", "C9-13", "E13-16", "A16-21"]);
    expect(grade(priority, 0, { job: "idle" })).toMatchObject({ correct: true });
    expect(grade(priority, 0, { job: "B" })).toMatchObject({ correct: false, misconceptionId: "arrival-ignored" });
    // at t = 9: C(6), E(6), A(9) ready: A is the reversed pick
    expect(grade(priority, 6, { job: "A" })).toMatchObject({ correct: false, misconceptionId: "priority-reversed" });
    expect(grade(priority, 6, { job: "C" })).toMatchObject({ correct: true });
  });

  it("identify mode: one goal, the policy", () => {
    const v = variant({ policy: "rr", quantum: 4, mode: "identify", jobs: J([["A", 0, 7], ["B", 2, 4], ["C", 4, 3], ["D", 6, 5]]) });
    expect(goals(v.spec as CpuScheduleSpec).map((x) => x.tag)).toEqual(["policy", "quantum"]);
    expect(grade(v, 0, { policy: "rr" })).toMatchObject({ correct: true, partial: true });
    expect(grade(v, 0, { policy: "fcfs" })).toMatchObject({ correct: false });
    expect(grade(v, 1, { value: 4 })).toMatchObject({ correct: true, partial: false });
    expect(grade(v, 1, { value: 3 })).toMatchObject({ correct: false });
    const sjnId = variant({ policy: "sjn", mode: "identify", jobs: J([["A", 0, 7], ["B", 2, 4]]) });
    expect(goals(sjnId.spec as CpuScheduleSpec).map((x) => x.tag)).toEqual(["policy"]);
  });

  it("phases can stop at the timeline, or skip it", () => {
    const only = variant({ policy: "fcfs", phases: ["timeline"], jobs: J([["A", 0, 15], ["B", 0, 2], ["C", 0, 1]]) });
    expect(goals(only.spec as CpuScheduleSpec).map((x) => x.tag)).toEqual(["job", "end", "job", "end", "job", "end"]);
    const table = variant({ policy: "fcfs", phases: ["finish", "turnaround", "average"], jobs: J([["A", 0, 15], ["B", 0, 2], ["C", 0, 1]]) });
    const g = goals(table.spec as CpuScheduleSpec);
    expect(g.map((x) => x.tag)).toEqual(["column", "column", "average"]);
    expect(g[0].drawn).toBe(3);
    expect(g[2]).toMatchObject({ value: 16.67 });
    expect(() => variant({ policy: "rr", jobs: J([["A", 0, 1], ["B", 0, 1]]) })).toThrow();
    expect(() => variant({ policy: "fcfs", phases: ["average"], jobs: J([["A", 0, 1], ["B", 0, 1]]) })).toThrow();
  });
});
