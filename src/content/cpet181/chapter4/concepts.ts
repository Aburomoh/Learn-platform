/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * CPET 181 Chapter 4, concepts and comparisons (#587, content pack ch4 §1–§9, §14 and the #588
 * inventory C4-1 … C4-13): program vs process, interrupt vs context switch, the two schedulers,
 * I/O-bound vs CPU-bound, the five states and who controls each transition, the PCB, the policy
 * criteria, preemptive vs non-preemptive, SJN vs SRT, FCFS advantages, and the quantum. Multiple
 * choice only; every fact is from docs/content-packs/cpet181/ch4.md and no quiz key is used.
 */
import type { z } from "zod";
import type { TopicSchema } from "../../schema";
import { mcq, type Row } from "../chapter1/mcq";

type TopicInput = z.input<typeof TopicSchema>;

const row = (prompt: string, correct: string, wrong: string[], rule: string, apply: string, hint: string): Row => ({ prompt, correct, wrong, rule, apply, hint });

/* ---------- processes, interrupts, schedulers ---------- */

const PROGRAM = "A job (program) is the unit of work a user submits, inactive until it runs, like a file on disk. A process (task) is the active entity that needs resources such as the processor and registers.";
const programVsProcess = mcq("sc.q.program", "Job or process", "sc.process", "sc.obj.process", [
  row("Which is a job (program): inactive, a file on disk waiting to run?", "The submitted program", ["The running entity that holds the processor", "The interrupt handler"], PROGRAM, "An inactive submitted unit is a job (program).", "Ask which of the two is active and using the processor and registers."),
  row("Which is a process (task): the active entity that needs the processor and registers?", "The running entity", ["The file on disk", "The submitted job waiting in HOLD"], PROGRAM, "The active entity that needs resources is the process.", "A file on disk does nothing until it runs."),
  row("A student saves a program on disk and has not run it. What is it?", "A job (program)", ["A process", "An interrupt"], PROGRAM, "Not running, so it is inactive: a job (program).", "Is anything using the processor?"),
]);

const INTERRUPT = "An interrupt is a hardware signal that suspends the running program and starts the interrupt handler. A context switch saves the interrupted job's processing information in its Process Control Block.";
const interruptVsSwitch = mcq("sc.q.interrupt", "Interrupt or switch", "sc.process", "sc.obj.interrupt", [
  row("Which is a hardware signal that suspends the running program and starts the handler?", "An interrupt", ["A context switch", "A process control block"], INTERRUPT, "The hardware signal is the interrupt.", "One is a signal; the other is the saving of state."),
  row("Which means saving the interrupted job's processing information in its PCB?", "A context switch", ["An interrupt", "A job scheduler"], INTERRUPT, "Saving the state in the PCB is the context switch.", "Where does the job's state go so it can resume later?"),
  row("The processor is interrupted and the running job's registers are stored in its PCB. What is the storing called?", "A context switch", ["An interrupt", "Compaction"], INTERRUPT, "The storing of the interrupted job's state is the context switch.", "The signal came first; this step is what the OS then does."),
]);

const SCHEDULERS = "The Job Scheduler starts jobs by set criteria and puts them in READY. The Process Scheduler gives the CPU to the processes in READY.";
const schedulers = mcq("sc.q.schedulers", "Which scheduler", "sc.process", "sc.obj.schedulers", [
  row("Which scheduler admits jobs to READY by set criteria?", "The Job Scheduler", ["The Process Scheduler"], SCHEDULERS, "Admitting jobs to READY is the Job Scheduler.", "Does it choose which job enters, or which ready process runs?"),
  row("Which scheduler gives the CPU to a process that is in READY?", "The Process Scheduler", ["The Job Scheduler"], SCHEDULERS, "Giving the CPU to READY processes is the Process Scheduler.", "Only one of the two ever hands out the CPU."),
  row("Which scheduler moves a job from HOLD to READY?", "The Job Scheduler", ["The Process Scheduler"], SCHEDULERS, "HOLD to READY is the Job Scheduler.", "HOLD is before the job is admitted."),
]);

