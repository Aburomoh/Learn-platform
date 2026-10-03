/**
 * Learning Stage state machine. Pure: wraps the tutor engine, grades against content, and
 * turns TutorActions into UI state plus a list of DOM effects (focus/highlight/pulse) that the
 * component applies. No React, no DOM, fully testable.
 */
import type { Activity, Variant } from "@/content/schema";
import { grade, type Answer, type GradeResult } from "@/content/grade";
import { fill } from "@/content/template";
import { hintsForStep, stepTag, stepVars as specStepVars } from "@/content/steps";
import { reduce, initialTutorState, contextFromVariant, type TutorState, type TutorAction, type Expression, type LearningEvent } from "@/tutor";
import type { RevealedHint, PredictionResult } from "@/interactions";

export interface RunnerState {
  qIndex: number;
  /** Variant index per question (retry variations advance it). */
  vIndex: number[];
  /** Variant ids already walked by Explain Slowly, per question. Session only, never stored. */
  explained: string[][];
  completed: boolean[];
  tutor: TutorState;
  expression: Expression;
  message: string;
  hints: RevealedHint[];
  /** Non-null while Explain Slowly is running. */
  explanation: { step: number; prediction?: PredictionResult } | null;
  /** Completed steps inside a multi-step question (repeated-division, circuit-predict). */
  stepIndex: number;
  /** Last graded answer on the current variant. */
  last?: { answer: Answer; result: GradeResult };
  /** Bumped on RESET_INTERACTION so inputs remount clean. */
  interactionKey: number;
  /** Incremented on every submit; the component records evidence when it changes. */
  attemptSeq: number;
  /** Incremented each time the tutor speaks, so a repeated text still counts as a new message. */
  messageSeq: number;
  /** Highest hint rung used on the current variant; summed into hintsUsedTotal on completion. */
  hintsUsedTotal: number;
  /** DOM effects to apply (FOCUS / HIGHLIGHT / PULSE / clears). */
  effects: TutorAction[];
  effectSeq: number;
  done: boolean;
}

export type RunnerAction =
  | { type: "OPEN" }
  | { type: "SUBMIT"; answer: Answer }
  | { type: "HINT" }
  | { type: "EXPLAIN" }
  | { type: "PREDICT"; index: number }
  | { type: "CONTINUE" }
  | { type: "RETRY_VARIANT" }
  | { type: "NEXT_QUESTION" }
  | { type: "HESITATION"; seconds: number }
  | { type: "RESTART" };

const EFFECT_TYPES = new Set<TutorAction["type"]>(["FOCUS", "HIGHLIGHT", "PULSE", "RESET_INTERACTION", "ADVANCE_EXPLANATION", "COMPLETE", "STEP_DONE"]);

/** Template variables for the step currently being worked on (ADR-0007: asked of the step contract). */
export function stepVars(variant: Variant, stepIndex: number): Record<string, string | number> {
  return specStepVars(variant.spec, stepIndex);
}

export function currentVariant(activity: Activity, s: Pick<RunnerState, "qIndex" | "vIndex">): Variant {
  const q = activity.questions[s.qIndex];
  return q.variants[s.vIndex[s.qIndex] % q.variants.length];
}

/**
 * Variant rotation index to retry on after Explain Slowly: the next variant whose numbers have
 * not been explained yet, or simply the next one if every variant has been (#80).
 */
export function nextUnexplainedVIndex(activity: Activity, s: Pick<RunnerState, "qIndex" | "vIndex" | "explained">): number {
  const variants = activity.questions[s.qIndex].variants;
  const seen = s.explained[s.qIndex];
  const from = s.vIndex[s.qIndex];
  for (let k = 1; k < variants.length; k++) if (!seen.includes(variants[(from + k) % variants.length].id)) return from + k;
  return from + 1;
}

export function hasAnotherVariant(activity: Activity, s: Pick<RunnerState, "qIndex" | "vIndex">): boolean {
  return activity.questions[s.qIndex].variants.length > 1;
}

export function initialRunnerState(activity: Activity): RunnerState {
  return {
    qIndex: 0,
    vIndex: activity.questions.map(() => 0),
    explained: activity.questions.map(() => []),
    completed: activity.questions.map(() => false),
    tutor: initialTutorState,
    expression: "neutral",
    message: "",
    hints: [],
    explanation: null,
    stepIndex: 0,
    interactionKey: 0,
    attemptSeq: 0,
    messageSeq: 0,
    hintsUsedTotal: 0,
    effects: [],
    effectSeq: 0,
    done: false,
  };
}

