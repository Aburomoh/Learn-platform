# Tutor Engine

Deterministic, rule-based, client-side. No LLM in v1 (ADR-0003). Code: `src/tutor/`.

## Contract
```ts
reduce(state: TutorState, event: LearningEvent, ctx: ActivityContext): { state: TutorState; actions: TutorAction[] }
```
Pure function: same inputs → same outputs. Unit-tested without React.

## Inputs
- **LearningEvent**: `ACTIVITY_OPENED`, `ANSWER_SUBMITTED {correct, misconceptionId?}`,
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
Expressions: `neutral, explaining, thinking, curious, encouraging, concern, pleased, pointing,
attention-left, attention-right` (placeholders until approved assets exist).

## Core rules (M1)
1. First wrong answer → `thinking`, short nudge keyed to the misconception if recognised,
   else generic nudge; `REQUEST_RETRY`. Never reveal.
2. Second wrong → concept reminder + `FOCUS` on the content-declared focus target.
3. Hint requests move down the ladder one rung at a time; rungs 5+ add `HIGHLIGHT`/`PULSE`.
4. Hesitation > 45 s with no attempt → `curious`, one gentle prompt (once per attempt).
5. Explain Slowly → `explaining`, walk steps; each step may `ASK`; correct prediction →
   `pleased` + continue, wrong → short note + continue (no penalty).
6. Correct answer → `pleased`, brief acknowledgement; if hints were used, offer a retry variation.

## Adapter
```ts
interface ConversationalTutorAdapter { respond(input: TutorTurnInput): Promise<TutorAction[]> }
```
`RuleBasedTutor` wraps `reduce`. `LocalModelTutor` / `CommercialTutor` are declared types only.
Any future adapter may only choose among approved messages; it never decides course truth.
