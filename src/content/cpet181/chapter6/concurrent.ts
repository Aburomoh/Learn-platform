/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * CPET 181 Chapter 6, concurrent processes (#621; content pack ch6 §1–§5 and the #588 inventory
 * C6-1 … C6-7): parallel processing, the three multiprocessing configurations, synchronization,
 * producers/consumers and readers/writers at the level of rules (semaphores are named only), and
 * concurrent evaluation of an expression. The expression counts are computed from the parsed
 * expression with the op-tree figure's own schedule (#615), never typed; every other fact is from
 * docs/content-packs/cpet181/ch6.md and no quiz key is used.
 */
import type { z } from "zod";
import type { TopicSchema } from "../../schema";
import { mcq, type Row } from "../chapter1/mcq";
import { count, type Count } from "../chapter8/counting";
import { operations, parseExpression, schedule } from "@/kinds/shared/figures/opTree";

type TopicInput = z.input<typeof TopicSchema>;
type Figure = NonNullable<Row["figure"]>;

const row = (prompt: string, correct: string, wrong: string[], rule: string, apply: string, hint: string, figure?: Figure): Row => ({ prompt, correct, wrong, rule, apply, hint, ...(figure ? { figure } : {}) });
const others = (all: string[], name: string) => all.filter((x) => x !== name);

/* ---------- parallel processing and the three configurations ---------- */

const PARALLEL = "Parallel processing runs two or more instructions at the same time, coordinated and synchronized by the Processor Manager. Its benefits are reliability (the others take over if one fails) and faster processing. Its challenges are connecting the processors and orchestrating them, because synchronization is the key.";
const parallel = mcq("cf.q.parallel", "Benefit or challenge", "cf.parallel", "cf.obj.parallel", [
  row("Which is a benefit of parallel processing?", "Other processors take over if one fails", ["It needs no synchronization", "One CPU does all the work"], PARALLEL, "Reliability is a benefit: the others take over.", "A benefit is something parallel processing gives, not something it costs."),
  row("Which is a challenge of parallel processing?", "Orchestrating the processors so they stay synchronized", ["Faster processing", "More reliability"], PARALLEL, "Synchronizing the processors is the key challenge.", "A challenge is something that has to be solved."),
  row("Which is a challenge of parallel processing?", "Connecting the processors", ["More computing power", "Faster processing"], PARALLEL, "Connecting the processors is a challenge.", "Which of these is a difficulty rather than a gain?"),
  row("What does parallel processing do?", "Executes two or more instructions at the same time", ["Executes one instruction at a time", "Replaces the Processor Manager"], PARALLEL, "Two or more CPUs execute instructions at the same time.", "The name says what happens in parallel."),
]);

const CONFIG = "Master/slave: one master runs the OS, schedules centrally and manages storage; the slaves do the work. It is simple, but no more reliable than one CPU, with poor resource use and more interrupts. Loosely coupled: several complete computers, each with its own OS and resources, a job staying on its processor; one failure does not stop the others, but a failed processor is hard to detect. Symmetric: all processors of one type and equal, with decentralised scheduling; the most reliable and best at balancing load, but hardest to implement, needing tight synchronization, and a job may move between processors.";
const CONFIGS = ["Master/slave", "Loosely coupled", "Symmetric"];
const configurations = mcq("cf.q.configurations", "Which configuration", "cf.configs", "cf.obj.configurations", [
  row("One processor runs the OS, schedules the others and manages storage; the others only do work. Which configuration is this?", "Master/slave", others(CONFIGS, "Master/slave"), CONFIG, "One master running the OS and scheduling centrally is master/slave.", "How many processors make the decisions?"),
  row("Several complete computers each have their own OS and resources, and a job stays on its processor. Which configuration is this?", "Loosely coupled", others(CONFIGS, "Loosely coupled"), CONFIG, "Complete computers with their own OS are loosely coupled.", "Each processor is a whole computer."),
  row("All the processors are of the same type and equal, and scheduling is decentralised. Which configuration is this?", "Symmetric", others(CONFIGS, "Symmetric"), CONFIG, "Equal processors with decentralised scheduling are symmetric.", "No processor is in charge."),
]);
const traits = mcq("cf.q.traits", "Advantage or cost", "cf.configs", "cf.obj.traits", [
  row("Which configuration is the most reliable and balances the load, but is the hardest to implement?", "Symmetric", others(CONFIGS, "Symmetric"), CONFIG, "Most reliable and best balanced, hardest to build: symmetric.", "It needs the tightest synchronization."),
  row("In which configuration does one failure not stop the others, but a failed processor is hard to detect?", "Loosely coupled", others(CONFIGS, "Loosely coupled"), CONFIG, "Independent computers survive each other's failures but are hard to monitor.", "Each processor is a complete computer."),
  row("In which configuration is scheduling centralised in one processor, making it simple but no more reliable than one CPU?", "Master/slave", others(CONFIGS, "Master/slave"), CONFIG, "Central scheduling in one master is master/slave.", "What happens if the master fails?"),
  row("In which configuration may a job move between processors, and does synchronization have to be tight to avoid races and deadlocks?", "Symmetric", others(CONFIGS, "Symmetric"), CONFIG, "A job moving between equal processors needs tight synchronization.", "The processors are all equal, so a job can go to any of them."),
]);

