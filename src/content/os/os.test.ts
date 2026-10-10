import { describe, expect, it } from "vitest";
import { allocate, compact, memoryFrom, place, release, schedule, type Region, type SchedJob } from "./index";

/** Jobs as [id, arrival, cpu] (or [id, priority, cpu] for priority). */
const J = (rows: [string, number, number][]): SchedJob[] => rows.map(([id, arrival, cpu]) => ({ id, arrival, cpu }));
const gantt = (s: ReturnType<typeof schedule>) => s.segments.map((x) => `${x.job ?? "idle"} ${x.start}-${x.end}`).join(", ");
const col = (s: ReturnType<typeof schedule>, k: "finish" | "turnaround" | "wait") => s.jobs.map((j) => j[k]);
const near = (a: number, b: number) => expect(a).toBeCloseTo(b, 2);

describe("FCFS (Ch4 s.17–18)", () => {
  it("s.17: long job first", () => {
    const s = schedule(J([["A", 0, 15], ["B", 0, 2], ["C", 0, 1]]), "fcfs");
    expect(gantt(s)).toBe("A 0-15, B 15-17, C 17-18");
    expect(col(s, "finish")).toEqual([15, 17, 18]);
    expect(col(s, "wait")).toEqual([0, 15, 17]);
    near(s.avgTurnaround, 16.67);
    near(s.avgWait, 10.67);
  });
  it("s.18: same jobs reordered", () => {
    const s = schedule(J([["C", 0, 1], ["B", 0, 2], ["A", 0, 15]]), "fcfs");
    expect(col(s, "finish")).toEqual([1, 3, 18]);
    near(s.avgTurnaround, 7.33);
    near(s.avgWait, 1.33);
  });
  it("runs by arrival, not table order, when arrivals differ; idles when empty", () => {
    const s = schedule(J([["B", 5, 2], ["A", 0, 2]]), "fcfs");
    expect(gantt(s)).toBe("A 0-2, idle 2-5, B 5-7");
    expect(col(s, "turnaround")).toEqual([2, 2]);
  });
});

describe("SJN (Ch4 s.20–22)", () => {
  it("s.20", () => {
    const s = schedule(J([["A", 0, 5], ["B", 0, 2], ["C", 0, 6], ["D", 0, 4]]), "sjn");
    expect(gantt(s)).toBe("B 0-2, D 2-6, A 6-11, C 11-17");
    expect(col(s, "finish")).toEqual([11, 2, 17, 6]);
    expect(col(s, "wait")).toEqual([6, 0, 11, 2]);
    near(s.avgTurnaround, 9);
    near(s.avgWait, 4.75);
  });
  it("s.21", () => {
    const s = schedule(J([["A", 0, 6], ["B", 1, 3], ["C", 2, 1], ["D", 3, 4]]), "sjn");
    expect(gantt(s)).toBe("A 0-6, C 6-7, B 7-10, D 10-14");
    expect(col(s, "turnaround")).toEqual([6, 9, 5, 11]);
    expect(col(s, "wait")).toEqual([0, 6, 4, 7]);
    near(s.avgTurnaround, 7.75);
    near(s.avgWait, 4.25);
  });
  it("s.22", () => {
    const s = schedule(J([["A", 0, 2], ["B", 1, 4], ["C", 2, 1], ["D", 4, 2]]), "sjn");
    expect(gantt(s)).toBe("A 0-2, C 2-3, B 3-7, D 7-9");
    expect(col(s, "turnaround")).toEqual([2, 6, 1, 5]);
    expect(col(s, "wait")).toEqual([0, 2, 0, 3]);
    near(s.avgTurnaround, 3.5);
    near(s.avgWait, 1.25);
  });
  it("tie: earlier arrival, then table order (inferred); table-only option", () => {
    const jobs = J([["A", 0, 3], ["B", 2, 2], ["C", 1, 2]]);
    expect(gantt(schedule(jobs, "sjn"))).toBe("A 0-3, C 3-5, B 5-7");
    expect(gantt(schedule(jobs, "sjn", { sjnTie: "table" }))).toBe("A 0-3, B 3-5, C 5-7");
  });
});

