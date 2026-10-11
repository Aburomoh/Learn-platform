import { describe, expect, it } from "vitest";
import { getActivity } from "../../index";
import { goals, truth, type Goal } from "@/kinds/cpu-schedule/logic";
import type { CpuScheduleSpec } from "@/kinds/cpu-schedule/spec";

const COURSE = "cpet181";

function specs(topic: string, activity: string, question: string) {
  const q = getActivity(COURSE, topic, activity)!.activity.questions.find((x) => x.id === question)!;
  return q.variants.map((v) => {
    if (v.spec.kind !== "cpu-schedule") throw new Error(`${v.id}: cpu-schedule expected`);
    return { id: v.id, spec: v.spec as CpuScheduleSpec };
  });
}
const byId = (topic: string, activity: string, question: string, id: string) => specs(topic, activity, question).find((x) => x.id === id)!.spec;
const column = (spec: CpuScheduleSpec, name: "finish" | "turnaround") => {
  const g = goals(spec).find((x): x is Extract<Goal, { tag: "column" }> => x.tag === "column" && x.column === name)!;
  return g.values;
};
const average = (spec: CpuScheduleSpec) => {
  const g = goals(spec).find((x): x is Extract<Goal, { tag: "average" }> => x.tag === "average")!;
  return Math.round(g.value * 100) / 100;
};
const chart = (spec: CpuScheduleSpec) =>
  truth(spec)
    .segments.map((s) => `${s.job ?? "-"} ${s.start}-${s.end}`)
    .join(", ");

