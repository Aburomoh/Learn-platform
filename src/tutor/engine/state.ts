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
  /** Any hint used on this variant, including on earlier steps of a multi-step question. */
  hintsEverUsed: boolean;
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
  reactions?: { correct?: string; correctAfterHints?: string; stepNext?: string };
  /** misconception id → message key (from content nudgeKey). */
  misconceptionKeys?: Record<string, string>;
  locale?: string;
  /** ADR-0007 step tag of the current step ("divide", "column", "carry", "gate", …). */
  stepTag?: string;
  /** The interaction kind of the variant ("kmap", "truth-table", …): step tags are only unique within a kind. */
  kind?: string;
  /** The question has another variant to retry on (new numbers). */
  hasOtherVariant?: boolean;
}

export const HESITATION_SECONDS = 45;

export const initialTutorState: TutorState = {
  stage: "await_answer",
  attempts: 0,
  hintLevel: 0,
  grantedRungs: [],
  hintsEverUsed: false,
  explanationStep: 0,
  hesitationPrompted: false,
  expression: "neutral",
};

/**
 * Hints and Explain Slowly can be asked for at any time while the question is open (owner,
 * 2026-10-11, #661): no attempt or hesitation is required first. Only a finished question or a
 * running explanation says no. (`attempts` and `hesitationPrompted` still drive the tutor's own
 * reactions.)
 */
export function canRequestScaffold(s: TutorState): boolean {
  return s.stage !== "complete" && s.stage !== "explaining";
}

export function nextHint(s: TutorState, ctx: ActivityContext): Hint | undefined {
  return ctx.hints.find((h) => h.rung > s.hintLevel);
}
