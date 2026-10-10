# Content pack — CPET 181 Chapter 4: Processor management (#527)

Source: Ch4 deck (pptx, 36 slides; Tier-1, not in the repo). References are slides (`Ch4 s.N`).
Restated, never quoted. Every schedule below was re-simulated independently (FCFS, SJN, SRT,
non-preemptive priority, RR with the queue rule in the conventions); finish, turnaround and averages
all re-derived. Taught weeks 9–10 (`weeks.md`), after Ch5.

## Deck-wide conventions
| Item | As taught |
|---|---|
| Table | Columns **Job, Arrival, CPU, Finish time, Turn Around Time**; priority example replaces Arrival with Priority (s.27) |
| Turnaround | TAT = finish − arrival, written per row as `14-0=14` (s.13) |
| Average | `(sum of TATs) / n = x ms`, two decimals (16.67, 7.33); unit ms throughout |
| Gantt chart | One row of boxes "Job X", often with the run length "(3ms)"; boundary times written under the box edges, starting at 0 |
| Job names | A, B, C…; table order is also the tie order for equal arrivals |
| Waiting time | Named as a criterion (s.12) but never computed in the deck or quizzes; given below as **derived** (TAT − CPU) only |
| Idle CPU | Never occurs in the examples (a job is always ready) |
| Context slides | s.1 title; s.15, s.19, s.23 four/five-step summary cards per algorithm |

## Tie-breaking and queue rules (evidence)
| Algorithm | Rule | Evidence |
|---|---|---|
| FCFS | Equal arrivals run in table order | s.17 vs s.18: same jobs reordered give 16.67 vs 7.33 |
| SJN | Non-preemptive; at each completion pick the shortest CPU among arrived jobs | s.21, s.22; no tie occurs in deck or quizzes |
| SJN tie | Not shown; follow the priority rule (earlier arrival, then table order) | inferred from s.26 |
| SRT | Preemptive; re-decide at every arrival and completion by remaining time | s.24, s.25 |
| SRT tie | Equal remaining time → earlier arrival runs first | s.36 at t = 11: A (rem 3, arr 0) before E (rem 3, arr 8) |
| SRT new arrival = running remaining | Not shown in any source | — |
| Priority | Non-preemptive; **smaller number runs first**; equal priority → FCFS | s.27: B(3), D(5), C(6), E(6), A(9); C before E; s.26 states the FCFS rule. Number direction is shown only by the example |
| RR quantum | A job with less than a quantum left runs only its remainder | s.31 C (3 ms), s.33 |
| RR arrival at a quantum boundary | A job arriving at the same instant a quantum expires joins the queue **ahead of** the preempted job | s.31 t = 4: C before A; s.32 t = 6: D before B |
| RR equal arrivals | Table order | ARA/ARB Q4: A then B, both at 0 |
| RR large quantum | Quantum ≥ every CPU time → same schedule as FCFS | s.29, s.33 (q = 7); Q2 MCQ 1 |

## 1. Program (job) vs process — s.2 — CORE
Job/program: unit of work submitted by a user, inactive (e.g. a file on disk). Process/task: active
entity needing resources (processor, registers). Assessed: Q2A T/F 1, Q2B T/F 1.

## 2. Processor in single-user vs multiprogramming systems — s.3 — CONTEXT
Single user: busy only while the user's job runs. Multiprogramming: must be shared fairly and efficiently
→ needs a scheduling policy and algorithm.

## 3. Interrupt and context switch — s.4 — CORE
Interrupt: hardware signal that suspends the program and starts the interrupt handler. Context switch:
saving the interrupted job's processing information in its PCB. Assessed: Q2 T/F 3, AR T/F 3.

## 4. Job Scheduler vs Process Scheduler; I/O-bound vs CPU-bound — s.5–6 — CORE
| Item | Meaning |
|---|---|
| Job Scheduler | Starts jobs by set criteria; puts them in READY |
| Process Scheduler | Gives the CPU to processes in READY (Q2 MCQ 2) |
| I/O-bound | Many short CPU cycles, long I/O (printing a series of documents) |
| CPU-bound | Long CPU cycles, short I/O (finding the first 300 primes) |

