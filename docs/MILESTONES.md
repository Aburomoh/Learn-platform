# Milestones

## M0 — Organisation (done 2026-10-03)
Repository, charters, state files, shared protocols, docs, ADRs 0001–0006, CI, PR/issue
templates, wake workflow, `.claude/agents` launchers, Next.js scaffold.

## M1 — First vertical slice (done 2026-10-03, awaiting owner walkthrough)

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

## M1.1 — Owner feedback on M1 (in progress)
Owner walkthrough, 2026-10-03: questions were too large (a full decimal-to-binary conversion in one
step) and the circuit drawing was unclear. Changes: #20 walked divide-by-2 flow following ECET 111
Chapter 1 (DivisionChain, step-aware tutor, read-off, octal and hex by grouping) — PR #25; #19 circuit
diagram with standard symbols and right-angle wires — PR #23; #21 Vercel project linked — PR #22.

**Director review (2026-10-03).** Feedback 1 (steps too large): fixed for decimal → binary — each
division is its own checked step. Feedback 2 (unclear circuit): drawing fixed, but the question still
asks for Y across three gates in one answer, the same size problem. Condition to close M1.1: a
gate-by-gate circuit walk (stage uses `activeGateId`; one checked answer per gate), pedagogy-reviewed,
and owner re-walk. Pedagogy vetoes #42 (High), #44 and #45 are pending owner decision
(DECISIONS_FOR_OWNER item 6; team recommends accepting all three). M1.2 approved with conditions on #47.

## M2 — Real content for one course (proposed, not started)
Owner supplies slides/questions for one CET course; Backend/Data + Pedagogy structure it with
the M1 schema and record what the schema lacks (input to the Instructor Studio design).

## Status log (newest first)
- 2026-10-03 — Director: M1.1 close-out = #32; vetoes #42/#44/#45 pending owner; M1.2 approved with conditions (#47); PR #26 resolved (owner approved).
- 2026-10-03 — M1.1 opened from owner feedback; course renamed to ECET 111, Chapter 1 method adopted.
- 2026-10-03 — M1 complete on `main`; 9 tasks closed via PRs #10–#18; 73 unit + 8 e2e tests green.
- 2026-10-03 — M0 complete; M1 tasks created; implementation started.
