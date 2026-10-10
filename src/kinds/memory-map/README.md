# memory-map

Contiguous memory allocation, CPET181 Chapter 2 (#561; spec `docs/design/cpet181/kinds-spec.md` §2;
pack `docs/content-packs/cpet181/ch2.md`). The memory column is the slide's picture: OS at address
0, blocks in address order, addresses at every boundary. The student answers *on* the column.

## Spec
`scheme` (`fixed` | `dynamic` | `relocatable`), `fit` (`first` | `best`), `os`, then either
`partitions` (sizes above the OS) or `layout` (blocks with the jobs already in them, for release and
compaction examples), `jobs` (arrival order) and `events` in order:

| Event | Goal tag(s) | Answer | Control |
|---|---|---|---|
| `{ place: id }` | `place` | `block` (index in the column) or `"waits"` | the free blocks are one radiogroup, plus a Waits chip |
| `{ fragmentation: true }` fixed | `waste` | `values[]`, one per partition (free ones ignored) | an input column in the partition table |
| `{ fragmentation: true }` dynamic | `holes` | `value` (total free in fragments) | `NumericInput` |
| `{ release: id }` fixed | `release` | `block` | the busy blocks are the radiogroup |
| `{ release: id }` dynamic | `release` | `start`, `size` of the merged free block | two 44 px fields |
| `{ compact: true }` | `move` per job (address order), then `register` per moved job | `start`; `value` in `registerUnit` | `NumericInput`; `signed` for the register |

Truth is `src/content/os/allocate.ts` (`place`, `release`, `compact`); `goals(spec)` walks the
events and keeps memory before and after each goal. The view draws the *before* state of the
current goal, so "see inside" (the split, the merge, the waste numbers) appears only after the
check that asks it. Registers: `register` in the truth module is bytes (×1024); `registerUnit: "KB"`
asks for the move in KB.

## Detectors
`block-too-small`, `first-fit-as-best`, `best-fit-as-first`, `waits-though-fits`, `waste-as-size`,
`largest-hole-only`, `no-merge`, `partial-merge`, `merge-wrong-start`, `merged-busy`, `gap-left`,
`register-sign`, `register-unit`. `wrongCells.first` is the first wrong waste cell, or 0/1 for the
start/size field of a release.

## Step vars
`stepNumber`, `stepCount`, `jobId`, `jobSize`, `fitName`, `schemeName`, `blockList` (rung 5 only),
`partitionNumber`, `blockStart`, `blockSize`, `waits`, `wasteList`, `wasteTotal`, `holesTotal`,
`largestHole`, `releasedStart`, `releasedSize`, `neighbourCase` (1–3), `resultStart`, `resultSize`,
`oldStart`, `newStart`, `moveNumber`, `moveCount`, `deltaUnits`, `register`, `unit`, `registerUnit`.

## View
Block heights are proportional (44 px floor, 120 px ceiling, column ≈ 480 px at most). Two columns
from 900 px, stacked below; compaction draws before/after side by side. Focus targets: `block-<i>`,
`waits`, `job-<id>`, `waste-<i>`, `partition-table`, `free-list`, `busy-list`, `release-start`,
`release-size`, `register`. Explain stages: `revealed` (goals shown done), `pick`, `fits`.
