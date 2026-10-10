import { schedule, type Policy, type Schedule } from "@/content/os";
import type { KindLogic } from "../types";
import type { CpuScheduleSpec } from "./spec";

/**
 * One answer per goal (ADR-0007): `job` for the next segment's job (`"idle"` for an idle gap),
 * `end` for its end time, `values` for a result column (one per job, table order), `value` for
 * the average turnaround (2 decimals), `policy` in identify mode.
 */
export type CpuScheduleAnswer = {
  kind: "cpu-schedule";
  step: number;
  job?: string;
  end?: number;
  values?: (number | null)[];
  value?: number;
  policy?: string;
};

export type GoalTag = "job" | "end" | "column" | "average" | "policy" | "quantum";

interface GoalBase {
  tag: GoalTag;
  /** Segments drawn before this goal. */
  drawn: number;
}
export interface JobGoal extends GoalBase {
  tag: "job";
  segment: number;
  time: number;
  /** The right job (null = idle). */
  job: string | null;
  ready: string[];
}
export interface EndGoal extends GoalBase {
  tag: "end";
  segment: number;
  time: number;
  job: string | null;
  end: number;
}
export interface ColumnGoal extends GoalBase {
  tag: "column";
  column: "finish" | "turnaround";
  values: number[];
}
export interface AverageGoal extends GoalBase {
  tag: "average";
  value: number;
  sum: number;
}
export interface PolicyGoal extends GoalBase {
  tag: "policy";
  policy: Policy;
}
/** Identify mode, RR only: the quantum, asked after the policy is right (never shown before, Lead on #583). */
export interface QuantumGoal extends GoalBase {
  tag: "quantum";
  value: number;
}
export type Goal = JobGoal | EndGoal | ColumnGoal | AverageGoal | PolicyGoal | QuantumGoal;

export const POLICY_NAME: Record<Policy, string> = { fcfs: "First Come First Served", sjn: "Shortest Job Next", srt: "Shortest Remaining Time", priority: "Priority", rr: "Round Robin" };
export const POLICY_SHORT: Record<Policy, string> = { fcfs: "FCFS", sjn: "SJN", srt: "SRT", priority: "Priority", rr: "RR" };

const cache = new WeakMap<CpuScheduleSpec, Schedule>();
/** The truth module's schedule for the spec (computed once per spec object). */
export function truth(spec: CpuScheduleSpec): Schedule {
  let s = cache.get(spec);
  if (!s) cache.set(spec, (s = schedule(spec.jobs, spec.policy, { quantum: spec.quantum })));
  return s;
}

export const round2 = (v: number) => Math.round(v * 100) / 100;

/** CPU time left for each job after the first `n` segments. */
export function remainingAfter(spec: CpuScheduleSpec, n: number): Record<string, number> {
  const left: Record<string, number> = Object.fromEntries(spec.jobs.map((j) => [j.id, j.cpu]));
  for (const s of truth(spec).segments.slice(0, n)) if (s.job !== null) left[s.job] -= s.end - s.start;
  return left;
}

/** Jobs that have arrived and still have CPU time at `time`, after `n` segments; table order. */
export function readyAt(spec: CpuScheduleSpec, time: number, n: number): string[] {
  const left = remainingAfter(spec, n);
  return spec.jobs.filter((j) => j.arrival <= time + 1e-9 && left[j.id] > 1e-9).map((j) => j.id);
}

export function goals(spec: CpuScheduleSpec): Goal[] {
  const t = truth(spec);
  if (spec.mode === "identify") {
    const drawn = t.segments.length;
    return spec.policy === "rr" ? [{ tag: "policy", drawn, policy: spec.policy }, { tag: "quantum", drawn, value: spec.quantum! }] : [{ tag: "policy", drawn, policy: spec.policy }];
  }
  const out: Goal[] = [];
  if (spec.phases.includes("timeline"))
    t.segments.forEach((s, k) => {
      out.push({ tag: "job", drawn: k, segment: k, time: s.start, job: s.job, ready: readyAt(spec, s.start, k) });
      out.push({ tag: "end", drawn: k, segment: k, time: s.start, job: s.job, end: s.end });
    });
  const drawn = t.segments.length;
  if (spec.phases.includes("finish")) out.push({ tag: "column", drawn, column: "finish", values: t.jobs.map((j) => j.finish) });
  if (spec.phases.includes("turnaround")) out.push({ tag: "column", drawn, column: "turnaround", values: t.jobs.map((j) => j.turnaround) });
  if (spec.phases.includes("average")) out.push({ tag: "average", drawn, value: round2(t.avgTurnaround), sum: t.jobs.reduce((a, j) => a + j.turnaround, 0) });
  return out;
}

const fmt = (v: number) => (Number.isInteger(v) ? String(v) : String(round2(v)));

