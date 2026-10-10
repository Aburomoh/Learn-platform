import { z } from "zod";
import { equivalentPolicies } from "./logic";

export const Policy = z.enum(["fcfs", "sjn", "srt", "priority", "rr"]);
export const Phase = z.enum(["timeline", "finish", "turnaround", "average"]);

/**
 * CPU scheduling (CPET181 Ch4, spec docs/design/cpet181/kinds-spec.md §1, #583). The Gantt chart
 * is built one segment at a time (which job runs next, then until when), then the finish and
 * turnaround columns and the average turnaround. Waiting time is never asked (Lead on #545).
 * `mode: "identify"` draws the whole chart as a given and asks which algorithm produced it.
 * Truth comes from `src/content/os/schedule.ts`; conventions are the pack's (ch4.md).
 */
export const CpuScheduleSpec = z
  .object({
    kind: z.literal("cpu-schedule"),
    policy: Policy,
    /** Round Robin only. */
    quantum: z.number().positive().optional(),
    /** Slide order (also the tie order for equal arrivals). */
    jobs: z
      .array(z.object({ id: z.string().min(1).max(4), arrival: z.number().min(0), cpu: z.number().positive(), priority: z.number().optional() }))
      .min(2)
      .max(6),
    /** Goals in this order; default all four. */
    phases: z.array(Phase).min(1).default(["timeline", "finish", "turnaround", "average"]),
    /** "build" (default): segment by segment. "identify": the chart is given, the policy is asked. */
    mode: z.enum(["build", "identify"]).default("build"),
    unit: z.string().min(1).default("ms"),
  })
  .superRefine((s, ctx) => {
    const ids = s.jobs.map((j) => j.id);
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", message: "job ids must be distinct" });
    if (s.policy === "rr" && !(s.quantum && s.quantum > 0)) ctx.addIssue({ code: "custom", path: ["quantum"], message: "round robin needs a quantum" });
    if (s.policy === "priority" && s.jobs.some((j) => j.priority === undefined)) ctx.addIssue({ code: "custom", path: ["jobs"], message: "priority scheduling needs a priority per job" });
    const order = ["timeline", "finish", "turnaround", "average"];
    const idx = s.phases.map((p) => order.indexOf(p));
    if (idx.some((v, i) => i > 0 && v <= idx[i - 1])) ctx.addIssue({ code: "custom", path: ["phases"], message: "phases must be timeline, finish, turnaround, average in that order" });
    if (s.phases.includes("average") && !s.phases.includes("turnaround")) ctx.addIssue({ code: "custom", path: ["phases"], message: "the average needs the turnaround column" });
    // identify mode needs one clear answer: no other policy (or RR quantum) draws the same chart
    if (s.mode === "identify" && (s.policy !== "rr" || s.quantum) && (s.policy !== "priority" || s.jobs.every((j) => j.priority !== undefined))) {
      const same = equivalentPolicies({ ...s, phases: s.phases ?? ["timeline"], mode: "identify", unit: s.unit ?? "ms" });
      if (same.length !== 1) ctx.addIssue({ code: "custom", path: ["mode"], message: `ambiguous chart: ${same.map((e) => (e.quantum ? `RR q=${e.quantum}` : e.policy.toUpperCase())).join(", ") || "no policy"} draw it` });
    }
  });

export type CpuScheduleSpec = z.infer<typeof CpuScheduleSpec>;

export const cpuScheduleDetectors = [
  /** Ran a job before it arrived, or left the CPU idle while a job was ready. */
  z.object({ type: z.literal("arrival-ignored") }),
  /** SJN/SRT: took the earliest arrival instead of the shortest. */
  z.object({ type: z.literal("fcfs-under-sjn") }),
  /** SJN/SRT: took the longest job instead of the shortest. */
  z.object({ type: z.literal("longest-first") }),
  /** SRT: kept the running job past a shorter arrival; RR: ran past the quantum. */
  z.object({ type: z.literal("not-preempted") }),
  /** FCFS/SJN/Priority: stopped a job before it finished. */
  z.object({ type: z.literal("preempted-nonpreemptive") }),
  /** RR: ran a full quantum although less CPU time was left. */
  z.object({ type: z.literal("end-past-remaining") }),
  /** Priority: the number direction inverted (largest number first). */
  z.object({ type: z.literal("priority-reversed") }),
  /** RR: a ready job out of queue order (the requeued job before a same-tick arrival, or the reverse). */
  z.object({ type: z.literal("rr-queue-order") }),
  /** Turnaround written as the finish time (arrival not subtracted). */
  z.object({ type: z.literal("turnaround-as-finish") }),
  /** Average divided by the wrong count. */
  z.object({ type: z.literal("average-wrong-count") }),
] as const;
