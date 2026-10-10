/** CPU scheduling truth (CPET181 Ch4, #539): pure, dependency-free. Conventions are explicit options. */

export type Policy = "fcfs" | "sjn" | "srt" | "priority" | "rr";

export interface SchedJob {
  id: string;
  arrival: number;
  cpu: number;
  /** Used by `priority` only. */
  priority?: number;
}

export interface ScheduleOptions {
  /** Round Robin time quantum (required for `rr`). */
  quantum?: number;
  /** Priority: "low-first" = smaller number runs first (Ch4 s.27). Default "low-first". */
  priorityOrder?: "low-first" | "high-first";
  /**
   * Priority tie (equal priority) is FCFS (Ch4 s.26): earlier arrival, then table order. Fixed by the
   * pack, not an option.
   *
   * SJN equal CPU time: "arrival-then-table" follows the priority rule. Inferred from s.26, never shown.
   * LOCAL SOURCE VERIFICATION NEEDED.
   */
  sjnTie?: "arrival-then-table" | "table";
  /**
   * SRT equal remaining time: "arrival-then-table" = earlier arrival first (s.36 at t = 11: A before E).
   */
  srtTie?: "arrival-then-table" | "table";
  /**
   * SRT, a new arrival has exactly the running job's remaining time. Not shown in any source.
   * "keep-running" = no preemption; "apply-tie-rule" = the SRT tie rule may preempt.
   * LOCAL SOURCE VERIFICATION NEEDED.
   */
  srtEqualRemaining?: "keep-running" | "apply-tie-rule";
  /**
   * RR: a job arriving at the instant a quantum expires. "arrival-first" = joins the queue ahead of the
   * preempted job (s.31 t = 4, s.32 t = 6). Default "arrival-first".
   */
  rrBoundary?: "arrival-first" | "preempted-first";
}

/** One box of the Gantt chart; `job: null` is idle CPU. */
export interface Segment {
  job: string | null;
  start: number;
  end: number;
}

export interface JobResult {
  id: string;
  arrival: number;
  cpu: number;
  finish: number;
  /** finish − arrival (Ch4 s.13). */
  turnaround: number;
  /** turnaround − cpu. Derived and internal: the source names waiting time but never assesses it. */
  wait: number;
}

export interface Schedule {
  segments: Segment[];
  jobs: JobResult[];
  avgTurnaround: number;
  /** Internal only; never assessed. */
  avgWait: number;
}

const EPS = 1e-9;

function validate(jobs: SchedJob[], policy: Policy, opts: ScheduleOptions): void {
  const seen = new Set<string>();
  for (const j of jobs) {
    if (seen.has(j.id)) throw new RangeError(`duplicate job id ${j.id}`);
    seen.add(j.id);
    if (!Number.isFinite(j.arrival) || j.arrival < 0) throw new RangeError(`bad arrival for ${j.id}`);
    if (!Number.isFinite(j.cpu) || j.cpu <= 0) throw new RangeError(`bad cpu time for ${j.id}`);
    if (policy === "priority" && !Number.isFinite(j.priority)) throw new RangeError(`missing priority for ${j.id}`);
  }
  if (policy === "rr" && !(typeof opts.quantum === "number" && opts.quantum > 0 && Number.isFinite(opts.quantum))) {
    throw new RangeError("round robin needs a positive quantum");
  }
}

/** Run `policy` over `jobs` (table order = array order). Never mutates the input. */
export function schedule(jobs: SchedJob[], policy: Policy, opts: ScheduleOptions = {}): Schedule {
  validate(jobs, policy, opts);
  const segments = policy === "rr" ? runRR(jobs, opts) : policy === "srt" ? runSRT(jobs, opts) : runNonPreemptive(jobs, policy, opts);
  return summarise(jobs, segments);
}

function summarise(jobs: SchedJob[], segments: Segment[]): Schedule {
  const finish = new Map<string, number>();
  for (const s of segments) if (s.job !== null) finish.set(s.job, s.end);
  const results: JobResult[] = jobs.map((j) => {
    const f = finish.get(j.id) ?? NaN;
    return { id: j.id, arrival: j.arrival, cpu: j.cpu, finish: f, turnaround: f - j.arrival, wait: f - j.arrival - j.cpu };
  });
  const n = results.length || 1;
  return {
    segments,
    jobs: results,
    avgTurnaround: results.reduce((a, r) => a + r.turnaround, 0) / n,
    avgWait: results.reduce((a, r) => a + r.wait, 0) / n,
  };
}

function push(segments: Segment[], job: string | null, start: number, end: number, merge: boolean): void {
  const last = segments[segments.length - 1];
  if (merge && last && last.job === job && Math.abs(last.end - start) < EPS) last.end = end;
  else segments.push({ job, start, end });
}