describe("SRT (Ch4 s.24–25, s.36)", () => {
  it("s.24", () => {
    const s = schedule(J([["A", 0, 6], ["B", 1, 3], ["C", 2, 1], ["D", 3, 4]]), "srt");
    expect(gantt(s)).toBe("A 0-1, B 1-2, C 2-3, B 3-5, D 5-9, A 9-14");
    expect(col(s, "finish")).toEqual([14, 5, 3, 9]);
    expect(col(s, "turnaround")).toEqual([14, 4, 1, 6]);
    expect(col(s, "wait")).toEqual([8, 1, 0, 2]);
    near(s.avgTurnaround, 6.25);
    near(s.avgWait, 2.75);
  });
  it("s.25: B does not preempt A at t=1; D preempts B at t=4", () => {
    const s = schedule(J([["A", 0, 2], ["B", 1, 4], ["C", 2, 1], ["D", 4, 2]]), "srt");
    expect(gantt(s)).toBe("A 0-2, C 2-3, B 3-4, D 4-6, B 6-9");
    expect(col(s, "finish")).toEqual([2, 9, 3, 6]);
    expect(col(s, "turnaround")).toEqual([2, 8, 1, 2]);
    near(s.avgTurnaround, 3.25);
    near(s.avgWait, 1);
  });
  it("s.36 exercise: equal remaining → earlier arrival (A before E at t=11)", () => {
    const s = schedule(J([["A", 0, 6], ["B", 3, 2], ["C", 5, 2], ["D", 7, 2], ["E", 8, 3], ["F", 9, 2]]), "srt");
    expect(gantt(s)).toBe("A 0-3, B 3-5, C 5-7, D 7-9, F 9-11, A 11-14, E 14-17");
    expect(col(s, "finish")).toEqual([14, 5, 7, 9, 17, 11]);
    expect(col(s, "turnaround")).toEqual([14, 2, 2, 2, 9, 2]);
    expect(col(s, "wait")).toEqual([8, 0, 0, 0, 6, 0]);
    near(s.avgTurnaround, 31 / 6);
    near(s.avgWait, 2.33);
  });
  it("arrival with remaining equal to the running job's: keep running by default (option applies the tie rule)", () => {
    const jobs = J([["A", 2, 2], ["B", 0, 4]]); // at t=2 B has 2 left, A arrives with 2
    expect(gantt(schedule(jobs, "srt"))).toBe("B 0-4, A 4-6");
    expect(gantt(schedule(jobs, "srt", { srtTie: "table", srtEqualRemaining: "apply-tie-rule" }))).toBe("B 0-2, A 2-4, B 4-6");
    // earlier arrival wins the tie rule, so the running (earlier) job continues either way
    expect(gantt(schedule(jobs, "srt", { srtEqualRemaining: "apply-tie-rule" }))).toBe("B 0-4, A 4-6");
  });
  it("idles when nothing is ready", () => {
    expect(gantt(schedule(J([["A", 3, 1]]), "srt"))).toBe("idle 0-3, A 3-4");
  });
});

describe("Priority, non-preemptive (Ch4 s.27)", () => {
  const rows = [["A", 9, 5], ["B", 3, 2], ["C", 6, 4], ["D", 5, 4], ["E", 6, 3]] as [string, number, number][];
  const jobs: SchedJob[] = rows.map(([id, priority, cpu]) => ({ id, arrival: 0, cpu, priority }));
  it("smaller number first, equal priority FCFS (C before E)", () => {
    const s = schedule(jobs, "priority");
    expect(gantt(s)).toBe("B 0-2, D 2-6, C 6-10, E 10-13, A 13-18");
    expect(col(s, "finish")).toEqual([18, 2, 10, 6, 13]);
    expect(col(s, "wait")).toEqual([13, 0, 6, 2, 10]);
    near(s.avgTurnaround, 9.8);
    near(s.avgWait, 6.2);
  });
  it("high-first option reverses the direction", () => {
    expect(schedule(jobs, "priority", { priorityOrder: "high-first" }).segments[0].job).toBe("A");
  });
  it("never preempts a running job", () => {
    const s = schedule([{ id: "A", arrival: 0, cpu: 5, priority: 9 }, { id: "B", arrival: 1, cpu: 1, priority: 1 }], "priority");
    expect(gantt(s)).toBe("A 0-5, B 5-6");
  });
  it("requires a priority", () => {
    expect(() => schedule(J([["A", 0, 1]]), "priority")).toThrow(RangeError);
  });
});

