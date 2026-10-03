"use client";

import { useState } from "react";
import type { Variant } from "@/content/schema";
import type { Answer, GradeResult } from "@/content/grade";
import { fill } from "@/content/template";
import { MultipleChoice, NumericInput, PlaceValueDiagram, CircuitDiagram, PredictionBeforeReveal, type Bit, type PredictionResult } from "@/interactions";
import { BitGroups } from "./BitGroups";
import styles from "./Stage.module.css";

export interface QuestionViewProps {
  variant: Variant;
  last?: { answer: Answer; result: GradeResult };
  locked: boolean;
  explanation: { step: number; prediction?: PredictionResult } | null;
  onSubmit: (answer: Answer) => void;
  onPredict: (index: number) => void;
  onContinue: () => void;
}

/** Renders one variant in practice mode or, while `explanation` is set, in Explain Slowly mode. */
export function QuestionView({ variant, last, locked, explanation, onSubmit, onPredict, onContinue }: QuestionViewProps) {
  const prompt = fill(variant.prompt, variant.vars);
  const state = last ? (last.result.correct ? "correct" : "incorrect") : "idle";

  if (explanation) {
    const step = variant.explanation[explanation.step];
    const isLast = explanation.step >= variant.explanation.length - 1;
    const needsPrediction = !!step.ask && !explanation.prediction;
    return (
      <section className={styles.question} aria-label="Explanation">
        <p className={styles.prompt}>{prompt}</p>
        <ExplainVisual variant={variant} stage={step.stage ?? {}} isLast={isLast} />
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

  return (
    <section className={styles.question} aria-label="Question">
      <PracticeInput variant={variant} prompt={prompt} state={state} last={last} locked={locked} onSubmit={onSubmit} />
      {last && (
        <p className={`${styles.feedback} ${last.result.correct ? styles.ok : styles.no}`} role="status">
          {last.result.correct ? "Correct." : "Not correct yet."}
        </p>
      )}
    </section>
  );
}

function PracticeInput({
  variant,
  prompt,
  state,
  last,
  locked,
  onSubmit,
}: {
  variant: Variant;
  prompt: string;
  state: "idle" | "correct" | "incorrect";
  last?: { answer: Answer; result: GradeResult };
  locked: boolean;
  onSubmit: (a: Answer) => void;
}) {
  const spec = variant.spec;
  const [digits, setDigits] = useState<Bit[]>(() =>
    spec.kind === "place-value" && last?.answer.kind === "place-value" ? last.answer.digits : Array.from({ length: spec.kind === "place-value" ? spec.slots : 0 }, () => null),
  );
  const [inputs, setInputs] = useState<Record<string, 0 | 1>>({});

  switch (spec.kind) {
    case "place-value":
      return (
        <>
          <p className={styles.prompt}>{prompt}</p>
          <PlaceValueDiagram id={variant.id} slots={spec.slots} digits={digits} onChange={setDigits} readOnly={locked} state={state} onSubmit={() => onSubmit({ kind: "place-value", digits })} />
        </>
      );
    case "numeric":
      return (
        <NumericInput
          id={variant.id}
          prompt={prompt}
          base={spec.base}
          disabled={locked}
          state={state}
          submittedText={last?.answer.kind === "numeric" ? last.answer.text : undefined}
          onAnswer={(text) => onSubmit({ kind: "numeric", text })}
        />
      );
    case "multiple-choice":
      return (
        <MultipleChoice
          id={variant.id}
          prompt={prompt}
          options={spec.options.map((o) => ({ id: o.id, text: fill(o.text, variant.vars) }))}
          disabled={locked}
          state={state}
          submittedOptionId={last?.answer.kind === "multiple-choice" ? last.answer.optionId : undefined}
          onAnswer={(optionId) => onSubmit({ kind: "multiple-choice", optionId })}
        />
      );
    case "circuit-predict": {
      const explore = locked && state === "correct" && spec.inputsToggleable;
      return (
        <>
          <p className={styles.prompt}>{prompt}</p>
          <CircuitDiagram
            id={variant.id}
            spec={spec}
            inputs={explore ? inputs : undefined}
            onToggleInput={explore ? (id, v) => setInputs((prev) => ({ ...prev, [id]: v })) : undefined}
            revealOutput={locked}
            lit={locked ? spec.gates.map((g) => g.id) : []}
          />
          {explore && <p className={styles.hintText}>Explore: toggle A, B or C and watch Y change.</p>}
          <MultipleChoice
            id={`${variant.id}-y`}
            prompt="What is Y?"
            options={[
              { id: "0", text: "Y = 0" },
              { id: "1", text: "Y = 1" },
            ]}
            disabled={locked}
            state={state}
            submittedOptionId={last?.answer.kind === "circuit-predict" ? String(last.answer.output) : undefined}
            onAnswer={(optionId) => onSubmit({ kind: "circuit-predict", output: optionId === "1" ? 1 : 0 })}
          />
        </>
      );
    }
  }
}

function ExplainVisual({ variant, stage, isLast }: { variant: Variant; stage: Record<string, unknown>; isLast: boolean }) {
  const spec = variant.spec;
  switch (spec.kind) {
    case "place-value":
      return (
        <PlaceValueDiagram
          id={variant.id}
          slots={spec.slots}
          digits={Array.from({ length: spec.slots }, () => null)}
          lit={(stage.lit as number[] | undefined) ?? []}
          attention={stage.attention as number | undefined}
          remainder={stage.remainder as number | undefined}
        />
      );
    case "numeric":
      return <BitGroups bits={String(variant.vars.answerBits ?? "")} groups={(stage.groups as string[] | undefined) ?? []} attention={stage.attention as number | undefined} done={!!stage.done} />;
    case "circuit-predict":
      return <CircuitDiagram id={variant.id} spec={spec} lit={(stage.lit as string[] | undefined) ?? []} revealOutput={isLast} />;
    case "multiple-choice":
      return null;
  }
}
