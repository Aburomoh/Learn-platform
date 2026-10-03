/** Learning events emitted by the stage and fed to the tutor engine (docs/TUTOR_ENGINE.md). */
export type LearningEvent =
  | { type: "ACTIVITY_OPENED" }
  | { type: "ANSWER_SUBMITTED"; correct: boolean; misconceptionId?: string }
  /** A step inside a multi-step question was answered correctly; more steps remain. */
  | { type: "STEP_COMPLETED" }
  | { type: "HINT_REQUESTED" }
  | { type: "EXPLAIN_SLOWLY_REQUESTED" }
  | { type: "PREDICTION_MADE"; correct: boolean }
  | { type: "EXPLANATION_STEP_DONE" }
  | { type: "RETRY_REQUESTED"; newVariant: boolean }
  | { type: "HESITATION"; seconds: number };
