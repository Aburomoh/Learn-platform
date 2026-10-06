# Content pack — CPET 181 Chapter 6: Concurrent processes (#527)

Source: Ch6 deck (pptx, 24 slides; Tier-1, not in the repo). References are slides (`Ch6 s.N`).
Restated, never quoted. The expression schedules below were re-derived from operator precedence
(`**` before `*` `/` before `+`) and the longest dependency chain. Taught week 11 (`weeks.md`);
assessed in Assessment R.

**Scope:** multiprocessing configurations, synchronization vocabulary, producer/consumer and
readers/writers at the level of rules, concurrent evaluation of an expression. Semaphores are **named
only** (two per problem); no P/V or wait/signal operations, test-and-set, or code.

## Deck-wide conventions
| Item | As taught |
|---|---|
| Expression notation | `*` multiply, `/` divide, `**` power, temporaries T1, T2, … |
| Step tables | Sequential: Step No., Operation, Result (s.22). Concurrent: Step No., Processor, Operation, Result (s.23) |
| Context slides | s.1 title; s.7, s.10, s.13 configuration diagrams; s.18 buffer states figure |

## 1. Parallel processing — s.2–4 — CORE
Two or more CPUs execute instructions at the same time; the Processor Manager coordinates and
synchronizes them. Why: throughput, computing power. Benefits: reliability (others take over if one
fails), faster processing. Levels: a CPU per job; per working set; individual instructions split.
Challenges: connecting the processors; orchestrating them (synchronization is key).

## 2. Multiprocessing configurations — s.5–13 — CORE (AR T/F 2, MCQ 5)
| | Master/slave (s.6–8) | Loosely coupled (s.9–10) | Symmetric (s.11–13) |
|---|---|---|---|
| Idea | Asymmetric: one master runs the OS, schedules, manages storage; slaves do work | Several complete computers, each with its own OS and resources | All processors of the same type, equal |
| Scheduling | Centralised in the master | Global tables say which processor has each job; a job stays on its processor | **Decentralised** |
| Plus | Simple | One failure does not stop the others | Most reliable, best resource use, balances load, degrades gracefully |
| Minus | Reliability no better than one CPU; poor resource use; more interrupts | A failed processor is hard to detect | Hardest to implement; needs tight synchronization (races, deadlocks); a job may move between processors |

## 3. Synchronization — s.12, s.14–15 — CORE
Race condition (s.12): several processors use the same resource at the same time. Successful
synchronization (s.14): lock the resource in use, release it, then let the waiting process in. Mistakes
cause starvation or deadlock (AR MCQ 4). Critical region (s.15): part of a program that must finish
without interleaving; others wait to use its resources.

## 4. Process cooperation — s.16–20 — CORE
Several processes on one task need mutual exclusion and synchronization; both classic cases use two
semaphores.

| Problem | Rules as taught |
|---|---|
| Producers and consumers (s.17–18) | Producer fills a buffer, consumer empties it (CPU and printer buffer). Delay the producer when the buffer is full, the consumer when it is empty. Two semaphores: number of full positions, number of empty positions. Buffer states: full, partly empty, empty |
| Readers and writers (s.19–20) | Shared file or database (airline reservations). Readers may all read if no writer is active (W1 = 0); a writer may write only if no reader (R1 = 0) and no writer (W1 = 0) |

Readers/writers case table (s.20):

| Process 1 | Process 2 | Allowed? |
|---|---|---|
| Writing | Reading | No |
| Reading | Reading | **Yes** |
| Reading | Writing | No |
| Writing | Writing | No |

AR T/F 5 links this to races: a race needs at least one writer; readers only cannot race.

## 5. Concurrent programming — s.21–24 — CORE + WORKED + PRACTICE
Sequential: one instruction at a time. Concurrent: several in parallel (one job, several processors).

**s.22–23** A = 3 * B * C + 4 / (D + E) ** (F − G)

| Mode | Steps | Order | Verified |
|---|---|---|---|
| Sequential (s.22) | 7 | F−G → T1; D+E → T2; T2**T1 → T1; 4/T1 → T2; 3*B → T1; T1*C → T1; T1+T2 → A | 7 operators ✓ |
| Concurrent (s.23) | 4 | Step 1 (3 processors): 3*B → T1, D+E → T2, F−G → T3. Step 2: T1*C → T4, T2**T3 → T5. Step 3: 4/T5 → T1. Step 4: T4+T1 → A | Longest chain F−G → ** → / → + = 4 ✓ |

**s.24** exercise (no answer on the slide): A = 3 * B + (C + 4) / (D + E) ** (F − G)

| Mode | Verified answer |
|---|---|
| Sequential | 7 steps (3*B, C+4, D+E, F−G, **, /, +) |
| Concurrent | 4 steps with 4 processors: (1) 3*B, C+4, D+E, F−G; (2) (D+E)**(F−G); (3) (C+4)/that; (4) 3*B + that |

Method rule: an operation may run in a step only when both its operands are ready; precedence fixes
which operations exist. Steps = length of the longest chain; processors = widest step.

## Ambiguities
| Where | Note |
|---|---|
| s.23 | Re-uses T1 for the quotient in step 3 after T1 (3*B) was consumed in step 2; temporaries may be reused once free |
| s.16–19 | Semaphore counts are named but never operated on; keep exercises at the rule level |
