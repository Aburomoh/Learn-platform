# Tutor Engine

Deterministic, rule-based, client-side. No LLM in v1 (ADR-0003). Code: `src/tutor/`.

## Contract
```ts
reduce(state: TutorState, event: LearningEvent, ctx: ActivityContext): { state: TutorState; actions: TutorAction[] }
```
Pure function: same inputs → same outputs. Unit-tested without React.

## Inputs
- **LearningEvent**: `ACTIVITY_OPENED`, `ANSWER_SUBMITTED {correct, misconceptionId?}`, `STEP_COMPLETED`,
  `HINT_REQUESTED`, `EXPLAIN_SLOWLY_REQUESTED`, `EXPLANATION_STEP_DONE`, `RETRY_REQUESTED`,
  `HESITATION {seconds}`, `PREDICTION_MADE {correct}`.
- **TutorState**: `attempts`, `hintLevel` (0–9 ladder rung), `stage` (`await_answer` |
  `await_retry` | `explaining` | `complete`), `explanationStep`, `lastMisconception`.
- **ActivityContext**: the activity's hints, explanation steps, misconception map, variables.

## Outputs: TutorAction (instructional, not arbitrary UI)
`SAY {messageKey, variables}` · `CHANGE_EXPRESSION {expression}` · `FOCUS {target}` ·
`HIGHLIGHT {target}` · `PULSE {target}` · `WAIT {ms}` · `ASK {questionId}` ·
`REVEAL_HINT {level}` · `ADVANCE_EXPLANATION {step}` · `RESET_INTERACTION` ·
`REQUEST_RETRY` · `COMPLETE`.

## Messages
`src/tutor/messages/en.ts` maps `messageKey` → template with `{variable}` slots. Activities may
add activity-scoped keys. A future `ar.ts` can override any key; missing keys fall back to `en`.
Words the tutor says belong in the catalog, not in content, so a locale can override them.
Expressions: `neutral, explaining, thinking, curious, encouraging, concern, pleased, pointing,
attention-left, attention-right` (placeholders until approved assets exist).

## Core rules (M1)
1. First wrong answer → `thinking`, short nudge keyed to the misconception if recognised,
   else generic nudge; `REQUEST_RETRY`. Never reveal.
2. Second wrong → concept reminder + `FOCUS` on the content-declared focus target.
3. Hint requests move down the ladder one rung at a time; rungs 5+ add `HIGHLIGHT`/`PULSE`.
4. Hesitation > 45 s with no attempt → `curious`, one gentle prompt (once per attempt).
5. Explain Slowly → `explaining`, walk steps; each step may `ASK`; correct prediction →
   `pleased` + continue, wrong → short note + continue (no penalty). When it ends, the retry uses
   another variant (`SWITCH_VARIANT`, `explain.done-variant`): the explained numbers can never
   complete the question (#42). Same numbers only if the question has a single variant.
7. Multi-step questions: a correct intermediate step sends `STEP_COMPLETED` → `encouraging`, one
   short line naming the next step, ladder and attempts restart, `STEP_DONE` clears pointers.
   Hint use on any step is remembered for the final reaction. The line names the next goal by
   ADR-0007 step tag: `column` → `step.next-column` (or `step.next-column-carry` when a 1 is
   carried in), `carry` → `step.last-carry`, `gate` → rule 8; content `stepNext` still wins.
   A nudge key may have a step-specific form `<key>.<stepTag>` that is used on that step.
   `ANSWER_SUBMITTED.vars` carries structural details of the wrong answer (e.g. `wrongBitNumber`).
8. Gate-by-gate circuit walk (ADR-0007 step tag `"gate"`): `stepVars` supplies structural vars
   only — `gateId`, `gateName` (type), `stepNumber`, `gateCount`, `gateOut`, and per input n = 1, 2
   `in{n}` plus `in{n}Label` (circuit input) or `in{n}Gate` (feeding gate's type).
   `contextFromVariant` adds `gateRule`, `gateAnalogy`, `gateInputs` from the `gate.*` keys in the
   active locale. A correct gate says `step.next-gate`, or `step.last-gate` before the output gate.
   Pointer targets such as `gate-{gateId}` are filled by the engine.
6. Correct answer → `pleased`, brief acknowledgement; if hints were used, offer a retry variation.

## Adapter
```ts
interface ConversationalTutorAdapter { respond(input: TutorTurnInput): Promise<TutorAction[]> }
```
`RuleBasedTutor` wraps `reduce`. `LocalModelTutor` / `CommercialTutor` are declared types only.
Any future adapter may only choose among approved messages; it never decides course truth.