const BOUND = "An I/O-bound job has many short CPU cycles and long I/O, like printing a series of documents. A CPU-bound job has long CPU cycles and short I/O, like finding the first 300 primes.";
const bound = mcq("sc.q.bound", "I/O or CPU bound", "sc.process", "sc.obj.bound", [
  row("Printing a series of documents has many short CPU cycles and long waits for I/O. Which kind of job is it?", "I/O-bound", ["CPU-bound"], BOUND, "Short CPU bursts with long I/O is I/O-bound.", "Which is longer, the CPU part or the I/O part?"),
  row("Finding the first 300 primes has long CPU cycles and little I/O. Which kind of job is it?", "CPU-bound", ["I/O-bound"], BOUND, "Long CPU cycles with short I/O is CPU-bound.", "Which is longer, the CPU part or the I/O part?"),
  row("Which kind of job has many short CPU cycles and long I/O?", "I/O-bound", ["CPU-bound"], BOUND, "Many short CPU cycles and long I/O is I/O-bound.", "The name says what the job spends its time on."),
]);

/* ---------- states, transitions and the PCB ---------- */

const STATES = "The states are HOLD, READY, RUNNING, WAITING and FINISHED. HOLD → READY is the Job Scheduler; READY → RUNNING, RUNNING → READY, RUNNING → WAITING and WAITING → READY are the Process Scheduler; RUNNING → FINISHED is the Job Scheduler.";
const transitions = mcq("sc.q.states", "State changes", "sc.states", "sc.obj.states", [
  row("A process is READY and is given the CPU. Which state change is this?", "READY → RUNNING", ["HOLD → READY", "RUNNING → WAITING", "RUNNING → FINISHED"], STATES, "Being given the CPU is READY → RUNNING (dispatched).", "Which state is the process in after it gets the CPU?"),
  row("A running process asks for I/O. Which state change is this?", "RUNNING → WAITING", ["RUNNING → READY", "WAITING → READY", "READY → RUNNING"], STATES, "An I/O request moves a running process to WAITING.", "It cannot continue until the I/O is done."),
  row("An interrupt is issued while a process runs, and the process goes back to the ready queue. Which change is this?", "RUNNING → READY", ["RUNNING → WAITING", "READY → RUNNING", "HOLD → READY"], STATES, "An interrupt returns the running process to READY.", "It did not ask for anything: it was interrupted."),
  row("Which transition is controlled by the Job Scheduler?", "HOLD → READY", ["READY → RUNNING", "RUNNING → WAITING", "WAITING → READY"], STATES, "HOLD → READY (and RUNNING → FINISHED) belong to the Job Scheduler.", "The Job Scheduler handles entering and leaving the system."),
]);

const PCB = "The PCB holds the process identification (a unique id), the process status (its current job state), the process state (status word, register contents, main-memory information, resources, priority) and accounting (CPU time, total time, memory occupancy, I/O operations, records read).";
const pcb = mcq("sc.q.pcb", "Parts of the PCB", "sc.states", "sc.obj.pcb", [
  row("Which part of the PCB holds a unique id for the process?", "Process identification", ["Process status", "Accounting"], PCB, "The unique id is the process identification.", "One part only names the process."),
  row("Which part of the PCB holds the current job state: HOLD, READY, RUNNING or WAITING?", "Process status", ["Process identification", "Accounting"], PCB, "The current job state is the process status.", "It is the part that changes as the process moves between states."),
  row("Which part of the PCB holds billing and performance data such as CPU time and I/O operations?", "Accounting", ["Process state", "Process identification"], PCB, "Billing and performance data are the accounting part.", "Think of what a bill would be based on."),
  row("Which part of the PCB holds the register contents, memory information, resources and priority?", "Process state", ["Process status", "Accounting"], PCB, "Registers, memory, resources and priority are the process state.", "It is the detail needed to resume the process."),
]);

/* ---------- criteria and algorithms ---------- */