describe("Round Robin (Ch4 s.30–33, s.35)", () => {
  const set2 = J([["A", 0, 7], ["B", 2, 4], ["C", 4, 3], ["D", 6, 5]]);
  it("s.30 (q=4)", () => {
    const s = schedule(J([["A", 0, 8], ["B", 1, 4], ["C", 2, 9], ["D", 3, 5]]), "rr", { quantum: 4 });
    expect(gantt(s)).toBe("A 0-4, B 4-8, C 8-12, D 12-16, A 16-20, C 20-24, D 24-25, C 25-26");
    expect(col(s, "finish")).toEqual([20, 8, 26, 25]);
    expect(col(s, "turnaround")).toEqual([20, 7, 24, 22]);
    expect(col(s, "wait")).toEqual([12, 3, 15, 17]);
    near(s.avgTurnaround, 18.25);
    near(s.avgWait, 11.75);
  });
  it("s.31 (q=4): C joins ahead of A at t=4; D's slices stay separate", () => {
    const s = schedule(set2, "rr", { quantum: 4 });
    expect(gantt(s)).toBe("A 0-4, B 4-8, C 8-11, A 11-14, D 14-18, D 18-19");
    expect(col(s, "finish")).toEqual([14, 8, 11, 19]);
    expect(col(s, "turnaround")).toEqual([14, 6, 7, 13]);
    expect(col(s, "wait")).toEqual([7, 2, 4, 8]);
    near(s.avgTurnaround, 10);
    near(s.avgWait, 5.25);
  });
  it("s.32 (q=3): D joins ahead of B at t=6", () => {
    const s = schedule(set2, "rr", { quantum: 3 });
    expect(gantt(s)).toBe("A 0-3, B 3-6, A 6-9, C 9-12, D 12-15, B 15-16, A 16-17, D 17-19");
    expect(col(s, "finish")).toEqual([17, 16, 12, 19]);
    expect(col(s, "turnaround")).toEqual([17, 14, 8, 13]);
    expect(col(s, "wait")).toEqual([10, 10, 5, 8]);
    near(s.avgTurnaround, 13);
    near(s.avgWait, 8.25);
  });
  it("s.33 (q=7): large quantum = FCFS", () => {
    const s = schedule(set2, "rr", { quantum: 7 });
    expect(gantt(s)).toBe("A 0-7, B 7-11, C 11-14, D 14-19");
    expect(col(s, "turnaround")).toEqual([7, 9, 10, 13]);
    expect(col(s, "wait")).toEqual([0, 5, 7, 8]);
    near(s.avgTurnaround, 9.75);
    near(s.avgWait, 5);
    expect(s.segments).toEqual(schedule(set2, "fcfs").segments);
  });
  it("s.35 exercise (q=3)", () => {
    const s = schedule(J([["A", 0, 3], ["B", 2, 5], ["C", 3, 3], ["D", 4, 4], ["E", 5, 2]]), "rr", { quantum: 3 });
    expect(gantt(s)).toBe("A 0-3, B 3-6, C 6-9, D 9-12, E 12-14, B 14-16, D 16-17");
    expect(col(s, "finish")).toEqual([3, 16, 9, 17, 14]);
    expect(col(s, "turnaround")).toEqual([3, 14, 6, 13, 9]);
    expect(col(s, "wait")).toEqual([0, 9, 3, 9, 7]);
    near(s.avgTurnaround, 9);
    near(s.avgWait, 5.6);
  });
  it("preempted-first option flips the boundary rule", () => {
    const s = schedule(set2, "rr", { quantum: 4, rrBoundary: "preempted-first" });
    expect(s.segments.slice(0, 4).map((x) => x.job)).toEqual(["A", "B", "A", "C"]);
  });
  it("a quantum ending exactly at completion does not requeue the job", () => {
    const s = schedule(J([["A", 0, 4], ["B", 0, 4]]), "rr", { quantum: 4 });
    expect(gantt(s)).toBe("A 0-4, B 4-8");
  });
  it("idles between jobs and rejects a bad quantum", () => {
    expect(gantt(schedule(J([["A", 0, 1], ["B", 5, 1]]), "rr", { quantum: 2 }))).toBe("A 0-1, idle 1-5, B 5-6");
    expect(() => schedule(J([["A", 0, 1]]), "rr")).toThrow(RangeError);
    expect(() => schedule(J([["A", 0, 1]]), "rr", { quantum: 0 })).toThrow(RangeError);
  });
});

