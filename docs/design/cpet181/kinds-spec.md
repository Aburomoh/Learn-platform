# CPET181 kinds: `cpu-schedule` and `memory-map` (UX, #541)

Epic #528. Two new ADR-0008 kind modules for Chapter 4 (processor management) and Chapter 2
(memory, simple systems). This extends `docs/design/ecet111-representations.md` §1 (shared grammar,
states, sizes, keyboard model) and reuses its primitives; nothing here redesigns the stage.
Truth comes from the OS truth module (#539): `schedule()` and `allocate()`. The views never grade.
Mock-ups: `docs/design/cpet181/mockups/*.html` (open in a browser) with renders at 390 and 1280 px in
`docs/design/cpet181/renders/`. The examples are illustrative, not content: real numbers come from
the packs (#527).

| Mock-up | Shows |
|---|---|
| `cpu-schedule.html` | RR timeline mid-build (segment 5), then the finish/turnaround table and the average |
| `memory-map.html` | Fixed partitions, first-fit, placing job 3; dynamic map with a release (case 2) and compaction |

## 0. What both kinds share
- **One goal per Check** (ADR-0007). The goal line names it in words: "Segment 3", "Column Finish",
  "Job P3", "Release P2", "Compact: new address of Job 3".
- **States** as in representations §1: *Now* (`--focus-halo` + 2 px `--accent` outline), *Done*
  (plain on `--surface`), *Later* (`--pending-opacity`, headers visible, values hidden), *Try again*
  (`--error-bg`, 2 px `--error`, ✕). After a wrong Check only the **first** wrong part is marked.
- **Moments** (visual system, ADR-0009): *meet it* (the given data and an empty drawing), *answer on
  it* (the drawing is the control), *see inside* (after a correct check the drawing grows the result
  and the bookkeeping table updates), *keep it* (the finished drawing and table stay as the worked
  result; the summary line reads the average or the waiting jobs).
- **Numbers before the answer are never shown.** Remaining CPU time, ready jobs, free sizes after a
  split, waste per partition: each appears only after the check that asks it, or on hint rung 5.
- **Sizes:** tappable targets ≥ 44 px tall, ≥ 36 px wide; all text ≥ 12 px incl. SVG
  (`--diagram-text-min`); drawings compact first, then scroll inside the well (`--surface-sunk`,
  fade edge); the page never scrolls sideways.
- **Actions:** one filled action per challenge (`Check segment`, `Check column`, `Place job`,
  `Check release`, `Check address`). Hint and Explain slowly stay quiet text actions.
- **Explain slowly** reuses the same view read-only with `revealed` stages (as timing and
  state-diagram do).
- **Keyboard:** no drag anywhere. Choices are one `radiogroup` with a single tab stop (arrows move,
  Space/Enter picks, Check confirms). Number fields are `inputmode="numeric"` inputs, 44 px tall.
  Grids follow the truth-table ARIA grid model (one tab stop, arrows move, typing sets).
- **Primitives reused** (kinds never import each other; shared code moves to `src/kinds/shared/`):

| Need | Reuse | From |
|---|---|---|
| Horizontal lane in a scrolling well, fade edge, active column kept in view, names column outside the scroller | `useScrollFade`, the well + scroll-into-view logic of `TimingDiagram` (lift the two into `src/kinds/shared/lane.ts`) | `src/interactions/shared/useScrollFade.ts`, `src/kinds/timing/TimingDiagram.tsx` |
| Dotted boundary guides, halo rect, `role="img"` summary, `?` marker | same drawing conventions as timing | timing README "View" |
| Job / block chips | `radiogroup` chips (state-diagram labels, mux-pairs) | `docs/design/ecet111-representations.md` §1 |
| Fill one table column per goal; `wrongCells.first`; 36 × 44 px cells; two-level headers; sticky header on phones | the truth-table grid model and styles, lifted into `src/kinds/shared/GridColumn.tsx` + CSS (the truth-table component itself stays Boolean-only) | `src/kinds/truth-table/TruthTable.tsx`, `TruthTable.module.css` |
| Multi-digit cell inputs, 44 px, first-wrong marking | column-addition's `.input` cells | `src/interactions/ColumnAddition/ColumnAddition.module.css` |
| Given / focus / result states on a drawing | ADR-0009 figure states (no `figure` field needed: the drawing is the kind's own) | `src/kinds/shared/figures/figures.module.css` |
| Numeric single answer (average, register) | `NumericInput` (base 10) | `src/interactions/NumericInput` |

---

## 1. `cpu-schedule` (Chapter 4)

### 1.1 Spec (shape for the UI engineer; final Zod in the kind)
```ts
{
  kind: "cpu-schedule",
  policy: "FCFS" | "SJN" | "SRT" | "Priority" | "RR",
  quantum?: number,                  // RR only
  jobs: { id: "A"|"B"|…, arrival: number, cpu: number, priority?: number }[],  // 3–6, slide order
  phases: ("timeline" | "finish" | "turnaround" | "wait" | "average")[],       // in this order; default all
  unit?: "ms",                       // label only
}
```
Truth: `schedule(jobs, policy, { quantum, tieBreak })` → `segments[] {job | "idle", start, end}`,
per-job `finish`, `turnaround`, `wait`, and averages. Tie-break and quantum-boundary conventions
are the truth module's (pack A); the view shows nothing that depends on them.

### 1.2 Steps (ADR-0007)
| tag | one per | answer | Check label |
|---|---|---|---|
| `segment` | timeline segment, in time order | `{ step, job: id \| "idle", end: number }` | Check segment |
| `column` | phase column in `phases` order: finish, turnaround, wait | `{ step, values: number[] }` (one per job, jobs order) | Check column |
| `average` | the asked average (turnaround; wait if `wait` is in phases) | `{ step, value: number }` | Check average |

Step vars: `segmentNumber`, `segmentCount`, `time` (the segment's start), `readyList` (ids ready at
`time`, for hint rung 5 only), `jobId`, `segmentEnd`, `columnLabel`, `jobCount`, `quantum`,
`policyName`. `grade()` returns `partial: true` until the last step. A segment is right only when
both job and end are right; the result says which part is wrong first (`wrongPart: "job" | "end"`).

### 1.3 Layout
Three bands, top to bottom, in the stage card:
1. **Jobs table** (given, read-only): Job · Arrival · CPU (· Priority). Policy and quantum as a
   small badge in the eyebrow: "Round Robin · quantum 2 ms". A fourth column **Left** (remaining
   CPU) appears only for SRT and RR and fills in as segments are checked (see inside). On phones
   the table is compact (36 px columns); it never scrolls.
2. **Timeline well** (`--surface-sunk`): the lane. From 900 px the jobs table sits to the left of
   the well (table ≈ 220 px, lane takes the rest); below 900 px they stack. At ≥ 1200 px the tutor
   column is beside the stage as usual.
3. **Controls**: goal line, job chips, end-time field, Check. Then the result table (phases 2–5)
   under the lane once the timeline is done.

### 1.4 The lane (answer on it)
Exactly the slide's picture: one row of boxes, tick numbers underneath.
- **Scale:** 1 time unit = `COL` px; `COL` = max(24, floor(available width / total time)) up to 40,
  so short examples fit the well and long ones scroll inside it with a fade edge. The active
  boundary is kept at least 3 units from the right edge (timing's rule). Total time is the
  truth's last `end`.
- **Rows** (SVG, names outside the scroller as in timing):
  - *Arrivals strip* (top, 20 units tall): a small ▲ with the job id at each arrival time (given).
    Jobs that arrive together stack their ids ("B C").
  - *CPU lane* (middle, 36 units tall): one box per checked segment, label "A 3" (job id and length).
    Mono text, ≥ 12 px; a box narrower than its label shows the id only, with the full label as
    `<title>`.
  - *Ticks* (bottom): the boundary times "0 2 5 9 10 13", exactly as the slides print them,
    one per checked boundary; the next boundary is a `?` in `--accent`.
- **Segment shapes** (shape + text, never colour alone):
  - a finished job: solid box, solid right edge;
  - a **preempted** job (SRT, RR): same box, **dotted right edge** and the label "A 3" with a small
    "↩" after it meaning "continues later"; the Left column shows what remains;
  - an **idle gap**: a hatched box labelled "idle" (diagonal lines, `--text-muted`), same height;
  - all boxes use `--surface` fill and `--text` stroke; a job's later segments are not colour-coded.
    (A 1.5 px top stripe in `--brand-soft` on every segment of the job named in the goal is a hint
    rung 5 effect, not the default.)
- **Now:** the open slot after the last checked boundary gets the halo: a dashed box of width
  `COL × 1` (grows to the typed end once the field has a value, so the student sees the box they
  are describing), with a `?` inside. The dotted vertical guide (timing) runs through the arrivals
  strip at the current time so the student can see who has arrived.
- **Done:** boxes stay. **Later:** nothing is drawn (the lane is open to the right); the ticks row
  shows nothing beyond the `?`.
- **Try again:** only the first wrong part is marked: a wrong job marks the picked chip (✕, `--error`
  border) and the feedback says "Not that job"; a wrong end marks the field and says "The job is
  right; look at when it stops". The dashed box stays where the student put it.
- **Screen reader:** `role="img"` with a summary: policy, quantum, arrivals, segments so far
  ("A from 0 to 2, B from 2 to 5; next starts at 5").

### 1.5 Controls (segment phase)
- Goal line: "Segment **3** · starts at 5: which job runs, and until when?"
- **Job chips** (`radiogroup` "Job for segment 3"): one chip per job in table order, plus **Idle**
  last. 44 px tall. Chips of finished jobs are disabled (`aria-disabled`, dimmed, with a ✓) once the
  truth says they finished: they are done facts, not hints. Unarrived jobs are *not* disabled (the
  arrival mistake is a real one; `arrival-ignored` catches it).
- **End field**: "until" + a 4-character numeric input (`inputmode=numeric`), 44 × 64 px, with the
  unit after it. Enter in the field checks.
- **Check segment** (filled). Enabled when both are set.
- After a correct check: the box draws, the tick appears, Left updates, focus moves to the chips
  for the next segment, live region: "Segment 3 correct: A runs 5 to 9. Next starts at 9."
- Last segment correct: the lane is complete; the live region says "Timeline complete."

### 1.6 Result table (phases finish → turnaround → wait → average)
The slides list Finish time and Turn Around Time as "15 − 0 = 15" per job, then the average.
- A table under the lane: **Job · Arrival · CPU · Finish · Turnaround (· Wait)**, one row per job in
  table order. Given columns are filled; the asked column is *Now*; later columns are *Later*
  (headers visible, dim). Column per goal, as truth-table fill mode; cells are 44 px tall and 56 px
  wide (two-digit numbers), 48 px on phones. First wrong cell only is marked; the feedback names
  the row ("2 cells are not right yet; look at job B").
- Turnaround cells show the subtraction as a muted hint only after the column is correct:
  "9 − 1 = 8" (see inside). Never before.
- **Average**: a single `NumericInput` under the table, "Average turnaround = (sum) / n = ?" with the
  sum written out **after** the check (see inside), two decimals accepted as the pack states them
  (truth module decides rounding). Check average. On correct: the lane's finish ticks get their
  job id under them (keep it) and the summary line reads the average.
- `wait` is optional (`phases`); the slides do not compute it, so content adds it only where the
  pack does.

### 1.7 Hints and detectors (what the view must be able to show)
- Rung 5 (visual) focus targets: `ready-now` (the arrivals strip at `time` plus a "ready: B, D"
  chip row under the lane, hidden until highlighted), `left-<job>` (the Left cell), `segment-<n>`,
  `tick-<n>`, `row-<job>`, `col-<label>`, `average`.
- Detectors (truth-module computed, named here so the view can point at the right thing):
  `arrival-ignored` (ran a job before it arrived, or idle while one was ready), `fcfs-under-sjn`
  (took the earliest instead of the shortest), `longest-first` (SJN/SRT reversed), `not-preempted`
  (SRT: kept running past a shorter arrival; RR: ran past the quantum), `preempted-nonpreemptive`
  (SJN/Priority/FCFS: stopped a job early), `end-past-remaining` (RR: full quantum though less was
  left), `priority-reversed` (pack's convention inverted), `rr-queue-order` (requeued job placed
  before a same-tick arrival, or vice versa; convention from pack A), `turnaround-as-finish`
  (forgot the arrival), `wait-as-turnaround`, `average-wrong-count`.

### 1.8 Phone (390 px) and desktop (1280 px)
- 390: jobs table full width (4–5 compact columns), lane scrolls inside the well (first ~12 units
  visible at COL 24), chips wrap to two rows, end field and Check on one row. Result table fits 6
  columns at 48 px; a 7th (Wait) scrolls inside the well with a sticky Job column.
- 1280: table beside the lane, lane fits ~26 units without scrolling at COL 32, tutor column right.

### 1.9 Explain slowly stages
`revealed` (segments drawn), `time` (the dotted guide and halo at this moment), `ready` (ids to
highlight in the arrivals strip), `rows` (result rows filled), `column` (which column is open),
`average` (show the sum line). Each step carries one idea: "At 5, who is ready?" → "The shortest
remaining is C" → "So C runs until 7".

---

## 2. `memory-map` (Chapter 2)

### 2.1 Spec
```ts
{
  kind: "memory-map",
  scheme: "fixed" | "dynamic" | "relocatable",
  fit: "first" | "best",
  os: number,                                   // OS block size at the bottom address (KB)
  partitions: number[],                         // fixed: sizes in address order; dynamic: one free block (total − os)
  jobs: { id: "P1"|"Job 1"|…, size: number }[], // arrival order
  events: ({ place: id } | { release: id } | { compact: true } | { fragmentation: true })[],
  registerUnit?: "KB" | "bytes",                // compaction registers; slides use bytes
  unit?: "KB",
}
```
Truth: `allocate()` applied event by event → the map after each event (blocks with start, size,
job or free), waiting jobs, internal waste per partition, external free fragments, free/busy lists,
and after compaction the new starts and relocation registers.

### 2.2 Steps (one per event; some events have two goals)
| tag | event | answer | Check label |
|---|---|---|---|
| `place` | `place` | `{ step, block: index \| "waits" }` | Place job |
| `waste` | `fragmentation` (fixed) | `{ step, values: number[] }` (internal waste per partition, address order) | Check column |
| `holes` | `fragmentation` (dynamic) | `{ step, value: number }` (total external free space) | Check total |
| `release` | `release` | `{ step, start: number, size: number }` (the resulting free block) | Check release |
| `move` | `compact`, one per remaining job in address order | `{ step, start: number }` (new start) | Check address |
| `register` | `compact`, one per moved job | `{ step, value: number }` (relocation register, `registerUnit`) | Check register |

Step vars: `jobId`, `jobSize`, `fitName`, `schemeName`, `blockList` (free blocks "18, 40, 12",
rung 5 only), `partitionNumber`, `oldStart`, `newStart`, `releasedStart`, `releasedSize`,
`neighbourCase` (1, 2 or 3; for the explanation only), `stepNumber`.

### 2.3 Layout
Two columns from 900 px; stacked below.
1. **Memory column** (left, 240 px wide at ≥ 900 px; full width on phones): the slide's picture.
   OS block at the top (the slides draw memory top-down starting with OS), then blocks in address
   order. Addresses in KB on the left edge at each boundary (mono, 12 px floor); sizes inside.
   Block height is proportional to size with a **44 px minimum** and a 120 px maximum; if the
   proportional column would exceed 480 px it is scaled down and the minimums hold, so a 5 KB
   remnant is still a 44 px target. The column scrolls inside its well only when the minimums
   alone exceed the viewport (never on the course's 4–6 block examples).
2. **Right side**: the **job queue** (chips in arrival order: placed ones ✓ and dim, the current one
   haloed, waiting ones marked "waits"), the **bookkeeping table** (free list / busy list as on the
   slides: Beginning address · Size · Status), the goal line and controls.

### 2.4 Placing a job (answer on it)
- Goal: "Job **P3** (24 KB), first-fit: which block?"
- The **free blocks are the control**: one `radiogroup` "Block for P3" whose radios are the free
  blocks in the column (busy blocks and the OS are not focusable), plus a **Waits** chip under the
  column. Tap, or arrows + Space; the picked block gets the accent ring; **Place job** confirms.
- Free block drawing: `--surface` with a light diagonal hatch and "free · 18 KB" (dynamic) or
  "Partition 2 · 18 KB" (fixed). Busy: solid `--surface-2` fill, "P1 · 10 KB" bold, in a fixed
  partition the job fills its proportion from the top and the rest of the partition stays hatched
  (the picture shows the leftover; the number does not appear until the waste step).
- **See inside** on correct: fixed → the job box draws inside the partition; dynamic → the block
  splits (job at the block's start, remainder stays free with its new size), the free/busy lists
  update their rows (changed cells get a brief `--highlight` fade, `--dur-base`, static under
  reduced motion; the slides shade changed entries too). "Waits" moves the chip to a *Waiting*
  row under the queue.
- **Try again:** the picked block gets the ✕ marker and `--error` border; the feedback says why in
  one line ("That block is smaller than P3", "First-fit takes the first block that fits, not the
  tightest"). The pick stays until changed.
- Hint rung 5: `fits-<i>` marks every free block that fits with a small "fits" tag (not which one
  the policy picks).

### 2.5 Fragmentation
- **Fixed (`waste`)**: a column goal in the partition table (Partition · Size · Job · Job size ·
  **Internal waste**), same grid model as the result table in §1.6; first wrong cell only. On
  correct the column's waste stripes in the memory column get their numbers.
- **Dynamic (`holes`)**: one numeric: "Free space in fragments between busy blocks: ? KB". On
  correct the hatched remnants get a thin `--brand` left bar and their total is written under the
  column; the waiting job's chip reads "P4 (26 KB) waits although 26 KB are free" (the slide's
  point).

### 2.6 Release (deallocation, cases 1–3)
- Goal: "**P2** finishes and releases its block (start 46, 16 KB). What free block results?"
- The released block gets the halo and a dashed outline (still labelled "P2 · releasing").
  Two numeric fields: **Start** and **Size**, 44 px, mono, with the unit; **Check release**.
- Correct: the block turns free; adjacent free blocks merge visually (one hatched block with the
  new size, a short 200 ms height transition, instant under reduced motion); the free list row
  updates and, in case 2, the vacated row shows "null entry" (the slide's wording).
- Fixed scheme: the step is a single pick ("mark it free") and the busy flag flips; no merging.
- Detectors: `no-merge` (gave the released block as is next to a free one), `merge-wrong-start`
  (used the released block's start, not the lowest), `partial-merge` (case 2, one side only),
  `merged-busy` (merged into a busy neighbour).

### 2.7 Compaction (relocatable)
- The column shows **before** on the left and an empty **after** column beside it (the slides' pair);
  on phones the two columns are side by side at half width each (120 px), labels shortened to the
  job id and size.
- `move`: one goal per job in address order: "After compaction, where does **Job 3** start?" A
  numeric field; on correct the job draws in the *after* column at its new address and a thin
  connector joins before → after. The last correct move draws the single free block with its size.
- `register`: per moved job, "Relocation register of Job 3 (bytes)": numeric, negative accepted
  as the slides write it (for example −8192). A muted note after the check shows the conversion
  "−8 KB × 1024" (see inside). Jobs that did not move are asked too (answer 0) only if the pack
  does; otherwise skipped.
- Detectors: `register-sign` (positive), `register-kb-for-bytes`, `moved-wrong-order` (jobs
  reordered), `gap-left` (a free gap kept between jobs).

### 2.8 Phone (390 px) and desktop (1280 px)
- 390: job queue chips as one horizontally scrolling row (fade edge, current chip scrolled into
  view); memory column full width, 44 px minimum rows; the bookkeeping table below the column with
  the sticky header pattern; Place/Check at the bottom. Compaction: two 120 px columns side by side.
- 1280: column left, queue + table + controls right; tutor column far right. Nothing scrolls.

### 2.9 Explain slowly stages
`map` (block list to draw), `pick` (block index to halo), `fits` (indices to tag), `lists` (show
free/busy lists), `merge` (indices being joined), `after` (compacted list to draw beside), `arrow`
(job whose move to draw).

---

## 3. Acceptance for the UI engineer
- Renders at 390 and 1280 px for: RR timeline mid-build and complete; SRT with an idle gap and a
  preemption; the result table with one wrong cell; fixed first-fit placing with "waits"; dynamic
  best-fit after a split; release case 2; compaction after the last move.
- Keyboard-only run of one question of each kind; screen-reader summary read once per check.
- No text under 12 px at 320 px; no sideways page scroll; one filled action per view.
- Nothing computed by the truth module is visible before the check that asks it (QA checks the
  Left column, waste numbers and the free-size after a split).
