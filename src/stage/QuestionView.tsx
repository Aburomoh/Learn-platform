"use client";

import { createElement, type ComponentType } from "react";
import type { InteractionSpec, Variant } from "@/content/schema";
import type { Answer, GradeResult } from "@/content/grade";
import { fill } from "@/content/template";
import { Notation } from "@/interactions/shared/Notation";
import { PredictionBeforeReveal, type PredictionResult } from "@/interactions/PredictionBeforeReveal/PredictionBeforeReveal";
import type { RegisteredKind } from "@/kinds";
import { FigureView } from "@/kinds/shared/figures/FigureView";
import type { ExplainProps, PracticeProps } from "@/kinds/types";
import { kindUI } from "@/kinds/ui";
import styles from "./Stage.module.css";

export interface QuestionViewProps {
  variant: Variant;
  last?: { answer: Answer; result: GradeResult };
  /** Completed steps of a multi-step question. */
  stepIndex: number;
  locked: boolean;
  explanation: { step: number; prediction?: PredictionResult } | null;
  onSubmit: (answer: Answer) => void;
  onPredict: (index: number) => void;
  onContinue: () => void;
}

/** Renders one variant in practice mode or, while `explanation` is set, in Explain Slowly mode. */
export function QuestionView({ variant, last, stepIndex, locked, explanation, onSubmit, onPredict, onContinue }: QuestionViewProps) {
  const prompt = fill(variant.prompt, variant.vars);
  const state = last ? (last.result.correct ? "correct" : "incorrect") : "idle";

  if (explanation) {
    const step = variant.explanation[explanation.step];
    const isLast = explanation.step >= variant.explanation.length - 1;
    const needsPrediction = !!step.ask && !explanation.prediction;
    return (
      <section className={styles.question} aria-label="Explanation">
        <p className={styles.prompt}>
          <Notation text={prompt} />
        </p>
        {variant.figure && <FigureView id={variant.id} figure={variant.figure} revealed={isLast || !!step.stage?.figureResult} focus={step.stage?.figureFocus} />}
        {createElement(views[variant.spec.kind].Explain, { variant, stage: step.stage ?? {}, isLast, answered: !step.ask || !!explanation.prediction, hasAsk: !!step.ask })}
        {step.ask && (
          <PredictionBeforeReveal id={step.id} prompt={fill(step.ask.prompt, variant.vars)} options={step.ask.options} onPredict={onPredict} result={explanation.prediction} />
        )}
        <div className={styles.actions}>
          <span className={styles.stepCount}>
            Step {explanation.step + 1} of {variant.explanation.length}
          </span>
          <button type="button" className="btn btn-primary" onClick={onContinue} disabled={needsPrediction}>
            {isLast ? "Now I try" : "Continue"}
          </button>
        </div>
      </section>
    );
  }

  const answer = (
    <>
      {createElement(views[variant.spec.kind].Practice, { variant, prompt, state, last, stepIndex, locked, onSubmit })}
      {last && (
        <p className={`${styles.feedback} ${last.result.correct ? styles.ok : styles.no}`} role="status">
          {last.result.correct ? "Correct." : "Not correct yet."}
        </p>
      )}
    </>
  );
  if (!variant.figure)
    return (
      <section className={styles.question} aria-label="Question">
        {answer}
      </section>
    );
  // With a figure (ADR-0009): the figure first on phones, beside the answer area from 900 px.
  return (
    <section className={`${styles.question} ${styles.withFigure}`} aria-label="Question">
      {/* never lit before a correct answer: `result` is the only state that shows the answer */}
      <FigureView id={variant.id} figure={variant.figure} revealed={locked && state === "correct"} />
      <div className={styles.question}>{answer}</div>
    </section>
  );
}

/**
 * Each kind's views come from the registry (ADR-0008), loaded on demand. One cast at the
 * dispatch: the registry pairs each kind with its own props, which TypeScript cannot correlate.
 */
const views = kindUI as Record<RegisteredKind, { Practice: ComponentType<PracticeProps<InteractionSpec, Answer>>; Explain: ComponentType<ExplainProps<InteractionSpec>> }>;
