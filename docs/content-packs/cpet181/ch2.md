# Content pack — CPET 181 Chapter 2: Memory management, simple systems (#527)

Source: Ch2 deck (pptx, 37 slides; Tier-1, not in the repo). References are slides (`Ch2 s.N`).
Restated, never quoted. Every allocation table, free-list update and relocation value below was
re-computed independently (first-fit and best-fit over the block list; compaction by sliding jobs
up; 1 KB = 1024 bytes). Taught weeks 2–3; assessed in Quiz 1 week 5 (`weeks.md`).

## Deck-wide conventions
| Item | As taught |
|---|---|
| Sizes | K / KB used interchangeably; 1 KB = 1024 bytes when converting to byte addresses (s.36–37) |
| Memory drawing | Vertical column, OS at the top (address 0), boundary addresses written at the right edge, byte addresses at the left (s.36–37) |
| Block order | Top to bottom = increasing address; "first" means first from the top |
| One job per block | A partition/block holds one job; its leftover is internal fragmentation and is **not** reused by later jobs (s.12, s.21–22) |
| Waiting job | A job that fits no free block waits; it is named "Job N waiting" above the memory column (s.21–22) |
| Allocation table | Columns memory location, block size, job number, job size, status, internal fragmentation; totals "available" and "used" (s.19–20) |
| Relocation register | new start − old start, in **bytes**, negative when a job moves toward the OS (s.34, s.36–37) |
| Context slides | s.1 title; s.2 outline; s.3–4 introduction |

## Tie and order rules
| Rule | Evidence |
|---|---|
| Jobs are placed in list order (J1, J2, …); a job that cannot be placed waits and the next job is tried | s.12, s.19, s.21–22; Q1 Q2 |
| First-fit: the first free block from the top that is large enough | s.17, s.19, s.21–22 |
| Best-fit: the smallest free block that is large enough | s.17, s.20, s.21–22 |
| Best-fit tie (two equal smallest blocks) | Never occurs in the deck or quizzes; take the higher one (first from the top) |
| Best-fit table lists rows in allocation order, not address order | s.20 |

## 1. Contiguous vs non-contiguous allocation — s.5–7 — CORE (see owner note)
| Row | Contiguous | Non-contiguous |
|---|---|---|
| Blocks | One run of consecutive memory | Separate pieces |
| Speed | Faster | Slower |
| OS control / overhead | Easier / minimal | Harder / more |
| Methods | Fixed and dynamic partitioning | Paging, multilevel and inverted paging, segmentation, segmented paging |
| Analogy | Array | Linked list |
| Degree of multiprogramming | Fixed (fixed partitions) | Not fixed |

The four contiguous schemes of this chapter: single-user, fixed, dynamic, relocatable dynamic (s.7).

## 2. Single-user contiguous scheme — s.8–9 — CORE
Whole program loaded at once; jobs one after another; a job larger than memory is rejected (an
accumulator tracks program size); at job end the whole memory is freed. Drawbacks: no
multiprogramming or networking, not cost-effective, program must be smaller than memory.

## 3. Fixed partitions — s.10–13 — CORE + WORKED
Partitions set at start-up, static until shutdown; one job per partition; needs protection and
size matching. Partition table (s.11): size, address, job, status.

| Slide | Partitions (K) | Jobs (K) | Result (first available partition large enough) | Verified |
|---|---|---|---|---|
| s.12 | 100, 25, 25, 50 (200 K total) | J1 30, J2 50, J3 30, J4 25 | J1 → 100 (70 K internal fragmentation); J2 → 50; J3 **waits**; J4 → first 25; second 25 empty | ✓ |

Point of s.12: J3 waits although 70 K is free inside partition 1. Drawbacks (s.13): partitions too small
→ long jobs wait; too large → internal fragmentation.

## 4. Dynamic partitions — s.14–15 — CORE + WORKED
Each job gets exactly the size it asks for; first-come-first-served; little waste at first, then
external fragmentation between busy blocks.

| Step (s.15) | Memory 10 K–105 K (OS 0–10 K) | Verified |
|---|---|---|
| (a) J1 10, J2 15, J3 20, J4 50 | J1 10–20, J2 20–35, J3 35–55, J4 55–105 | ✓ |
| (b) J1, J4 end | Free 10–20, 55–105 | ✓ |
| (c) J5 5, J6 30 arrive | J5 10–15, J6 55–85 (first hole large enough) | ✓ |
| (d) J3 ends | Free 15–20, 35–55, 85–105 | ✓ |
| (e) J7 10, J8 30 arrive | J7 35–45; J8 **waits**: holes 5 + 10 + 20 = 35 K, none ≥ 30 | ✓ |

## 5. Internal vs external fragmentation — s.16 — CORE
Internal: unused space inside an allocated partition (allocated > requested). External: unusable free
pieces between busy blocks created by dynamic allocation.

## 6. First-fit vs best-fit — s.17–22 — CORE + WORKED
| | First-fit | Best-fit |
|---|---|---|
| Rule | First block large enough | Smallest block large enough |
| Plus | Faster allocation | Least wasted space |
| Minus | Wastes memory | Slower allocation |

