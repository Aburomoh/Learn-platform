# CPET 181 content packs — index (#527)

Course: CPET 181 Computer Operating Systems Basics (textbook: McHoes & Flynn, *Understanding Operating
Systems*, 8th ed.). Packs restate the instructor's material in our own words and point to it by
reference; the sources themselves are private and never enter the repository.

## Sources (Tier-1, private, not in the repo)
| Source | Reference form | Notes |
|---|---|---|
| Nine chapter decks (pptx): Ch1 36, Ch2 37, Ch3 25, Ch4 36, Ch5 22, Ch6 24, Ch7 28, Ch8 15, Ch9 25 slides | `Ch4 s.24` | Read rendered and by shape position (tables, Gantt rows, memory maps) |
| Quiz 1 Fall 2025, versions A/B + keys | `Q1A Q2` | Ch1, Ch2 |
| Quiz 2, versions A/B + keys | `Q2B Q4` | Ch4, Ch5 |
| Assessment R, versions A/B + keys | `ARA Q4` | Ch4, Ch6, Ch7 |
| Syllabus Fall 2025 (2025-2026) — **authoritative** for scope, order, weeks | `Syl-F25 p.N` | No Fall 2026 syllabus exists |
| Syllabus Spring 2025 — secondary | `Syl-S25 p.N` | Differences in `weeks.md` |

The knowledge-base txt files are a derived summary of the same decks and quizzes; every row in these
packs was checked against the decks and quiz documents themselves.

## Classes
CORE = taught concept students must use; WORKED = slide example with a full answer; CONTEXT =
background, definitions only, no procedure; PRACTICE = exercise slide or quiz item. Conservative when
unclear. "see owner note" = a source point the Lead has received privately.

## Packs
| Chapter | Pack | Taught in (Fall 2025) | Batch |
|---|---|---|---|
| Syllabus and week map | `weeks.md` | — | A |
| 1 Introduction to OS | `ch1.md` | weeks 1–2 | A |
| 2 Memory management: simple systems | `ch2.md` | weeks 2–3 | B |
| 3 Memory management: virtual systems | `ch3.md` | week 4 | B |
| 4 Processor management | `ch4.md` | weeks 9–10 | A |
| 5 Process management (deadlock, starvation) | `ch5.md` | weeks 6–7 | C |
| 6 Concurrent processes | `ch6.md` | week 11 | C |
| 7 Device management | `ch7.md` | weeks 12–13 | C |
| 8 File management | `ch8.md` | week 5 | D |
| 9 Network organization and security | `ch9.md` | week 16 | D |
| Quiz and question patterns | `quiz-patterns.md` | Quiz 1 week 5, Quiz 2 week 12 | D |

Teaching order is **not** chapter order: 1, 2, 3, 8, 5, (midterm), 4, 6, 7, 9 (`weeks.md`).

## Scope check: commonly expected OS topics
| Topic | Taught? | Where / what instead |
|---|---|---|
| Page replacement (FIFO, LRU, OPT), page faults counted | **No** | Ch3 teaches paging and segmentation address translation only; "page fault" appears only as a state-transition label (Ch4 s.8) and thrashing only as a word (Ch3 s.20) |
| Banker's algorithm, safe/unsafe states, avoidance | **No** | Ch5 teaches the four conditions, seven deadlock cases, recovery methods and starvation |
| Resource-allocation graphs (formal) | **No** | Ch5 s.16–19 use small hold/request sketches per condition; no graph notation or cycle detection exercise |
| Disk-seek scheduling (FCFS/SSTF/SCAN/LOOK) | **No** | Ch7 covers device types and storage media only |
| RAID | **No** | Not mentioned |
| File allocation methods (contiguous/linked/indexed) | **No** | Ch8 teaches record organization (sequential, direct, indexed sequential), compression, FAT vs NTFS |
| Semaphores | **Name only** | Ch6 s.16–19 say producer/consumer and readers/writers are implemented with two semaphores; no P/V or wait/signal operations |
| Waiting time (scheduling) | **Criterion only** | Ch4 s.12 names it; no slide or quiz computes it (packs give it as derived, TAT − CPU) |
| DOS/Linux commands, OS installation, troubleshooting labs | Lab only | Syllabus outcomes 3–6, 12–13; lab material is not in the source base |

## Computed procedures (need checked, deterministic answers)
| Procedure | Pack row | Source examples |
|---|---|---|
| CPU scheduling table + Gantt (FCFS, SJN, SRT, Priority, RR) → finish, TAT, average | ch4 §10–16 | Ch4 s.17–36; Q2 Q3–Q4; AR Q4 |
| First-fit / best-fit job-to-block allocation, waiting jobs, leftover fragments | ch2 | Ch2 s.12, s.19–22; Q1 Q2 |
| Deallocation in a dynamic free list (join two, join three, isolated) | ch2 | Ch2 s.24–30 |
| Compaction: new start addresses and relocation register | ch2 | Ch2 s.33–37; Q1 Q3 |
| Page number and displacement; physical address from PMT | ch3 | Ch3 s.11–13 |
| Segment + displacement lookup in the SMT | ch3 | Ch3 s.16–17 |
| Concurrent evaluation of an arithmetic expression (step count) | ch6 | Ch6 s.22–24 |
| Repeated-character and front-end compression | ch8 | Ch8 s.10–11 |