export function createRunnerReducer(activity: Activity) {
  function runTutor(s: RunnerState, event: LearningEvent): RunnerState {
    const variant = currentVariant(activity, s);
    // Hints may differ per kind of step (ADR-0007 §3): ask the step contract for this step's ladder.
    const ctx = { ...contextFromVariant(variant, "en", stepVars(variant, s.stepIndex), stepTag(variant.spec, s.stepIndex)), hints: hintsForStep(variant, s.stepIndex), hasOtherVariant: hasAnotherVariant(activity, s) };
    const { state: tutor, actions } = reduce(s.tutor, event, ctx);
    let next: RunnerState = { ...s, tutor };
    const effects: TutorAction[] = [];
    for (const a of actions) {
      switch (a.type) {
        case "SAY":
          next.message = a.text;
          next.messageSeq += 1;
          break;
        case "CHANGE_EXPRESSION":
          next.expression = a.expression;
          break;
        case "REVEAL_HINT":
          if (!next.hints.some((h) => h.rung === a.rung)) next.hints = [...next.hints, { rung: a.rung, text: a.text }];
          break;
        case "ADVANCE_EXPLANATION":
          next.explanation = { step: a.step };
          break;
        case "SWITCH_VARIANT": {
          // New numbers for the same question, preferring ones not yet explained; hints shown were for the old ones.
          const explained = [...next.explained];
          explained[next.qIndex] = [...new Set([...explained[next.qIndex], variant.id])];
          const vIndex = [...next.vIndex];
          vIndex[next.qIndex] = nextUnexplainedVIndex(activity, { ...next, explained });
          next = { ...next, vIndex, explained, hints: [], last: undefined };
          break;
        }
        case "RESET_INTERACTION":
          next = { ...next, last: undefined, stepIndex: 0, interactionKey: next.interactionKey + 1, explanation: null };
          break;
        case "COMPLETE": {
          const completed = [...next.completed];
          completed[next.qIndex] = true;
          next = { ...next, completed, hintsUsedTotal: next.hintsUsedTotal + (next.tutor.hintLevel > 0 || next.tutor.hintsEverUsed ? 1 : 0) };
          break;
        }
        default:
          break;
      }
      if (EFFECT_TYPES.has(a.type)) effects.push(a);
    }
    if (tutor.stage !== "explaining" && next.explanation && next.tutor.stage !== "explaining") next.explanation = null;
    if (effects.length) next = { ...next, effects, effectSeq: next.effectSeq + 1 };
    return next;
  }

  return function runnerReducer(s: RunnerState, action: RunnerAction): RunnerState {
    switch (action.type) {
      case "OPEN":
        return runTutor(s, { type: "ACTIVITY_OPENED" });

      case "SUBMIT": {
        if (s.tutor.stage === "complete" || s.tutor.stage === "explaining") return s;
        const variant = currentVariant(activity, s);
        const result = grade(variant, action.answer);
        if (result.correct && result.partial) {
          // A correct intermediate step: open the next one; the question stays in progress.
          const stepped: RunnerState = { ...s, stepIndex: s.stepIndex + 1, last: undefined, hints: [] };
          return runTutor(stepped, { type: "STEP_COMPLETED" });
        }
        const withLast: RunnerState = { ...s, last: { answer: action.answer, result }, attemptSeq: s.attemptSeq + 1 };
        const vars = result.wrongBit === undefined ? undefined : { wrongBitNumber: result.wrongBit + 1 };
        return runTutor(withLast, { type: "ANSWER_SUBMITTED", correct: result.correct, misconceptionId: result.misconceptionId, vars });
      }

      case "HINT":
        return runTutor(s, { type: "HINT_REQUESTED" });

      case "EXPLAIN":
        return runTutor({ ...s, last: undefined }, { type: "EXPLAIN_SLOWLY_REQUESTED" });

      case "PREDICT": {
        if (!s.explanation) return s;
        const step = currentVariant(activity, s).explanation[s.explanation.step];
        if (!step?.ask || s.explanation.prediction) return s;
        const correct = action.index === step.ask.correctIndex;
        const vars = { ...currentVariant(activity, s).vars, ...stepVars(currentVariant(activity, s), s.stepIndex) };
        const reveal = fill((correct ? step.ask.afterCorrect : step.ask.afterWrong) ?? "", vars) || undefined;
        const next: RunnerState = { ...s, explanation: { ...s.explanation, prediction: { chosenIndex: action.index, correct, reveal } } };
        return runTutor(next, { type: "PREDICTION_MADE", correct });
      }

      case "CONTINUE":
        if (!s.explanation) return s;
        return runTutor(s, { type: "EXPLANATION_STEP_DONE" });

      case "RETRY_VARIANT": {
        const vIndex = [...s.vIndex];
        vIndex[s.qIndex] += 1;
        const completed = [...s.completed];
        completed[s.qIndex] = false;
        const next: RunnerState = { ...s, vIndex, completed, hints: [], last: undefined, explanation: null, stepIndex: 0, done: false };
        return runTutor(next, { type: "RETRY_REQUESTED", newVariant: true });
      }

      case "NEXT_QUESTION": {
        const qIndex = s.completed.findIndex((c, i) => !c && i > s.qIndex);
        const target = qIndex === -1 ? s.completed.findIndex((c) => !c) : qIndex;
        if (target === -1) return { ...s, done: true };
        const next: RunnerState = { ...s, qIndex: target, hints: [], last: undefined, explanation: null, stepIndex: 0, tutor: initialTutorState, interactionKey: s.interactionKey + 1 };
        return runTutor(next, { type: "ACTIVITY_OPENED" });
      }

      case "HESITATION":
        return runTutor(s, { type: "HESITATION", seconds: action.seconds });

      case "RESTART": {
        const fresh = initialRunnerState(activity);
        // keep variant rotation so a restart gives different numbers where available
        fresh.vIndex = s.vIndex.map((v) => v + 1);
        fresh.interactionKey = s.interactionKey + 1;
        return runTutor(fresh, { type: "ACTIVITY_OPENED" });
      }
    }
  };
}
