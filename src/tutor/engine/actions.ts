import type { TemplateVars } from "@/content/template";

/** Structured instructional actions. The UI executes these; the engine never touches the DOM. */
export type Expression =
  | "neutral"
  | "explaining"
  | "thinking"
  | "encouraging"
  | "concern"
  | "pleased"
  | "pointing"
  | "attention-left"
  | "attention-right"
  // owner, 2026-10-12 (#663): the second and later wrong answers and hesitation; a finished practice; the explanation clicking
  | "reassuring"
  | "proud"
  | "aha";

export const EXPRESSIONS: Expression[] = [
  "neutral", "explaining", "thinking", "encouraging",
  "concern", "pleased", "pointing", "attention-left", "attention-right",
  "reassuring", "proud", "aha",
];

export type TutorAction =
  /** `text` is the filled English; `template` and `vars` let the UI render it in the learner's language (ADR-0011). */
  | { type: "SAY"; messageKey: string; text: string; template: string; vars: TemplateVars }
  | { type: "CHANGE_EXPRESSION"; expression: Expression }
  | { type: "FOCUS"; target: string }
  | { type: "HIGHLIGHT"; target: string }
  | { type: "PULSE"; target: string }
  | { type: "WAIT"; ms: number }
  | { type: "ASK"; stepId: string }
  | { type: "REVEAL_HINT"; rung: number; text: string; template: string; vars: TemplateVars }
  | { type: "ADVANCE_EXPLANATION"; step: number }
  | { type: "RESET_INTERACTION" }
  | { type: "REQUEST_RETRY" }
  /** Move to another variant of the same question (new numbers), e.g. after Explain Slowly. */
  | { type: "SWITCH_VARIANT" }
  /** A step was completed: clear pointers and step-level hints, keep the question open. */
  | { type: "STEP_DONE" }
  | { type: "COMPLETE" };
