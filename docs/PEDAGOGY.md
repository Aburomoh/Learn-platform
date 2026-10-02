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

## Pedagogy veto
The Pedagogy Engineer may file `PEDAGOGY VETO — TASK-###` (advisory to the owner; format in
`agents/pedagogy_engineer.md`, issue template `.github/ISSUE_TEMPLATE/pedagogy-veto.yml`).
Typical triggers: answers revealed too early, passive text walls, distracting animation,
cognitive overload, AI doing the student's reasoning, inaccessible activity.