## 5. Job and process states — s.7–8 — CORE
States: HOLD, READY, RUNNING, WAITING, FINISHED.

| From → to | Trigger | Controlled by |
|---|---|---|
| HOLD → READY | Admitted | Job Scheduler |
| READY → RUNNING | Dispatched | Processor (process) scheduler |
| RUNNING → READY | Interrupt issued | Processor scheduler |
| RUNNING → WAITING | I/O request or page fault | Processor scheduler |
| WAITING → READY | Signal to continue | Processor scheduler |
| RUNNING → FINISHED | Completes | Job Scheduler |

## 6. Process Control Block — s.9–10 — CORE (Q2 MCQ 3)
| Part | Holds |
|---|---|
| Process identification | Unique id |
| Process status | Current job state (HOLD, READY, RUNNING, WAITING) |
| Process state | Status word, register contents, main-memory info, resources, priority |
| Accounting | Billing and performance data: CPU time, total time, memory occupancy, I/O operations, records read |

## 7. Policy limits and criteria — s.11–12 — CORE
Limits the OS must handle: finite resources; some resources unshareable once given (printers); some need
an operator (CD-ROM R/W). Criteria: maximise throughput; minimise response time; minimise turnaround;
minimise waiting time; maximise CPU efficiency; fairness for all jobs.

## 8. Turnaround time — s.13 — CORE
Time from submission to completion; TAT = finish − arrival.

## 9. The six algorithms — s.14 — CORE
| Algorithm | Preemptive? | Suits (as taught) |
|---|---|---|
| FCFS (s.15) | No; FIFO queue | Batch |
| SJN (s.19) | No; CPU time must be known | Batch, not interactive |
| SRT (s.23) | Yes | Batch, not interactive |
| Priority (s.26) | No | Admin- or OS-assigned priorities |
| Round Robin (s.28) | Yes; time quantum 100 ms – 2 s | Interactive |
| Multiple-level queues (s.34) | Combines schemes | Grouped jobs (CPU-bound vs I/O-bound, batch vs interactive) |

## 10. FCFS — s.15–18 — WORKED (see owner note for s.18)
| Slide | Jobs (arrival, CPU) | Gantt | Finish | TAT | Avg TAT | Wait (derived) |
|---|---|---|---|---|---|---|
| s.17 | A(0,15) B(0,2) C(0,1) | A 0–15, B –17, C –18 | 15, 17, 18 | 15, 17, 18 | **16.67** ✓ | 0, 15, 17 (10.67) |
| s.18 | C(0,1) B(0,2) A(0,15) | C 0–1, B –3, A –18 | 1, 3, 18 | 1, 3, 18 | **7.33** ✓ | 0, 1, 3 (1.33) |

Point of the pair: order alone changes the average (long job first hurts everyone; s.16).

## 11. SJN — s.19–22 — WORKED
| Slide | Jobs (arrival, CPU) | Gantt | Finish A,B,C,D | TAT | Avg | Wait (derived) |
|---|---|---|---|---|---|---|
| s.20 | A(0,5) B(0,2) C(0,6) D(0,4) | B 0–2, D –6, A –11, C –17 | 11, 2, 17, 6 | 11, 2, 17, 6 | **9** ✓ | 6, 0, 11, 2 (4.75) |
| s.21 | A(0,6) B(1,3) C(2,1) D(3,4) | A 0–6, C –7, B –10, D –14 | 6, 10, 7, 14 | 6, 9, 5, 11 | **7.75** ✓ | 0, 6, 4, 7 (4.25) |
| s.22 | A(0,2) B(1,4) C(2,1) D(4,2) | A 0–2, C –3, B –7, D –9 | 2, 7, 3, 9 | 2, 6, 1, 5 | **3.5** ✓ | 0, 2, 0, 3 (1.25) |

