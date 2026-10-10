# CPET 181 quiz and question patterns (#527)

Source: Quiz 1 Fall 2025 (versions A/B, keys), Quiz 2 (A/B, keys), Assessment R Fall 2025 (A/B, keys);
Tier-1, not in the repo. References: `Q1A Q2` = Quiz 1 version A question 2; `Q2B`, `ARA` likewise.
Items are restated by topic, never quoted. Every key below was re-checked against the decks and every
numeric answer re-computed (same simulator and allocation rules as the chapter packs). Midterm and
final exams are not in the source base.

## Format
| Assessment | Week (Fall 2025) | Questions (points) | Chapters |
|---|---|---|---|
| Quiz 1 | 5 | Q1 RAM vs ROM table (20); Q2 first-fit + best-fit + "which is better, why" (50); Q3 compaction and relocation (30) | Ch1, Ch2 |
| Quiz 2 | 12 | Q1 five T/F (20); Q2 five MCQ (20); Q3 SJN table (30); Q4 RR table (30) | Ch4, Ch5 |
| Assessment R | not stated | Q1 five T/F (20); Q2 five MCQ (20); Q3 HDD/SSD and CD-type matrices (30); Q4 RR table (30) | Ch4, Ch6, Ch7 |

Versions A and B keep the question shapes and change the numbers, the polarity of T/F statements and the
order of MCQ options.

## Question archetypes (for interaction design)
| Archetype | Used in | Student fills |
|---|---|---|
| Two-column comparison table | Q1 Q1 (RAM/ROM: stands for, definition, use, volatility) | Short text per cell |
| Feature matrix with two choices per cell | AR Q3 (HDD vs SSD: moving parts, power, noise, capacity, rewrite lifetime) | Pick one of two per cell |
| Capability matrix | AR Q3 (CD-ROM/CD-R/CD-RW × read/write/rewrite) | Yes/No per cell |
| True/False statement table | Q2 Q1, AR Q1 | T/F per row |
| MCQ set (4 options) | Q2 Q2, AR Q2 | One option each |
| Block allocation table + waiting list + justification | Q1 Q2 | Job per block, waiting jobs, then a reason |
| Before/after compaction memory map | Q1 Q3 | Boundary addresses after compaction; old start, new start, relocation register for two jobs |
| Scheduling table (+ Gantt in keys) | Q2 Q3–Q4, AR Q4 | Finish and TAT per job, then the average |

## Quiz 1 — verified
**Q1** (both versions): RAM = Random Access Memory, read/write, volatile; ROM = Read-Only Memory, holds
boot instructions, read only, non-volatile (Ch1 s.8).

**Q2** jobs in order into four blocks (one job per block, Ch2 conventions):

| Version | Blocks (K, top→bottom) | Jobs (K) | First-fit | Best-fit | Verified |
|---|---|---|---|---|---|
| A | 25, 50, 10, 30 | J1 30, J2 15, J3 45, J4 10 | 25 J2, 50 J1, 10 J4, 30 empty; **J3 waits** | 25 J2, 50 J3, 10 J4, 30 J1; none waits | ✓ key |
| B | 10, 30, 50, 35 | J1 20, J2 25, J3 10, J4 40 | 10 J3, 30 J1, 50 J2, 35 empty; **J4 waits** | 10 J3, 30 J1, 50 J4, 35 J2; none waits | ✓ key |

Expected justification: best-fit, because every job is placed and less memory is wasted inside blocks.

**Q3** relocatable dynamic partitions:

| Version | Before (K) | After compaction | Relocation register (verified) | Key |
|---|---|---|---|---|
| A | OS 0–10, J1 10–30, free 30–35, J4 35–50, free 50–60, J2 60–95 | J4 30–45, J2 45–80 | J4 −5 K (−5120 B); J2 −15 K (−15360 B) | 5K, 15K (see owner note) |
| B | OS 0–10, J1 10–25, free 25–35, J4 35–60, free 60–65, J2 65–100 | J4 25–50, J2 50–85 | J4 −10 K (−10240 B); J2 −15 K (−15360 B) | 10K, 15K (see owner note) |