/* ---------- synchronization, cooperation ---------- */

const SYNC = "A race condition is several processors using the same resource at the same time. Successful synchronization locks the resource in use, releases it, then lets the waiting process in. A critical region is a part of a program that must finish without interleaving while the others wait to use its resources. Poor synchronization leads to starvation or deadlock.";
const SYNC_NAMES = ["A race condition", "Successful synchronization", "A critical region"];
const synchronization = mcq("sy.q.synchronization", "Race or lock", "sy.sync", "sy.obj.synchronization", [
  row("Several processors use the same resource at the same time. What is this?", "A race condition", others(SYNC_NAMES, "A race condition"), SYNC, "Simultaneous use of one resource is a race condition.", "Is anything locked?"),
  row("A resource in use is locked, then released, and then the waiting process is let in. What is this?", "Successful synchronization", others(SYNC_NAMES, "Successful synchronization"), SYNC, "Lock, use, release, then admit the next is successful synchronization.", "Something is orderly here: who goes first?"),
  row("A part of a program must finish without interleaving, and the other processes wait to use its resources. What is this?", "A critical region", others(SYNC_NAMES, "A critical region"), SYNC, "A part that must finish uninterrupted is a critical region.", "It is a section of the program."),
  row("Poor synchronization can lead to two failures. Which pair?", "Starvation and deadlock", ["Aging and spooling", "Locking and releasing"], SYNC, "Bad synchronization leads to starvation or deadlock.", "Chapter 5 named them."),
]);

const COOP = "Producers and consumers: a producer fills a buffer and a consumer empties it; the producer is delayed when the buffer is full and the consumer when it is empty. Readers and writers: a shared file or database where many readers may read when no writer is active, and a writer may write only when no reader and no writer is active.";
const PROBLEMS = ["Producers and consumers", "Readers and writers"];
const cooperation = mcq("sy.q.cooperation", "Which problem", "sy.coop", "sy.obj.cooperation", [
  row("A producer fills a buffer and a consumer empties it. Which classic problem is this?", "Producers and consumers", others(PROBLEMS, "Producers and consumers"), COOP, "Filling and emptying a buffer is producers and consumers.", "What is shared: a buffer or a file?"),
  row("Many processes may read a shared file at once, but a writer needs it alone. Which classic problem is this?", "Readers and writers", others(PROBLEMS, "Readers and writers"), COOP, "Readers sharing a file with a writer who needs it alone is readers and writers.", "What is shared: a buffer or a file?"),
  row("In producers and consumers, who is delayed when the buffer is full?", "The producer", ["The consumer", "Both of them"], COOP, "A full buffer delays the producer.", "Who needs a free position?"),
  row("In producers and consumers, who is delayed when the buffer is empty?", "The consumer", ["The producer", "Both of them"], COOP, "An empty buffer delays the consumer.", "Who needs something to take out?"),
]);