describe("CPET 181 Chapter 4 scheduling content (#587)", () => {
  it("every question has three or four variants on the cpu-schedule kind", () => {
    for (const [topic, activity, question] of [
      ["fcfs-sjn", "fcfs", "fs.q.fcfs"],
      ["fcfs-sjn", "sjn", "fs.q.sjn"],
      ["srt", "srt", "st.q.srt"],
      ["priority", "priority", "pr.q.priority"],
      ["round-robin", "round-robin", "rr.q.build"],
      ["round-robin", "quantum", "rr.q.quantum"],
      ["compare-algorithms", "compare", "cm.q.fcfs"],
      ["compare-algorithms", "compare", "cm.q.sjn"],
      ["compare-algorithms", "compare", "cm.q.srt"],
      ["compare-algorithms", "identify", "cm.q.identify"],
    ] as const) {
      const n = specs(topic, activity, question).length;
      expect(n, question).toBeGreaterThanOrEqual(3);
      expect(n, question).toBeLessThanOrEqual(4);
    }
  });

  it("the deck's worked schedules come out as the pack records them (s.17–s.36)", () => {
    const f = (topic: string, activity: string, question: string, id: string) => {
      const spec = byId(topic, activity, question, id);
      return { finish: column(spec, "finish"), tat: column(spec, "turnaround"), avg: average(spec), chart: chart(spec) };
    };
    expect(f("fcfs-sjn", "fcfs", "fs.q.fcfs", "s17")).toMatchObject({ finish: [15, 17, 18], tat: [15, 17, 18], avg: 16.67 });
    expect(f("fcfs-sjn", "fcfs", "fs.q.fcfs", "s18")).toMatchObject({ finish: [1, 3, 18], avg: 7.33 });
    expect(f("fcfs-sjn", "sjn", "fs.q.sjn", "s20")).toMatchObject({ finish: [11, 2, 17, 6], avg: 9 });
    expect(f("fcfs-sjn", "sjn", "fs.q.sjn", "s21")).toMatchObject({ finish: [6, 10, 7, 14], tat: [6, 9, 5, 11], avg: 7.75, chart: "A 0-6, C 6-7, B 7-10, D 10-14" });
    expect(f("fcfs-sjn", "sjn", "fs.q.sjn", "s22")).toMatchObject({ finish: [2, 7, 3, 9], avg: 3.5 });
    expect(f("srt", "srt", "st.q.srt", "s24")).toMatchObject({ finish: [14, 5, 3, 9], tat: [14, 4, 1, 6], avg: 6.25, chart: "A 0-1, B 1-2, C 2-3, B 3-5, D 5-9, A 9-14" });
    expect(f("srt", "srt", "st.q.srt", "s25")).toMatchObject({ finish: [2, 9, 3, 6], avg: 3.25 });
    expect(f("srt", "srt", "st.q.srt", "s36")).toMatchObject({ finish: [14, 5, 7, 9, 17, 11], tat: [14, 2, 2, 2, 9, 2], avg: 5.17 });
    expect(f("priority", "priority", "pr.q.priority", "s27")).toMatchObject({ finish: [18, 2, 10, 6, 13], avg: 9.8, chart: "B 0-2, D 2-6, C 6-10, E 10-13, A 13-18" });
    expect(f("round-robin", "round-robin", "rr.q.build", "s30")).toMatchObject({ finish: [20, 8, 26, 25], tat: [20, 7, 24, 22], avg: 18.25 });
    expect(f("round-robin", "round-robin", "rr.q.build", "s35")).toMatchObject({ finish: [3, 16, 9, 17, 14], tat: [3, 14, 6, 13, 9], avg: 9 });
    expect(f("round-robin", "quantum", "rr.q.quantum", "s31-q4")).toMatchObject({ finish: [14, 8, 11, 19], avg: 10 });
    expect(f("round-robin", "quantum", "rr.q.quantum", "s32-q3")).toMatchObject({ finish: [17, 16, 12, 19], avg: 13 });
    expect(f("round-robin", "quantum", "rr.q.quantum", "s33-q7")).toMatchObject({ finish: [7, 11, 14, 19], avg: 9.75 });
  });

  it("conventions: priority ties are first come first served; a quantum above every burst equals FCFS; the arrival at a quantum boundary queues first", () => {
    // Priority s.27: C and E both 6, C before E (table order); fresh set 2: A and C both 3, A before C
    expect(chart(byId("priority", "priority", "pr.q.priority", "s27"))).toContain("C 6-10, E 10-13");
    expect(chart(byId("priority", "priority", "pr.q.priority", "f-new2"))).toBe("B 0-6, D 6-11, A 11-15, C 15-17");
    // RR s.33: quantum 7 is at least every burst, so the schedule is the FCFS schedule of the same jobs
    const rr = byId("round-robin", "quantum", "rr.q.quantum", "s33-q7");
    const fcfs: CpuScheduleSpec = { ...rr, policy: "fcfs", quantum: undefined };
    expect(chart(rr)).toBe(chart(fcfs));
    // RR s.31 t = 4: C arrives as A's quantum expires and queues ahead of A
    expect(chart(byId("round-robin", "quantum", "rr.q.quantum", "s31-q4")).startsWith("A 0-4, B 4-8, C 8-11, A 11-14")).toBe(true);
    // fresh SJN and SRT sets have no tie at any decision (ties are LOCAL SOURCE VERIFICATION in the truth module)
    expect(chart(byId("fcfs-sjn", "sjn", "fs.q.sjn", "f-new"))).toBe("A 0-7, C 7-8, D 8-11, B 11-15");
    expect(chart(byId("srt", "srt", "st.q.srt", "f-new"))).toBe("A 0-1, B 1-3, C 3-4, D 4-5, C 5-8, A 8-14");
    const sjn = specs("fcfs-sjn", "sjn", "fs.q.sjn").find((x) => x.id === "f-new")!.spec;
    for (const g of goals(sjn)) {
      if (g.tag !== "job" || g.ready.length < 2) continue;
      const lengths = g.ready.map((j) => sjn.jobs.find((x) => x.id === j)!.cpu).sort((a, b) => a - b);
      expect(lengths[0], `tie at ${g.time}`).not.toBe(lengths[1]);
    }
  });

  it("the comparison sets give different averages under FCFS, SJN and SRT, so there is something to compare", () => {
    const sets = [0, 1, 2].map((i) => ["cm.q.fcfs", "cm.q.sjn", "cm.q.srt"].map((q) => average(specs("compare-algorithms", "compare", q)[i].spec)));
    for (const set of sets) expect(new Set(set).size, JSON.stringify(set)).toBeGreaterThan(1);
  });

  it("identify charts are one clear answer each: RR with a quantum, SJN, SRT, Priority", () => {
    expect(specs("compare-algorithms", "identify", "cm.q.identify").map((x) => x.spec.policy)).toEqual(["rr", "sjn", "srt", "priority"]);
  });
});