describe("quiz-pattern schedules (Ch8 pack / quiz-patterns, verified by simulation)", () => {
  it("Q2 Q3 SJN, versions A and B", () => {
    const a = schedule(J([["A", 0, 4], ["B", 1, 2], ["C", 2, 6], ["D", 3, 1], ["E", 5, 3]]), "sjn");
    expect(gantt(a)).toBe("A 0-4, D 4-5, B 5-7, E 7-10, C 10-16");
    expect(col(a, "turnaround")).toEqual([4, 6, 14, 2, 5]);
    near(a.avgTurnaround, 6.2);
    const b = schedule(J([["A", 0, 3], ["B", 1, 3], ["C", 2, 1], ["D", 3, 6], ["E", 5, 2]]), "sjn");
    expect(gantt(b)).toBe("A 0-3, C 3-4, B 4-7, E 7-9, D 9-15");
    expect(col(b, "turnaround")).toEqual([3, 6, 2, 12, 4]);
    near(b.avgTurnaround, 5.4);
  });
  it("Q2 Q4 RR q=4, versions A and B", () => {
    const a = schedule(J([["A", 0, 7], ["B", 2, 4], ["C", 4, 5], ["D", 6, 3], ["E", 7, 10]]), "rr", { quantum: 4 });
    expect(gantt(a)).toBe("A 0-4, B 4-8, C 8-12, A 12-15, D 15-18, E 18-22, C 22-23, E 23-27, E 27-29");
    expect(col(a, "finish")).toEqual([15, 8, 23, 18, 29]);
    expect(col(a, "turnaround")).toEqual([15, 6, 19, 12, 22]);
    near(a.avgTurnaround, 14.8);
    const b = schedule(J([["A", 0, 6], ["B", 2, 7], ["C", 4, 3], ["D", 6, 5], ["E", 7, 9]]), "rr", { quantum: 4 });
    expect(gantt(b)).toBe("A 0-4, B 4-8, C 8-11, A 11-13, D 13-17, E 17-21, B 21-24, D 24-25, E 25-29, E 29-30");
    expect(col(b, "finish")).toEqual([13, 24, 11, 25, 30]);
    expect(col(b, "turnaround")).toEqual([13, 22, 7, 19, 23]);
    near(b.avgTurnaround, 16.8);
  });
  it("AR Q4 RR q=5, two jobs arriving together at 0", () => {
    const a = schedule(J([["A", 0, 10], ["B", 0, 8], ["C", 4, 5], ["D", 8, 3], ["E", 12, 8]]), "rr", { quantum: 5 });
    expect(gantt(a)).toBe("A 0-5, B 5-10, C 10-15, A 15-20, D 20-23, B 23-26, E 26-31, E 31-34");
    expect(col(a, "turnaround")).toEqual([20, 26, 11, 15, 22]);
    near(a.avgTurnaround, 18.8);
    const b = schedule(J([["A", 0, 8], ["B", 0, 9], ["C", 4, 5], ["D", 8, 7], ["E", 12, 3]]), "rr", { quantum: 5 });
    expect(gantt(b)).toBe("A 0-5, B 5-10, C 10-15, A 15-18, D 18-23, B 23-27, E 27-30, D 30-32");
    expect(col(b, "finish")).toEqual([18, 27, 15, 32, 30]);
    expect(col(b, "turnaround")).toEqual([18, 27, 11, 24, 18]);
    near(b.avgTurnaround, 19.6);
  });
});

describe("schedule validation", () => {
  it("rejects duplicate ids, non-positive CPU and negative arrival; does not mutate input", () => {
    expect(() => schedule(J([["A", 0, 1], ["A", 0, 1]]), "fcfs")).toThrow(RangeError);
    expect(() => schedule(J([["A", 0, 0]]), "fcfs")).toThrow(RangeError);
    expect(() => schedule(J([["A", -1, 1]]), "fcfs")).toThrow(RangeError);
    const jobs = J([["A", 0, 2]]);
    const copy = JSON.stringify(jobs);
    schedule(jobs, "srt");
    expect(JSON.stringify(jobs)).toBe(copy);
  });
});

