/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * CPET 181 Chapter 5, deadlock and starvation (#614; content pack ch5 §1–§5 and the #588 inventory
 * C5-1 … C5-7): deadlock against starvation, the seven cases, deadlock against a race, the two
 * kinds of arrow in a sketch, circular wait, the four conditions, the three recovery methods,
 * and starvation with aging. Multiple choice only, with the resource-graph figure (#607) where
 * the sketch is the object. No numeric content exists in the chapter; every fact is from
 * docs/content-packs/cpet181/ch5.md and no quiz key is used.
 */
import type { z } from "zod";
import type { TopicSchema } from "../../schema";
import { mcq, type Row } from "../chapter1/mcq";

type TopicInput = z.input<typeof TopicSchema>;
type Figure = NonNullable<Row["figure"]>;

const row = (prompt: string, correct: string, wrong: string[], rule: string, apply: string, hint: string, figure?: Figure): Row => ({ prompt, correct, wrong, rule, apply, hint, ...(figure ? { figure } : {}) });
const others = (all: string[], name: string) => all.filter((x) => x !== name);

/* ---------- deadlock, starvation, the seven cases, races ---------- */

const DL = "A deadlock is a system-wide tangle that starts when two or more jobs are put on hold, each waiting for a resource another holds. Starvation is one job postponed indefinitely, while other jobs go on.";
const DS = ["Deadlock", "Starvation", "A race"];
const deadlockStarvation = mcq("dl.q.deadlock-starvation", "Deadlock or starvation", "dl.basics", "dl.obj.deadlock-starvation", [
  row("Two or more jobs are on hold, and each waits for a resource that another of them holds. What is this?", "Deadlock", others(DS, "Deadlock"), DL, "Jobs waiting on each other's resources are in a deadlock.", "Do the jobs wait on each other, or does one job wait alone?"),
  row("One job is postponed indefinitely while the other jobs keep running. What is this?", "Starvation", others(DS, "Starvation"), DL, "One job postponed without end is starvation.", "Is the whole system tangled, or one job?"),
  row("Which problem is system-wide and starts when two or more jobs are put on hold?", "Deadlock", others(DS, "Deadlock"), DL, "A deadlock is a system-wide tangle.", "The other one affects a single job."),
  row("A job never runs because the resources it needs never become free to it. What is this?", "Starvation", others(DS, "Starvation"), DL, "A job that never gets its resources is starved.", "Only one job is affected."),
]);

const CASES = "Deadlock cases: file requests (each process holds one file and wants the other), database records (each locks one record and asks for the other), one type of dedicated device (two tape drives), multiple devices (a circle of tape drive, printer and plotter), spooling, disk sharing and networks.";
const CASE_NAMES = ["File requests", "Database records", "A dedicated device", "Multiple devices"];
const cases = mcq("dl.q.cases", "Which case", "dl.basics", "dl.obj.cases", [
  row("P1 holds file F1 and wants F2; P2 holds F2 and wants F1. Which case of deadlock?", "File requests", others(CASE_NAMES, "File requests").slice(0, 3), CASES, "Each process holds one file and wants the other: file requests.", "What kind of resource are they holding?"),
  row("P1 locks record R1 and P2 locks record R2; each then asks for the other's record. Which case of deadlock?", "Database records", others(CASE_NAMES, "Database records").slice(0, 3), CASES, "Each locks one record and asks for the other: database records.", "What kind of resource is locked?"),
  row("There are two tape drives. P1 has drive 1 and P2 has drive 2, and each asks for the other's drive. Which case of deadlock?", "A dedicated device", others(CASE_NAMES, "A dedicated device").slice(0, 3), CASES, "Two drives of one dedicated device type: a dedicated device case.", "Both resources are the same kind of device."),
  row("P1 has the tape drive, P2 the printer and P3 the plotter, and each asks for the next one around the circle. Which case of deadlock?", "Multiple devices", others(CASE_NAMES, "Multiple devices").slice(0, 3), CASES, "Different devices held in a circle: multiple devices.", "The devices are of different kinds."),
]);

const RACE = "A race happens when two processes update the same record without locking: the final data depend on which writes last, and one update is lost. Locking lets one user lock the others out while working.";
const race = mcq("dl.q.race", "Deadlock or race", "dl.basics", "dl.obj.race", [
  row("Two processes update one record with no locking. Whichever writes last wins and the other update is lost. What is this?", "A race", ["Deadlock", "Starvation"], RACE, "Unlocked updates where the last writer wins are a race.", "Is anyone waiting, or is everyone writing at once?"),
  row("Every process is stuck because each holds a lock that another needs. What is this?", "Deadlock", ["A race", "Starvation"], RACE, "Locks held in a circle that block everyone are a deadlock.", "In a race nobody is blocked."),
  row("Which problem is caused by NOT using locking?", "A race", ["Deadlock", "Starvation"], RACE, "Without locking, the update that writes last wins: a race.", "Locking is the remedy for one of these."),
  row("What does locking do when one user works on a record?", "Keeps the other users out of the record while the user works", ["Lets all users update it at once", "Takes the record back from the user"], RACE, "Locking locks the other users out while one works.", "It is about who may use the record at that moment."),
]);

/* ---------- sketches: arrows and circles ---------- */

const ARROWS = "In a resource sketch a circle is a process and a box is a resource. A solid arrow from a resource to a process means the resource is allocated to it; a dashed arrow from a process to a resource means the process is requesting it.";
const sketchOne: Figure = { type: "resource-graph", processes: ["P1", "P2"], resources: ["R1", "R2"], edges: [{ process: "P1", resource: "R1", kind: "holds" }, { process: "P2", resource: "R1", kind: "requests" }], caption: "Two processes and two resources, with arrows between them." };
const sketchTwo: Figure = { type: "resource-graph", processes: ["P1", "P2"], resources: ["R1", "R2"], edges: [{ process: "P1", resource: "R2", kind: "holds" }, { process: "P1", resource: "R1", kind: "requests" }, { process: "P2", resource: "R1", kind: "holds" }], caption: "Two processes and two resources, with arrows between them." };
const arrows = mcq("dl.q.arrows", "Solid or dashed", "dl.sketches", "dl.obj.arrows", [
  row("In the figure, a solid arrow joins R1 and P1. What does it show?", "R1 is allocated to P1", ["P1 is requesting R1", "P1 has finished with R1"], ARROWS, "A solid arrow from a resource to a process is an allocation.", "Solid and dashed mean different things.", sketchOne),
  row("In the figure, a dashed arrow joins P2 and R1. What does it show?", "P2 is requesting R1", ["R1 is allocated to P2", "P2 has released R1"], ARROWS, "A dashed arrow from a process to a resource is a request.", "Solid and dashed mean different things.", sketchOne),
  row("In the figure, P1 has a dashed arrow to R1. What is P1 doing?", "Requesting R1", ["Holding R1", "Releasing R1"], ARROWS, "A dashed arrow from a process is a request.", "Which way does the arrow point, and is it solid or dashed?", sketchTwo),
  row("Which arrow in a sketch shows that a resource is allocated to a process?", "A solid arrow from the resource to the process", ["A dashed arrow from the process to the resource", "A dashed arrow from the resource to the process"], ARROWS, "Allocated is solid and points from the resource to the process.", "Allocated resources are drawn solid.", undefined),
]);

const CIRCLE = "Circular wait means the processes wait for each other in a circle: each holds a resource that the next one in the circle wants. If some process in the chain is not waiting, it can finish and release its resource, so the chain clears.";
const YES = "Deadlock: the processes wait for each other in a circle";
const NO = "No deadlock: there is no circle of waiting";
const sketch = (processes: string[], resources: string[], edges: { process: string; resource: string; kind: "holds" | "requests" }[]): Figure => ({ type: "resource-graph", processes, resources, edges, caption: "Processes and resources, with who holds and who requests what." });
const circular = mcq("dl.q.circular", "Is there a circle", "dl.sketches", "dl.obj.circular", [
  row("P1 holds R1 and requests R2. P2 holds R2 and requests R1. The sketch is in the figure. What does it show?", YES, [NO], CIRCLE, "P1 waits for P2 and P2 waits for P1: a circle.", "Follow who waits for whom.", sketch(["P1", "P2"], ["R1", "R2"], [{ process: "P1", resource: "R1", kind: "holds" }, { process: "P1", resource: "R2", kind: "requests" }, { process: "P2", resource: "R2", kind: "holds" }, { process: "P2", resource: "R1", kind: "requests" }])),
  row("P1 holds R1 and requests R2, and R2 is held by nobody. P2 requests R1. The sketch is in the figure. What does it show?", NO, [YES], CIRCLE, "P1 can get R2 and finish, which frees R1 for P2: no circle.", "Is anyone waiting for a resource that nobody has?", sketch(["P1", "P2"], ["R1", "R2"], [{ process: "P1", resource: "R1", kind: "holds" }, { process: "P1", resource: "R2", kind: "requests" }, { process: "P2", resource: "R1", kind: "requests" }])),
  row("P1 holds R1 and requests R2, P2 holds R2 and requests R3, and P3 holds R3 and requests R1. The sketch is in the figure. What does it show?", YES, [NO], CIRCLE, "P1 waits for P2, P2 for P3 and P3 for P1: a circle.", "Follow the waiting from P1 and see where you end up.", sketch(["P1", "P2", "P3"], ["R1", "R2", "R3"], [{ process: "P1", resource: "R1", kind: "holds" }, { process: "P1", resource: "R2", kind: "requests" }, { process: "P2", resource: "R2", kind: "holds" }, { process: "P2", resource: "R3", kind: "requests" }, { process: "P3", resource: "R3", kind: "holds" }, { process: "P3", resource: "R1", kind: "requests" }])),
  row("P1 holds R1 and requests R2, P2 holds R2 and requests nothing, and P3 requests R1. The sketch is in the figure. What does it show?", NO, [YES], CIRCLE, "P2 is not waiting, so it finishes and releases R2: no circle.", "Does anyone in the chain stop waiting?", sketch(["P1", "P2", "P3"], ["R1", "R2"], [{ process: "P1", resource: "R1", kind: "holds" }, { process: "P1", resource: "R2", kind: "requests" }, { process: "P2", resource: "R2", kind: "holds" }, { process: "P3", resource: "R1", kind: "requests" }])),
]);

/* ---------- the four conditions ---------- */

const CONDITIONS = "Deadlock needs all four conditions at the same time. Mutual exclusion: only one process may use a dedicated resource. Hold and wait: a process holds a resource while waiting for another. No preemption: a resource is not taken back until the process releases it. Circular wait: the processes wait for each other in a circle. Removing any one of them prevents deadlock.";
const CONDITION_NAMES = ["Mutual exclusion", "Hold and wait", "No preemption", "Circular wait"];
const conditions = mcq("dl.q.conditions", "Name the condition", "dl.conditions", "dl.obj.conditions", [
  row("Only one process may use a dedicated resource at a time. Which condition is this?", "Mutual exclusion", others(CONDITION_NAMES, "Mutual exclusion"), CONDITIONS, "One user per dedicated resource is mutual exclusion.", "The word is about excluding other users."),
  row("A process holds at least one resource while it waits for another. Which condition is this?", "Hold and wait", others(CONDITION_NAMES, "Hold and wait"), CONDITIONS, "Holding one resource while waiting for another is hold and wait.", "The name describes both things the process is doing."),
  row("The OS cannot take a resource back from a process until the process releases it. Which condition is this?", "No preemption", others(CONDITION_NAMES, "No preemption"), CONDITIONS, "A resource that cannot be taken back is no preemption.", "Preemption means forcing a process to stop."),
  row("P1 waits for P2, and P2 waits for P1. Which condition is this?", "Circular wait", others(CONDITION_NAMES, "Circular wait"), CONDITIONS, "Waiting for each other in a circle is circular wait.", "Look at the shape of the waiting."),
]);

const allFour = mcq("dl.q.all-four", "All four needed", "dl.conditions", "dl.obj.all-four", [
  row("A system has mutual exclusion, hold and wait and circular wait, but resources can be taken back from a process. Can deadlock happen?", "No: one condition is missing", ["Yes: three of the four are enough", "Yes: but only with three processes"], CONDITIONS, "All four are needed, and no preemption is missing, so no deadlock.", "How many of the four does deadlock need?"),
  row("All four conditions are present at the same time. What can follow?", "Deadlock", ["No deadlock", "Starvation of one job only"], CONDITIONS, "All four at once is a deadlock.", "How many of the four does deadlock need?"),
  row("What is enough to prevent a deadlock?", "Removing any one of the four conditions", ["Removing all four conditions", "Removing only mutual exclusion"], CONDITIONS, "Removing any one condition prevents deadlock.", "Deadlock needs all four together."),
  row("No process holds a resource while waiting for another, but the other three conditions are present. Can deadlock happen?", "No: hold and wait is missing", ["Yes: three of the four are enough", "Yes: but only with a printer"], CONDITIONS, "Without hold and wait there is no deadlock.", "One of the four is absent."),
]);

/* ---------- recovery, starvation ---------- */

const RECOVERY = "Once a deadlock is detected it is untangled by terminating every active job and restarting all of them, or terminating only the deadlocked jobs and asking users to resubmit them, or terminating the deadlocked jobs one at a time until the deadlock clears. A faster CPU is not a recovery method.";
const recovery = mcq("rc.q.recovery", "Recovery methods", "rc.recovery", "rc.obj.recovery", [
  row("Which is a way to recover from a deadlock?", "Terminate only the deadlocked jobs and ask users to resubmit them", ["Increase the CPU clock speed", "Start more jobs to share the resources"], RECOVERY, "Ending just the deadlocked jobs and asking for resubmission is a recovery method.", "A faster CPU does not release held resources."),
  row("Which is a way to recover from a deadlock?", "Terminate the deadlocked jobs one at a time until the deadlock clears", ["Give every job a longer quantum", "Rename the files in the deadlock"], RECOVERY, "Ending deadlocked jobs one at a time until it clears is a recovery method.", "Recovery means breaking the circle of waiting."),
  row("Which recovery method ends every active job and starts them all again?", "Terminate every active job and restart all", ["Terminate only the deadlocked jobs", "Terminate the deadlocked jobs one at a time"], RECOVERY, "Ending every active job and restarting all is the first method.", "This is the one that touches every job."),
  row("Which recovery method asks users to resubmit the jobs that were ended?", "Terminate only the deadlocked jobs", ["Terminate every active job and restart all", "Terminate the deadlocked jobs one at a time"], RECOVERY, "Only the deadlocked jobs end, and their users resubmit them.", "Only some of the jobs are ended."),
]);

const STARVATION = "Starvation is indefinite, not a short normal delay. Priority scheduling can starve low-priority jobs. It is avoided by aging (tracking how long each job waits) and by blocking new jobs until the starving ones are served.";
const starvation = mcq("st.q.starvation", "Starvation facts", "st.starvation", "st.obj.starvation", [
  row("A job waits a short, normal time and then runs. Is this starvation?", "No: starvation is a delay without end", ["Yes: any waiting is starvation", "Yes: but only under priority scheduling"], STARVATION, "Starvation is indefinite, not a short normal delay.", "How long does the job wait in starvation?"),
  row("Which Chapter 4 scheduling policy can starve low-priority jobs?", "Priority scheduling", ["First Come First Served", "Round Robin"], STARVATION, "Low-priority jobs can wait without end under priority scheduling.", "Starvation needs jobs that are always overtaken."),
  row("What is aging?", "Tracking how long each job has waited", ["Terminating the oldest job", "Giving every job the same quantum"], STARVATION, "Aging tracks how long each job waits, so the long-waiting job can be served.", "The word tells you what is measured."),
  row("Which method holds back new jobs until the starving jobs are served?", "Blocking new jobs", ["Aging", "Spooling"], STARVATION, "Blocking new jobs lets the starving ones be served first.", "Aging tracks time; this one holds jobs back."),
]);

/* ---------- topics ---------- */

export const deadlockBasicsTopic: TopicInput = {
  id: "deadlock-basics",
  title: "Deadlock, starvation and races",
  summary: "What a deadlock is, how it differs from starvation and from a race, and the cases of deadlock the course names.",
  concepts: [{ id: "dl.basics", title: "Deadlock, starvation, races and the cases", summary: "Jobs waiting on each other; one job postponed forever; unlocked updates where the last writer wins." }],
  objectives: [
    { id: "dl.obj.deadlock-starvation", conceptId: "dl.basics", text: "Tell a deadlock from starvation." },
    { id: "dl.obj.cases", conceptId: "dl.basics", text: "Name the case of deadlock a scenario shows." },
    { id: "dl.obj.race", conceptId: "dl.basics", text: "Tell a deadlock from a race, and say what locking does." },
  ],
  activities: [
    { id: "deadlock-or-starvation", title: "Deadlock or starvation", summary: "Which problem is which.", authority: "DEMO", minutes: 5, questions: [deadlockStarvation] },
    { id: "cases", title: "The cases of deadlock", summary: "Files, records, devices.", authority: "DEMO", minutes: 6, questions: [cases] },
    { id: "races", title: "Deadlock or a race", summary: "Locked in a circle, or no locking at all.", authority: "DEMO", minutes: 5, questions: [race] },
  ],
};

export const deadlockSketchesTopic: TopicInput = {
  id: "deadlock-sketches",
  title: "Reading a resource sketch",
  summary: "The solid and dashed arrows of a resource sketch, and how to see a circle of waiting.",
  concepts: [{ id: "dl.sketches", title: "Allocated, requested, circular", summary: "Solid arrow resource → process: allocated; dashed arrow process → resource: requested; a circle of waiting is a deadlock." }],
  objectives: [
    { id: "dl.obj.arrows", conceptId: "dl.sketches", text: "Say what a solid and a dashed arrow show." },
    { id: "dl.obj.circular", conceptId: "dl.sketches", text: "Say whether a sketch has a circle of waiting." },
  ],
  activities: [
    { id: "arrows", title: "Solid or dashed", summary: "Allocated and requested.", authority: "DEMO", minutes: 6, questions: [arrows] },
    { id: "circle", title: "Is there a circle", summary: "Follow who waits for whom.", authority: "DEMO", minutes: 8, questions: [circular] },
  ],
};

export const fourConditionsTopic: TopicInput = {
  id: "four-conditions",
  title: "The four conditions",
  summary: "Mutual exclusion, hold and wait, no preemption and circular wait: all four are needed for a deadlock.",
  concepts: [{ id: "dl.conditions", title: "The four conditions", summary: "All four at once make a deadlock; removing any one prevents it." }],
  objectives: [
    { id: "dl.obj.conditions", conceptId: "dl.conditions", text: "Name the condition a statement describes." },
    { id: "dl.obj.all-four", conceptId: "dl.conditions", text: "Say whether a deadlock can happen when a condition is missing." },
  ],
  activities: [
    { id: "name-the-condition", title: "Name the condition", summary: "Which of the four.", authority: "DEMO", minutes: 5, questions: [conditions] },
    { id: "all-four", title: "All four needed", summary: "Present or missing, deadlock or not.", authority: "DEMO", minutes: 6, questions: [allFour] },
  ],
};

export const recoveryStarvationTopic: TopicInput = {
  id: "recovery-starvation",
  title: "Recovery and starvation",
  summary: "How a deadlock is untangled, and what starvation is and how it is avoided.",
  concepts: [
    { id: "rc.recovery", title: "Recovery methods", summary: "Terminate all and restart, terminate only the deadlocked jobs, or terminate them one at a time." },
    { id: "st.starvation", title: "Starvation and aging", summary: "A delay without end; avoided by aging and by blocking new jobs." },
  ],
  objectives: [
    { id: "rc.obj.recovery", conceptId: "rc.recovery", text: "Name the recovery methods and tell them apart." },
    { id: "st.obj.starvation", conceptId: "st.starvation", text: "Say what starvation is and how it is avoided." },
  ],
  activities: [
    { id: "recovery", title: "Recovery methods", summary: "The three ways to untangle a deadlock.", authority: "DEMO", minutes: 6, questions: [recovery] },
    { id: "starvation", title: "Starvation", summary: "What it is and how to avoid it.", authority: "DEMO", minutes: 6, questions: [starvation] },
  ],
};