## 12. SRT — s.23–25 — WORKED
| Slide | Jobs (arrival, CPU) | Gantt | Finish A,B,C,D | TAT | Avg | Wait (derived) |
|---|---|---|---|---|---|---|
| s.24 | A(0,6) B(1,3) C(2,1) D(3,4) | A 0–1, B –2, C –3, B –5, D –9, A –14 | 14, 5, 3, 9 | 14, 4, 1, 6 | **6.25** ✓ | 8, 1, 0, 2 (2.75) |
| s.25 | A(0,2) B(1,4) C(2,1) D(4,2) | A 0–2, C –3, B –4, D –6, B –9 | 2, 9, 3, 6 | 2, 8, 1, 2 | **3.25** ✓ | 0, 4, 0, 0 (1) |

s.25 shows the non-obvious step: at t = 1 B (4) does not preempt A (1 left); at t = 4 D (2) preempts
B (3 left).

## 13. Priority (non-preemptive) — s.26–27 — WORKED
| Slide | Jobs (priority, CPU), all at 0 | Gantt | Finish A–E | TAT | Avg | Wait (derived) |
|---|---|---|---|---|---|---|
| s.27 | A(9,5) B(3,2) C(6,4) D(5,4) E(6,3) | B 0–2, D –6, C –10, E –13, A –18 | 18, 2, 10, 6, 13 | same | **9.8** ✓ | 13, 0, 6, 2, 10 (6.2) |

## 14. Round Robin — s.28–33 — WORKED
Quantum trade-off (s.29): too large → becomes FCFS; too small → many context switches, overhead.

| Slide | q | Jobs (arrival, CPU) | Gantt | Finish | TAT | Avg | Wait (derived) |
|---|---|---|---|---|---|---|---|
| s.30 | 4 | A(0,8) B(1,4) C(2,9) D(3,5) | A 0–4, B –8, C –12, D –16, A –20, C –24, D –25, C –26 | 20, 8, 26, 25 | 20, 7, 24, 22 | **18.25** ✓ | 12, 3, 15, 17 (11.75) |
| s.31 | 4 | A(0,7) B(2,4) C(4,3) D(6,5) | A 0–4, B –8, C –11, A –14, D –18, D –19 | 14, 8, 11, 19 | 14, 6, 7, 13 | **10** ✓ | 7, 2, 4, 8 (5.25) |
| s.32 | 3 | same jobs | A 0–3, B –6, A –9, C –12, D –15, B –16, A –17, D –19 | 17, 16, 12, 19 | 17, 14, 8, 13 | **13** ✓ | 10, 10, 5, 8 (8.25) |
| s.33 | 7 | same jobs | A 0–7, B –11, C –14, D –19 | 7, 11, 14, 19 | 7, 9, 10, 13 | **9.75** ✓ | 0, 5, 7, 8 (5) |

s.31–33 reuse one job set with q = 4, 3, 7: a ready-made "change the quantum" comparison. s.31 draws D's
last two slices as separate boxes (D 14–18, D 18–19) because D is alone in the queue.

## 15. Multiple-level queues — s.34 — CONTEXT
Separate queues per priority or job type (CPU-bound vs I/O-bound; batch background vs interactive
foreground), each with its own policy. The slide mentions four methods but lists none; no example.

## 16. Exercises — s.35–36 — PRACTICE (answers on the slides; see owner note for s.36)
| Slide | Task | Jobs (arrival, CPU) | Gantt | Finish | TAT | Avg (verified) | Wait (derived) |
|---|---|---|---|---|---|---|---|
| s.35 | RR q = 3 | A(0,3) B(2,5) C(3,3) D(4,4) E(5,2) | A 0–3, B –6, C –9, D –12, E –14, B –16, D –17 | 3, 16, 9, 17, 14 | 3, 14, 6, 13, 9 | **9** | 0, 9, 3, 9, 7 (5.6) |
| s.36 | SRT | A(0,6) B(3,2) C(5,2) D(7,2) E(8,3) F(9,2) | A 0–3, B –5, C –7, D –9, F –11, A –14, E –17 | 14, 5, 7, 9, 17, 11 | 14, 2, 2, 2, 9, 2 | **31/6 = 5.17** | 8, 0, 0, 0, 6, 0 (2.33) |

