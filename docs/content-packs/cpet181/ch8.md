# Content pack — CPET 181 Chapter 8: File management (#527)

Source: Ch8 deck (pptx, 15 slides; Tier-1, not in the repo). References are slides (`Ch8 s.N`).
Restated, never quoted. The two compression examples were re-derived (run counts; longest common
prefix with the previous entry). Taught week 5, between Ch3 and Ch5 (`weeks.md`). Not assessed in the
quiz documents of the source base.

**Scope:** file manager duties, naming, record types, record organization, compression, FAT vs NTFS.
Not taught: file allocation methods (contiguous, linked, indexed blocks), directory structures (tree,
acyclic graph), access control lists or matrices, free-space bitmaps.

## Deck-wide conventions
| Item | As taught |
|---|---|
| Blank in compression examples | Written as the letter **b** |
| Data hierarchy | Field → record → file → database; directories list filenames and attributes |
| Context slides | s.1 title |

## 1. File Manager — s.2 — CORE
Creates, deletes, modifies and controls access to files. Duties: know where each file is; apply the
storage policy (where and how); allocate a file to a cleared user; deallocate when it is returned.

## 2. Terms — s.3 — CORE
| Term | Meaning |
|---|---|
| Field | Named group of related bytes with a type and size |
| Record | Group of related fields |
| File | Group of related records used by applications |
| Database | Related files linked at several levels for flexible access |
| Directory | List of filenames with their attributes |

## 3. File names — s.4 — CORE
Absolute name: full path. Relative name: the short name seen in a listing and chosen at creation.
Extension: identifies the type (EXE, TXT, DOC, MP4, PDF, PPT).

## 4. Fixed vs variable-length records — s.5 — CORE
| | Fixed-length | Variable-length |
|---|---|---|
| Direct access | Easiest | Difficult |
| Space | Size is critical: fields may be cut off (s.5 figure: "Whitesto", "Harrisbur") or padded | No empty space, nothing truncated |
| Typical use | Data files | Sequentially accessed files |

## 5. Physical record organization — s.6–9 — CORE
Chosen by volatility, activity, size of the file and response time (s.6).

| Organization | How | Plus | Minus |
|---|---|---|---|
| Sequential (s.7) | Records one after another; search from the start | Easiest to implement | Slow to find one record |
| Direct (s.8) | Relative address computed from the key; DASD only | Fast access, quick updates | Collisions when keys give the same address |
| Indexed sequential (s.9) | Ordered file split into equal blocks plus an index file | Best of both; no collisions | — |

## 6. Data compression — s.10–11 — CORE + WORKED
| Method | Rule | Slide example | Verified |
|---|---|---|---|
| Repeated characters (s.10) | Replace a run with a code: run of blanks → `b` + count; run of zeros → `#` + count | `ADAMS` + 10 blanks → `ADAMSb10`; `3` + eight 0s → `3#8` | 10 blanks, 8 zeros ✓ |
| Repeated terms (s.10) | Frequent words replaced by one symbol (student, course, grade, department) | — | — |
| Front-end (s.11) | Each entry starts with the count of leading characters it shares with the previous entry, then the rest | see below | ✓ |

| Original | Compressed | Shared prefix |
|---|---|---|
| Smith, Betty | Smith, Betty | first entry, kept whole |
| Smith, Donald | 7Donald | "Smith, " = 7 (comma and space count) |
| Smith, Gino | 7Gino | "Smith, " = 7 |
| Smithberger, Gino | 5berger, Gino | "Smith" = 5 |

Variant generation: count includes punctuation and spaces; compare only with the entry immediately above.

## 7. File systems: FAT vs NTFS — s.12–15 — CORE
A file system names files and places them logically for storage and retrieval; most common FAT and NTFS.

| | FAT (s.13–14) | NTFS (s.15) |
|---|---|---|
| Name | File Allocation Table (a "table of contents") | New Technology File System |
| History | MS-DOS, Windows 95/98 | Later Windows |
| Best for | Drives/partitions under about 200 MB; little overhead | Larger volumes; not below about 400 MB (space overhead); cannot format a floppy |
| Limits / strengths | Partitions up to 4 GB; slows on large partitions | No performance loss; designed so repair utilities are not needed; keeps copies of critical files; transparent compression and encryption |
| Reserved names (FAT) | CON, AUX, COM1–COM4, LPT1–LPT3, PRN, NUL | — |

## Ambiguities
| Where | Note |
|---|---|
| s.10 | Two code styles in one method (`b10` names the character, `#8` does not); variants should reuse exactly these two forms |