const jobsOf = (rows: [string, number][]) => rows.map(([id, size]) => ({ id, size }));
const slots = (a: ReturnType<typeof allocate>) => a.regions.map((r) => r.job ?? "-").join(",");

describe("fixed partitions (Ch2 s.12)", () => {
  it("s.12: J3 waits though 70 K is free inside partition 1", () => {
    const a = allocate([{ size: 100 }, { size: 25 }, { size: 25 }, { size: 50 }], jobsOf([["J1", 30], ["J2", 50], ["J3", 30], ["J4", 25]]), "first", "fixed");
    expect(slots(a)).toBe("J1,J4,-,J2");
    expect(a.waiting.map((w) => w.job)).toEqual(["J3"]);
    expect(a.placements[0].internalFragmentation).toBe(70);
    expect(a.summary.available).toBe(200);
  });
});

describe("first-fit vs best-fit (Ch2 s.19–22)", () => {
  const blocks19 = [{ start: 10240, size: 30 }, { start: 40960, size: 15 }, { start: 56320, size: 50 }, { start: 107520, size: 20 }];
  const jobs19 = jobsOf([["J1", 10], ["J2", 20], ["J3", 30], ["J4", 10]]);
  it("s.19 first-fit", () => {
    const a = allocate(blocks19, jobs19, "first", "fixed");
    expect(a.placements.map((p) => [p.job, p.blockSize])).toEqual([["J1", 30], ["J2", 50], ["J4", 15]]);
    expect(a.waiting.map((w) => w.job)).toEqual(["J3"]);
    expect(a.placements.map((p) => p.internalFragmentation)).toEqual([20, 30, 5]);
    expect(a.summary.used).toBe(40);
    expect(a.summary.available).toBe(115);
  });
  it("s.20 best-fit (rows in allocation order)", () => {
    const a = allocate(blocks19, jobs19, "best", "fixed");
    expect(a.placements.map((p) => [p.job, p.blockSize])).toEqual([["J1", 15], ["J2", 20], ["J3", 30], ["J4", 50]]);
    expect(a.placements.map((p) => p.internalFragmentation)).toEqual([5, 0, 0, 40]);
    expect(a.waiting).toEqual([]);
    expect(a.summary.used).toBe(70);
  });
  const run = (sizes: number[], jobs: [string, number][], fit: "first" | "best") => {
    const a = allocate(sizes.map((size) => ({ size })), jobsOf(jobs), fit, "fixed");
    return { by: a.regions.map((r) => (r.job ? `${r.job}(${r.size - r.jobSize})` : "empty")), waiting: a.waiting.map((w) => w.job) };
  };
  it("s.21", () => {
    const j: [string, number][] = [["P1", 15], ["P2", 25], ["P3", 35], ["P4", 20]];
    expect(run([35, 20, 55, 30], j, "first")).toEqual({ by: ["P1(20)", "P4(0)", "P2(30)", "empty"], waiting: ["P3"] });
    expect(run([35, 20, 55, 30], j, "best")).toEqual({ by: ["P3(0)", "P1(5)", "P4(35)", "P2(5)"], waiting: [] });
  });
  it("s.22", () => {
    const j: [string, number][] = [["P1", 12], ["P2", 24], ["P3", 15], ["P4", 32]];
    expect(run([30, 40, 15, 20], j, "first")).toEqual({ by: ["P1(18)", "P2(16)", "P3(0)", "empty"], waiting: ["P4"] });
    expect(run([30, 40, 15, 20], j, "best")).toEqual({ by: ["P2(6)", "P4(8)", "P1(3)", "P3(5)"], waiting: [] });
  });
  it("quiz-pattern Q1 Q2, versions A and B", () => {
    const A: [string, number][] = [["J1", 30], ["J2", 15], ["J3", 45], ["J4", 10]];
    expect(run([25, 50, 10, 30], A, "first")).toEqual({ by: ["J2(10)", "J1(20)", "J4(0)", "empty"], waiting: ["J3"] });
    expect(run([25, 50, 10, 30], A, "best")).toEqual({ by: ["J2(10)", "J3(5)", "J4(0)", "J1(0)"], waiting: [] });
    const B: [string, number][] = [["J1", 20], ["J2", 25], ["J3", 10], ["J4", 40]];
    expect(run([10, 30, 50, 35], B, "first")).toEqual({ by: ["J3(0)", "J1(10)", "J2(25)", "empty"], waiting: ["J4"] });
    expect(run([10, 30, 50, 35], B, "best")).toEqual({ by: ["J3(0)", "J1(10)", "J4(10)", "J2(10)"], waiting: [] });
  });
  it("best-fit tie: first from the top by default, last by option", () => {
    const blocks = [{ size: 20 }, { size: 20 }];
    expect(allocate(blocks, jobsOf([["J", 10]]), "best", "fixed").placements[0].blockStart).toBe(0);
    expect(allocate(blocks, jobsOf([["J", 10]]), "best", "fixed", { bestFitTie: "last" }).placements[0].blockStart).toBe(20);
  });
  it("a job that never fits waits and later jobs are still tried; leftover is not reused", () => {
    const a = allocate([{ size: 50 }], jobsOf([["J1", 10], ["J2", 60], ["J3", 10]]), "first", "fixed");
    expect(a.placements.map((p) => p.job)).toEqual(["J1"]);
    expect(a.waiting.map((w) => w.job)).toEqual(["J2", "J3"]);
    expect(a.waiting[0].fitsAfterCompaction).toBe(false);
  });
});