const CRITERIA = "A policy aims to maximise throughput and CPU efficiency, and to minimise response time, turnaround time and waiting time, while being fair to all jobs.";
const criteria = mcq("sc.q.criteria", "Maximise or minimise", "sc.policy", "sc.obj.criteria", [
  row("Which criterion should a scheduling policy maximise?", "Throughput", ["Response time", "Turnaround time", "Waiting time"], CRITERIA, "Throughput is maximised; response, turnaround and waiting time are minimised.", "Three of the four are times a user does not want to be long."),
  row("Which criterion should a scheduling policy minimise?", "Turnaround time", ["Throughput", "CPU efficiency"], CRITERIA, "Turnaround time is minimised.", "A shorter time from submission to completion is better."),
  row("Which criterion should a scheduling policy maximise?", "CPU efficiency", ["Waiting time", "Response time"], CRITERIA, "CPU efficiency is maximised.", "A busy CPU is a good thing."),
]);

const PREEMPT = "Shortest Remaining Time and Round Robin are preemptive: a running job can be taken off the CPU. First Come First Served, Shortest Job Next and Priority are non-preemptive: each job runs to the end.";
const preemption = mcq("sc.q.preemptive", "Preemptive or not", "sc.policy", "sc.obj.preemptive", [
  row("Which of these algorithms is preemptive?", "Shortest Remaining Time", ["First Come First Served", "Shortest Job Next", "Priority"], PREEMPT, "Shortest Remaining Time is preemptive.", "One of them re-decides when a shorter job arrives."),
  row("Which of these algorithms is NOT preemptive?", "Shortest Job Next", ["Round Robin", "Shortest Remaining Time"], PREEMPT, "Shortest Job Next runs each job to the end.", "Two of the three can take the CPU away from a running job."),
  row("Which algorithm preempts a running job when its time quantum runs out?", "Round Robin", ["First Come First Served", "Priority"], PREEMPT, "Round Robin preempts at the end of each quantum.", "Only one of these has a time slice."),
]);

const SJN_SRT = "Shortest Job Next and Shortest Remaining Time both favour short jobs. SJN decides only when a job finishes; SRT also decides again at every arrival, so a shorter arrival preempts.";
const sjnSrt = mcq("sc.q.sjn-srt", "SJN or SRT", "sc.policy", "sc.obj.sjn-srt", [
  row("Which algorithm decides again every time a new job arrives?", "Shortest Remaining Time", ["Shortest Job Next"], SJN_SRT, "SRT re-decides at every arrival.", "One of them waits for the running job to finish."),
  row("Which algorithm decides only when the running job finishes?", "Shortest Job Next", ["Shortest Remaining Time"], SJN_SRT, "SJN decides only at completions.", "Which one never interrupts?"),
  row("A job with 1 ms left arrives while a job with 5 ms left runs. Which algorithm lets it take the CPU?", "Shortest Remaining Time", ["Shortest Job Next", "First Come First Served"], SJN_SRT, "SRT preempts for a shorter remaining time.", "Only one of these is preemptive and shortest-first."),
]);

const FCFS = "First Come First Served is simple, but a long job at the front makes every later job wait: the same jobs reordered change the average turnaround (16.67 against 7.33 in the deck's example).";
const fcfs = mcq("sc.q.fcfs", "FCFS in practice", "sc.policy", "sc.obj.fcfs", [
  row("What is the advantage of First Come First Served?", "It is simple: jobs run in arrival order", ["It gives the shortest average turnaround", "It never makes a job wait"], FCFS, "Its strength is simplicity.", "It is the easiest rule to state."),
  row("What is the disadvantage of First Come First Served?", "Short jobs get stuck behind a long one", ["It cannot run a job to the end", "It needs the CPU time known in advance"], FCFS, "A long job in front delays all the others.", "Think about one long job arriving first."),
  row("The same three jobs run in a different arrival order and the average turnaround changes a lot. Which algorithm shows this?", "First Come First Served", ["Shortest Job Next", "Priority"], FCFS, "Under FCFS the order alone changes the average.", "Only this algorithm is decided by order alone."),
]);