## Quiz 2 — verified
**Q1 T/F** (A / B): job is the active entity (F) / process is inactive on disk (F); starvation = short
normal delay (F) / indefinite wait (T); context switch on RUNNING → FINISHED (F) / on interruption (T);
RR gives each process a fixed slice (T) / FCFS serves first arrivals first (T); priority can starve
low-priority jobs (T) / can starve high-priority jobs (F). All keys agree with Ch4 s.2, s.4, s.15, s.28
and Ch5 s.3, s.21.

**Q2 MCQ** (both versions): RR with a huge quantum → FCFS; READY → CPU decided by the Process Scheduler;
state/status/memory/accounting record → PCB; deadlock condition named (A: hold and wait; B: mutual
exclusion); not a recovery method → increase CPU clock speed. ✓

**Q3 SJN** and **Q4 RR (q = 4)**:

| Item | Jobs (arrival, CPU) | Gantt (verified) | Finish | TAT | Avg | Key |
|---|---|---|---|---|---|---|
| A Q3 SJN | A(0,4) B(1,2) C(2,6) D(3,1) E(5,3) | A 0–4, D –5, B –7, E –10, C –16 | 4, 7, 16, 5, 10 | 4, 6, 14, 2, 5 | **6.2** | ✓ |
| B Q3 SJN | A(0,3) B(1,3) C(2,1) D(3,6) E(5,2) | A 0–3, C –4, B –7, E –9, D –15 | 3, 7, 4, 15, 9 | 3, 6, 2, 12, 4 | **5.4** | ✓ |
| A Q4 RR | A(0,7) B(2,4) C(4,5) D(6,3) E(7,10) | A 0–4, B –8, C –12, A –15, D –18, E –22, C –23, E –27, E –29 | 15, 8, 23, 18, 29 | 15, 6, 19, 12, 22 | **14.8** | see owner note |
| B Q4 RR | A(0,6) B(2,7) C(4,3) D(6,5) E(7,9) | A 0–4, B –8, C –11, A –13, D –17, E –21, B –24, D –25, E –29, E –30 | 13, 24, 11, 25, 30 | 13, 22, 7, 19, 23 | **16.8** | ✓ |

Both RR items hinge on the Ch4 queue rule: C arrives at t = 4 exactly when A's quantum ends and goes
ahead of A; A (re-queued at 4) is ahead of D (6) and E (7).

## Assessment R — verified
**Q1 T/F** (A / B): shared devices need no conflict control (F) / dedicated devices are shared at once
(F); SMP processors differ, central scheduling (F) / same type, decentralised (T); context switch = CPU
moves from one process to another (T, both); SRT is non-preemptive (F) / SJN is preemptive (F); race
needs at least one writer (T) / readers only can race (F). ✓ (Ch7 s.4–5; Ch6 s.11–12, s.20; Ch4 s.4,
s.19, s.23.)

**Q2 MCQ** (both versions, options reordered): sequential access → magnetic tape; spooling → share slow
devices efficiently; dedicated-device drawback → not fully used during a job; missing synchronization →
deadlock or starvation; all processors equal → symmetric. ✓

**Q3**: HDD/SSD and CD-type answers equal Ch7 s.28 and s.25 (HDD: moving parts, high power, noisy,
higher capacity, longer rewrite life; CD-R writes once). ✓

**Q4 RR (q = 5)**, A and B both arrive at 0 (table order):

| Version | Jobs (arrival, CPU) | Gantt (verified) | Finish | TAT | Avg | Key |
|---|---|---|---|---|---|---|
| A | A(0,10) B(0,8) C(4,5) D(8,3) E(12,8) | A 0–5, B –10, C –15, A –20, D –23, B –26, E –31, E –34 | 20, 26, 15, 23, 34 | 20, 26, 11, 15, 22 | **18.8** | ✓ |
| B | A(0,8) B(0,9) C(4,5) D(8,7) E(12,3) | A 0–5, B –10, C –15, A –18, D –23, B –27, E –30, D –32 | 18, 27, 15, 32, 30 | 18, 27, 11, 24, 18 | **19.6** | ✓ |

## Observations for content
- Numeric items always ask for finish, TAT and the average; never waiting time, response time or a Gantt
  chart by itself (keys add the Gantt as working).
- Five jobs, averages with at most one decimal, quantum 4 or 5, all CPU times ≤ 10.
- Allocation items always have four jobs and four blocks and are designed so first-fit leaves one job
  waiting.
- No assessment touches Ch3, Ch8 or Ch9 in the source base.