const BUFFER_STATES = ["Full", "Partly empty", "Empty"];
const FIGURE_CAPTION = "The producer, the buffer and the consumer.";
const bufferState = (slots: number, filled: number): Figure => ({ type: "buffer", slots, filled, producer: "Producer", consumer: "Consumer", caption: FIGURE_CAPTION });
const BUFFER = "A buffer is full when every position holds data, empty when none does, and partly empty in between. The producer waits when it is full and the consumer waits when it is empty.";
const bufferStates = mcq("sy.q.buffer", "State of the buffer", "sy.coop", "sy.obj.buffer", [
  row("In the figure, the buffer between a producer and a consumer has every position holding data. What state is it in?", "Full", others(BUFFER_STATES, "Full"), BUFFER, "Every position holding data is a full buffer.", "How many positions are free?", bufferState(6, 6)),
  row("In the figure, the buffer between a producer and a consumer has some positions holding data and some free. What state is it in?", "Partly empty", others(BUFFER_STATES, "Partly empty"), BUFFER, "Some positions used and some free is partly empty.", "Is it all one or all the other?", bufferState(6, 2)),
  row("In the figure, the buffer between a producer and a consumer has no position holding data. What state is it in?", "Empty", others(BUFFER_STATES, "Empty"), BUFFER, "No position holding data is an empty buffer.", "How many positions hold data?", bufferState(6, 0)),
]);

const RW = "Readers may all read when no writer is active; a writer may write only when no reader and no writer is active. So only reading with reading is allowed; any pair with a writer is not. A race needs at least one writer: readers alone cannot race.";
const ALLOWED = ["Yes", "No"];
const readersWriters = mcq("sy.q.rw", "Allowed or not", "sy.coop", "sy.obj.rw", [
  row("One process is reading a shared file and another process reads it at the same time. Is this allowed?", "Yes", others(ALLOWED, "Yes"), RW, "Two readers can share the file: allowed.", "Does anyone change the file?"),
  row("One process is writing a shared file and another process reads it at the same time. Is this allowed?", "No", others(ALLOWED, "No"), RW, "A writer needs the file alone: not allowed.", "Does anyone change the file?"),
  row("One process is reading a shared file and another process starts writing it. Is this allowed?", "No", others(ALLOWED, "No"), RW, "A writer may write only when no reader is active: not allowed.", "Is a reader active?"),
  row("One process is writing a shared file and another process writes it at the same time. Is this allowed?", "No", others(ALLOWED, "No"), RW, "Only one writer at a time: not allowed.", "How many writers may there be?"),
]);

/* ---------- concurrent evaluation of an expression (the op-tree figure's own schedule) ---------- */

/** The first two are the slides' (s.22–23 and the s.24 exercise); the others are new. */
export const EXPRESSIONS = [
  "A = 3 * B * C + 4 / (D + E) ** (F − G)",
  "A = 3 * B + (C + 4) / (D + E) ** (F − G)",
  "A = (B + C) * (D − E) / F",
  "A = B * C + D * E + F * G",
];
export const facts = (expression: string) => {
  const { root } = parseExpression(expression);
  const { steps, widest } = schedule(root);
  return { operations: operations(root).length, steps: steps.length, widest, widths: steps.map((s) => s.length) };
};
const figureOf = (expression: string): Figure => ({ type: "op-tree", expression, caption: "The operations of the expression as a tree." });

const SEQ = "Evaluated sequentially, each operation takes its own step: parentheses first, then ** before * and /, then + and −.";
const sequentialSteps = count(
  "cc.q.sequential",
  "Sequential steps",
  "cc.concurrent",
  "cc.obj.sequential",
  EXPRESSIONS.map((e): Count => {
    const f = facts(e);
    return {
      prompt: `Evaluate ${e} one operation at a time, a single operation per step. How many steps does it take?`,
      answer: f.operations,
      rule: SEQ,
      apply: `The expression has ${f.operations} operations (every + − * / and **), so a sequential evaluation takes ${f.operations} steps.`,
      hint: "Count the operators: each one is a step.",
      figure: figureOf(e),
    };
  }),
);