export const cpuSchedule: KindLogic<CpuScheduleSpec, CpuScheduleAnswer> = {
  grade(variant, answer) {
    const spec = variant.spec;
    const all = goals(spec);
    const g = all[answer.step];
    if (!g) throw new Error(`No cpu-schedule step ${answer.step}`);
    const find = (type: string) => variant.misconceptions.find((m) => m.detect.type === type)?.id;
    const partial = answer.step < all.length - 1;
    const done = (correct: boolean, normalized: string, slip?: string) => (correct ? { correct, normalized, partial } : { correct, normalized, misconceptionId: slip ? find(slip) : undefined });
    const t = truth(spec);
    const byId = Object.fromEntries(spec.jobs.map((j) => [j.id, j]));

    if (g.tag === "policy") {
      const normalized = `policy:${answer.policy ?? ""}`;
      return done(answer.policy === g.policy, normalized);
    }
    if (g.tag === "quantum") return done(answer.value === g.value, `quantum:${answer.value ?? ""}`);

    if (g.tag === "job") {
      const picked = answer.job;
      const normalized = `seg${g.segment + 1}:${picked ?? ""}`;
      const want = g.job ?? "idle";
      if (picked === want) return done(true, normalized);
      if (picked === undefined) return done(false, normalized);
      const left = remainingAfter(spec, g.segment);
      const ready = g.ready;
      // ran a job that has not arrived (or is finished), or idled while a job was ready
      if (picked === "idle" ? ready.length > 0 : !ready.includes(picked)) return done(false, normalized, "arrival-ignored");
      const p = byId[picked];
      let slip: string | undefined;
      if (spec.policy === "sjn" || spec.policy === "srt") {
        const earliest = ready.reduce((a, b) => (byId[b].arrival < byId[a].arrival ? b : a));
        const longest = ready.reduce((a, b) => (left[b] > left[a] ? b : a));
        const previous = g.segment > 0 ? t.segments[g.segment - 1].job : null;
        if (spec.policy === "srt" && picked === previous && left[picked] > 0) slip = "not-preempted";
        else if (picked === earliest) slip = "fcfs-under-sjn";
        else if (picked === longest) slip = "longest-first";
      } else if (spec.policy === "priority") {
        const reversed = ready.reduce((a, b) => ((byId[b].priority ?? 0) > (byId[a].priority ?? 0) ? b : a));
        if (picked === reversed) slip = "priority-reversed";
      } else if (spec.policy === "rr") {
        slip = "rr-queue-order";
      } else if (spec.policy === "fcfs" && p.arrival > byId[want]?.arrival) slip = undefined;
      return done(false, normalized, slip);
    }

    if (g.tag === "end") {
      const end = answer.end;
      const normalized = `seg${g.segment + 1}:until${end ?? ""}`;
      if (end === g.end) return done(true, normalized);
      if (end === undefined) return done(false, normalized);
      const left = remainingAfter(spec, g.segment);
      let slip: string | undefined;
      if (g.job !== null) {
        const toFinish = g.time + left[g.job];
        if (spec.policy === "rr") {
          if (end === g.time + (spec.quantum ?? 0) && g.end < end) slip = "end-past-remaining";
          else if (end === toFinish && g.end < end) slip = "not-preempted";
        } else if (spec.policy === "srt") {
          if (end === toFinish && g.end < end) slip = "not-preempted";
        } else if (end < toFinish && end > g.time) slip = "preempted-nonpreemptive";
      }
      return done(false, normalized, slip);
    }

    if (g.tag === "column") {
      const values = answer.values ?? [];
      const normalized = `${g.column}:${values.map((v) => (v === null || v === undefined ? "_" : fmt(v))).join(",")}`;
      const wrong = g.values.flatMap((v, i) => (values[i] !== v ? [i] : []));
      if (!wrong.length) return done(true, normalized);
      const slip = g.column === "turnaround" && wrong.every((i) => values[i] === t.jobs[i].finish && t.jobs[i].arrival > 0) ? "turnaround-as-finish" : undefined;
      return { ...done(false, normalized, slip), wrongCells: { first: wrong[0], count: wrong.length } };
    }

    // average
    const v = answer.value;
    const normalized = `avg:${v ?? ""}`;
    if (v !== undefined && round2(v) === g.value) return done(true, normalized);
    const n = spec.jobs.length;
    const slip = v !== undefined && [n - 1, n + 1].some((d) => d > 0 && round2(g.sum / d) === round2(v)) ? "average-wrong-count" : undefined;
    return done(false, normalized, slip);
  },

  // ADR-0007: two goals per segment (the job, then its end), one per result column, one for the average.
  steps: {
    count: (spec) => goals(spec).length,
    tag: (spec, i) => goals(spec)[i].tag,
    vars: (spec, i) => {
      const all = goals(spec);
      const g = all[i];
      const t = truth(spec);
      const base = { stepNumber: i + 1, stepCount: all.length, policyName: POLICY_NAME[spec.policy], policyShort: POLICY_SHORT[spec.policy], quantum: spec.quantum ?? "", jobCount: spec.jobs.length, segmentCount: t.segments.length, unit: spec.unit };
      switch (g.tag) {
        case "job":
          return { ...base, segmentNumber: g.segment + 1, time: g.time, readyList: g.ready.join(", "), jobId: g.job ?? "idle" };
        case "end":
          return { ...base, segmentNumber: g.segment + 1, time: g.time, jobId: g.job ?? "idle", segmentEnd: g.end, runLength: g.end - g.time };
        case "column":
          return { ...base, columnLabel: g.column === "finish" ? "Finish" : "Turnaround", columnValues: g.values.map(fmt).join(", ") };
        case "average":
          return { ...base, sumList: t.jobs.map((j) => fmt(j.turnaround)).join(" + "), sum: fmt(g.sum), average: g.value.toFixed(2), averageExpression: `(${t.jobs.map((j) => fmt(j.turnaround)).join(" + ")}) / ${spec.jobs.length}` };
        case "policy":
          return { ...base, policyList: Object.values(POLICY_SHORT).join(", ") };
        case "quantum":
          return { ...base, quantum: g.value };
      }
    },
  },
};
