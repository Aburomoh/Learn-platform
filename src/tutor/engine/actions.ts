/** Structured instructional actions. The UI executes these; the engine never touches the DOM. */
export type Expression =
  | "neutral"
  | "explaining"
  | "thinking"
  | "curious"
  | "encouraging"
  | "concern"
  | "pleased"
  | "pointing"
  | "attention-left"
  | "attention-right";

export const EXPRESSIONS: Expression[] = [
  "neutral", "explaining", "thinking", "curious", "encouraging",
  "concern", "pleased", "pointing", "attention-left", "attention-right",
];

export type TutorAction =
  | { type: "SAY"; messageKey: string; text: string }
  | { type: "CHANGE_EXPRESSION"; expression: Expression }
  | { type: "FOCUS"; target: string }
  | { type: "HIGHLIGHT"; target: string }
  | { type: "PULSE"; target: string }
  | { type: "WAIT"; ms: number }
  | { type: "ASK"; stepId: string }
  | { type: "REVEAL_HINT"; rung: number; text: string }
  | { type: "ADVANCE_EXPLANATION"; step: number }
  | { type: "RESET_INTERACTION" }
  | { type: "REQUEST_RETRY" }
  /** A step was completed: clear pointers and step-level hints, keep the question open. */
  | { type: "STEP_DONE" }
  | { type: "COMPLETE" };