describe("dynamic partitions (Ch2 s.15)", () => {
  it("s.15 steps a–e", () => {
    const mem = memoryFrom([{ start: 10, size: 95 }]);
    let r = mem;
    for (const [id, size] of [["J1", 10], ["J2", 15], ["J3", 20], ["J4", 50]] as const) r = place(r, { id, size }, "first", "dynamic").regions;
    const at = (x: Region[]) => x.map((q) => `${q.job ?? "free"} ${q.start}-${q.start + q.size}`).join(", ");
    expect(at(r)).toBe("J1 10-20, J2 20-35, J3 35-55, J4 55-105");
    r = release(release(r, "J1", "dynamic"), "J4", "dynamic");
    expect(at(r)).toBe("free 10-20, J2 20-35, J3 35-55, free 55-105");
    r = place(place(r, { id: "J5", size: 5 }, "first", "dynamic").regions, { id: "J6", size: 30 }, "first", "dynamic").regions;
    expect(at(r)).toBe("J5 10-15, free 15-20, J2 20-35, J3 35-55, J6 55-85, free 85-105");
    r = release(r, "J3", "dynamic");
    expect(r.filter((q) => !q.job).map((q) => `${q.start}-${q.start + q.size}`)).toEqual(["15-20", "35-55", "85-105"]);
    r = place(r, { id: "J7", size: 10 }, "first", "dynamic").regions;
    const j8 = place(r, { id: "J8", size: 30 }, "first", "dynamic");
    expect(r.find((q) => q.job === "J7")?.start).toBe(35);
    expect(j8.placement).toBeNull();
    const batch = allocate(r, jobsOf([["J8", 30]]), "first", "dynamic");
    expect(batch.summary.freeTotal).toBe(5 + 10 + 20);
    expect(batch.waiting[0].fitsAfterCompaction).toBe(true);
  });
  it("splits exactly, with no internal fragmentation", () => {
    const a = allocate([{ size: 100 }], jobsOf([["J1", 30], ["J2", 70]]), "best", "dynamic");
    expect(a.summary.internalFragmentation).toBe(0);
    expect(a.summary.freeTotal).toBe(0);
    expect(a.regions).toHaveLength(2);
  });
});

