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
  /**
   * A misconception was named on this step (#700). The diagnosis counts as the help already given: the
   * generic nudge rungs (≤ `DIAGNOSIS_RUNG`) are skipped, so a hint or "I am stuck" is never vaguer than it.
   * Cleared when the step completes.
   */
  diagnosis?: { messageKey: string; text: string; template: string; vars: TemplateVars };
  /**
   * The student has engaged with the current step: a first edit, or "I am stuck" (#690, §2.1). A
   * Check is engagement too, and shows as `attempts > 0`. Cleared when the step completes.
   */
  engaged: boolean;
  /** One quiet idle prompt per attempt cycle. */
  idlePrompted: boolean;
  /** Explain Slowly has just finished and no answer has been given since: the first correct one is an `aha` (#663). */
  afterExplanation: boolean;
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
  /** Index of the current step of a multi-step question (0 for the first step and for single-answer kinds). */
  stepIndex?: number;
}

/** Idle time that produces the quiet prompt (it opens nothing, #690). */
export const IDLE_SECONDS = 45;
/** @deprecated Use `IDLE_SECONDS`. */
export const HESITATION_SECONDS = IDLE_SECONDS;
/** A step shown less than this long ago ignores Hint and "I am stuck" taps, with no message (reflex guard, #690 H5). */
export const REFLEX_GUARD_MS = 5000;

export const initialTutorState: TutorState = {
  stage: "await_answer",
  attempts: 0,
  hintLevel: 0,
  grantedRungs: [],
  hintsEverUsed: false,
  explanationStep: 0,
  engaged: false,
  idlePrompted: false,
  afterExplanation: false,
  expression: "neutral",
};

/**
 * Pedagogy gate for hints (#690, §2.2): a hint opens once the student has engaged with the step, by a
 * first edit, a Check, or "I am stuck". Not after all fields are filled and not after a timer.
 * Explain Slowly is not gated (§2.3).
 */
export function canRequestScaffold(s: TutorState): boolean {
  return s.stage !== "complete" && s.stage !== "explaining" && (s.attempts > 0 || s.engaged);
}

/**
 * Interim (#690, §2.6): a legacy walkthrough walks the live numbers, so afterwards the question
 * restarts with new numbers and at step 0. On a multi-step question past its first step that loses
 * work, so the runner asks once before opening it. Not needed at step 0 or on single-answer kinds.
 */
export function legacyWalkthroughLosesWork(ctx: Pick<ActivityContext, "stepIndex">): boolean {
  return (ctx.stepIndex ?? 0) > 0;
}

/** The lowest rung of this step's ladder not yet granted (rung 2 is usually still free after a wrong check granted 3). */
export function lowestUngrantedHint(s: TutorState, ctx: ActivityContext): Hint | undefined {
  const above = diagnosisFloor(s, ctx);
  return [...ctx.hints].sort((a, b) => a.rung - b.rung).find((h) => h.rung > above && !s.grantedRungs.includes(h.rung));
}

export function nextHint(s: TutorState, ctx: ActivityContext): Hint | undefined {
  return ctx.hints.find((h) => h.rung > Math.max(s.hintLevel, diagnosisFloor(s, ctx)));
}

/** Rungs up to this one are the generic "Not yet" nudge: less specific than a named misconception (#700). */
export const DIAGNOSIS_RUNG = 2;

/** With a diagnosis on the step the ladder starts above the generic nudge, if the ladder has anything above it. */
function diagnosisFloor(s: TutorState, ctx: ActivityContext): number {
  return s.diagnosis && ctx.hints.some((h) => h.rung > DIAGNOSIS_RUNG) ? DIAGNOSIS_RUNG : 0;
}