Both are used with fixed and dynamic schemes (s.17).

**s.19–20** blocks (address, size): 10240 30 K, 40960 15 K, 56320 50 K, 107520 20 K (115 K available);
jobs J1 10, J2 20, J3 30, J4 10.

| Method | J1 | J2 | J3 | J4 | Internal fragmentation | Used | Verified |
|---|---|---|---|---|---|---|---|
| First-fit (s.19) | 30 K block | 50 K | **waits** | 15 K | 20, 30, 5 | 40 K | ✓ |
| Best-fit (s.20) | 15 K | 20 K | 30 K | 50 K | 5, 0, 0, 40 | 70 K | ✓ |

**s.21** blocks below the OS: 35, 20, 55, 30 KB; processes P1 15, P2 25, P3 35, P4 20.

| Method | 35 | 20 | 55 | 30 | Waiting | Verified |
|---|---|---|---|---|---|---|
| First-fit | P1 (20 left) | P4 (0) | P2 (30 left) | empty | P3 | ✓ |
| Best-fit | P3 (0) | P1 (5) | P4 (35) | P2 (5) | none | ✓ |

**s.22** blocks: 30, 40, 15, 20 KB; processes P1 12, P2 24, P3 15, P4 32.

| Method | 30 | 40 | 15 | 20 | Waiting | Verified |
|---|---|---|---|---|---|---|
| First-fit | P1 (18) | P2 (16) | P3 (0) | empty | P4 | ✓ |
| Best-fit | P2 (6) | P4 (8) | P1 (3) | P3 (5) | none | ✓ |

The three worked pairs all end the same way (first-fit leaves a job waiting, best-fit places all four),
as do both Quiz 1 versions; a variant generator should also produce cases where first-fit does as
well as or better than best-fit, which the source never shows.

## 7. Deallocation — s.23–30 — CORE + WORKED
Fixed partitions: mark the block free (e.g. 0 = free, 1 = busy). Dynamic: merge with free neighbours.
Free list columns: beginning address, block size, status; kept in address order.

| Case | Released block | Free neighbours | Free-list change | Verified |
|---|---|---|---|---|
| 1 Join two (s.25–26) | 7600, size 200 | 7800 (5) after it | 7800 row becomes 7600, 205 | 7600 + 200 = 7800 ✓ |
| 2 Join three (s.27–28) | 7580, size 20 | 7560 (20) before, 7600 (205) after | 7560, 245; the 7600 row becomes a null entry | 20 + 20 + 205 = 245 ✓ |
| 3 Isolated (s.29–30) | 8805, size 445 | none (busy 7805–8805 and 9250–) | null entry reused: 8805, 445 free; busy-list row becomes null | 8805 + 445 = 9250 ✓ |

## 8. Relocatable dynamic partitions and compaction — s.31–37 — CORE + WORKED
Compaction: move every job up so that all free space becomes one block at the bottom; every address
in a program is adjusted, data values are not (s.32). Registers (s.35): **bounds** register = highest
address the program may use; **relocation** register = amount added to each address (0 if not moved).

| Slide | Before (start K, size K) | After | Relocation register | Free after | Verified |
|---|---|---|---|---|---|
| s.33 | J1 10/8, J4 30/32, J2 92/16, J5 108/48; J6 84 K waiting | J1 10, J4 18, J2 50, J5 66; then J6 at 114 | — (figure only) | — | ✓ |
| s.34 | J4 starts 30 K, holds bytes 31744 ("Load 4, 53248") and 53248 ("37") | J4 at 18 K; same items at 19456 and 40960 | −12288 | — | 30 K → 18 K = −12 K ✓ |
| s.36 | OS 8; J1 8/22; hole 15; J3 45/25; hole 15; J2 85/15; top 100 | J1 8, J3 30, J2 55 | J3 −15360, J2 −30720 | 30 KB (70–100) | ✓ |
| s.37 (see owner note) | OS 10; J1 10/30; hole 12; J2 52/28; hole 35; J3 115/15; top 130 | J1 10, J2 40, J3 68 | J2 −12288, J3 −48128 | 47 KB (83–130) | ✓ |

Method as drawn: write each boundary in K and in bytes (K × 1024); register = (new start − old start)
× 1024. s.34 shows the instruction text itself unchanged ("Load 4, 53248") while its location moves.

## Assessed (details in `quiz-patterns.md`)
Q1 Q2: four jobs into four blocks by first-fit then best-fit, list waiting jobs, then say which is
more efficient and why (key: best-fit, all jobs placed, less internal fragmentation). Q1 Q3: before/after
compaction map with boundary values and the relocation register of two jobs (key gives magnitudes in K,
no sign; see owner note).

## Ambiguities
| Where | Note |
|---|---|
| s.6 | Fragmentation row of the comparison table — see owner note |
| s.37 | Second register label — see owner note |
| Q1 Q3 vs s.34–37 | Register sign and unit — see owner note |
| s.25–30 | Addresses are unitless in the deallocation tables |