Each exercise asks for start and finish times, each TAT, and the average.

## Assessed patterns (details and verified keys in `quiz-patterns.md`)
Q2 Q3: SJN table, 5 jobs. Q2 Q4: RR q = 4, 5 jobs (see owner note for version A). AR Q4: RR q = 5, two
jobs arriving together at 0. T/F and MCQ items: job vs process, context switch, RR fixed slice, priority
starvation, RR large quantum → FCFS, Process Scheduler, PCB, SRT preemptive, SJN non-preemptive.

## High-value comparisons and definitions (#588)
Inventory for match/distinguish activities (#586): every contrast, definition set or list of
distinguishing characteristics in the deck, in our own words. CORE = students are expected to know it;
CONTEXT = shown, not expected.

| ID | Ref | Concepts compared | Distinguishing attributes | Level |
|---|---|---|---|---|
| C4-1 | s.2 | Program (job) vs process (task) | Inactive submitted unit, e.g. a file on disk vs active entity using CPU and registers (quizzed T/F) | CORE |
| C4-2 | s.3 | Processor in single-user vs multiprogramming systems | Busy only during the user's job vs shared, needing a policy and an algorithm | CONTEXT |
| C4-3 | s.4 | Interrupt vs context switch | Hardware signal that suspends the program and starts the handler vs saving the job's state in its PCB (quizzed T/F) | CORE |
| C4-4 | s.5 | Job Scheduler vs Process Scheduler | Admits jobs to READY by criteria vs gives the CPU to READY processes (quizzed MCQ) | CORE |
| C4-5 | s.6 | I/O-bound vs CPU-bound | Many short CPU bursts, long I/O (printing documents) vs long CPU bursts, short I/O (computing primes) | CORE |
| C4-6 | s.7–8 | HOLD, READY, RUNNING, WAITING, FINISHED | Each transition and its trigger; HOLD→READY and RUNNING→FINISHED by the Job Scheduler, the rest by the Process Scheduler | CORE |
| C4-7 | s.9–10 | PCB parts: identification, status, state, accounting | Unique id vs current job state vs register, memory, resource and priority detail vs billing and performance data (quizzed MCQ) | CORE |
| C4-8 | s.12 | Criteria to maximise vs minimise | Throughput, CPU efficiency (maximise) vs response, turnaround, waiting time (minimise); plus fairness | CORE |
| C4-9 | s.14–34 | Preemptive vs non-preemptive algorithms | SRT and RR preempt; FCFS, SJN and Priority run each job to the end | CORE |
| C4-10 | s.15–34 | FCFS vs SJN vs SRT vs Priority vs RR vs multiple-level queues | Arrival order; shortest CPU time; shortest remaining time, re-decided on arrivals; smallest priority number; fixed quantum in turn; separate queues per job group | CORE |
| C4-11 | s.19, s.23 | SJN vs SRT | Same shortest-first idea; SJN decides only at completions vs SRT also at every arrival | CORE |
| C4-12 | s.16 | FCFS advantage vs disadvantage | Simple vs short jobs stuck behind a long one (s.17 vs s.18) | CORE |
| C4-13 | s.29 | RR quantum too large vs too small | Turns into FCFS vs heavy context-switch overhead | CORE |

## Ambiguities
| Where | Note |
|---|---|
| s.26–27 | Priority direction (low number = high priority) is shown only by the example |
| s.18, s.36 | See owner note |
| s.34 | "Four primary methods" of multiple-level queues are not listed |
