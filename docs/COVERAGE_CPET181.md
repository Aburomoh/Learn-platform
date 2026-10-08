# CPET181 coverage matrix (#528)

Execution checklist, updated at every merge. Packs (verified answers, conventions, slide references): `docs/content-packs/cpet181/` (#527).
Source: syllabus Fall 2025 (`CPET181/`, git-ignored) and the private knowledge base, never committed or quoted. Topic rows are seeded from the source's own topic list; the packs add slide references and the class, and may split or merge rows.

**Class:** CORE (assessed) · WORKED · CONTEXT · PRACTICE (pending pack, conservative when unclear). **Covered:** COMPLETE · PARTIAL · MISSING · N/A. A chapter is COMPLETE only after its gate passes.
Kinds: `cpu-schedule` and `memory-map` are new (spec #541). Everything else reuses the existing kinds. Truth module: #539. Course shell: #540.
Out of scope (confirmed by packs #544–#548, not taught): FIFO/LRU/OPT page replacement, Banker's algorithm and safe states, disk-seek scheduling, RAID, file-allocation methods. Resource-allocation graphs are figures only; semaphores are named only; waiting time is not assessed. Delivery order follows the syllabus: 1, 2, 3, 8, 5, (midterm), 4, 6, 7, 9 (#528).

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
| Topic | Source | Class | Covered | Interaction | Status |
|---|---|---|---|---|---|
| Deadlock and starvation definitions | pack | TBD | MISSING | — | — |
| Seven deadlock cases (files, databases, dedicated devices, multiple devices, spooling, …) | pack | TBD | MISSING | — | — |
| Four necessary conditions | pack | TBD | MISSING | — | — |
| Deadlock recovery | pack | TBD | MISSING | — | — |
| Starvation | pack | TBD | MISSING | — | — |

## C6 Concurrent processes (gate #534)
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
| Topic | Source | Class | Covered | Interaction | Status |
|---|---|---|---|---|---|
| Device classes: dedicated, shared, virtual | pack | TBD | MISSING | — | — |
| Device-management functions | pack | TBD | MISSING | — | — |
| Storage-media classification | pack | TBD | MISSING | — | — |
| Magnetic tape and blocking | pack | TBD | MISSING | — | — |
| Magnetic disk: fixed-head and movable-head | pack | TBD | MISSING | — | — |
| Hard disk: cylinder, surface, record address | pack | TBD | MISSING | — | — |
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