const CONC = "Evaluated concurrently, an operation can run in a step once both its operands are ready, so independent operations share a step. The number of steps is the length of the longest chain of operations that depend on each other.";
const concurrentSteps = count(
  "cc.q.concurrent",
  "Concurrent steps",
  "cc.concurrent",
  "cc.obj.concurrent",
  EXPRESSIONS.map((e): Count => {
    const f = facts(e);
    return {
      prompt: `Evaluate ${e} with as many processors as it needs, every operation running as soon as its operands are ready. How many steps does it take?`,
      answer: f.steps,
      rule: CONC,
      apply: `The longest chain of dependent operations has ${f.steps} operations, so it takes ${f.steps} steps.`,
      hint: "Find the longest chain in which each operation needs the result of the one before.",
      figure: figureOf(e),
      wrong: [{ id: "cc.steps-as-ops", nudgeKey: "cc.steps-as-ops", value: f.operations }],
    };
  }),
);

const LEVEL = "With earliest-step scheduling an operation runs in the first step in which both of its operands are ready: operands that are inputs are ready at once, and an operation that needs another operation's result runs one step after it. The operations of one step run at the same time.";
const levelQuestion = (n: 1 | 2) =>
  count(
    `cc.q.step-${n}`,
    `Operations in step ${n}`,
    "cc.concurrent",
    "cc.obj.processors",
    EXPRESSIONS.map((e): Count => {
      const f = facts(e);
      const w = f.widths[n - 1];
      return {
        prompt: `${e}. Every operation runs in the earliest step in which both its operands are ready. How many operations run in step ${n}?`,
        answer: w,
        rule: LEVEL,
        apply:
          n === 1
            ? `Step 1 holds every operation whose two operands are inputs: ${w} of them.`
            : `Step 2 holds the operations that needed a step 1 result and nothing later: ${w} of them.`,
        hint: n === 1 ? "Which operations have two inputs as their operands, with no other operation's result needed?" : "Which operations need a result from step 1, and nothing from a later step?",
        figure: figureOf(e),
      };
    }),
  );
const step1 = levelQuestion(1);
const step2 = levelQuestion(2);

const PROCESSORS = "With earliest-step scheduling every operation runs as soon as its operands are ready. The processors needed are those of the widest step: the most operations that run in the same step.";
const processors = count(
  "cc.q.processors",
  "Processors needed",
  "cc.concurrent",
  "cc.obj.processors",
  EXPRESSIONS.map((e): Count => {
    const f = facts(e);
    return {
      prompt: `${e}. Every operation runs in the earliest step in which both its operands are ready, and the processors needed are those of the busiest step. How many processors are needed?`,
      answer: f.widest,
      rule: PROCESSORS,
      apply: `The steps hold ${f.widths.join(", ")} operations; the busiest holds ${f.widest}, so ${f.widest} processors.`,
      hint: "Schedule each operation as early as possible, then count the operations of the busiest step.",
      figure: figureOf(e),
      wrong: [{ id: "cc.processors-as-steps", nudgeKey: "cc.processors-as-steps", value: f.steps }],
    };
  }),
);

const KINDS = ["Sequential", "Concurrent"];
const KINDS_RULE = "Sequential programming runs one instruction at a time. Concurrent programming runs several in parallel on several processors for one job, so independent operations take the same step.";
const sequentialOrConcurrent = mcq("cc.q.kind", "Sequential or concurrent", "cc.concurrent", "cc.obj.kind", [
  row("An expression is evaluated one operation per step, on one processor. Which kind of programming?", "Sequential", others(KINDS, "Sequential"), KINDS_RULE, "One operation at a time is sequential.", "How many operations run in a step?"),
  row("The independent operations of an expression run in the same step on several processors. Which kind of programming?", "Concurrent", others(KINDS, "Concurrent"), KINDS_RULE, "Independent operations in parallel is concurrent.", "How many processors are used?"),
  row("Which kind of evaluation can finish the same expression in fewer steps?", "Concurrent", others(KINDS, "Concurrent"), KINDS_RULE, "Several operations per step need fewer steps.", "Which one does several operations at once?"),
]);

/* ---------- topics ---------- */

