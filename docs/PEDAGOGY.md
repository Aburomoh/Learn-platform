# Pedagogy

Optimise for learning, not answer acquisition. Preserve productive cognitive effort.

## Dominant cycle
**Attempt → feedback → optional scaffold → re-attempt.** Students get a chance to answer before
any explanation. Never reveal the solution after one wrong attempt.

## Scaffold ladder (offered progressively; the student may stop anywhere)
1. Independent retry
2. Gentle nudge
3. Concept reminder
4. Socratic question
5. Visual hint (focus/highlight on the stage)
6. Decomposition into steps
7. Analogous example
8. Guided explanation
9. Full explanation (when appropriate)

The tutor engine moves down the ladder based on attempts, hesitation, hint requests and known
misconceptions (`TUTOR_ENGINE.md`). Rungs may be skipped when a misconception is recognised.

## Explain Slowly
Available on demand wherever appropriate. Genuinely slow: short explanation → interaction →
short explanation → visual change → question → response → continuation. Each step carries one
idea and, where possible, one `PredictionBeforeReveal` question. No walls of text.

## Tutor voice
Short, direct, mostly quiet. "Look at this part again." "What happens to the remainder?"
"Good. Now change this value." Reactions, not lectures.

## Language
Technical terms stay in English as students meet them in class. Surrounding explanation uses
plain English; restrained Arabic support can be added per message key later. No slang, no
caricature.

## Authoring rules for content
- Every question carries: concept, objective, answer, distractors with known-mistake tags,
  hints in ladder order, explanation steps, retry variation(s), tutor reactions.
- Distractors encode real misconceptions, not random wrong values.
- Every interaction has a learning purpose; movement communicates meaning.

## Step size (owner rule, 2026-10-03)
A question asks for one small step, never a whole procedure. Procedures taught in class are
walked through in the same layout and order as the slides (for example: divide by 2 one step at
a time, then read the remainders, then group the bits). A content test guards this for
number-base conversion.

Each step is a goal by itself (owner, 2026-10-03, #42). The next step appears only after the
current one is done; earlier steps stay done. Be patient: no time pressure, and a wrong step is
retried on its own. Grouping for octal/hex is its own checked step before the digits (#44).

After Explain Slowly the next attempt uses different numbers (another variant), so a revealed
answer can never complete a question (#42). Every content task needs at least two variants.
Variant ids are an activity-level number set: a shared id means shared numbers, and it must sit
at the same index in every question that has it. A finished question passes its set on to the
following questions (#141).

## Pedagogy veto
The Pedagogy Engineer may file `PEDAGOGY VETO — TASK-###` (advisory to the owner; format in
`agents/pedagogy_engineer.md`, issue template `.github/ISSUE_TEMPLATE/pedagogy-veto.yml`).
Typical triggers: answers revealed too early, passive text walls, distracting animation,
cognitive overload, AI doing the student's reasoning, inaccessible activity.
