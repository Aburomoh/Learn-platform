# Content pack — CPET 181 Chapter 1: Introduction to operating systems (#527)

Source: Ch1 deck (pptx, 36 slides; Tier-1, not in the repo). References are slides (`Ch1 s.N`).
Restated, never quoted. No computed content in this chapter. Taught weeks 1–2 (`weeks.md`).

## Deck-wide conventions
| Item | As taught |
|---|---|
| Computer | Hardware (physical parts) + software (encoded instructions) (s.3) |
| Manager names | Memory, Processor, Device, File, Network Manager (capitalised, "Manager") |
| OS type names | Batch, Interactive, Real-time (hard/soft), Hybrid, Embedded |
| Context slides | s.1 title; s.2 textbook; s.10 class question (how many OSs do you know?); s.13 Windows collage; s.14 application icons |

## 1. Hardware categories — s.3–7, s.9 — CORE
| Category | Examples on the slides |
|---|---|
| Input | Mouse, keyboard, microphone, camera, scanner, barcode reader (s.4) |
| Output | Monitor, printer, projector, speakers (s.5) |
| CPU | The computer's "brain": interprets and executes instructions; starts every storage reference, data operation and I/O (s.6) |
| Memory | Primary and secondary (s.7) |
| Secondary memory | Hard disk drive, SD card, flash memory, CD/DVD (s.9) |

Natural drill: sort a device into input / output / storage.

## 2. Primary memory: RAM vs ROM — s.8 — CORE (assessed: Q1A/Q1B Q1)
| Row | RAM | ROM |
|---|---|---|
| Stands for | Random Access Memory | Read-Only Memory |
| What it is | Read/write storage reachable in any order at any time | Holds the start-up (boot) instructions |
| Use | Fast read/write while applications run | Read only; boots the computer |
| Volatility | Volatile: lost at power-off | Non-volatile: kept at power-off |

The quiz uses exactly these four rows (stands for, definition, use, volatility); its key accepts short
forms ("Read/Write" vs "Read").

## 3. Software: OS and applications — s.10–14 — CONTEXT
| Slide | Content |
|---|---|
| s.11–12 | Three desktop OSs ranked by the instructor from most to least difficult: Linux, Windows, macOS |
| s.13 | Windows family collage |
| s.14 | Applications, e.g. the Microsoft Office package |

## 4. Troubleshooting — s.15–16 — CONTEXT (LO 12–13)
| Item | Content |
|---|---|
| General steps (any OS) | Reboot; check cables; install updates; scan for malware; free disk space; look up error messages |
| macOS issues | Start-up, slowness, apps crashing |
| Linux issues | Boot, packages (install/update), network |
| Windows issues | Blue screen (BSOD), slowness, drivers |

## 5. What an operating system is — s.17 — CORE
Part of the software; manages all hardware and software; controls every file, device, section of main
memory and slice of processor time; controls who may use the system and how.

## 6. The managers — s.18–24 — CORE (see owner note)
Every manager (s.19): monitors its resources continuously, enforces the policy for who gets what, when
and how much, allocates, and deallocates.

| Manager | In charge of | Responsibilities as listed |
|---|---|---|
| Memory (s.20) | Main memory (RAM) | Protect the OS's space; check that requests are valid and legal; keep a tracking table (needed for multiuser); deallocate to reclaim |
| Processor (s.21) | CPU allocation; tracks process status | Two levels: Job Scheduler admits jobs; Process Scheduler runs the processes inside them |
| Device (s.22) | Devices, channels, control units | Choose the most efficient allocation by scheduling policy; allocate; deallocate |
| File (s.23) | Every file (data, programs, compilers, applications) | Enforce access restrictions; enforce modification rights (read-only, read-write, create, delete); allocate by opening; deallocate by closing |
| Network (s.24) | Networked systems: the fifth manager | Share hardware and software resources while keeping user access control |

s.18 figure: the managers linked to each other and to the user interface. s.25 (model of a networked
OS): all five managers connected to each other — CONTEXT.

## 7. User interface: GUI vs command line — s.26–29 — CORE
| | GUI | Command line |
|---|---|---|
| Input | Pointing device (mouse, finger) | Typed commands |
| Strength | Easy; menus vary by OS | Commands can be chained into one powerful command |
| Demand on user | — | Exact spelling, correct syntax, correct combination |

## 8. Types of operating systems — s.30–36 — CORE
Two distinguishing features: response time, and how data enters the system (s.30).

| Type | Key idea | Examples on slides |
|---|---|---|
| Batch (s.31) | Jobs entered whole and in sequence; one job finishes before the next starts | Early punched-card systems |
| Interactive (s.32) | Several jobs in progress; faster response than batch | Terminal users sharing a computer |
| Real-time (s.33) | Must meet a strict deadline every time; reliability critical | Spacecraft, air-traffic control, industrial control, medical systems |
| Hard real-time (s.34) | Missed deadline → total system failure | — |
| Soft real-time (s.34) | Missed deadline → degraded performance only | — |
| Hybrid (s.35) | Interactive in front, batch in the background when load is light; the most common today | — |
| Embedded (s.36) | Computer built into the product it controls | Cars (engine, brakes, navigation), music players, elevators, pacemakers |

## Ambiguities
| Where | Note |
|---|---|
| s.18 | Manager count wording; use five managers (s.18 list, s.24, s.25, syllabus objectives) — see owner note |
