# Tutor Engine

Deterministic, rule-based, client-side. No LLM in v1 (ADR-0003). Code: `src/tutor/`.

## Contract
```ts
reduce(state: TutorState, event: LearningEvent, ctx: ActivityContext): { state: TutorState; actions: TutorAction[] }
```
Pure function: same inputs → same outputs. Unit-tested without React.

## Inputs
- **LearningEvent**: `ACTIVITY_OPENED`, `ANSWER_SUBMITTED {correct, misconceptionId?}`, `STEP_COMPLETED`,
  `HINT_REQUESTED {sinceStepMs?}`, `EXPLAIN_SLOWLY_REQUESTED {confirmed?}`, `EXPLANATION_STEP_DONE`,
  `RETRY_REQUESTED`, `PREDICTION_MADE {correct}`, and the engagement events (#690, learn 1a):
  - `ENGAGED`: the first edit of a field in the current step; sent once per step by the runner.
  - `STUCK_REQUESTED {sinceStepMs?}`: "I am stuck".
  - `IDLE {seconds}`: the runner's idle clock; every input resets it.
  - `HESITATION {seconds}` is deprecated: the pre-#690 runner sends it and it keeps its old gate-opening
    until the runner sends `ENGAGED` and `IDLE` (learn 1b), then it is removed.
- **TutorState**: `attempts`, `engaged`, `idlePrompted`, `hintLevel` (0–9 ladder rung), `stage` (`await_answer` |
  `await_retry` | `explaining` | `complete`), `explanationStep`, `lastMisconception`.
- **ActivityContext**: the activity's hints, explanation steps, misconception map, variables, and
  `stepIndex` (the current step of a multi-step question; 0 on the first step).

## Outputs: TutorAction (instructional, not arbitrary UI)
`SAY {messageKey, variables}` · `CHANGE_EXPRESSION {expression}` · `FOCUS {target}` ·
`HIGHLIGHT {target}` · `PULSE {target}` · `WAIT {ms}` · `ASK {questionId}` ·
`REVEAL_HINT {level}` · `ADVANCE_EXPLANATION {step}` · `RESET_INTERACTION` ·
`REQUEST_RETRY` · `COMPLETE` · `OFFER_HELP {options}` (the two choices that end an "I am stuck" reply:
"hint", "explain-slowly") · `CONFIRM_RESTART` (ask once before a legacy walkthrough restarts the question).

## Messages
`src/tutor/messages/en.ts` maps `messageKey` → template with `{variable}` slots. Activities may
add activity-scoped keys. `ar.ts` holds only translated keys (`Partial`); any other key
falls back to `en` and is listed by `untranslatedKeys("ar")`. A translation must keep the English
`{slots}` (tested).
Words the tutor says belong in the catalog, not in content, so a locale can override them.
Expressions: `neutral, explaining, thinking, encouraging, concern, pleased, pointing,
reassuring, proud, aha,
attention-left, attention-right` (placeholders until approved assets exist).

## Core rules (M1)
1. First wrong answer → `thinking`, short nudge keyed to the misconception if recognised,
   else generic nudge; `REQUEST_RETRY`. Never reveal.
2. Second wrong → concept reminder + `FOCUS` on the content-declared focus target.
3. Hint requests move down the ladder one rung at a time; rungs 5+ add `HIGHLIGHT`/`PULSE`.
4. Idle > 45 s (`IDLE`) → `reassuring`, one quiet line ("Take your time. If you are stuck, say so."), once per
   attempt cycle. It opens nothing: a timer never opens a hint (#690). Poses (owner, 2026-10-12, #663): the first wrong answer shows `concern` (try_again), the second
   and later ones `reassuring` until the step moves on; a correct prediction and the first correct
   answer or step straight after Explain Slowly show `aha`; a finished practice shows `proud`
   (stage summary). `curious` is retired.
5. Explain Slowly is never gated (owner, #684): it opens whenever a question is open, before any attempt,
   engagement or wait; only a finished question or an open walkthrough ignores it. It → `explaining`, walk steps; each step may `ASK`; correct prediction →
   `pleased` + continue, wrong → short note + continue (no penalty). When it ends, the retry uses
   another variant (`SWITCH_VARIANT`, `explain.done-variant`): the explained numbers can never
   complete the question (#42). Same numbers only if the question has a single variant.
7. Multi-step questions: a correct intermediate step sends `STEP_COMPLETED` → `encouraging`, one
   short line naming the next step, ladder and attempts restart, `STEP_DONE` clears pointers.
   Hint use on any step is remembered for the final reaction. The line names the next goal by
   ADR-0007 step tag: `column` → `step.next-column` (or `step.next-column-carry` when a 1 is
   carried in), `carry` → `step.last-carry`, `gate` → rule 8; content `stepNext` still wins.
   A nudge key may have a step-specific form `<key>.<stepTag>` that is used on that step.
   `ANSWER_SUBMITTED.vars` carries structural details of the wrong answer (`wrongBitNumber`,
   `wrongCount` for grids). Truth-table steps (`columnLabel` in the step vars) say
   `step.next-table-column` / `step.last-table-column`. A grid answer with wrong cells and no
   recognised slip says `wrong.cell` (or `wrong.cell.<stepTag>`): it states how many cells are not
   right and points at the one the view marks. Generic wrong lines have step forms too
   (`wrong.first.<stepTag>`). Keep the plain form free of step-only slots (`columnLabel`).
8. Gate-by-gate circuit walk (ADR-0007 step tag `"gate"`): `stepVars` supplies structural vars
   only — `gateId`, `gateName` (type), `stepNumber`, `gateCount`, `gateOut`, and per input n = 1, 2
   `in{n}` plus `in{n}Label` (circuit input) or `in{n}Gate` (feeding gate's type).
   `contextFromVariant` adds `gateRule`, `gateAnalogy`, `gateInputs` from the `gate.*` keys in the
   active locale. A correct gate says `step.next-gate`, or `step.last-gate` before the output gate.
   Pointer targets such as `gate-{gateId}` are filled by the engine.
6. Correct answer → `pleased`, brief acknowledgement; if hints were used, offer a retry variation.
9. Hint gate (#690, docs/learning/LEARNING_ARCHITECTURE_684.md §2.1–2.2). A hint opens once the student has
   **engaged** with the step: a first edit (`ENGAGED`), a graded Check (`attempts > 0`), or "I am stuck".
   Before that, a Hint tap says `hint.try-first-or-stuck` ("try once first" stays). Not on completion, not on a
   timer. The gate resets per step (`STEP_COMPLETED` clears `engaged`) and reopens on the first input of the
   next step. Single-pick kinds count a Check only: the runner does not send `ENGAGED` for them (the kind's
   `engageOn`, ADR-0008 amendment, learn 1b).
   **Reflex guard:** a `HINT_REQUESTED` or `STUCK_REQUESTED` with `sinceStepMs` under 5000 is ignored with no
   message (a double tap, not a request). Explain Slowly has no such guard.
10. "I am stuck" (`STUCK_REQUESTED`). Counts as engagement and is not a Check or a wrong answer. It grants the
   **lowest rung not yet granted on this step** (never skipping one; after two wrong checks gave rung 3, rung
   2 is still given, and `hintLevel` stays the highest granted), says `stuck.start`, then `stuck.offer` and
   `OFFER_HELP`. With every rung granted it says `hints.exhausted` and offers Explain Slowly only.
11. Interim for steps with no lesson yet (§2.6): the legacy walkthrough walks the live numbers and restarts the
   question afterwards (variant switch, step 0). `legacyWalkthroughLosesWork(ctx)` is true when
   `ctx.stepIndex > 0`; then the first `EXPLAIN_SLOWLY_REQUESTED` says `explain.confirm-restart` and emits
   `CONFIRM_RESTART`, and the runner re-sends it with `confirmed: true`.

## Adapter
```ts
interface ConversationalTutorAdapter { respond(input: TutorTurnInput): Promise<TutorAction[]> }
```
`RuleBasedTutor` wraps `reduce`. `LocalModelTutor` / `CommercialTutor` are declared types only.
Any future adapter may only choose among approved messages; it never decides course truth.