export const multiprocessingTopic: TopicInput = {
  id: "multiprocessing",
  title: "Parallel processing and configurations",
  summary: "What parallel processing gives and costs, and what tells master/slave, loosely coupled and symmetric configurations apart.",
  concepts: [
    { id: "cf.parallel", title: "Parallel processing", summary: "Reliability and speed; connecting and orchestrating the processors." },
    { id: "cf.configs", title: "Three configurations", summary: "Master/slave, loosely coupled and symmetric: who schedules, who fails, how reliable." },
  ],
  objectives: [
    { id: "cf.obj.parallel", conceptId: "cf.parallel", text: "Tell a benefit of parallel processing from a challenge." },
    { id: "cf.obj.configurations", conceptId: "cf.configs", text: "Name the configuration from how it is organised." },
    { id: "cf.obj.traits", conceptId: "cf.configs", text: "Say which configuration has a given advantage or cost." },
  ],
  activities: [
    { id: "parallel", title: "Benefit or challenge", summary: "What parallel processing gives and costs.", authority: "DEMO", minutes: 5, questions: [parallel] },
    { id: "configurations", title: "Which configuration", summary: "Master/slave, loosely coupled or symmetric.", authority: "DEMO", minutes: 6, questions: [configurations] },
    { id: "configuration-traits", title: "Advantages and costs", summary: "Which configuration has which trait.", authority: "DEMO", minutes: 6, questions: [traits] },
  ],
};

export const synchronizationTopic: TopicInput = {
  id: "synchronization",
  title: "Synchronization and cooperation",
  summary: "Races, locks and critical regions; producers and consumers; readers and writers.",
  concepts: [
    { id: "sy.sync", title: "Races, locks and critical regions", summary: "Simultaneous use of a resource, against lock-use-release, against a part that must finish uninterrupted." },
    { id: "sy.coop", title: "Cooperating processes", summary: "A buffer between producers and consumers; many readers or one writer on a shared file." },
  ],
  objectives: [
    { id: "sy.obj.synchronization", conceptId: "sy.sync", text: "Tell a race, successful synchronization and a critical region apart." },
    { id: "sy.obj.cooperation", conceptId: "sy.coop", text: "Say which classic problem a description is, and who is delayed." },
    { id: "sy.obj.buffer", conceptId: "sy.coop", text: "Say whether a buffer is full, partly empty or empty." },
    { id: "sy.obj.rw", conceptId: "sy.coop", text: "Say whether two processes may use a shared file together." },
  ],
  activities: [
    { id: "sync", title: "Race or lock", summary: "Which of the three, and what goes wrong.", authority: "DEMO", minutes: 6, questions: [synchronization] },
    { id: "classic-problems", title: "The classic problems", summary: "Producers and consumers, readers and writers.", authority: "DEMO", minutes: 6, questions: [cooperation, bufferStates] },
    { id: "readers-writers", title: "Readers and writers", summary: "Which pairs may use the file together.", authority: "DEMO", minutes: 5, questions: [readersWriters] },
  ],
};

export const concurrentProgrammingTopic: TopicInput = {
  id: "concurrent-programming",
  title: "Concurrent evaluation of an expression",
  summary: "Count the steps of an expression evaluated one operation at a time and with several processors, and the processors the earliest schedule needs.",
  concepts: [{ id: "cc.concurrent", title: "Sequential and concurrent evaluation", summary: "One operation per step, against independent operations sharing a step; the longest chain sets the steps." }],
  objectives: [
    { id: "cc.obj.kind", conceptId: "cc.concurrent", text: "Tell sequential from concurrent evaluation." },
    { id: "cc.obj.sequential", conceptId: "cc.concurrent", text: "Count the steps of a sequential evaluation." },
    { id: "cc.obj.concurrent", conceptId: "cc.concurrent", text: "Count the steps of a concurrent evaluation." },
    { id: "cc.obj.processors", conceptId: "cc.concurrent", text: "Count the operations in each step of the earliest-step schedule, then the processors it needs." },
  ],
  activities: [
    { id: "kinds", title: "Sequential or concurrent", summary: "What each kind of evaluation does.", authority: "DEMO", minutes: 4, questions: [sequentialOrConcurrent] },
    { id: "sequential-steps", title: "Sequential steps", summary: "One operation per step.", authority: "DEMO", minutes: 6, questions: [sequentialSteps] },
    { id: "concurrent-steps", title: "Concurrent steps and processors", summary: "The longest chain and the widest step.", authority: "DEMO", minutes: 10, questions: [concurrentSteps, step1, step2, processors] },
  ],
};
