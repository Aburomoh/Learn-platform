# CPET181 coverage matrix (#528)

Execution checklist, updated at every merge. Packs (verified answers, conventions, slide references): `docs/content-packs/cpet181/` (#527).
Source: syllabus Fall 2025 (`CPET181/`, git-ignored) and the private knowledge base, never committed or quoted. Topic rows are seeded from the source's own topic list; the packs add slide references and the class, and may split or merge rows.

**Class:** CORE (assessed) · WORKED · CONTEXT · PRACTICE (pending pack, conservative when unclear). **Covered:** COMPLETE · PARTIAL · MISSING · N/A. A chapter is COMPLETE only after its gate passes.
Kinds: `cpu-schedule` and `memory-map` are new (spec #541). Everything else reuses the existing kinds. Truth module: #539. Course shell: #540.
Packs on main: A #544 (index, weeks, Ch1, Ch4), B #546 (Ch2, Ch3), D #548 (Ch8, Ch9, quiz patterns). **Pack C (Ch5, Ch6, Ch7) is only on PR #547 (Changes needed, not merged):** the C5–C7 rows below are provisional and nothing is built from them until #547 merges.
Out of scope (Plan update on #528): FIFO/LRU/OPT page replacement (pack B), disk-seek scheduling, seek/rotation/transfer-time calculations and RAID (pack C, #547), Banker's algorithm and safe states (pack C, #547), file-allocation methods (pack D). Resource-allocation graphs are figures only; semaphores are named only; waiting time is not assessed.

## Delivery order and previews (#528 Plan update)
Teaching order (syllabus Fall 2025): C1, C2, C3, C8, C5, midterm, C4, C6, C7, C9.
- **UI:** shell #540 → `memory-map` (C2) → `cpu-schedule` (C4) → figures (C3 tables, C5 resource sketches, C8 organisations).
- **Content:** truth module #539 → C1 → C8 and C5 (no new kind) → C3 → C2 (after `memory-map`) → C4 (after `cpu-schedule`) → C6, C7, C9.
- **Previews:** P1 = shell + C1 + C2. P2 = pre-midterm (C1, C2, C3, C8, C5). P3 = all nine chapters after the C10 audit.

## Required acceptance gates vs deferred source checks
**Required (block merge or gate):** Reviewer verdict on every PR at its head SHA (answers recomputed once from the truth module and packs) + green CI; QA verdict for new or changed screens, kinds, behaviour and bug fixes; chapter gate #529–#537 (QA, owner A2 recomputation) before a chapter is COMPLETE; C10 audit #538 before P3; owner approval for production.
**Deferred (LOCAL SOURCE VERIFICATION NEEDED; never block a cloud PR or chapter gate):** checks that need the original slides or the private errata. Builders use the pack's stated default and keep it a named option; reviewers note the item and pass. They are resolved locally by the owner or a local specialist, and must be cleared before **P3 / production**, not before:
- inferred tie rules: SJN ties (pack A ch4), SRT arrival equal to remaining time (pack A ch4), best-fit ties (pack B ch2);
- quiz answer keys that disagree with pack values (owner errata; pack D quiz-patterns "see owner note");
- pack C ch7 storage-capacity comparison: confirming the slide's own value (s.24 owner note) is deferred, but #547 must still remove or mark as unverified the "about 15 × a CD" claim before it merges (required);
- Fall 2025 as the authoritative syllabus;
- figure fidelity to slides and Pedagogy chapter sign-off against slides (requested by the Lead per chapter; not a cloud gate).

## C1 Introduction (gate #529)
| Topic | Source | Class | Covered | Interaction | Status |
|---|---|---|---|---|---|
| Computer system fundamentals | pack | TBD | MISSING | — | — |
| Primary memory: RAM vs ROM | pack | CORE | MISSING | — | — |
| Operating systems in context | pack | TBD | MISSING | — | — |
| Applications and troubleshooting | pack | TBD | MISSING | — | — |
| Definition of an operating system | pack | TBD | MISSING | — | — |
| The five managers (memory, processor, device, file, network) | pack | TBD | MISSING | — | — |
| User interface (GUI vs command line) | pack | TBD | MISSING | — | — |
| Types of operating systems | pack | TBD | MISSING | — | — |

## C2 Memory: simple systems (gate #530)
Interaction: memory-map (new) for fit, deallocation and compaction rows.
| Topic | Source | Class | Covered | Interaction | Status |
|---|---|---|---|---|---|
| Memory allocation terms | pack | TBD | MISSING | — | — |
| Single-user contiguous scheme | pack | TBD | MISSING | — | — |
| Fixed partitions | pack | TBD | MISSING | — | — |
| Dynamic partitions | pack | TBD | MISSING | — | — |
| Internal and external fragmentation | pack | TBD | MISSING | — | — |
| First-fit and best-fit allocation | pack | TBD | MISSING | — | — |
| Deallocation, cases 1–3 (merging free blocks) | pack | TBD | MISSING | — | — |
| Relocatable dynamic partitions and compaction | pack | TBD | MISSING | — | — |

## C3 Memory: virtual systems (gate #531)
Interaction: numeric/derivation + page/segment table figure.
| Topic | Source | Class | Covered | Interaction | Status |
|---|---|---|---|---|---|
| Non-contiguous allocation | pack | TBD | MISSING | — | — |
| Paging fundamentals and page tables | pack | TBD | MISSING | — | — |
| Page number and displacement: address translation | pack | TBD | MISSING | — | — |
| Paging advantages and disadvantages | pack | TBD | MISSING | — | — |
| Segmentation fundamentals and segment tables | pack | TBD | MISSING | — | — |
| Segment addressing | pack | TBD | MISSING | — | — |
| Logical vs physical addresses | pack | TBD | MISSING | — | — |
| Virtual memory | pack | TBD | MISSING | — | — |
| Cache memory (design factors) | pack | TBD | MISSING | — | — |
| Internal vs external fragmentation (revisited) | pack | TBD | MISSING | — | — |

## C4 Processor management (gate #532)
Interaction: cpu-schedule (new) for the algorithm rows.
| Topic | Source | Class | Covered | Interaction | Status |
|---|---|---|---|---|---|
| Program, process, CPU context | pack | TBD | MISSING | — | — |
| Interrupts and context switch | pack | TBD | MISSING | — | — |
| Job vs process scheduling | pack | TBD | MISSING | — | — |
| Job and process states | pack | TBD | MISSING | — | — |
| Process control block (PCB) | pack | TBD | MISSING | — | — |
| Scheduling policy criteria (throughput, response, turnaround, wait) | pack | TBD | MISSING | — | — |
| Turnaround and average turnaround | pack | CORE | MISSING | — | — |
| FCFS | pack | TBD | MISSING | — | — |
| SJN | pack | TBD | MISSING | — | — |
| SRT | pack | TBD | MISSING | — | — |
| Priority | pack | TBD | MISSING | — | — |
| Round Robin and quantum trade-off | pack | TBD | MISSING | — | — |
| Multiple-level queues | pack | CONTEXT | MISSING | — | — |

## C5 Process management (gate #533)
Source: pack C, PR #547 (not merged). Provisional rows.
| Topic | Source | Class | Covered | Interaction | Status |
|---|---|---|---|---|---|
| Deadlock and starvation definitions | pack | TBD | MISSING | — | — |
| Seven deadlock cases (files, databases, dedicated devices, multiple devices, spooling, …) | pack | TBD | MISSING | — | — |
| Four necessary conditions | pack | TBD | MISSING | — | — |
| Deadlock recovery | pack | TBD | MISSING | — | — |
| Starvation | pack | TBD | MISSING | — | — |

## C6 Concurrent processes (gate #534)
Source: pack C, PR #547 (not merged). Provisional rows.
| Topic | Source | Class | Covered | Interaction | Status |
|---|---|---|---|---|---|
| Parallel processing and multiprocessing | pack | TBD | MISSING | — | — |
| Configurations: master/slave, loosely coupled, symmetric | pack | TBD | MISSING | — | — |
| Process synchronization software | pack | TBD | MISSING | — | — |
| Process cooperation and semaphores | pack | TBD | MISSING | — | — |
| Producers and consumers | pack | TBD | MISSING | — | — |
| Readers and writers | pack | TBD | MISSING | — | — |
| Concurrent programming and applications | pack | TBD | MISSING | — | — |

## C7 Device management (gate #535)
Source: pack C, PR #547 (not merged). Provisional rows.
| Topic | Source | Class | Covered | Interaction | Status |
|---|---|---|---|---|---|
| Device classes: dedicated, shared, virtual | pack | TBD | MISSING | — | — |
| Device-management functions | pack | TBD | MISSING | — | — |
| Storage-media classification | pack | TBD | MISSING | — | — |
| Magnetic tape and blocking | pack | TBD | MISSING | — | — |
| Magnetic disk: fixed-head and movable-head | pack | TBD | MISSING | — | — |
| Hard disk: cylinder, surface, record address (no access-time calculation) | pack C | TBD | MISSING | — | — |
| Optical disks (CD, DVD, Blu-ray) | pack | TBD | MISSING | — | — |
| Solid-state storage and flash; HDD vs SSD | pack | TBD | MISSING | — | — |

## C8 File management (gate #536)
| Topic | Source | Class | Covered | Interaction | Status |
|---|---|---|---|---|---|
| File manager responsibilities | pack | TBD | MISSING | — | — |
| Definitions hierarchy (field, record, file, database) | pack | TBD | MISSING | — | — |
| File naming | pack | TBD | MISSING | — | — |
| File organization and record types | pack | TBD | MISSING | — | — |
| Physical organization: sequential, direct, indexed sequential | pack | TBD | MISSING | — | — |
| Data compression | pack | TBD | MISSING | — | — |
| File systems: FAT, NTFS | pack | TBD | MISSING | — | — |

## C9 Networks and security (gate #537)
| Topic | Source | Class | Covered | Interaction | Status |
|---|---|---|---|---|---|
| Network basics and distributed-system terms | pack | TBD | MISSING | — | — |
| Topologies: star, ring, bus, tree, hybrid | pack | TBD | MISSING | — | — |
| Network types and interconnection; wireless LAN | pack | TBD | MISSING | — | — |
| Switching: circuit vs packet | pack | TBD | MISSING | — | — |
| Security (protection methods) | pack | TBD | MISSING | — | — |
| Ethics | pack | TBD | MISSING | — | — |

## C10 Final audit (#538)
Runs after the gates for C1–C9 pass; then the owner report (preview P3).
