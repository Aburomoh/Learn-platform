# Content pack — CPET 181 Chapter 5: Process management — deadlock and starvation (#527)

Source: Ch5 deck (pptx, 22 slides; Tier-1, not in the repo). References are slides (`Ch5 s.N`).
Restated, never quoted. No numeric content. Taught weeks 6–7, **before** Ch4 (`weeks.md`); assessed in
Quiz 2 (week 12).

**Scope:** deadlock cases, the four conditions, recovery, starvation. Not taught: Banker's algorithm,
safe/unsafe states, avoidance or prevention strategies, detection algorithms, formal
resource-allocation-graph reading.

## Deck-wide conventions
| Item | As taught |
|---|---|
| Names | Processes P1, P2, P3; resources R1–R3, files F1–F2, records R1–R2 |
| Graphs (s.7, s.13) | Circle = process, box = resource; solid arrow resource → process = **allocated**; dashed arrow process → resource = **requested** |
| Sketches (s.16–19) | Rounded box = resource, circle = process; arrows labelled "holds", "requests", "assigned to", "waiting for" |
| Condition names | Mutual exclusion, hold and wait, no preemption, circular wait (upper case on s.15) |
| Context slides | s.1 title; s.4 story (spoon and fork); s.5 traffic-jam picture |

## 1. Process management; deadlock vs starvation — s.2–3 — CORE
Process management allocates resources to running processes and monitors them; done badly it leads to
deadlocks and crashes. Deadlock: system-wide tangle that starts when two or more jobs are put on hold,
each waiting for a resource another holds. Starvation: a job postponed indefinitely.

## 2. Seven cases of deadlock — s.6–14 — CORE
| Case | Pattern on the slide |
|---|---|
| File requests (s.7) | P1 holds F1 and wants F2; P2 holds F2 and wants F1; lasts until a program is withdrawn; others needing F1/F2 also wait |
| Databases (s.8) | P1 locks R1, P2 locks R2, each then asks for the other's record |
| Race (s.9–10) | Without locking, two processes update one record: P1 changes the GPA (2.5 → 3.0), P2 the address; whichever writes last wins, so one update is lost (final record GPA 2.5, Main St.) |
| Dedicated device (s.11) | Two tape drives; P1 gets drive 1, P2 drive 2, each blocked asking for the other |
| Multiple devices (s.12–13) | P1 tape drive, P2 printer, P3 plotter; each then asks for the next one in the circle and blocks |
| Spooling (s.14) | Defines the virtual device and spooling only |
| Disk sharing, network (s.6) | Named only |

Locking (s.9): one user locks the others out while working; races occur when locking is not used and
the final data depend on execution order.

## 3. The four conditions — s.15–19 — CORE
Deadlock needs **all four at once**; removing any one prevents it (s.15 grid: one column all ✔ =
deadlock; four columns each with a single ✘ = no deadlock).

| Condition | Meaning | Sketch |
|---|---|---|
| Mutual exclusion (s.16) | Only one process may use a dedicated resource | R1 assigned to P1; P2 cannot use it |
| Hold and wait (s.17) | A process holds at least one resource while waiting for another | P1 holds R1, R2 and waits for R3, held by P2 |
| No preemption (s.18) | A resource is not taken back until the process releases it (preemption = forced stop) | OS cannot take R1 from P1 |
| Circular wait (s.19) | Processes wait for each other in a circle | P1 holds R1 wants R2; P2 holds R2 wants R1 |

Drill shape: given a scenario or a ✔/✘ column, decide deadlock or not; name the condition a statement
describes (Q2A MCQ 4 hold and wait; Q2B MCQ 4 mutual exclusion).

## 4. Recovery — s.20 — CORE
Once detected, untangle quickly by one of: terminate every active job and restart all; terminate only
the deadlocked jobs and ask users to resubmit; terminate deadlocked jobs one at a time until it clears.
(Q2 MCQ 5 distractor: "increase CPU clock speed" is not a method.)

## 5. Starvation — s.21–22 — CORE
A job never runs because the resources it needs never become free to it. Example: the dining table
(each diner needs the fork on both sides). Avoid by **aging** (track how long each job waits) and by
blocking new jobs until starving ones are served. Quiz 2 T/F: starvation is indefinite, not a short
normal delay; priority scheduling can starve low-priority jobs (links to Ch4).

## High-value comparisons and definitions (#588)
Inventory for match/distinguish activities (#586): every contrast, definition set or list of
distinguishing characteristics in the deck, in our own words. CORE = students are expected to know it;
CONTEXT = shown, not expected.

| ID | Ref | Concepts compared | Distinguishing attributes | Level |
|---|---|---|---|---|
| C5-1 | s.3, s.21 | Deadlock vs starvation | System-wide tangle: two or more held jobs each wait for a resource another holds vs one job postponed indefinitely while others proceed | CORE |
| C5-2 | s.6–14 | The seven deadlock cases | Files (each holds one file, wants the other); database records (each locks one record, asks for the other); one type of dedicated device (two tape drives); multiple devices (a circle of tape drive, printer, plotter); spooling; disk sharing and network (named only) | CORE |
| C5-3 | s.8–10 | Deadlock vs race | Locking held in a circle blocks everyone vs no locking, so the last writer wins and an update is lost | CORE |
| C5-4 | s.7, s.13 | Allocated vs requested edge | Solid arrow resource → process vs dashed arrow process → resource | CORE |
| C5-5 | s.15–19 | Mutual exclusion vs hold and wait vs no preemption vs circular wait | One user per dedicated resource; holding one while waiting for another; resource not taken back until released; processes waiting in a circle. All four needed, removing one prevents deadlock (quizzed MCQ) | CORE |
| C5-6 | s.20 | The three recovery methods | Kill all active jobs and restart vs kill only the deadlocked jobs and ask for resubmission vs kill deadlocked jobs one at a time until it clears (faster CPU is not one) | CORE |
| C5-7 | s.22 | Aging vs blocking new jobs | Track how long each job waits vs hold back new jobs until the starving job is served | CORE |

## Ambiguities
| Where | Note |
|---|---|
| s.6 vs s.7–14 | Seven cases are listed; five are illustrated and spooling only by definition |
| s.15 | The grid has no row labels for the columns; read as "column = one scenario" |