describe("deallocation merges (Ch2 s.25–30)", () => {
  const busy = (start: number, size: number, job: string): Region => ({ start, size, job, jobSize: size });
  const free = (start: number, size: number): Region => ({ start, size, job: null, jobSize: 0 });
  it("case 1: join two → 7600, 205", () => {
    const r = release([busy(7000, 600, "X"), busy(7600, 200, "J"), free(7800, 5)], "J", "dynamic");
    expect(r.filter((q) => !q.job)).toEqual([free(7600, 205)]);
  });
  it("case 2: join three → 7560, 245", () => {
    const r = release([free(7560, 20), busy(7580, 20, "J"), free(7600, 205)], "J", "dynamic");
    expect(r).toEqual([free(7560, 245)]);
  });
  it("case 3: isolated → 8805, 445", () => {
    const r = release([busy(7805, 1000, "X"), busy(8805, 445, "J"), busy(9250, 100, "Y")], "J", "dynamic");
    expect(r.filter((q) => !q.job)).toEqual([free(8805, 445)]);
  });
  it("fixed partitions are only marked free, never merged; unknown job throws", () => {
    const r = release(memoryFrom([{ size: 10 }, { size: 10 }]).map((q, i) => (i ? q : { ...q, job: "J", jobSize: 5 })), "J", "fixed");
    expect(r).toHaveLength(2);
    expect(() => release(r, "J", "fixed")).toThrow(RangeError);
  });
});

describe("compaction and relocation register (Ch2 s.33–37, bytes = K × 1024)", () => {
  const mk = (rows: [string | null, number, number][]): Region[] => rows.map(([job, start, size]) => ({ start, size, job, jobSize: job ? size : 0 }));
  const regs = (c: ReturnType<typeof compact>) => Object.fromEntries(c.relocations.map((x) => [x.job, x.register]));
  it("s.33: jobs slide up; the free block starts at 114 (where J6 goes)", () => {
    const c = compact(mk([["J1", 10, 8], [null, 18, 12], ["J4", 30, 32], [null, 62, 30], ["J2", 92, 16], ["J5", 108, 48]]));
    expect(c.regions.map((r) => `${r.job ?? "free"}@${r.start}`)).toEqual(["J1@10", "J4@18", "J2@50", "J5@66", "free@114"]); // J6 then starts at 114
  });
  it("s.34: J4 30 K → 18 K is −12288", () => {
    const c = compact(mk([["J1", 10, 8], [null, 18, 12], ["J4", 30, 32]]));
    expect(regs(c).J4).toBe(-12288);
  });
  it("s.36", () => {
    const c = compact(mk([["J1", 8, 22], [null, 30, 15], ["J3", 45, 25], [null, 70, 15], ["J2", 85, 15]]));
    expect(c.regions.map((r) => `${r.job ?? "free"}@${r.start}`)).toEqual(["J1@8", "J3@30", "J2@55", "free@70"]);
    expect(regs(c)).toEqual({ J1: 0, J3: -15360, J2: -30720 });
    expect(c.regions[3].size).toBe(30);
  });
  it("s.37", () => {
    const c = compact(mk([["J1", 10, 30], [null, 40, 12], ["J2", 52, 28], [null, 80, 35], ["J3", 115, 15]]));
    expect(c.regions.map((r) => `${r.job ?? "free"}@${r.start}`)).toEqual(["J1@10", "J2@40", "J3@68", "free@83"]);
    expect(regs(c)).toEqual({ J1: 0, J2: -12288, J3: -48128 });
    expect(c.regions[3].size).toBe(47);
  });
  it("quiz-pattern Q1 Q3, versions A and B (magnitudes only in the key; signed here)", () => {
    const a = compact(mk([["J1", 10, 20], [null, 30, 5], ["J4", 35, 15], [null, 50, 10], ["J2", 60, 35]]));
    expect(regs(a)).toEqual({ J1: 0, J4: -5120, J2: -15360 });
    const b = compact(mk([["J1", 10, 15], [null, 25, 10], ["J4", 35, 25], [null, 60, 5], ["J2", 65, 35]]));
    expect(regs(b)).toEqual({ J1: 0, J4: -10240, J2: -15360 });
  });
  it("unitBytes option; nothing to move; fully busy memory has no free block", () => {
    expect(regs(compact(mk([[null, 0, 10], ["J", 10, 5]]), { unitBytes: 1 })).J).toBe(-10);
    const full = compact(mk([["J", 0, 10]]));
    expect(full.regions).toHaveLength(1);
    expect(compact([])).toEqual({ regions: [], relocations: [] });
  });
});
