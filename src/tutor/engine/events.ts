/** Learning events emitted by the stage and fed to the tutor engine (docs/TUTOR_ENGINE.md). */
export type LearningEvent =
  | { type: "ACTIVITY_OPENED" }
  /** `vars`: structural details of this wrong answer for the nudge, e.g. `wrongBitNumber`. */
  | { type: "ANSWER_SUBMITTED"; correct: boolean; misconceptionId?: string; vars?: Record<string, string | number> }
  /** A step inside a multi-step question was answered correctly; more steps remain. */
  | { type: "STEP_COMPLETED" }
  /** `sinceStepMs`: how long ago the current step appeared; under REFLEX_GUARD_MS the tap is ignored without a message (#690, H5). */
  | { type: "HINT_REQUESTED"; sinceStepMs?: number }
  /**
   * Never gated (#690, E1). `confirmed`: the student accepted the one-time warning that a legacy
   * walkthrough restarts the question (`legacyWalkthroughLosesWork`, §2.6).
   */
  | { type: "EXPLAIN_SLOWLY_REQUESTED"; confirmed?: boolean }
  /** The first edit of a field in the current step: the student has engaged with it. Sent once per step by the runner (#690, §2.1). */
  | { type: "ENGAGED" }
  /** "I am stuck": counts as engagement and grants the lowest rung not yet granted on this step (#690, §2.4). */
  | { type: "STUCK_REQUESTED"; sinceStepMs?: number }
  /** The runner's idle clock fired (every input resets it). A quiet line only: it opens nothing (#690, §2.2 H2). */
  | { type: "IDLE"; seconds: number }
  | { type: "PREDICTION_MADE"; correct: boolean }
  | { type: "EXPLANATION_STEP_DONE" }
  | { type: "RETRY_REQUESTED"; newVariant: boolean }
  /**
   * @deprecated The runner of before #690 sends this and relies on it opening the gate. It keeps that
   * behaviour only until the runner sends `ENGAGED` and `IDLE` (learn 1b); then it is removed.
   */
  | { type: "HESITATION"; seconds: number };