function runNonPreemptive(jobs: SchedJob[], policy: Policy, opts: ScheduleOptions): Segment[] {
  const segments: Segment[] = [];
  const idx = new Map(jobs.map((j, i) => [j.id, i] as const));
  const pending = new Set(jobs.map((j) => j.id));
  const byId = new Map(jobs.map((j) => [j.id, j] as const));
  const dir = opts.priorityOrder === "high-first" ? -1 : 1;
  const sjnTableOnly = opts.sjnTie === "table";
  let t = 0;
  while (pending.size) {
    const ready = [...pending].map((id) => byId.get(id)!).filter((j) => j.arrival <= t + EPS);
    if (!ready.length) {
      const next = Math.min(...[...pending].map((id) => byId.get(id)!.arrival));
      push(segments, null, t, next, true);
      t = next;
      continue;
    }
    const key = (j: SchedJob): number[] => {
      const i = idx.get(j.id)!;
      if (policy === "fcfs") return [j.arrival, i];
      if (policy === "sjn") return sjnTableOnly ? [j.cpu, i] : [j.cpu, j.arrival, i];
      return [dir * (j.priority as number), j.arrival, i];
    };
    const pick = ready.reduce((a, b) => (cmp(key(b), key(a)) < 0 ? b : a));
    // FCFS with equal arrivals runs in table order (key above); arrival order otherwise.
    pending.delete(pick.id);
    push(segments, pick.id, t, t + pick.cpu, false);
    t += pick.cpu;
  }
  return segments;
}

function cmp(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > EPS) return a[i] - b[i];
  return 0;
}

function runSRT(jobs: SchedJob[], opts: ScheduleOptions): Segment[] {
  const segments: Segment[] = [];
  const rem = new Map(jobs.map((j) => [j.id, j.cpu] as const));
  const idx = new Map(jobs.map((j, i) => [j.id, i] as const));
  const tableOnly = opts.srtTie === "table";
  const keepRunning = opts.srtEqualRemaining !== "apply-tie-rule";
  const arrivals = [...new Set(jobs.map((j) => j.arrival))].sort((a, b) => a - b);
  let t = 0;
  let running: string | null = null;
  for (;;) {
    const ready = jobs.filter((j) => j.arrival <= t + EPS && rem.get(j.id)! > EPS);
    if (!ready.length) {
      const next = arrivals.find((a) => a > t + EPS);
      if (next === undefined) break;
      push(segments, null, t, next, true);
      t = next;
      running = null;
      continue;
    }
    const key = (j: SchedJob): number[] => (tableOnly ? [rem.get(j.id)!, idx.get(j.id)!] : [rem.get(j.id)!, j.arrival, idx.get(j.id)!]);
    let pick = ready.reduce((a, b) => (cmp(key(b), key(a)) < 0 ? b : a));
    if (running !== null && keepRunning && rem.get(running)! > EPS) {
      const cur = jobs[idx.get(running)!];
      if (Math.abs(rem.get(cur.id)! - rem.get(pick.id)!) < EPS) pick = cur;
    }
    running = pick.id;
    const nextArrival = arrivals.find((a) => a > t + EPS);
    const finishAt = t + rem.get(pick.id)!;
    const end = nextArrival !== undefined && nextArrival < finishAt - EPS ? nextArrival : finishAt;
    rem.set(pick.id, rem.get(pick.id)! - (end - t));
    push(segments, pick.id, t, end, true);
    t = end;
  }
  return segments;
}

function runRR(jobs: SchedJob[], opts: ScheduleOptions): Segment[] {
  const q = opts.quantum as number;
  const arrivalFirst = opts.rrBoundary !== "preempted-first";
  const segments: Segment[] = [];
  const idx = new Map(jobs.map((j, i) => [j.id, i] as const));
  const incoming = [...jobs].sort((a, b) => a.arrival - b.arrival || idx.get(a.id)! - idx.get(b.id)!);
  const rem = new Map(jobs.map((j) => [j.id, j.cpu] as const));
  const queue: string[] = [];
  let next = 0;
  let t = 0;
  const admit = (upTo: number, inclusive: boolean) => {
    while (next < incoming.length && (inclusive ? incoming[next].arrival <= upTo + EPS : incoming[next].arrival < upTo - EPS)) {
      queue.push(incoming[next++].id);
    }
  };
  admit(t, true);
  while (queue.length || next < incoming.length) {
    if (!queue.length) {
      const at = incoming[next].arrival;
      push(segments, null, t, at, true);
      t = at;
      admit(t, true);
      continue;
    }
    const id = queue.shift()!;
    const run = Math.min(q, rem.get(id)!);
    const end = t + run;
    rem.set(id, rem.get(id)! - run);
    push(segments, id, t, end, false); // slices stay separate boxes (s.31 draws D 14–18, D 18–19)
    if (arrivalFirst) {
      admit(end, true);
      if (rem.get(id)! > EPS) queue.push(id);
    } else {
      admit(end, false);
      if (rem.get(id)! > EPS) queue.push(id);
      admit(end, true);
    }
    t = end;
  }
  return segments;
}
