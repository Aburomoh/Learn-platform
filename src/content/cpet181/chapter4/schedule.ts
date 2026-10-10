/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * CPET 181 Chapter 4, scheduling algorithms (#587, content pack ch4 §8–§14, §16): FCFS, SJN, SRT,
 * Priority and Round Robin on the cpu-schedule kind, plus comparing algorithms on one job set and
 * recognising an algorithm from its chart. Every chart, finish, turnaround and average comes from
 * `src/content/os/schedule.ts` through the kind; nothing is authored. The job table and the chart
 * are drawn by the kind on every practice (question-context rule, #568). Waiting time is never asked.
 * Deck sets (s.17–s.36) carry their slide number in the set id; the others are fresh, and no fresh
 * set has a tie the pack does not state (SJN/SRT ties are LOCAL SOURCE VERIFICATION in the truth module).
 */
import type { z } from "zod";
import type { TopicSchema, VariantSchema } from "../../schema";

type TopicInput = z.input<typeof TopicSchema>;
type VariantInput = z.input<typeof VariantSchema>;
type HintInput = NonNullable<VariantInput["hints"]>[number];
type Misconception = NonNullable<VariantInput["misconceptions"]>[number];
export type Policy = "fcfs" | "sjn" | "srt" | "priority" | "rr";
type Phase = "timeline" | "finish" | "turnaround" | "average";
type Job = { id: string; arrival: number; cpu: number; priority?: number };

/** Jobs from `[id, arrival, cpu, priority?]` rows, in slide order. */
export const jobs = (rows: [string, number, number, number?][]): Job[] => rows.map(([id, arrival, cpu, priority]) => (priority === undefined ? { id, arrival, cpu } : { id, arrival, cpu, priority }));

export const NAME: Record<Policy, string> = { fcfs: "First Come First Served", sjn: "Shortest Job Next", srt: "Shortest Remaining Time", priority: "Priority", rr: "Round Robin" };

const RULE: Record<Policy, string> = {
  fcfs: "First Come First Served runs the jobs in the order they arrive (equal arrivals in table order), each to the end.",
  sjn: "Shortest Job Next picks, among the jobs that have arrived, the one with the shortest CPU time, and runs it to the end. It decides only when a job finishes.",
  srt: "Shortest Remaining Time runs the arrived job with the least CPU time left, and decides again at every arrival and every completion, so a shorter job preempts.",
  priority: "Priority (non-preemptive) runs the arrived job with the smallest priority number, to the end; equal priorities go first come first served.",
  rr: "Round Robin gives each job in the queue at most one quantum in turn; an unfinished job goes to the back. A job that arrives exactly when a quantum expires joins the queue ahead of the preempted job.",
};

const jobHints = (policy: Policy): HintInput[] => [
  { rung: 2, text: "Not yet. At time {time}, which jobs have arrived and are not finished?" },
  { rung: 3, text: RULE[policy] },
  { rung: 5, text: "Ready at {time}: {readyList}." },
  { rung: 9, text: "At time {time} the rule picks {jobId}." },
];
const endHints = (policy: Policy): HintInput[] => [
  { rung: 2, text: "Not yet. How long does {jobId} run before the CPU is taken from it?" },
  {
    rung: 3,
    text:
      policy === "rr"
        ? "Round Robin runs a job for one quantum, or less when it has less CPU time left."
        : policy === "srt"
          ? "It runs until it finishes or until a job arrives that has less time left than it does."
          : "A non-preemptive job runs until it finishes: its CPU time from when it starts.",
  },
  { rung: 9, text: "{jobId} runs for {runLength} {unit}, until {segmentEnd}." },
];
const columnHints: HintInput[] = [
  { rung: 2, text: "Not yet. Look at the chart: when does each job's last box end?" },
  { rung: 3, text: "Finish time is the end of a job's last box. Turnaround is finish − arrival." },
  { rung: 9, text: "{columnLabel}: {columnValues}." },
];
const averageHints: HintInput[] = [
  { rung: 2, text: "Not yet. Add the turnaround times, then divide by the number of jobs." },
  { rung: 3, text: "Average turnaround = (sum of the turnarounds) ÷ (number of jobs), to two decimals." },
  { rung: 9, text: "({sumList}) ÷ {jobCount} = {average}." },
];
const policyHints: HintInput[] = [
  { rung: 2, text: "Not yet. Look at the chart: does a running job ever get cut off, and what decides who runs next?" },
  { rung: 3, text: "Jobs cut off before they finish point to Shortest Remaining Time or Round Robin; the others run each job to the end." },
  { rung: 9, text: "The chart is drawn by {policyName}." },
];

const MIS: Record<string, Misconception> = {
  arrival: { id: "cs.arrival-ignored", title: "Ran a job before it arrived", nudgeKey: "cs.arrival-ignored", detect: { type: "arrival-ignored" } },
  fcfsUnderSjn: { id: "cs.fcfs-under-sjn", title: "Earliest arrival taken instead of the shortest", nudgeKey: "cs.fcfs-under-sjn", detect: { type: "fcfs-under-sjn" } },
  longest: { id: "cs.longest-first", title: "The longest job taken", nudgeKey: "cs.longest-first", detect: { type: "longest-first" } },
  notPreempted: { id: "cs.not-preempted", title: "A running job not preempted", nudgeKey: "cs.not-preempted", detect: { type: "not-preempted" } },
  preemptedNon: { id: "cs.preempted-nonpreemptive", title: "A non-preemptive job stopped early", nudgeKey: "cs.preempted-nonpreemptive", detect: { type: "preempted-nonpreemptive" } },
  pastRemaining: { id: "cs.end-past-remaining", title: "A full quantum run with less left", nudgeKey: "cs.end-past-remaining", detect: { type: "end-past-remaining" } },
  priorityReversed: { id: "cs.priority-reversed", title: "Largest priority number first", nudgeKey: "cs.priority-reversed", detect: { type: "priority-reversed" } },
  queueOrder: { id: "cs.rr-queue-order", title: "Queue order wrong at the quantum boundary", nudgeKey: "cs.rr-queue-order", detect: { type: "rr-queue-order" } },
  tatAsFinish: { id: "cs.turnaround-as-finish", title: "Finish written as the turnaround", nudgeKey: "cs.turnaround-as-finish", detect: { type: "turnaround-as-finish" } },
  avgCount: { id: "cs.average-wrong-count", title: "Divided by the wrong count", nudgeKey: "cs.average-wrong-count", detect: { type: "average-wrong-count" } },
};
const MIS_BY_POLICY: Record<Policy, Misconception[]> = {
  fcfs: [MIS.arrival, MIS.preemptedNon],
  sjn: [MIS.arrival, MIS.fcfsUnderSjn, MIS.longest, MIS.preemptedNon],
  srt: [MIS.arrival, MIS.fcfsUnderSjn, MIS.longest, MIS.notPreempted],
  priority: [MIS.arrival, MIS.priorityReversed, MIS.preemptedNon],
  rr: [MIS.arrival, MIS.notPreempted, MIS.pastRemaining, MIS.queueOrder],
};

export interface ScheduleCase {
  id: string;
  policy: Policy;
  quantum?: number;
  jobs: Job[];
  /** Default: the whole procedure. */
  phases?: Phase[];
  mode?: "build" | "identify";
  prompt?: string;
}

const PHASE_NAMES = "then each job's finish time and turnaround time, then the average turnaround";

export function scheduleVariant(c: ScheduleCase): VariantInput {
  const phases = c.phases ?? ["timeline", "finish", "turnaround", "average"];
  const identify = c.mode === "identify";
  const wholeProcedure = phases.includes("timeline");
  const prompt =
    c.prompt ??
    (identify
      ? "The Gantt chart below was drawn by one scheduling algorithm. Which algorithm was it?"
      : wholeProcedure
        ? `${NAME[c.policy]}${c.quantum ? `, quantum ${c.quantum} ms` : ""}: build the Gantt chart one segment at a time (which job runs next, then until when), ${PHASE_NAMES}.`
        : `${NAME[c.policy]}${c.quantum ? `, quantum ${c.quantum} ms` : ""}: the chart is drawn. Give each job's finish time and turnaround time, then the average turnaround.`);
  const byStep: Record<string, HintInput[]> = identify
    ? { policy: policyHints, quantum: [{ rung: 2, text: "Not yet. How long is the longest box that is cut off before its job finishes?" }, { rung: 3, text: "In Round Robin every box is at most one quantum long, so the quantum is the length of the longest full box." }, { rung: 9, text: "The quantum is {quantum} {unit}." }] }
    : { job: jobHints(c.policy), end: endHints(c.policy), column: columnHints, average: averageHints };
  return {
    id: c.id,
    prompt,
    spec: {
      kind: "cpu-schedule",
      policy: c.policy,
      ...(c.quantum ? { quantum: c.quantum } : {}),
      jobs: c.jobs,
      phases,
      mode: c.mode ?? "build",
      unit: "ms",
    },
    hints: identify ? policyHints : jobHints(c.policy),
    hintsByStep: byStep,
    ...(phases.includes("average") && !identify ? { calculator: { average: "{averageExpression}" } } : {}),
    misconceptions: identify ? [] : [...MIS_BY_POLICY[c.policy], MIS.tatAsFinish, MIS.avgCount],
    explanation: [
      { id: "s1", say: identify ? "Look at how the boxes are cut: boxes that stop before their job finishes mean a preemptive algorithm." : RULE[c.policy] },
      {
        id: "s2",
        say: identify
          ? "Then check who runs next at each boundary: the earliest arrival, the shortest job, the smallest priority number, or the next in the queue."
          : "At every boundary, list the jobs that have arrived and are not finished, and apply the rule to that list. Turnaround is finish − arrival, and the average is the sum of the turnarounds divided by the number of jobs.",
      },
    ],
  };
}

const q = (id: string, label: string, conceptId: string, objectiveId: string, variants: VariantInput[]) => ({ id, label, conceptId, objectiveId, variants });
const build = (policy: Policy, sets: { id: string; jobs: Job[]; quantum?: number }[]) => sets.map((s) => scheduleVariant({ id: s.id, policy, jobs: s.jobs, quantum: s.quantum }));

/* ---------- job sets (A, B, C… in slide order) ---------- */

export const FCFS_SETS = [
  { id: "s17", jobs: jobs([["A", 0, 15], ["B", 0, 2], ["C", 0, 1]]) }, // 16.67
  { id: "s18", jobs: jobs([["C", 0, 1], ["B", 0, 2], ["A", 0, 15]]) }, // 7.33
  { id: "f-new", jobs: jobs([["A", 0, 5], ["B", 1, 3], ["C", 2, 8], ["D", 3, 2]]) }, // 10.25
];
export const SJN_SETS = [
  { id: "s20", jobs: jobs([["A", 0, 5], ["B", 0, 2], ["C", 0, 6], ["D", 0, 4]]) }, // 9
  { id: "s21", jobs: jobs([["A", 0, 6], ["B", 1, 3], ["C", 2, 1], ["D", 3, 4]]) }, // 7.75
  { id: "s22", jobs: jobs([["A", 0, 2], ["B", 1, 4], ["C", 2, 1], ["D", 4, 2]]) }, // 3.5
  { id: "f-new", jobs: jobs([["A", 0, 7], ["B", 2, 4], ["C", 4, 1], ["D", 5, 3]]) }, // 7.5
];
export const SRT_SETS = [
  { id: "s24", jobs: jobs([["A", 0, 6], ["B", 1, 3], ["C", 2, 1], ["D", 3, 4]]) }, // 6.25
  { id: "s25", jobs: jobs([["A", 0, 2], ["B", 1, 4], ["C", 2, 1], ["D", 4, 2]]) }, // 3.25
  { id: "f-new", jobs: jobs([["A", 0, 7], ["B", 1, 2], ["C", 3, 4], ["D", 4, 1]]) }, // 5.5
  { id: "s36", jobs: jobs([["A", 0, 6], ["B", 3, 2], ["C", 5, 2], ["D", 7, 2], ["E", 8, 3], ["F", 9, 2]]) }, // 31/6
];
export const PRIORITY_SETS = [
  { id: "s27", jobs: jobs([["A", 0, 5, 9], ["B", 0, 2, 3], ["C", 0, 4, 6], ["D", 0, 4, 5], ["E", 0, 3, 6]]) }, // 9.8
  { id: "f-new1", jobs: jobs([["A", 0, 6, 4], ["B", 0, 3, 2], ["C", 0, 2, 5], ["D", 0, 5, 1]]) }, // 10.75
  { id: "f-new2", jobs: jobs([["A", 0, 4, 3], ["B", 0, 6, 1], ["C", 0, 2, 3], ["D", 0, 5, 2]]) }, // 12.25, tie A before C
];
const RR_JOBS_31 = jobs([["A", 0, 7], ["B", 2, 4], ["C", 4, 3], ["D", 6, 5]]);
export const RR_SETS = [
  { id: "s30", quantum: 4, jobs: jobs([["A", 0, 8], ["B", 1, 4], ["C", 2, 9], ["D", 3, 5]]) }, // 18.25
  { id: "s35", quantum: 3, jobs: jobs([["A", 0, 3], ["B", 2, 5], ["C", 3, 3], ["D", 4, 4], ["E", 5, 2]]) }, // 9
  { id: "f-new", quantum: 3, jobs: jobs([["A", 0, 5], ["B", 1, 3], ["C", 2, 6]]) },
];
export const RR_QUANTUM_SETS = [
  { id: "s31-q4", quantum: 4, jobs: RR_JOBS_31 }, // 10
  { id: "s32-q3", quantum: 3, jobs: RR_JOBS_31 }, // 13
  { id: "s33-q7", quantum: 7, jobs: RR_JOBS_31 }, // 9.75, the same schedule as FCFS
];

/* ---------- topics ---------- */

export const fcfsSjnTopic: TopicInput = {
  id: "fcfs-sjn",
  title: "First come first served and shortest job next",
  summary: "Two non-preemptive algorithms: run the jobs in arrival order, or the shortest arrived job next. Build the chart, then finish, turnaround and the average.",
  concepts: [
    { id: "fs.fcfs", title: "First Come First Served", summary: "Jobs run to the end in arrival order; a long job first makes everyone wait." },
    { id: "fs.sjn", title: "Shortest Job Next", summary: "At each completion the shortest arrived job runs, to the end." },
  ],
  objectives: [
    { id: "fs.obj.fcfs", conceptId: "fs.fcfs", text: "Build the FCFS chart and find the finish and turnaround times and the average." },
    { id: "fs.obj.sjn", conceptId: "fs.sjn", text: "Build the SJN chart and find the finish and turnaround times and the average." },
  ],
  activities: [
    { id: "fcfs", title: "First come first served", summary: "Jobs run in arrival order: build the chart, then the times.", authority: "DEMO", minutes: 10, questions: [q("fs.q.fcfs", "FCFS", "fs.fcfs", "fs.obj.fcfs", build("fcfs", FCFS_SETS))] },
    { id: "sjn", title: "Shortest job next", summary: "At each completion the shortest arrived job runs: build the chart, then the times.", authority: "DEMO", minutes: 14, questions: [q("fs.q.sjn", "SJN", "fs.sjn", "fs.obj.sjn", build("sjn", SJN_SETS))] },
  ],
};

export const srtTopic: TopicInput = {
  id: "srt",
  title: "Shortest remaining time",
  summary: "The preemptive version of shortest job next: a shorter arrival takes the CPU. Build the chart, then finish, turnaround and the average.",
  concepts: [{ id: "st.srt", title: "Shortest Remaining Time", summary: "The arrived job with the least time left runs; the choice is made again at every arrival and completion." }],
  objectives: [{ id: "st.obj.srt", conceptId: "st.srt", text: "Build the SRT chart, including the preemptions, and find the times and the average." }],
  activities: [{ id: "srt", title: "Shortest remaining time", summary: "Re-decide at every arrival and completion.", authority: "DEMO", minutes: 16, questions: [q("st.q.srt", "SRT", "st.srt", "st.obj.srt", build("srt", SRT_SETS))] }],
};

export const priorityTopic: TopicInput = {
  id: "priority",
  title: "Priority scheduling",
  summary: "Each job has a priority number, and the smallest number runs first, to the end. Equal priorities go first come first served.",
  concepts: [{ id: "pr.priority", title: "Priority scheduling", summary: "Non-preemptive: the arrived job with the smallest priority number runs next; ties are first come first served." }],
  objectives: [{ id: "pr.obj.priority", conceptId: "pr.priority", text: "Build the priority chart, resolving equal priorities, and find the times and the average." }],
  activities: [{ id: "priority", title: "Priority scheduling", summary: "Smallest priority number first.", authority: "DEMO", minutes: 12, questions: [q("pr.q.priority", "Priority", "pr.priority", "pr.obj.priority", build("priority", PRIORITY_SETS))] }],
};

export const roundRobinTopic: TopicInput = {
  id: "round-robin",
  title: "Round robin",
  summary: "Each job gets a fixed quantum in turn. Build the chart, then see what a different quantum does to the same jobs.",
  concepts: [
    { id: "rr.rr", title: "Round Robin", summary: "Each job runs for at most one quantum, then goes to the back of the queue; a job that arrives as a quantum expires joins ahead of the preempted one." },
    { id: "rr.quantum", title: "The quantum", summary: "A quantum at least as long as every job turns Round Robin into FCFS; a very small one adds overhead." },
  ],
  objectives: [
    { id: "rr.obj.rr", conceptId: "rr.rr", text: "Build the Round Robin chart, with the queue order at a quantum boundary, and find the times and the average." },
    { id: "rr.obj.quantum", conceptId: "rr.quantum", text: "Work out the same job set under different quanta and see the effect on the average." },
  ],
  activities: [
    { id: "round-robin", title: "Round robin", summary: "Build the chart quantum by quantum.", authority: "DEMO", minutes: 18, questions: [q("rr.q.build", "Round Robin", "rr.rr", "rr.obj.rr", build("rr", RR_SETS))] },
    { id: "quantum", title: "Changing the quantum", summary: "The same four jobs with quantum 4, 3 and 7.", authority: "DEMO", minutes: 16, questions: [q("rr.q.quantum", "Another quantum", "rr.quantum", "rr.obj.quantum", build("rr", RR_QUANTUM_SETS))] },
  ],
};

/* ---------- comparing algorithms and recognising one ---------- */

const COMPARE_SETS = [
  { id: "cmp-1", jobs: jobs([["A", 0, 6], ["B", 1, 3], ["C", 2, 1], ["D", 3, 4]]) },
  { id: "cmp-2", jobs: jobs([["A", 0, 2], ["B", 1, 4], ["C", 2, 1], ["D", 4, 2]]) },
  { id: "cmp-3", jobs: jobs([["A", 0, 5], ["B", 1, 3], ["C", 2, 6], ["D", 4, 1]]) },
];
const compare = (policy: Policy) => COMPARE_SETS.map((s) => scheduleVariant({ id: s.id, policy, jobs: s.jobs, phases: ["finish", "turnaround", "average"] }));

const IDENTIFY: ScheduleCase[] = [
  { id: "idn-rr", policy: "rr", quantum: 3, mode: "identify", phases: ["timeline"], jobs: RR_JOBS_31 },
  { id: "idn-sjn", policy: "sjn", mode: "identify", phases: ["timeline"], jobs: jobs([["A", 0, 6], ["B", 1, 3], ["C", 2, 1], ["D", 3, 4]]) },
  { id: "idn-srt", policy: "srt", mode: "identify", phases: ["timeline"], jobs: jobs([["A", 0, 6], ["B", 1, 3], ["C", 2, 1], ["D", 3, 4]]) },
  { id: "idn-pri", policy: "priority", mode: "identify", phases: ["timeline"], jobs: jobs([["A", 0, 5, 9], ["B", 0, 2, 3], ["C", 0, 4, 6], ["D", 0, 4, 5], ["E", 0, 3, 6]]) },
];

export const compareTopic: TopicInput = {
  id: "compare-algorithms",
  title: "Comparing scheduling algorithms",
  summary: "The same jobs under different algorithms give different averages; and a chart tells you which algorithm drew it.",
  concepts: [
    { id: "cm.compare", title: "Comparing algorithms", summary: "On one job set the algorithm changes who waits: compare the average turnaround." },
    { id: "cm.identify", title: "Recognising an algorithm", summary: "Preemption, the order of the boxes and the priority column tell the algorithm apart." },
  ],
  objectives: [
    { id: "cm.obj.compare", conceptId: "cm.compare", text: "Work out the average turnaround of one job set under FCFS, SJN and SRT, and say which is best." },
    { id: "cm.obj.identify", conceptId: "cm.identify", text: "Name the algorithm that drew a given Gantt chart." },
  ],
  activities: [
    {
      id: "compare",
      title: "Same jobs, different algorithms",
      summary: "The chart is drawn: find the finish, turnaround and average under FCFS, SJN and SRT.",
      authority: "DEMO",
      minutes: 14,
      questions: [
        q("cm.q.fcfs", "FCFS average", "cm.compare", "cm.obj.compare", compare("fcfs")),
        q("cm.q.sjn", "SJN average", "cm.compare", "cm.obj.compare", compare("sjn")),
        q("cm.q.srt", "SRT average", "cm.compare", "cm.obj.compare", compare("srt")),
      ],
    },
    {
      id: "identify",
      title: "Which algorithm drew it?",
      summary: "Read a finished chart and name the algorithm.",
      authority: "DEMO",
      minutes: 8,
      questions: [q("cm.q.identify", "Name the algorithm", "cm.identify", "cm.obj.identify", IDENTIFY.map(scheduleVariant))],
    },
  ],
};
