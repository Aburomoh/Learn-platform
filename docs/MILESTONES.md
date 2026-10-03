# Milestones

## M0 — Organisation (done 2026-10-03)
Repository, charters, state files, shared protocols, docs, ADRs 0001–0006, CI, PR/issue
templates, wake workflow, `.claude/agents` launchers, Next.js scaffold.

## M1 — First vertical slice (closed 2026-10-04)

**Product Manager proposal.** One demo course "Digital Logic Fundamentals (DEMO)" with two
topics chosen by the owner: Number Systems and Logic Gates. Activity 1 (decimal → binary with
place-value drag, then hex) receives the full slice; Activity 2 (predict a small circuit's
output, identify a gate) reuses the same engine and components.

**Director review.** Approved with conditions: no server or AI calls; content clearly marked
DEMO; components documented as an internal product; pedagogy review on content, engine and
runner PRs; no production release without owner approval. All conditions met.

**Acceptance (mission §38) — verified by `e2e/smoke.spec.ts` at 1280×800 and Pixel 7.**
A guest opens an activity, attempts a question (keyboard drag, mouse/touch drag, radio, text),
receives short rule-based guidance with an expression change and a focus/highlight action,
requests hints down the ladder, requests Explain Slowly with predictions before reveal, retries
on a reset stage, completes, and sees progress survive a reload. Zero network requests after
page load. No horizontal overflow on mobile.

**Delivered (PRs #10–#18).** Content schema + grader + demo course · Learning Shell · 7
interaction components (MultipleChoice, NumericInput, HintReveal, PredictionBeforeReveal,
DragToTarget, PlaceValueDiagram, CircuitDiagram) · tutor engine + catalog + adapter · tutor UI ·
offering-scoped local progress + settings · ActivityRunner · smoke tests.

**Known gaps / backlog (not in M1).** Arabic message catalog · octal/hex ↔ binary grouping
drills · IEEE-754 activity · Sortable/Matching/SequenceBuilder/CodeStepper components ·
Vercel preview deployments (owner action, see DECISIONS_FOR_OWNER) · real course content.

## M1.1 — Owner feedback on M1 (closed 2026-10-04)
Owner walkthrough, 2026-10-03: questions were too large (a full decimal-to-binary conversion in one
step) and the circuit drawing was unclear. Changes: #20 walked divide-by-2 flow following ECET 111
Chapter 1 (DivisionChain, step-aware tutor, read-off, octal and hex by grouping) — PR #25; #19 circuit
diagram with standard symbols and right-angle wires — PR #23; #21 Vercel project linked — PR #22.

**Director review (2026-10-03).** Feedback 1 (steps too large): fixed for decimal → binary — each
division is its own checked step. Feedback 2 (unclear circuit): drawing fixed, but the question still
asks for Y across three gates in one answer, the same size problem. Condition to close M1.1: a
gate-by-gate circuit walk (stage uses `activeGateId`; one checked answer per gate), pedagogy-reviewed,
and owner re-walk. Pedagogy vetoes #42 (High), #44 and #45 accepted by the owner and added to the close-out, with the
phone fixes #52–#54. M1.2 approved with conditions on #47.

**M1.1 close-out (before M1.2 frontend, tutor and content work).** #32 gate-by-gate circuit walk
(Frontend); pedagogy vetoes on #25 (accepted by the owner, 2026-10-03): #42 retry on another variant after Explain Slowly (AI Tutor,
High), #45 content fixes (Backend), #44 octal/hex grouping as two checked steps (Frontend, after #32).

## M1.2 — ECET 111 Chapter 1 complete (closed 2026-10-04)
Rest of Chapter 1 after M1.1 closes (#32 gate-by-gate circuit walk): binary addition, 1's and 2's
complement, subtraction by 2's complement, and the slide exercises. Every question is walked in
checked steps (owner feedback of 2026-10-03); all content DEMO until instructor approval.

| # | Task | Role | Depends on |
|---|---|---|---|
| #33 | `column-addition` schema + grader | Backend | — |
| #35 | 1's complement: `bit-row` context + first-wrong-bit detector | Backend | — |
| #43 | Exercise: 88 and 73 conversions (existing kinds) | Backend | #42, #44 |
| #34 | ColumnAddition interaction | Frontend | #33 |
| #36 | `bit-row` aligned-cells presentation | Frontend | #35 |
| #37 | Tutor messages for both | AI Tutor | #33, #35 |
| #38 | Binary addition activity (1101 + 0111) | Backend | #34, #37 |
| #39 | 1's and 2's complement activity | Backend | #34, #36, #37 |
| #40 | Subtraction by 2's complement, positive (13−9, 12−6) | Backend | #39 |
| #41 | Exercise: 15−4 and 10−14 (negative result) | Backend | #40 |

Content and interaction tasks carry pedagogy review. Only #33 and #35 (schema + grader, nothing
learner-facing) are `ready` now; the rest go `ready` as their dependencies merge, after the M1.1
close-out. Technical Lead decision (#47): no new kind for 1's complement — `numeric` with a `bit-row`
context; 2's complement is that plus +1 through `column-addition`.

**Variant rule (from #42).** Every content question has at least two variants: the walked example
(Explain Slowly) uses one, the retry uses another, so an explained answer can never complete it.

## M2 — Real content for one course (superseded by epic #192: complete ECET 111, milestones C1–C6)
Owner supplies slides/questions for one CET course; Backend/Data + Pedagogy structure it with
the M1 schema and record what the schema lacks (input to the Instructor Studio design).

## Status log (newest first)
- 2026-10-04 — Director: M1, M1.1, M1.2 and R1 (#110) closed on the owner's verdict (quoted on #192). Next: ECET 111 complete (#192); plan approval on #193.
- 2026-10-04 — Director: M1.1, M1.2 and R1 redesign all on main (57624e6; 301 unit, 40 e2e green); combined owner walkthrough requested (DECISIONS item 5).
- 2026-10-03 — M1.2 complete on `main`: binary addition, 1's/2's complement, subtraction (positive and negative), exercises 88/73 and 15−4/10−14, base subscripts (#55); follow-ups #141, #158, #170 closed. All content DEMO until instructor approval.
- 2026-10-03 — Owner accepted vetoes #42/#44/#45; rule: each step is its own goal. M1.1 close-out = #32, #42, #44, #45, #52–#54.
- 2026-10-03 — Director: M1.1 close-out = #32; vetoes #42/#44/#45 pending owner; M1.2 approved with conditions (#47); PR #26 resolved (owner approved).
- 2026-10-03 — M1.1 opened from owner feedback; course renamed to ECET 111, Chapter 1 method adopted.
- 2026-10-03 — M1 complete on `main`; 9 tasks closed via PRs #10–#18; 73 unit + 8 e2e tests green.
- 2026-10-03 — M0 complete; M1 tasks created; implementation started.