const QUANTUM = "In Round Robin a quantum that is too large (at least every job's CPU time) turns the algorithm into First Come First Served; one that is too small causes many context switches and heavy overhead.";
const quantum = mcq("sc.q.quantum", "Too large or too small", "sc.policy", "sc.obj.quantum", [
  row("A Round Robin quantum is longer than every job's CPU time. What does the schedule become?", "First Come First Served", ["Shortest Job Next", "Priority"], QUANTUM, "A very large quantum makes Round Robin behave as FCFS.", "No job is ever cut off."),
  row("A Round Robin quantum is very small. What is the main cost?", "Many context switches, so heavy overhead", ["Jobs run to the end", "Short jobs wait behind long ones"], QUANTUM, "A tiny quantum means constant switching.", "Each cut-off costs a context switch."),
  row("Which algorithm suits interactive systems, with a quantum of roughly 100 ms to 2 s?", "Round Robin", ["Shortest Job Next", "First Come First Served"], QUANTUM, "Round Robin shares the CPU in turn, which suits interactive use.", "Only one of these has a time slice."),
]);

export const schedulingConceptsTopic: TopicInput = {
  id: "scheduling-concepts",
  title: "Processes, schedulers and policies",
  summary: "Jobs and processes, interrupts, the two schedulers, the five states, the PCB, the policy criteria, and what tells the scheduling algorithms apart.",
  concepts: [
    { id: "sc.process", title: "Jobs, processes and schedulers", summary: "A job is inactive, a process is active; an interrupt starts a context switch; the Job Scheduler admits, the Process Scheduler dispatches." },
    { id: "sc.states", title: "States and the PCB", summary: "HOLD, READY, RUNNING, WAITING, FINISHED, and the Process Control Block that records them." },
    { id: "sc.policy", title: "Policy criteria and algorithms", summary: "Maximise throughput and CPU efficiency; minimise response, turnaround and waiting time; preemptive against non-preemptive." },
  ],
  objectives: [
    { id: "sc.obj.process", conceptId: "sc.process", text: "Tell a job (program) from a process." },
    { id: "sc.obj.interrupt", conceptId: "sc.process", text: "Tell an interrupt from a context switch." },
    { id: "sc.obj.schedulers", conceptId: "sc.process", text: "Tell the Job Scheduler from the Process Scheduler." },
    { id: "sc.obj.bound", conceptId: "sc.process", text: "Tell an I/O-bound job from a CPU-bound job." },
    { id: "sc.obj.states", conceptId: "sc.states", text: "Name the state change in a situation, and which scheduler controls it." },
    { id: "sc.obj.pcb", conceptId: "sc.states", text: "Say which part of the PCB holds a given item." },
    { id: "sc.obj.criteria", conceptId: "sc.policy", text: "Say which criteria a policy maximises and which it minimises." },
    { id: "sc.obj.preemptive", conceptId: "sc.policy", text: "Tell the preemptive algorithms from the non-preemptive ones." },
    { id: "sc.obj.sjn-srt", conceptId: "sc.policy", text: "Tell Shortest Job Next from Shortest Remaining Time." },
    { id: "sc.obj.fcfs", conceptId: "sc.policy", text: "Give the advantage and disadvantage of First Come First Served." },
    { id: "sc.obj.quantum", conceptId: "sc.policy", text: "Say what a too-large and a too-small Round Robin quantum do." },
  ],
  activities: [
    {
      id: "processes-and-schedulers",
      title: "Processes and schedulers",
      summary: "Job or process, interrupt or context switch, which scheduler, I/O-bound or CPU-bound.",
      authority: "DEMO",
      minutes: 10,
      questions: [programVsProcess, interruptVsSwitch, schedulers, bound],
    },
    {
      id: "states-and-pcb",
      title: "States and the PCB",
      summary: "Name the state change and the part of the PCB.",
      authority: "DEMO",
      minutes: 8,
      questions: [transitions, pcb],
    },
    {
      id: "policies",
      title: "Criteria and algorithms",
      summary: "What a policy maximises and minimises, and what tells the algorithms apart.",
      authority: "DEMO",
      minutes: 10,
      questions: [criteria, preemption, sjnSrt, fcfs, quantum],
    },
  ],
};
