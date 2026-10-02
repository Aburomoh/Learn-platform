import type { ExplanationStep, Hint } from "@/content/schema";
import type { TemplateVars } from "@/content/template";
import type { Expression } from "./actions";

export type TutorStage = "await_answer" | "await_retry" | "explaining" | "complete";

export interface TutorState {
  stage: TutorStage;
  /** Attempts on the current variant. */
  attempts: number;
  /** Highest ladder rung granted so far (0 = none). */
  hintLevel: number;
  grantedRungs: number[];
  /** Index of the current Explain Slowly step while `stage === "explaining"`. */
  explanationStep: number;
  lastMisconception?: string;
  /** One gentle prompt per attempt cycle. */
  hesitationPrompted: boolean;
  expression: Expression;
}

export interface ActivityContext {
  hints: Hint[];
  explanation: ExplanationStep[];
  vars: TemplateVars;
  /** Per-variant overrides of generic reactions (plain text). */
  reactions?: { correct?: string; correctAfterHints?: string };
  /** misconception id → message key (from content nudgeKey). */
  misconceptionKeys?: Record<string, string>;
  locale?: string;
}

export const HESITATION_SECONDS = 45;

export const initialTutorState: TutorState = {
  stage: "await_answer",
  attempts: 0,
  hintLevel: 0,
  grantedRungs: [],
  explanationStep: 0,
  hesitationPrompted: false,
  expression: "neutral",
};

/** Pedagogy gate: scaffolds open after an attempt or after visible hesitation. */
export function canRequestScaffold(s: TutorState): boolean {
  return s.stage !== "complete" && s.stage !== "explaining" && (s.attempts > 0 || s.hesitationPrompted);
}

export function nextHint(s: TutorState, ctx: ActivityContext): Hint | undefined {
  return ctx.hints.find((h) => h.rung > s.hintLevel);
}
