"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CircuitSpec, Variant } from "@/content/schema";
import type { Answer, GradeResult } from "@/content/grade";
import { stepCount, stepVars } from "@/content/steps";
import { fill } from "@/content/template";
import { MultipleChoice, NumericInput, PlaceValueDiagram, CircuitDiagram, DivisionChain, PredictionBeforeReveal, type Bit, type PredictionResult } from "@/interactions";
import { BitGroups } from "./BitGroups";
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
        <p className={styles.prompt}>{prompt}</p>
        <ExplainVisual variant={variant} stage={step.stage ?? {}} isLast={isLast} answered={!step.ask || !!explanation.prediction} />
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
      <PracticeInput variant={variant} prompt={prompt} state={state} last={last} stepIndex={stepIndex} locked={locked} onSubmit={onSubmit} />
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
  stepIndex,
  locked,
  onSubmit,
}: {
  variant: Variant;
  prompt: string;
  state: "idle" | "correct" | "incorrect";
  last?: { answer: Answer; result: GradeResult };
  stepIndex: number;
  locked: boolean;
  onSubmit: (a: Answer) => void;
}) {
  const spec = variant.spec;
  const [digits, setDigits] = useState<Bit[]>(() =>
    spec.kind === "place-value" && last?.answer.kind === "place-value" ? last.answer.digits : Array.from({ length: spec.kind === "place-value" ? spec.slots : 0 }, () => null),
  );

  switch (spec.kind) {
    case "place-value":
      return (
        <>
          <p className={styles.prompt}>{prompt}</p>
          <PlaceValueDiagram id={variant.id} slots={spec.slots} digits={digits} onChange={setDigits} readOnly={locked} state={state} onSubmit={() => onSubmit({ kind: "place-value", digits })} />
        </>
      );
    case "repeated-division": {
      const finished = state === "correct";
      return (
        <>
          <p className={styles.prompt}>{prompt}</p>
          <DivisionChain
            key={stepIndex}
            id={variant.id}
            steps={spec.steps}
            stepIndex={finished ? spec.steps.length : stepIndex}
            state={state === "incorrect" ? "incorrect" : "idle"}
            disabled={locked}
            onStep={(quotient, remainder) => onSubmit({ kind: "repeated-division", step: stepIndex, quotient, remainder })}
          />
        </>
      );
    }
    case "numeric":
      return (
        <>
          {spec.context?.type === "division-chain" && <DivisionChain id={`${variant.id}-ctx`} steps={spec.context.steps} stepIndex={spec.context.steps.length} />}
          {spec.context?.type === "bits" && <BitGroups bits={spec.context.bits} groups={[]} />}
        <NumericInput
          id={variant.id}
          prompt={prompt}
          base={spec.base}
          disabled={locked}
          state={state}
          submittedText={last?.answer.kind === "numeric" ? last.answer.text : undefined}
          onAnswer={(text) => onSubmit({ kind: "numeric", text })}
        />
        </>
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
    case "circuit-predict":
      return <CircuitWalk variant={variant} spec={spec} prompt={prompt} state={state} last={last} stepIndex={stepIndex} locked={locked} onSubmit={onSubmit} />;
  }
}

/**
 * Circuit question answered one gate at a time, in signal-flow order. The gate being asked is
 * outlined; gates already answered stay lit with their value; the last gate gives Y.
 */
function CircuitWalk({
  variant,
  spec,
  prompt,
  state,
  last,
  stepIndex,
  locked,
  onSubmit,
}: {
  variant: Variant;
  spec: CircuitSpec;
  prompt: string;
  state: "idle" | "correct" | "incorrect";
  last?: { answer: Answer; result: GradeResult };
  stepIndex: number;
  locked: boolean;
  onSubmit: (a: Answer) => void;
}) {
  const [inputs, setInputs] = useState<Record<string, 0 | 1>>({});
  // Gate order comes from the step contract (ADR-0007): step i asks about one gate.
  const order = useMemo(() => Array.from({ length: stepCount(spec) }, (_, i) => String(stepVars(spec, i).gateId)), [spec]);
  const step = Math.min(stepIndex, order.length - 1);
  const gate = spec.gates.find((g) => g.id === order[step])!;
  const isOutput = step === order.length - 1;
  const finished = locked && state === "correct";
  const explore = finished && spec.inputsToggleable;

  // The answer form is replaced on each step; keep keyboard focus with the new question.
  const answerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (step > 0 && !finished) answerRef.current?.querySelector<HTMLInputElement>("input[type='radio']")?.focus();
  }, [step, finished]);

  return (
    <>
      <p className={styles.prompt}>{prompt}</p>
      <CircuitDiagram
        id={variant.id}
        spec={spec}
        inputs={explore ? inputs : undefined}
        onToggleInput={explore ? (id, v) => setInputs((prev) => ({ ...prev, [id]: v })) : undefined}
        revealOutput={finished}
        lit={finished ? order : order.slice(0, step)}
        activeGateId={finished ? undefined : gate.id}
      />
      {explore && <p className={styles.hintText}>Explore: toggle A, B or C and watch Y change.</p>}
      {!finished && (
        <p className={styles.walkStep} aria-live="polite">
          Gate {step + 1} of {order.length}: {gate.type}
        </p>
      )}
      <div ref={answerRef}>
        <MultipleChoice
          key={step}
          id={`${variant.id}-${gate.id}`}
          prompt={isOutput ? `What comes out of the ${gate.type} gate? That is Y.` : `What comes out of the ${gate.type} gate?`}
          options={[
            { id: "0", text: isOutput ? "Y = 0" : "0" },
            { id: "1", text: isOutput ? "Y = 1" : "1" },
          ]}
          disabled={locked}
          state={state}
          submittedOptionId={last?.answer.kind === "circuit-predict" ? String(last.answer.output) : undefined}
          onAnswer={(optionId) => onSubmit({ kind: "circuit-predict", step, output: optionId === "1" ? 1 : 0 })}
        />
      </div>
    </>
  );
}

function ExplainVisual({ variant, stage, isLast, answered }: { variant: Variant; stage: Record<string, unknown>; isLast: boolean; answered: boolean }) {
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
    case "repeated-division":
      return <DivisionChain id={variant.id} steps={spec.steps} stepIndex={(stage.revealed as number | undefined) ?? 0} attention={stage.attention as number | undefined} />;
    case "numeric":
      if (spec.context?.type === "division-chain")
        return <DivisionChain id={variant.id} steps={spec.context.steps} stepIndex={spec.context.steps.length} showOrder={!!stage.showOrder} attention={stage.attention as number | undefined} />;
      if (spec.context?.type === "bits")
        return <BitGroups bits={spec.context.bits} groups={(stage.groups as string[] | undefined) ?? []} attention={stage.attention as number | undefined} done={!!stage.done} />;
      return null;
    case "circuit-predict": {
      const active = stage.active as string | undefined;
      const lit = (stage.lit as string[] | undefined) ?? [];
      return <CircuitDiagram id={variant.id} spec={spec} lit={active && answered ? [...lit, active] : lit} activeGateId={active} revealOutput={isLast} />;
    }
    case "multiple-choice":
      return null;
  }
}
