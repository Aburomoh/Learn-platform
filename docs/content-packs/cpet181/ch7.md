# Content pack — CPET 181 Chapter 7: Device management (#527)

Source: Ch7 deck (pptx, 28 slides; Tier-1, not in the repo). References are slides (`Ch7 s.N`).
Restated, never quoted. Only counting content (tape gaps); checked by hand. Taught weeks 12–13
(`weeks.md`); assessed in Assessment R.

**Scope:** device types and storage media. Not taught: disk-seek scheduling (FCFS/SSTF/SCAN/LOOK),
seek/rotation/transfer time calculations, RAID, channels and control units, buffering schemes.

## Deck-wide conventions
| Item | As taught |
|---|---|
| Acronyms | DASD = direct access storage device; IRG / IBG = inter-record / inter-block gap |
| Comparison tables | Feature rows × device columns (s.24, s.28) — the same shape the assessment uses |
| Context slides | s.1 title; s.23 photo of CD/DVD/Blu-ray (700 MB, 4.7 GB, 25 GB) |

## 1. Device Manager functions — s.2 — CORE
Track each device's status; decide by policy which process gets a device and for how long; allocate;
deallocate at two levels: process level (after an I/O command, temporary) and job level (job finished,
permanent).

## 2. Dedicated, shared, virtual devices — s.3–6 — CORE (AR T/F 1, MCQ 2–3)
| Type | Meaning | Examples | Note |
|---|---|---|---|
| Dedicated | One job at a time, for the whole job | Tape drives, printers, plotters | Wasteful when the device is idle part of the time |
| Shared | Several processes, requests interleaved | Disks / any DASD | Device Manager must control conflicts by policy |
| Virtual | Dedicated device made shareable | Printer via spooling | Spooling speeds up slow dedicated devices; output goes to the printer only when complete |

## 3. Storage media classification — s.7–8 — CORE (AR MCQ 1)
| Access | Media |
|---|---|
| Sequential | Magnetic tape |
| Direct (DASD) | Magnetic disk (floppy, zip, hard disk — fixed or movable head), optical disc (CD, DVD, Blu-ray), flash memory |

DASD can hold sequential or direct files and read/write a chosen place directly.

## 4. Magnetic tape — s.9–14 — CORE + WORKED (counting)
Plastic ribbon, magnetizable coating, one side, serial; records found by position. Nine tracks: 8 data
+ 1 parity. Density = characters per inch. **Transfer rate = density × transport speed** (formula only).

| Item | Rule | Verified |
|---|---|---|
| IRG (s.11) | ½-inch gap between individually stored records | 10 records → 9 gaps ✓ (n records → n − 1 gaps) |
| IBG (s.12) | ½-inch gap between blocks of records | s.12 figure: blocks of 10 records separated by an IBG |
| Blocking plus (s.13) | Fewer I/O operations, less tape wasted | — |
| Blocking minus (s.13) | Overhead for blocking/deblocking; buffer wasted if one record is needed | — |
| Tape plus / minus (s.14) | Cheap, compact, good for backup and archives / variable access time, poor for routine or interactive use | — |

## 5. Magnetic disks — s.15–21 — CORE
| Item | Content |
|---|---|
| Disk (s.15–16) | Coated platter, both surfaces, concentric tracks; cheaper than RAM, larger, slower. Plus: direct access, large, faster than tape, less corruption, reusable. Minus: dearer than tape, needs a clean environment, less portable, poor for sequential access |
| Hard disk (s.17) | Platters on one spindle; heads on a common access arm; top and bottom outer surfaces unused |
| Fixed-head (s.18–19) | One head per track; faster; used in spacecraft and aircraft; costly, less capacity |
| Movable-head (s.20) | Heads move together on the arm (PC drives) |
| Record address (s.21) | Cylinder number, surface number, record number |

## 6. Optical discs — s.22–25 — CORE (AR Q3)
Reflective metal layer read by laser; one long spiral track (not concentric); constant linear velocity.

| | CD | DVD | Blu-ray |
|---|---|---|---|
| Capacity (s.24) | Up to 700 MB | 4.7–17 GB (about 15 × a CD) | Up to 128 GB |
| Laser | Optical | Optical | Blue-violet, tighter tracks |
| Typical use | General data | Multimedia | HD audio/video |
| Varieties | CD-ROM, CD-R, CD-RW | read-only, recordable, rewritable | BD-ROM, BD-R, BD-RE |

CD types (s.25):

| Type | Read | Write | Rewrite |
|---|---|---|---|
| CD-ROM (written by maker) | Yes | No | No |
| CD-R | Yes | Once | No |
| CD-RW | Yes | Yes | Yes |

## 7. Solid state and flash — s.26–28 — CORE (AR Q3)
SSD: charge in floating-gate transistors; no moving parts; less power, silent, light; minus: crashes
without warning, transfer rate degrades over time. Flash (s.27): portable EEPROM, non-volatile,
removable; written by charge through the floating gate, erased by a strong field ("flash").

HDD vs SSD (s.28):

| Feature | HDD | SSD |
|---|---|---|
| Access time | Slower | Faster |
| Power | Higher | Lower |
| Weight | Heavier | Lighter |
| Noise | Yes | No |
| Moving parts | Yes | No |
| Cost per GB | Lower | Higher |
| Very high capacity | Yes | No |
| Write/rewrite lifetime | Longer | Shorter |

## Ambiguities
| Where | Note |
|---|---|
| s.24 | Two cells of the CD/DVD/Blu-ray table — see owner note |
| s.23 vs s.24 | Blu-ray 25 GB (photo, single layer) vs up to 128 GB (table) |
