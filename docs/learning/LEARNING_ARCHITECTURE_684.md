# Learning architecture: attempt → check → hint → lesson → return (epic #684)

Role: Educational / Pedagogy Engineer (on demand) · 2026-10-13 · main @ 7822804
Status: **proposal only**. No code. §7 by UX / Design Engineer (2026-10-13). The Lead fills §9 (final order) and §10.
Inputs: the owner's directive (#684 body), the Lead's file-cited code facts (#684), the Content Engineer's inventory (#684),
`docs/PEDAGOGY.md`, ADR-0007, ADR-0008, `docs/navigation/IA_AUDIT_670.md` (§7, §8, §12) and Pedagogy's conditions C1–C5 on #678.

Working principle (owner): **"Preserve productive struggle, but localize feedback and help to the learner's current reasoning step."**
Owner rule kept throughout: each step is its own goal, one at a time, with patience, and a retry uses different numbers (#42).

---

## 1. Current root causes

The owner's symptoms come from eight causes. All file references are from the Lead's facts and were re-checked on 7822804.

**RC1 — Explain Slowly shares the hint gate.** `EXPLAIN_SLOWLY_REQUESTED` uses `canRequestScaffold` (`reduce.ts:124-128`), the same
check as hints (`state.ts:58-60`). Instruction is treated as a scaffold rung. A student who does not understand the idea yet
must first make a blind attempt, or wait, before being allowed to be taught.

**RC2 — The gate tracks the wrong signals.** Help opens on `attempts > 0` (a graded Check) or `hesitationPrompted`
(`HESITATION_SECONDS = 45`, sampled every 15 s, `ActivityRunner.tsx:28,153-168`). Typing inside a kind does not reset the idle
clock, because only runner actions do. As a result:
- a student who is working, but slowly, is treated as idle;
- a student who is genuinely stuck must wait 45 s;
- a student who has filled half a column has "engaged" but still cannot ask, because Check is disabled until the chunk is full (RC4).

**RC3 — The gate closes again on every step.** `STEP_COMPLETED` resets `attempts`, `hintLevel` and `hesitationPrompted`
(`reduce.ts:97`). Resetting the ladder per step is correct, because each step is a different goal. Resetting the gate is not:
on every new step the student meets the same 45 s or "try first" wall again.

**RC4 — Some check units are larger than a reasoning unit.** Check stays disabled until every field of the unit is filled:
- K-map fill: all 8 or 16 cells, including the mechanical 0s (`KarnaughMap.tsx:137`);
- truth table: a whole column. In three-JK that is 16 cells per Check, 10 columns and 160 cells in one question (`three-jk.ts:41-52`);
- cpu-schedule: every job's cell in a column (`CpuSchedule.tsx:354`);
- base-to-decimal: a whole row (`WeightDiagram.tsx:225`).

The student gets feedback late, and the evidence cannot say which part of the reasoning failed.

**RC5 — Work in progress is not preserved.**
- Field values belong to each kind view and are cleared on remount (`questionViewKey`).
- `stepIndex`, the variant and revealed hints are never stored. Continue reopens at variant 0, step 0 (`runnerReducer.ts:143-156`).
- Most important for this epic: when Explain Slowly ends, the runner runs `SWITCH_VARIANT` and then `RESET_INTERACTION`, which
  sets `stepIndex: 0` (`runnerReducer.ts:182-192`). **Every step already completed in the question is thrown away.** A student who
  needs help on step 7 of 10 goes back to step 1 with new numbers.

**RC6 — Explanations are often too shallow to rebuild understanding.**
- All 142 CPET 181 questions have exactly two screens, the rule and then the rule applied, with no prediction. These come from the
  `mcq` and `count` builders.
- 47 ECET 111 questions also have only two screens.
- cpu-schedule and memory-map have two screens and no check.

Two screens with no check give no evidence that the gap is closed. Explanations are authored per variant (`schema.ts:52-72`).
The same idea is therefore written many times, at varying depth, and always over the live numbers.

**RC7 — There is no lesson layer.**
- Nothing below topic level (`concepts[]`, `objectives[]`) can be addressed.
- No step points to the instruction it depends on.
- Instruction cannot be reached outside a question.

Because the only explanation walks the live numbers, it must reveal them. That forces the variant switch in RC5 (#42 is correct
given that design). So RC5 and RC7 have one root: **instruction is fused to the problem instance.**

**RC8 (content, not the runner): hidden multi-skill questions** (§5). One answer silently combines
skills that were never asked alone, or were asked after the combined question.

---

## 2. The model: attempt → check → hint → lesson → return

Two mechanisms are deliberately separate (owner point 5):

| | **Hint ladder** | **Lesson (Explain Slowly)** |
|---|---|---|
| Where | inside the problem, on the live numbers | instruction, on the lesson's own numbers |
| Purpose | unblock this step | rebuild the idea behind this step |
| Gated? | yes, by engagement (§2.2) | **no** (§2.3) |
| Reveals the live answer? | only at rung 9, as today | **never** |
| After it | continue the same step | **return to the same step, same numbers, work preserved** |

### 2.1 Engagement (definition)
A student has **engaged with the current step** when any one of these happens on that step:
1. **Input:** the first edit of any field in the step's current chunk. This is a new kind → runner signal, "engaged", sent once per step.
2. **Check:** a graded Check, right or wrong (today's `attempts > 0`).
3. **"I'm stuck"** (§2.4).

Typing, tapping a cell, choosing an option and dragging all count as input. Focusing a field or scrolling does not.
Every input event also **resets the idle clock** (fixes RC2).

### 2.2 Hint availability
- **H1. Open on engagement.** The Hint button works once the student has engaged with the current step. Before that, pressing it
  gives the existing "Try once first" reply, extended with the alternative: "Try once first, or tell me you're stuck." *Try once
  first stays.*
- **H2. Not on completion and not on a timer.** Filling every field is not required, and no long timer opens hints. The 45 s idle
  rule stops being a gate. Idle becomes a quiet tutor line ("Take your time. If you're stuck, say so.") pointing at "I'm stuck".
  It opens nothing by itself.
- **H3. The ladder resets per step; the gate does not need a fresh wait.** Each step is its own goal, so `hintLevel` and the rungs
  restart per step (as today). The gate of the new step opens on the first input in that step, so there is no wall to wait out
  (fixes RC3).
- **H4. One rung per request, as today.** The wrong-check ladder in the Lead's fact 5 (nudge → rung 3 + focus → one more rung per
  wrong check) is unchanged. Hints are per chunk (§3), using `hintsByStep` keyed by step tag.
- **H5. Short delay, secondary only.** A step that appeared less than **5 s** ago ignores Hint and "I'm stuck" taps with no message.
  This guards against reflex double taps. It is not shown and never counts down.

### 2.3 Explain Slowly availability
- **E1. Always available**, whenever a question is open and not in the middle of grading. This includes before any attempt, on any
  step, and after hints. It is never gated by H1–H5.
- **E2. It opens the lesson section** mapped to the current step (`lessonRef`, §4.3). Where no lesson exists yet, it falls back to
  today's per-variant explanation, with today's behaviour (variant switch). The fallback is temporary (§6).
- **E3. The tutor may offer it and never forces it.** The offer appears after the **second** wrong check on the same chunk, alongside
  the hint rung: "Want to go back over how this works?" The student chooses.
- **E4. Return.** "Back to my step" is always visible during the lesson, so it never traps. Return lands on the same activity,
  question, **variant**, step and chunk. Fields hold exactly what the student left, revealed hints stay revealed, and the ladder
  level is unchanged. The tutor says one line: "Back to {stepLabel}. Your work is as you left it." The first correct check after
  return keeps today's `aha` (#663).
- **E5. Why staying on the same numbers is safe.** The rule in #42, "a revealed answer can never complete a question", is kept
  because a lesson never shows the live numbers (§4.4, content-tested). Today's switch exists only because the explanation walks
  the live numbers. With lessons it is no longer needed, so the student does not lose completed steps.

### 2.4 "I'm stuck"
- **S1.** It is an explicit, secondary control on every question (presentation: §7.3). It **counts as engagement** (H1), subject only
  to H5.
- **S2.** Its first response is the **lowest rung not yet granted on this step**. That is usually rung 2: restate the step's goal in
  one sentence, then a nudge. It never skips rungs. The response ends with two choices: "Show a hint" (next rung) and "Explain
  slowly" (lesson).
- **S3.** It is recorded like a hint request (a rung was granted). It is not a wrong answer and it is not a Check.

### 2.5 Interaction with progress, evidence and `explained`
Storage stays `cet-learn:v1:progress:<offering>` v1 (ADR-0005). Only the meanings below are added; no fields are added or changed.

| Event | `attempts` | `hintsUsed` / `independent` | `MasteryEvidence` | `explained` (skip gate) | `lastAt` (IA §7.2) |
|---|---|---|---|---|---|
| Input (engaged) | — | — | — | — | — (not meaningful) |
| Check | +1 (as today) | — | one record (as today) | — | bumped |
| Hint / "I'm stuck" | — | counts as help used (as today) | next record carries `hintsUsed > 0` | — | — |
| Explain Slowly opened from a question | — | the question can no longer complete *independent* (as today, `hintsEverUsed`) | next record carries `hintsUsed ≥ 1` | **set** (as today) | **not bumped** (IA §12.3) |
| Lesson opened on its own (not from a question) | — | — | — | **not set** | — |
| Lesson understanding check | — | — | **not stored** (session only) | — | — |
| Return, then correct check | +1 | supported | `correct: true`, `hintsUsed ≥ 1`: the evidence that the gap was rebuilt | — | bumped |

- **Evidence that the gap is rebuilt** comes from two places. In the session, the lesson's own understanding check (§4.2). Stored,
  the **next check on the returned step** with the student's own numbers. Both already exist, so nothing new is stored.
- A per-section "seen / check passed" record would be an additive optional field. It is **not proposed now**. The Auditor (§10) can
  ask for it later as a versioned addition.
- **Meaningful progress (IA §7.1) is unchanged:** an attempt or a completed question. Opening a lesson, being engaged, saying
  "I'm stuck" and drafts are never meaningful on their own.
- **The skip gate** ("one practice first-try correct, no Explain Slowly") keeps reading `explained`, which is set only from
  questions, so browsing lessons never blocks the skip.
- **Declared entries (#678 C1–C5):** unchanged. An entered step has its own `lessonRef`, so Explain Slowly there teaches that step
  only and never the earlier ones (C5, criterion 3).

---

## 3. Kinds that need chunked checking

**Guessing rule.** Whether a chunk invites guessing depends on its answer space:
- **Binary/ternary cells** (0/1/X, row picks): a chunk must hold enough cells that blind trial costs more than reasoning. The
  minimum is **8 cells** (≥ 256 combinations).
  - After a wrong check, the first wrong cell is marked only from the **second** wrong check on that chunk. The first gets the
    misconception nudge and the count, as today.
  - Every wrong check costs evidence. It is never independent.
- **Numeric / expression fields**: guessing is impractical, so a chunk may be **one item**, and the partially filled chunk may be
  checked ("check what I have"). The chunk is done when all its items are right.
- **Single pick from 2–4 options**: unchanged. The guard is the wrong-check ladder, not chunk size.

| Kind | Current unit (Lead fact 1) | Proposed reasoning unit | Why it doesn't invite guessing |
|---|---|---|---|
| **kmap**, fill | all 8/16 cells, including 0s | **(a)** From Σ: *place the 1s (and Xs)* as one chunk. Unfilled cells are taken as 0 at the check, or filled by one "rest are 0" tap once the 1s are right (UX). **(b)** From an expression (`km.q.from-expression`): **one product term at a time**, by tapping the cells the term covers. Then group → term → F, as today (owner: populate → verify → group → verify → expression) | (a) the student must locate every minterm. The answer is a set out of 2^8–2^16, and the count plus the first-wrong rule from the 2nd check keeps feedback coarse. (b) a term covers 2–4 cells out of 8/16, so trial is costly, and the unit is exactly the expansion skill |
| **kmap**, group / term / F | one group, one term, F | unchanged | each is already one reasoning unit |
| **truth-table**, fill, ≤ 8 rows | one column | unchanged | 8 cells meets the minimum |
| **truth-table**, fill, > 8 rows (three-JK, 4-input) | one 16-row column | **one 8-row block per column**, split on the most significant input (first half then second half, with a visible separator). Same column goal, same step tag. The block is a sub-chunk inside the step (ADR-0007: the step contract is unchanged, `grade` returns `partial` for the first block) | 8 binary cells per block (256 combinations). The split follows the table's own structure, so it is a meaningful half, not an arbitrary cut |
| **truth-table**, three-JK as a whole | 10 column steps in one question | **split into three questions on one variant set (#141):** JK inputs (6 columns) → next state (3 columns) → output y (1 column). Each later question shows the earlier columns as `given` (#568 type B) | not a guessing issue. Each question is one skill, `completedQuestions` records the stage, so resume loses at most one stage, and §5 item 5 is resolved |
| **truth-table**, row-select / mux-pairs | one pick set / one pair | unchanged | one pair is one decision. The ladder guards it |
| **cpu-schedule**, column of all jobs | finish / turnaround column | **numeric columns: one job per check, or check what I have** (graded cells lock when right). Radio and segment steps unchanged | numeric: one finish time cannot be guessed |
| **base-to-decimal**, row | every entry of a row | **weights row: unchanged** (one idea, powers of the base). **Terms row: check what I have** (numeric) | weights are a single pattern, so one check per row is right. Terms are numeric |
| **column-addition** | one column (sum + carry) | unchanged | the slides' unit. Binary sum + carry has 4 combinations, but the arithmetic is the skill and the ladder guards it |
| **timing** | every Q pick for one clock edge | unchanged | one edge is the reasoning unit, and it has several Q values |
| **memory-map** | one event | unchanged | already the unit |
| **state-diagram, device, circuit-predict, derivation, repeated-division, bit-grouping** | one pick / line | unchanged | already the unit |
| **expression, multiple-choice, numeric, place-value** | whole answer | unchanged **as a check unit**. Where the answer hides several skills, the fix is **content** (L1/L2/L3, §5), not a smaller check | a whole answer to a single-skill question is the unit. Splitting a hidden multi-skill question belongs to the practice, not the kind |

Kinds whose check unit changes: **kmap (fill), truth-table (> 8 rows; three-JK split), cpu-schedule (numeric columns),
base-to-decimal (terms row)**. Each change stays within ADR-0007 (sub-chunks are `partial` grades of one step) and ADR-0008
(inside the kind folder).

---

## 4. Reusable lesson architecture and lesson-entry mapping

### 4.1 Content model
Lessons are typed data (ADR-0002), separate from questions, in `src/lessons/<area>/<lesson>.ts`. A lesson can serve both courses.

```
Lesson   { id, title, conceptIds[], objectiveIds[], sections: Section[] }
Section  { id, title, goal,            // goal: one sentence, "After this you can …"
           screens: Screen[],
           needs?: SectionRef[] }      // prerequisite sections, shown as links, never forced
Screen   = concept | example | walkthrough | check | apply | return
SectionRef { lesson: string, section: string }
```

| Screen type | Content | Required? |
|---|---|---|
| `concept` | one idea in ≤ 2 short sentences, optional figure (ADR-0009) | a section has a `concept` **or** a `walkthrough` |
| `example` | a simple worked instance with **lesson-owned numbers**, shown on the kind's stage in demo mode (the kind's existing `Explain` entry point, ADR-0008) | optional |
| `walkthrough` | the reasoning, one idea per screen. **Same shape as today's `ExplanationStep`** (`say`, `stage`, `ask`), so the shared walk helpers port directly | optional |
| `check` | small understanding check: 1–3 items, multiple-choice or a one-chunk kind instance, lesson-owned numbers, with feedback | **required in every section** (evidence that the gap is rebuilt) |
| `apply` | nearby application: one item close to the step's skill, different lesson-owned numbers, graded, one nudge on a wrong answer | recommended for procedural sections |
| `return` | one-line recap and "Back to {stepLabel}", plus "Stay in the lesson" | added automatically when entered from a question |

Not every section needs every screen (owner point 5). The **minimum** is a concept or walkthrough, plus a check.
A content test enforces this.

Presentation of screens, sections and the return: §7.4 and §7.6.

### 4.2 Depth standard
The order is concept → simple example → walkthrough → check → apply → return. As in PEDAGOGY "Explain Slowly":
- one idea per screen;
- a prediction before each reveal where possible;
- no walls of text.

The check must test the idea, not recall of the screen. Examples:
- after the expansion walkthrough, the check is "Which minterms does x′z cover?";
- it is not "What did we multiply by?".

### 4.3 How a question step references a lesson
On the **question** (shared by its variants, because they share the skill), keyed by ADR-0007 step tag, exactly like `hintsByStep`:

```
Question.lessonRefs?: Record<stepTag | "*", SectionRef>     // "*" = single-answer kinds and the fallback
Question.alsoNeeds?:  SectionRef[]                          // extra skills a combined (L3) question relies on (§5)
```

- Resolution on Explain Slowly is: `lessonRefs[stepTag]`, then `lessonRefs["*"]`, then the legacy `variant.explanation` (E2).
- **Reuse:** many questions point at one section. For example, `km.q.expand`, `mt.q.expand` and the new L2 question all point at
  `minterms › expand-a-term`. `pg.q.page-number` and `pg.q.whole` point at `paging › page-and-displacement`. Fixing a section
  fixes every question that uses it.
- **Direct access:** a lesson, and any section, can be opened without a question (owner point 4). Opened this way, nothing is
  recorded (§2.5). Where lessons live in the navigation: §7.2.
- **Content tests (new):**
  - every ref resolves;
  - every section reached from a question has a check screen;
  - lesson numbers never equal a referencing variant's answer for that step (§4.4);
  - a question with `alsoNeeds` has every listed section referenced alone by an **earlier** question of the same practice or topic (§5).

### 4.4 Lesson numbers are never the live numbers
Lesson screens are not templates over `variant.vars`. They carry their own fixed values. A test compares the lesson's worked
values with the step answers of every variant that references the section and fails on a match.

This is what makes E5 safe. It also means one lesson serves 3–4 variants without being rewritten.

### 4.5 What "return to the same step with work preserved" requires of runner state
Restoring needs these: `qIndex`, the **variant id** (not the index, because ids survive content reordering), `stepIndex`, the sub-chunk
(§3), the **draft** values of the current chunk, `hints` (revealed), `tutor.hintLevel` / `grantedRungs`, and `completed[]`.

Two cases. **UX chose case A** (§7.1): the lesson opens in the same page and the runner stays mounted.

| Case | Requires | Storage |
|---|---|---|
| **A. The runner stays mounted** (the lesson is shown over or beside the problem in the same page) | Explain Slowly must **not** dispatch `SWITCH_VARIANT` / `RESET_INTERACTION` when a lesson section exists. The runner keeps a `detour: SectionRef \| null` instead of `explanation`. Kind views keep their own state because the key does not change | **none.** State lives in memory, with no format change |
| **B. The runner unmounts** (a lesson route, or leaving and coming back) | kinds must expose their draft as serialisable data. This is a small `draft` / `onDraft` contract in `KindModule` (ADR-0008 amendment), and the runner restores from a snapshot | **a versioned addition:** a *separate* key `cet-learn:v1:draft:<offering>`, one snapshot per activity `{ questionId, variantId, stepIndex, chunk, draft, hintLevel, at }`. Dropped when the question completes. Ignored if the variant id or step count no longer matches the content. Capped (e.g. 20 activities). The progress v1 format is **not** touched |

- I recommend **A first**: it meets the owner's return rule with no storage change. B is worth doing on its own merits, because
  Continue then resumes mid-step. That fixes the "leaving loses work" half of RC5.
- B needs an ADR-0005 amendment, because it is a new key with privacy notes. It is local only, holds no personal data, and the
  existing "clear my progress" control must also clear it.
- **Resume interplay (IA §7.2):** with B, Continue still picks the practice by `lastAt` and the question by first-unfinished order.
  Only then, if a matching snapshot exists for that question, it opens at the snapshot's variant and step instead of variant 0,
  step 0. A draft never bumps `lastAt`, and a `#q=` declared entry still wins over a snapshot.

---

## 5. Hidden multi-skill audit (Content inventory, judged)

**Ladder pattern** (owner point 6):
- **L1:** the simplest form of each skill, asked alone (read canonical).
- **L2:** one application of the new skill (convert one term).
- **L3:** the combined question, which is kept as it is.

L1/L2 go **before** the L3 in the same practice, or in the practice just before it in the same topic. Each one is self-contained
(#568 type A). They share the variant set ids when they share numbers (#141) and point at the same lesson sections. The L3 gets
`alsoNeeds` (§4.3), so a test keeps the order.

An L3 is **never a declared entry**: its skills are prerequisites (#678 criterion 4).

Verdicts: **L3+** = keep as L3 and add L1/L2 · **Reorder** = the lower levels exist but come after · **Scaffolded** = the kind or
earlier questions already stage it · **Single** = genuinely one skill.

| Pri | # | Question(s) | Verdict | What to add or change |
|---|---|---|---|---|
| **P1** | 1 | `km.q.expand` | **L3+** | L1: "Which Σ is F?" with F already in canonical (all 3-variable minterms written out). L2: expand one term, `xy = xy(z + z′) = xyz + xyz′ → m6, m7` (derivation, 3 variables). Then the existing L3. Lesson `minterms`, sections `read-canonical` and `expand-a-term`. This is the owner's example |
| **P1** | 4 | `dz.q.t-inputs`, `dz.q.jk-inputs` | **L3+** (no lower level anywhere) | L1: the excitation rule alone, "Q goes 0 → 1: what must J K be?" (multiple-choice, 4 transitions per FF type, with X explained). The rule currently lives only in hint rung 3 and Explain Slowly step 1. Lesson `flip-flops › excitation`. Content: also trace the T question line by line |
| **P1** | 16 | `fs.q.fcfs`, `fs.q.sjn`, `st.q.srt`, `pr.q.priority`, `rr.q.build`, `rr.q.quantum` | **Reorder + L3+** | Chart reading (finish, turnaround = finish − arrival, average) is practised only later, in `cm.q.*`. Add one L1 practice, "read a drawn chart", **before** `fs.q.fcfs`. The kind already stages choose → finish → turnaround → average inside each question. Affects 6 practices, so it has the widest reach |
| **P1** | 3 | `ff.q.eq-jk`, `ff.q.eq-t`, `ff.q.eq-d` | **Reorder + L3+** | Order D → T → JK, simplest first. L2 before JK: "pick the rows where Q(t+1) = 1" (truth-table row-select), then write the SOP. Simplification has a `needs` link to the Ch.2–3 section |
| **P2** | 18 | `cc.q.sequential`, `cc.q.concurrent` | **Reorder** | Move `cc.q.step-1` and `cc.q.step-2` before `cc.q.concurrent`. Content only, cheap |
| **P2** | 14 | `sg.q.physical` | **L3+** (no lower level) | L1: read a segment's base from the table (numeric). Section shared with `pg.q.physical` (base + displacement) |
| **P2** | 19 | `tp.q.irg`, `tp.q.ibg` | **L3+** for IBG, **Single** for IRG | IBG L2: blocks = records ÷ blocking factor, alone, then gaps = blocks − 1. IRG (n − 1) is one skill, so it needs only a lesson section |
| **P2** | 8 | `dz.q.problem-table` | **L3+** | L1: one arrow into one row ("from 010 with x = 1 the arrow goes to 011: fill this row"). `an.q.diagram` goes the other way and does not count |
| **P2** | 5 | `j3.q.table` | **Scaffolded in part → split** | Split into three questions (§3). Lower levels exist (`an.q.table`, `an.q.ex-table`) |
| **P2** | 2 | `km.q.from-expression` | **Scaffolded** once #1 lands | Populate per term (§3 kmap b). `alsoNeeds: minterms › expand-a-term` |
| **P3** | 6 | `an.q.ex-next-a`, `an.q.ex-next-b` | **L3+** | L2: substitute JA, KA into `JQ′ + K′Q` without simplifying (derivation line 1), then simplify (line 2). L1 exists (`ff.q.eq-jk`) |
| **P3** | 7 | `an.q.ex-table` | **Scaffolded** (equations come just before; the kind fills a column per step) | Prompt only: say "one column at a time, using the equations above", and show them (#568 type B) |
| **P3** | 9 | `dz.q.problem-trace` | **Scaffolded** by the timing kind (one edge per check) | The hidden part is evaluating 3–4-term D equations per edge. A lesson section with a check is needed (today: 2 screens, no prediction). No new question |
| **P3** | 10 | `mx.q.pairs` | **Scaffolded** (one pair per check) | The 0/1/z/z′ decision needs a lesson section with a check |
| **P3** | 13 | `pg.q.whole` | **Scaffolded** (all four parts come earlier in the topic) | Keep it as L3 with `alsoNeeds` on the four sections. The gap is lesson depth (2 screens) |
| **P4** | 15 | `pg.q.pages` | **Single** (minor) | Lesson point: "a partial page still takes a whole page". Optional L1 multiple-choice |
| **P4** | 20 | `ro.q.block` | **Single** (minor) | Lesson point only |
| **P4** | 22 | `lt.q.nand`, `lt.q.gated` | **Candidate**: trace first | Content traces the question. If the active-low reading is hidden, add an L1 "which input sets a NAND latch?" |
| — | 11 | `fa.q.algebra` | **Scaffolded** (the derivation names the law first) | none |
| — | 12 | `ns.q.read`, `ns.x.read` | **Single** (minor) | lesson point: read bottom to top |
| — | 17 | `cm.q.best` | **Scaffolded** (three schedules come just before) | none |
| — | 21 | `fx.*`, `dy.*`, `rl.q.compact` | **Scaffolded** by the memory-map kind | lesson depth only (2 screens, no check) |

**New questions:**
- P1: about 4 practices or questions (items 1, 4, 16, plus the reorder in 3).
- P2: about 5.
- P3: no new questions, only prompts and lessons.

Each new question needs ≥ 3 variant sets (owner, #192) and Arabic in the batch (ADR-0011).

---

## 6. Migration of existing content

Today each variant has an `explanation` (≥ 2 screens, over the live numbers): 307 questions × 3–4 variants. Lessons replace this
**as the target of Explain Slowly**, step by step. Nothing is deleted until a step's lesson exists.

**Starting map (automatable):** one lesson per topic (65), one section per objective. Every question already has `conceptId` and
`objectiveId`, so a script can:
1. propose `lessonRefs["*"] = { lesson: <topic>, section: <objective> }` for every question, and per step tag for staged kinds;
2. **group the existing text by section:**
   - CPET 181 `rule` screens (from the `mcq` and `count` builders) that share an objective become the draft `concept` screen.
     Identical rules are de-duplicated. The `apply` screen is per-variant and is **not** carried over, because it uses live numbers.
   - ECET 111 shared walk helpers (`additionWalk`, `divisionWalk`, `groupingWalk`, `flipWalk`, `arrowSteps`, `additionSteps`,
     `divisionSteps`) become `walkthrough` screens. Each is called once with lesson-owned numbers. Their `ask` predictions come
     along unchanged.
3. list, per section, the questions that reference it, their step tags, and the current screen and prediction counts. That is the
   authoring worklist.
4. run the §4.4 number-collision test.

**Must be authored (by a person, with Content and Pedagogy review):**
- every `check` screen. CPET 181 has **zero** predictions today, so all 9 chapters need them;
- `apply` items and the lesson-owned numbers;
- `concept` screens where the rule text is too dense for one idea (cpu-schedule averages 355 characters of `say`);
- the inline per-question ECET 111 explanations (truth table, K-map, flip-flops): their screens are kept as raw material, but the
  numbers must be replaced;
- Arabic for every new string, sent as one batch through the Lead (ADR-0011, #634 glossary).

**Order of migration** (pain first):
1. the §5 P1/P2 sections (they are needed by the new L1/L2 questions anyway);
2. CPET 181 chapter by chapter: all two-screen, no check;
3. ECET 111 two-screen topics (Laws and rules, De Morgan, Minterms, Analysing clocked circuits);
4. the rest.

**After migration:** when every step of a question resolves to a lesson, `variant.explanation` can become optional. That is a schema
relaxation, with a content test switch per question, so it is not big-bang. The per-variant walkthrough of the live numbers is then
retired. Rung 8/9 hints remain the "your numbers" help inside the problem.

---

## 7. UX implications

Role: UX / Design Engineer (on demand) · 2026-10-13. Fits the approved navigation model (IA §4, §12), R1 classroom layout,
`docs/DESIGN_SYSTEM.md` (44 px targets, one filled action per view, colour never the sole state carrier, motion only with meaning),
epic #110 (calm, no radical change) and ADR-0011 (`EN | عربي`, new labels in the shared map). Tutor: Mr. Mohanad.

### 7.1 Lesson presentation: one component, two hosts; the detour is **case A**

| Option | Verdict | Why |
|---|---|---|
| **Same page, runner stays mounted** (sheet on phone, focused overlay on tablet, side panel on desktop) | **Recommended** | No storage change (§4.5 A); return is a state flip, so fields, revealed hints and the ladder survive by construction; the tutor stays the same person in the same place; on phone the problem need not be visible (constraint 7) |
| Separate route `/…/<activity>/lesson/` | Rejected for the detour | Unmounts the runner: needs the `draft` contract, the `cet-learn:v1:draft` key and an ADR-0005 amendment before the first lesson can ship; Back becomes ambiguous (leave the lesson or leave the practice?) |
| Inline accordion under the prompt | Rejected | At 390 it pushes the problem off-screen anyway, and the lesson's numbers sit next to the live numbers (constraint 4) |

So: **one `LessonView` component with two hosts.** Host 1 is the **detour** (Explain Slowly, "I'm stuck → Explain slowly", the
E3 offer), rendered inside the practice page over the mounted runner. Host 2 is the **lesson page** for independent access (§7.2),
a static route. The screens, tutor and check look identical in both; only the header differs (detour: "Back to my step";
page: location line and "Practise this").

Detour geometry (no new breakpoints: ≤640, <900, ≥900):
- **390**: full-height sheet, slides up from the bottom edge, covers the stage; `role="dialog" aria-modal="true"`, focus trapped. The
  runner beneath is `inert`. The sheet keeps the top bar visible (logo, `EN | عربي`), so the student never loses the shell.
- **768**: the same sheet inset to a 600 px centred overlay (`aria-modal`), the problem dimmed to `--pending-opacity` behind it and
  read-only. The dim is the visual promise that the problem is paused, not gone.
- **1280**: a **side panel that takes the tutor column** (≥900 the R1 aside), widened to 440 px; the problem stays in the main column,
  read-only (fields `aria-disabled`, Check hidden, goal chip reads "Paused · lesson open"). Not modal: `role="region"
  aria-label="Lesson"`. Mr. Mohanad moves from the aside into the panel header, so the lesson is still him teaching.
- The sheet pushes one history entry with the hash `#lesson=<lesson>/<section>`; **browser Back closes the lesson** (popstate →
  `detour: null`), which is what phone users press. The hash is not a route; a reload with the hash opens the lesson over a fresh
  runner at step 0, the same loss as any reload today (case B fixes it later, §9 step 7).
- Problem and lesson never share a surface colour: the lesson body sits on `--surface-2` with a dashed border, eyebrow **Lesson ·**
  `<lesson> › <section>`, and every lesson stage carries the tag "Example numbers". The live problem never shows that tag.

### 7.2 Independent lesson access (learn before practising)

Lessons live **at topic level**, where the concepts and objectives they map to already live (§6 starting map). No global menu.

- **Topic page**: one quiet block **"Learn first (optional)"** between the preview board and "Recommended next": the topic's lesson
  sections as 1-line links, "Read canonical form · 3 min", "Expand a term · 4 min". It is never the filled button; Recommended next
  keeps pointing at a practice (browsing is not progress, IA §7.1).
- **Course page**: no new rows (calm). Topic rows keep the kind line from IA §12.1; a topic with lessons gets the word "Lessons"
  appended to its muted line ("… · Subtraction by 2's complement · Lessons").
- **Practice page**: the S2 navigator disclosure gets a second group "Lessons for this topic" under the practice list. Opening one
  from there is the **detour** (host 1), so the work stays. The group is hidden while a detour is open.
- **Lesson page** route: `/courses/<c>/<t>/learn/<lesson>/#<section>`, pre-rendered (ADR-0008), location line
  `ECET 111 › Ch 2 › Minterms › Lesson`, up = `← <topic>`. Its last screen offers "Practise this: Start · <practice>" (quiet link to
  the first practice referencing the section) and "Back to topic". Section list = a left rail at ≥900, a `<details>` above the
  body below it. Nothing is written to progress (§2.5).
- Guide, not trap: every lesson section is reachable from its topic page in two taps, leavable in one (up link or Back to my step),
  and no screen has to be finished to leave.

### 7.3 Controls in the practice

Action row under the stage, same at every width (wraps to two rows at 390):

```
[ Check rows 1–8 ▸ ]                                    ← the one filled button; its label names the chunk
Hint        I'm stuck        Explain slowly        ⋯    ← quiet text buttons, 44 px targets; ⋯ = skip menu, as today
```

- **Check names its chunk**: "Check column Q(t+1)", "Check rows 1–8", "Check the 1s", "Check group 2", "Check what I have",
  "Check" alone for single-answer kinds. The label comes from the step tag plus sub-chunk (§3), so the strip, the goal chip and the
  button all say the same thing. Disabled state as today (`aria-disabled`, never hidden) until the chunk's rule is met.
- **Goal chip** above the stage, left-aligned under the prompt: `Now: rows 1–8 of column Q(t+1) · 3 of 10 columns`. This is the
  "step as goal" line; it changes on every step or sub-chunk and is announced politely (§7.5).
- **Hint**: quiet, before engagement it stays enabled and answers in the tutor bubble "Try once first, or tell me you're stuck."
  (H1), so it is never greyed out and never pulses. Revealed rungs stack in the bubble as today (`HintReveal`).
- **"I'm stuck"**: a quiet text button, same weight as Hint, always present, no icon, no timer, no badge (constraint 5). Its reply
  (S2) ends with two inline chips in the bubble: `Show a hint` and `Explain slowly`. The 5 s guard (H5) is silent.
- **Explain slowly**: quiet, **always enabled** (E1). It is the only control that opens a lesson; its icon is a small open book so
  it reads as "instruction", not "help with my numbers" (constraint 3). Legacy fallback (E2) keeps today's walkthrough look.
- **⋯**: unchanged `SkipMenu`, last in the row, 44 px.
- **Idle line** (H2) is an ordinary tutor message in the bubble, no motion.
- Only one filled button per view: during the detour at 1280, Check is hidden (not disabled) in the main column, so the lesson's
  own Next / Check is the single filled action on screen.

Chunk boundaries on the stage:
- **Truth table > 8 rows**: a 2 px rule between rows 8 and 9 (the MSB flip), row numbers 1–8 / 9–16 in the gutter, and the active
  block in the active column gets `--focus-halo`; the other block of the same column is dim (`--pending-opacity`), inputs disabled.
  After the first block is right, its cells lock with a tick, the halo moves down, Check reads "Check rows 9–16". Repeated headers
  every 8 rows (existing phone pattern) coincide with the block edge.
- **K-map**: a three-chip **phase strip** over the map: `① Place the 1s  ② Group  ③ Expression`, current chip filled, later chips
  outlined. Verify is the Check at the end of each phase, so the chips are goals, not five steps. In phase ①, empty cells read as
  faint "·" and the Check is "Check the 1s"; when right, a one-tap quiet action **"Fill the rest with 0"** writes the 0s visibly
  (no auto-fill without the tap, so the student sees the map complete). Per-term variant (§3 b): the current product term is the
  goal chip ("Now: the cells x′z covers") and Check reads "Check x′z".
- **cpu-schedule numeric columns**: Check reads "Check what I have"; graded-right cells lock (tick, read-only), wrong cells get the
  error outline and keep their value, empty cells stay open. The column header carries the goal ("Finish times").
- **base-to-decimal terms row**: same "Check what I have" treatment; the weights row above it is locked once right.

### 7.4 Lesson screen types

Shared frame: eyebrow `Lesson · Minterms › Expand a term`, a small Mr. Mohanad head (the strip crop) beside the screen text,
screen dots `● ● ○ ○ ○` with the type name as the dot's title, body, footer. **"Back to my step"** is a quiet outlined button in
the header on every screen (constraint 1). The filled button in the footer is Next, or Check inside a check/apply screen.

| Screen | Visual pattern | Tutor's role |
|---|---|---|
| `concept` | heading = the idea in ≤ 2 sentences (`--text`, 18–20 px), optional ADR-0009 figure in `given` state. No inputs | states it once, pose `explain` |
| `example` | the kind's stage in demo mode on the lesson surface, tag "Example numbers", values pre-filled, nothing editable; a "Why?" disclosure under it | points at the stage (`point_left` ≥1200), one line |
| `walkthrough` | `say` left, `stage` right (stacked at 390); `ask` renders 2–4 option chips; the reveal appears only after a pick, with `afterCorrect` / `afterWrong` in the bubble | asks the prediction, then confirms; pose `think` on the ask |
| `check` | 1–3 items on the lesson surface, heading "Check your understanding", one filled **Check** inside the screen; right → tick and one sentence; wrong → one nudge and "Read it again" (back one screen). Never required to leave | gives the feedback, never the answer before a try |
| `apply` | one graded item, heading "Try one", same look as check; wrong → one nudge, then "Show me" reveals the lesson's answer (lesson numbers, so it is safe) | nudges once |
| `return` | recap in one line, **[ Back to my step ]** filled (the only screen where it is), quiet "Stay in the lesson" | says "Back to {stepLabel}? Your work is as you left it." |

Understanding check vs the practice Check: the lesson Check sits inside the lesson surface, grades lesson numbers, writes nothing
to progress and never shows the practice's goal chip, so a student can tell the two apart at a glance.

### 7.5 Return mechanics, Arabic and RTL, accessibility, motion

**Return (E4, constraint 2).** Closing the lesson (Back to my step, the return screen, Escape, or browser Back) sets
`detour: null`; the kind views were never unmounted, so cells, drafts, revealed hints and `hintLevel` are exactly as left. Then:
1. focus moves to the element the runner recorded on the last "engaged" input (or the first empty cell of the chunk; fallback Check);
2. the active chunk's `--focus-halo` is re-drawn once (static outline under reduced motion);
3. the tutor bubble shows "Back to {stepLabel}. Your work is as you left it." and the goal chip is unchanged.
The hash entry is popped so a second Back leaves the practice, as before the lesson.

**Arabic and RTL.** All labels above (Check rows 1–8, I'm stuck, Explain slowly, Learn first, Back to my step, Example numbers,
Fill the rest with 0, the phase chips) enter `docs/localization/ar/source-texts.ar.json` before release. Lesson prose, tutor
lines and the action row follow the document direction (`dir="rtl"`, logical flex, so the filled Check sits at the reading start).
The stage, tables, K-maps, charts, expressions and all numbers stay LTR inside `dir="ltr"` isolates (`<bdi>` for inline
numbers): **no mirroring** of figures or tables. The phase strip's order follows reading direction but its numerals ①②③ keep
their value. The 1280 lesson panel takes the tutor column wherever that column is under RTL (logical `inline-end`).

**Accessibility.** Sheet and overlay are modal dialogs with the title focused on open and the runner `inert`; the 1280 panel is a
region whose heading receives focus on open. One `role="status"` live region (the existing tutor bubble) announces the return
line, check feedback and goal-chip changes (`aria-live="polite"`); screen dots are a `<nav aria-label="Lesson screens">`. Escape
closes the detour at every width. Locked cells are `readonly` with a tick glyph plus text, never colour alone. All targets 44 px.

**Motion.** Sheet: 200 ms slide (`--dur-base`), overlay/panel: 120 ms fade; return: one halo redraw; all instant under
`prefers-reduced-motion`. Nothing pulses on a timer; "I'm stuck", Hint and Explain slowly never animate to attract attention.

### 7.6 Low-fi mockups (390 · 768 · 1280)

**390** — practice with controls · lesson opened from step 4 · return
```
┌───────────────────────────────┐ ┌───────────────────────────────┐ ┌───────────────────────────────┐
│▣ CET Learn ← Three JK  EN|عربي│ │▣ CET Learn             EN|عربي│ │▣ CET Learn ← Three JK  EN|عربي│
│ECET 111 › Ch 5 › Three JK      │ │ Lesson · Flip-flops › JK rule  │ │ECET 111 › Ch 5 › Three JK      │
│Next-state table                │ │            [ Back to my step ] │ │Next-state table                │
│● ● ● ◉ ○ ○ ○ ○ ○ ○  Step 4/10  │ │ ● ● ○ ○ ○   walkthrough 2 of 5 │ │● ● ● ◉ ○ ○ ○ ○ ○ ○  Step 4/10  │
│┌ Mr. Mohanad ─────────────────┐│ │┌ Mr. Mohanad ─────────────────┐│ │┌ Mr. Mohanad ─────────────────┐│
││"Rows 1–8 first. Which rows   ││ ││ "If J=1 and K=0, what does Q ││ ││"Back to column Q_A(t+1). Your││
││ flip?"                       ││ ││  do on the clock edge?"      ││ ││ work is as you left it."     ││
│└──────────────────────────────┘│ │└──────────────────────────────┘│ │└──────────────────────────────┘│
│Now: rows 1–8 of Q_A(t+1) · 4/10│ │ ┌ Example numbers ───────────┐ │ │Now: rows 1–8 of Q_A(t+1) · 4/10│
│  #  A B C │ JA KA │ QA(t+1)    │ │ │  J K │ Q → Q(t+1)          │ │ │  #  A B C │ JA KA │ QA(t+1)    │
│  1  0 0 0 │ 1  0 │ [1]   ╮    │ │ │  1 0 │ 1 →  ?              │ │ │  1  0 0 0 │ 1  0 │ [1]   ╮    │
│  2  0 0 1 │ 0  1 │ [ ]   │halo│ │ └────────────────────────────┘ │ │  2  0 0 1 │ 0  1 │ [▌]   │halo│  ← focus
│  …  …     │      │ [ ]   ╯    │ │  ( ) stays 1  ( ) becomes 0    │ │  …  …     │      │ [ ]   ╯    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │  ( ) toggles  ( ) sets to 1    │ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  9  1 0 0 │ … dim, disabled    │ │                                │ │  9  1 0 0 │ … dim, disabled    │
│ 16  1 1 1 │                    │ │                                │ │ 16  1 1 1 │                    │
│[ Check rows 1–8 ▸ ]            │ │               [ Next ▸ ]       │ │[ Check rows 1–8 ▸ ]            │
│Hint  I'm stuck  Explain slowly ⋯│ │ sheet · Esc / Back closes      │ │Hint  I'm stuck  Explain slowly ⋯│
└───────────────────────────────┘ └───────────────────────────────┘ └───────────────────────────────┘
```

**768** — the lesson is a centred overlay; the problem is dimmed and read-only behind it
```
┌──────────────────────────────────────────────────────────────────────┐
│▣ CET Learn   ← Three JK flip-flops                          EN|عربي ◯│
│ ECET 111 › Ch 5 › Three JK         Next-state table    ● ● ● ◉ ○ 4/10 │
│ ┌ Mr. Mohanad "Rows 1–8 first…" ┐  Now: rows 1–8 of Q_A(t+1) · 4/10  │
│ ░░░░░░░░░░░░┌──────────────────────────────────────────┐░░░░░░░░░░░░░│
│ ░ table    ░│ Lesson · Flip-flops › JK rule   [Back to my step]       │
│ ░ dimmed,  ░│ ● ● ● ○ ○   check 4 of 5                 │░ (read-only)│
│ ░ paused   ░│ Check your understanding                 │░            │
│ ░          ░│ ┌ Example numbers ────────────────────┐  │░            │
│ ░          ░│ │ Q=0, J=1, K=1.  Q(t+1) = ?          │  │░            │
│ ░          ░│ └─────────────────────────────────────┘  │░            │
│ ░          ░│ ( ) 0   (•) 1   ( ) unchanged            │░            │
│ ░          ░│                       [ Check ]          │░            │
│ ░░░░░░░░░░░░└──────────────────────────────────────────┘░░░░░░░░░░░░░│
│  (Check hidden while the lesson is open)   Hint  I'm stuck  Explain… ⋯│
└──────────────────────────────────────────────────────────────────────┘
```
Return at 768: the overlay fades, the dim lifts, focus lands on the half-filled cell in row 2, the bubble reads
"Back to column Q_A(t+1). Your work is as you left it.", and `[ Check rows 1–8 ▸ ]` reappears as the one filled button.

**1280** — practice (left) and the lesson in the tutor column (right); the return state below
```
┌──────────────────────────────────────────────────────────────────┬────────────────────────────────────┐
│▣ CET Learn   ← Three JK flip-flops                                │                       EN|عربي ◯ Guest│
│ ECET 111 › Ch 5 › Three JK                                        │ Lesson · Flip-flops › JK rule       │
│ Next-state table   ▸ Practices in this topic (4 of 5)              │ [ Back to my step ]                 │
│ ● ● ● ◉ ○ ○ ○ ○ ○ ○   Step 4 of 10                                 │ ● ● ○ ○ ○  walkthrough 2 of 5        │
│ Paused · lesson open                                               │ ┌ Mr. Mohanad (head) ─────────────┐│
│  #  A B C │ JA KA │ QA(t+1)   (fields aria-disabled)               │ │ "If J=1 and K=0, what does Q do ││
│  1  0 0 0 │ 1  0 │ [1]                                            │ │  on the clock edge?"            ││
│  2  0 0 1 │ 0  1 │ [ ]                                            │ └─────────────────────────────────┘│
│  …        │      │                                                │ ┌ Example numbers ───────────────┐ │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │  J K │ Q → Q(t+1)              │ │
│  9 … 16   dim                                                      │ │  1 0 │ 1 →  ?                  │ │
│                                                                    │ └────────────────────────────────┘ │
│ (no Check while the lesson is open)   Hint  I'm stuck  Explain… ⋯  │ ( ) stays 1  ( ) becomes 0        │
│                                                                    │ ( ) toggles  ( ) sets to 1        │
│                                                                    │                        [ Next ▸ ]  │
└──────────────────────────────────────────────────────────────────┴────────────────────────────────────┘
after return:
│ Now: rows 1–8 of Q_A(t+1) · 4 of 10        rows 1–8 halo redrawn   │ Mr. Mohanad (waist-up, point_left)  │
│  2  0 0 1 │ 0  1 │ [▌]  ← focus returns here                        │ "Back to column Q_A(t+1). Your work │
│ [ Check rows 1–8 ▸ ]   Hint  I'm stuck  Explain slowly  ⋯          │  is as you left it."                │
```

Before the practice (any width), the same stage with the K-map phase strip, for reference:
```
│ ① Place the 1s   ② Group   ③ Expression        Now: place the 1s of Σ(1,3,5,7)        [ Check the 1s ▸ ] │
```

**Storage:** none. Case A needs no new key and no ADR-0005 amendment; the only new runner field is `detour` (in memory).
Case B (draft key) stays a later, separate step (§9 step 7) and does not change anything drawn here.

---

## 8. Risks and backward compatibility

| Risk | Mitigation |
|---|---|
| Explain Slowly always open reduces productive struggle | the lesson never shows live numbers (§4.4), completion after it is never independent (§2.5), the tutor offers it only after the 2nd wrong check (E3), and the student must still solve their own step |
| "I'm stuck" used as a reflex | lowest rung only, one rung per request, 5 s guard (H5), recorded as help |
| Smaller binary chunks invite trial | 8-cell minimum, first wrong cell marked only from the 2nd wrong check, evidence cost (§3) |
| A lesson number collides with a variant's answer | content test (§4.4) |
| Legacy fallback still loses the steps | temporary, and it disappears per question as its sections land. P1 sections first |
| Storage | progress v1 unchanged. Case B adds a **separate** draft key, versioned and tolerant (an unknown variant or step count means ignore and start at step 0), and needs an ADR-0005 amendment |
| Schema | additive and optional (`lessonRefs`, `alsoNeeds`, lessons). Old content validates unchanged. `explanation` stays required until §6 relaxes it per question |
| Bundle size | lessons are lazy data chunks loaded on Explain Slowly or on lesson open, never in the activity's first load (ADR-0008, #683 option C) |
| Interplay with #670 | `explained` and `lastAt` rules unchanged from IA §7/§12.3. `#q=` entry wins over a draft snapshot. Entered steps teach only their own section (#678 C5) |
| Authoring and Arabic volume | the automatable map (§6) cuts drafting. Authored screens are batched per chapter, and Arabic goes in one batch per release |
| ADR-0007 `partial` semantics with sub-chunks | a sub-chunk is a `partial` grade of the same step tag, so the tutor ladder and `hintsByStep` keep working. Reviewer to confirm |

Docs that change once this is approved: `docs/PEDAGOGY.md` (gate rules, Explain Slowly, chunk rule), `docs/TUTOR_ENGINE.md`, a new
ADR "Lessons and lesson references" (§4), and amendments to ADR-0007 (sub-chunks), ADR-0008 (kind draft contract, case B only) and
ADR-0005 (draft key, case B only).

---

## 9. Implementation order (Pedagogy's suggestion; the Lead finalises)

1. **Gate rules** (§2.1–2.4, tutor engine and runner only):
   - Explain Slowly ungated;
   - engagement signal, and typing resets idle;
   - "I'm stuck";
   - the 45 s idle no longer gates.

   Smallest change, largest relief. Legacy explanations keep the variant switch for now.
2. **Cheap content fixes:** reorders (§5 items 3, 18) and the `an.q.ex-table` prompt.
3. **Chunk changes** (§3): K-map "1s first" / per term, truth-table 8-row blocks, three-JK split, numeric "check what I have".
4. **Lesson ADR and schema** (`Lesson`, `lessonRefs`, `alsoNeeds`, tests), plus the **case A detour**: no variant switch when a
   section exists. UX §7 decided first.
5. **Pilot lessons with the P1 audit:**
   - `minterms` (#1, #2), with its L1 and L2;
   - `flip-flops › excitation` (#4);
   - CPU-scheduling chart reading (#16).

   Pedagogy and the Auditor review the pilot with learners' evidence before scaling.
6. **Migration script and the CPET 181 lessons**, chapter by chapter, then ECET 111's two-screen topics (§6).
7. **Draft persistence (case B)** after the ADR-0005 amendment: return across routes and mid-step Continue.
8. Retire `variant.explanation` per question as its coverage completes.

---

## 10. Educational Integrity Auditor (Lead, see #684)

