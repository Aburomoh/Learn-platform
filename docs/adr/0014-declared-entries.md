# 0014 — Declared entries: a self-contained question may be opened directly (amends 0007 and 0008)
Status: Proposed · Date: 2026-10-14 · Owner: UI / Interaction Engineer (epic #670 S3, #679; IA audit §8.4, §12.4; Pedagogy C1–C5 on #678, binding)

## Context
The practice is the unit of entry: a direct URL, the navigator and resume all land on a practice
page and the runner starts at challenge 1 (or resumes at the first unfinished one). A student who
wants one skill inside a practice (Best-fit, the "Add" step of a subtraction) has only the hidden ⋯
skip, which records a skip. The owner's refinement 4: practices stay freely selectable; a *step*
is entered only through a content-declared entry, shown as a secondary link, never the primary
choice. ADR-0007 defines steps *inside* a question; this amendment is about the questions of a
practice (the challenge strip), which the student sees as its steps.

## Decision
1. **`entry?: boolean` on a question** (`QuestionSchema`). Content flags it against the #678
   criteria (self-contained on every variant, a named skill with its own objective, hints and
   explanations that never lean on earlier questions, not question 1, a label that stands alone).
   A content test enforces what a test can: an entry has a `label`, is not the first question, and
   a practice has at most one entry (C1, "for now"). The manual direct-entry check stays the
   Reviewer's. First flags: `fx.q.best`; the five `*.q.add` after #672.
2. **`#q=<questionId>` on the practice URL opens that question** when, and only when, it is a
   declared entry; any other value is ignored and the page behaves as without it. The runner reads
   the hash at mount the way it reads `?review=1` (`startState`): the exported route and its HTML
   are unchanged, since a hash never reaches the server (the 0008 part). Precedence: a declared
   `#q=` wins over `?review=1` and over a `started` record; a resume still picks the practice by
   `lastAt` and lands on the first unfinished question when there is no `#q=` (ADR-0013 rule 7).
3. **Entering marks nothing.** Earlier questions stay neither done nor skipped (`completedQuestions`
   and `skippedQuestions` untouched; no "skipped ahead"; the strip's earlier dots stay empty). The
   practice completes only when every question is done. Opening an entry writes nothing to
   progress (ADR-0013: not meaningful); the first attempt there does, as anywhere.
4. **The "Steps before this one" strip** shows on the entered question only, while earlier
   questions are still open: plain muted text, not a live region, no links, no values from earlier
   questions: "Steps before this one: First-fit" and "You started here. They are not done yet, and
   this step does not need them." Labels joined with " · ".
5. **The way in is one secondary link per practice row** (topic page and the S2 navigator):
   "Start at: Best-fit" under the row's primary action, visibly smaller, never a filled button,
   never on Home, never on a Continue, never suggested by the tutor (C1). It links to
   `<practice>/#q=<id>`.
6. **The end of the chain (C3).** When the entered question and every later one are done while an
   earlier one is still open, the runner does not wrap silently to it (today's `NEXT_QUESTION`): it
   ends with "You finished the steps from Best-fit on. Still to do: First-fit.", a primary "Do
   First-fit" (the first open question, in the runner) and a quiet "← <topic>". An offer, never
   forced. Nothing is written as complete until every question is done.
7. **Tutor and feedback unchanged** (C5): the ladder, Explain Slowly and retry on new numbers are as
   today; an entered question starts on the activity's first set and later questions follow it
   (#141); the "Stuck? You skipped…" offer never fires for an entry and the tutor never offers
   earlier questions.
8. **Resume after an entry** keeps today's rule (first unfinished question); going back to the
   entered question would need a stored "last question", which is not added now (Pedagogy's
   advisory). A `#q=` on a declared entry still wins over that rule (2).

## Consequences
Journey D (Best-fit) becomes: topic page → "Start at: Best-fit" (or the navigator's same link) →
the practice at Best-fit with the strip; the ⋯ skip is no longer the only route into a known
skill (the structural gate). Journey C follows once #672 flags the "Add" questions. Content
tests guard the flag; `src/content/schema.ts`, `src/content/content.test.ts`, `runnerReducer.ts`
(`entryRunnerState`, the end-of-chain offer), `ActivityRunner.tsx` (hash at mount, the strip),
`TopicNavigator.tsx` (`PracticeRows`: the secondary link), `ActivitySummary` (the C3 offer) and
`primaryAction.ts` (`entryHref`) change; storage does not. New strings for the Arabic batch
(#676): `ui.row.start-at` "Start at: {label}", `ui.stage.before` "Steps before this one:
{labels}", `ui.stage.before-note` "You started here. They are not done yet, and this step does not
need them.", `ui.stage.remaining` "You finished the steps from {label} on. Still to do: {labels}",
`ui.stage.do` "Do {label}". Tests: schema and content guards; reducer (entry state, nothing marked,
the end-of-chain offer, an unknown or non-entry `#q=` ignored, precedence over review and resume);
`PracticeRows` (the link only on an entry row, never the primary); e2e journeys C and D at 390 and
1280 (the link, the landing question, the strip, the empty earlier dots, the offer at the end, no
progress written on entry).

## Alternatives considered
Arbitrary `#q=<k>` for any question: unsafe for continuations (§8.3) and it blurs practice
selection and step entry. A primary "Start at" button: the owner excluded it (refinement 4). A
stored "entered at" for resume: a storage addition for an advisory benefit; later if wanted.
