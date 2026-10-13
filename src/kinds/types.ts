/**
 * What a kind module provides (ADR-0008). A kind is a folder under `src/kinds/`:
 * - `spec.ts`  — the Zod spec and its misconception detectors (build time only: content parsing);
 * - `logic.ts` — `grade` and the ADR-0007 step contract (runtime, no Zod);
 * - `ui.tsx`   — `Practice` and `Explain`, loaded on demand through `src/kinds/ui.ts`.
 * This file holds types only, so every part can import it without pulling in code.
 */
import type { Variant } from "@/content/schema";
import type { TemplateVars } from "@/content/template";
import type { Answer } from "@/content/grade";

export interface GradeResult {
  correct: boolean;
  misconceptionId?: string;
  /** Normalised student answer for evidence (never raw UI state). */
  normalized: string;
  /** True when a step was right but the question has more steps (repeated-division, column-addition, circuit-predict). */
  partial?: boolean;
  /** Leftmost wrong bit, 0-based from the left (set with a `first-wrong-bit` misconception). */
  wrongBit?: number;
  /** Grids (truth table): the first wrong row and how many cells are wrong; only the first is marked (UX §1). */
  wrongCells?: { first: number; count: number };
}

/** The step contract of a multi-step kind (ADR-0007). Single-answer kinds have none. */
export interface StepContract<S> {
  count(spec: S): number;
  /** What kind of goal step `i` is: "divide", "column", "carry", "gate", … */
  tag(spec: S, i: number): string;
  vars(spec: S, i: number): TemplateVars;
}

/** A variant whose spec is known to be of one kind. */
export type VariantOf<S> = Omit<Variant, "spec"> & { spec: S };

/** When a student counts as engaged with a step (ADR-0008 amendment 1, #691): the first edit of a field, or only a Check. */
export type EngagePolicy = "input" | "check";

/** Runtime logic of a kind: deterministic grading and, for multi-step kinds, the step contract. */
export interface KindLogic<S, A> {
  grade(variant: VariantOf<S>, answer: A): GradeResult;
  steps?: StepContract<S>;
  /**
   * Engagement policy (learning architecture §2.1). Field and cell kinds declare `"input"`: the
   * first edit engages the step, so hints open without a Check. Single-pick kinds (a tap is the
   * answer) declare nothing or `"check"`: today's behaviour, minus the timer.
   */
  engageOn?: EngagePolicy;
}

export type AnswerState = "idle" | "correct" | "incorrect";

/** Props of a kind's practice view. It reports answers and never grades. */
export interface PracticeProps<S, A> {
  variant: VariantOf<S>;
  /** The variant's prompt with its slots filled. */
  prompt: string;
  state: AnswerState;
  last?: { answer: Answer; result: GradeResult };
  /** Completed steps of a multi-step question. */
  stepIndex: number;
  locked: boolean;
  onSubmit: (answer: A) => void;
  /**
   * Optional (ADR-0008 amendment 1, #691): a kind may report every edit with the edited element's
   * `data-focus-target` id. The runner also listens for `input` / `change` on the stage, so a kind
   * that ignores this still engages on its first edit; reporting it only adds the exact target
   * for focus return.
   */
  onInput?: (targetId: string) => void;
}

/** Props of a kind's Explain Slowly visual. `stage` is the authored state of the current step. */
export interface ExplainProps<S> {
  variant: VariantOf<S>;
  stage: Record<string, unknown>;
  isLast: boolean;
  /** The step has no prediction, or the student has made it. */
  answered: boolean;
  hasAsk: boolean;
}
