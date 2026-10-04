"use client";

import { createElement, type ComponentType } from "react";
import type { ColumnAdditionSpec, InteractionSpec, NumericContext, Variant } from "@/content/schema";
import type { Answer, GradeResult } from "@/content/grade";
import { stepCount, stepTag, stepVars } from "@/content/steps";
import { Notation } from "@/interactions/shared/Notation";
import { fill } from "@/content/template";
// direct imports, not the barrel: the barrel would pull every component into the stage chunk
import { MultipleChoice } from "@/interactions/MultipleChoice/MultipleChoice";
import { NumericInput } from "@/interactions/NumericInput/NumericInput";
import { DivisionChain } from "@/interactions/DivisionChain/DivisionChain";
import { BitGrouping } from "@/interactions/BitGrouping/BitGrouping";
import { ColumnAddition, type AdditionColumn } from "@/interactions/ColumnAddition/ColumnAddition";
import { BitRow } from "@/interactions/BitRow/BitRow";
import { PredictionBeforeReveal, type PredictionResult } from "@/interactions/PredictionBeforeReveal/PredictionBeforeReveal";
import { isRegisteredKind, type RegisteredKind } from "@/kinds";
import type { ExplainProps, PracticeProps } from "@/kinds/types";
import { kindUI } from "@/kinds/ui";
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
        <p className={styles.prompt}>
            <Notation text={prompt} />
          </p>
        <ExplainVisual variant={variant} stage={step.stage ?? {}} isLast={isLast} answered={!step.ask || !!explanation.prediction} hasAsk={!!step.ask} />
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

type RegisteredSpec = Extract<InteractionSpec, { kind: RegisteredKind }>;

/** True for a kind that lives in `src/kinds/` (ADR-0008); its views are loaded on demand. */
function isRegistered(spec: InteractionSpec): spec is RegisteredSpec {
  return isRegisteredKind(spec.kind);
}

// One cast at the dispatch: the registry pairs each kind with its own props.
const views = kindUI as Record<RegisteredKind, { Practice: ComponentType<PracticeProps<InteractionSpec, Answer>>; Explain: ComponentType<ExplainProps<InteractionSpec>> }>;

/** Every step of a column addition as the component draws it, read from the step contract. */
function additionColumns(spec: ColumnAdditionSpec): AdditionColumn[] {
  return Array.from({ length: stepCount(spec) }, (_, i) => {
    const v = stepVars(spec, i) as Record<string, 0 | 1>;
    return { a: v.aBit, b: v.bBit, carryIn: v.carryIn, sum: v.sum, carryOut: v.carryOut, final: stepTag(spec, i) === "carry" };
  });
}

/** A worked result shown above a numeric or multiple-choice question; `stage` drives it in Explain Slowly. */
function ContextView({ id, context, stage }: { id: string; context: NumericContext | undefined; stage?: Record<string, unknown> }) {
  if (!context) return null;
  switch (context.type) {
    case "division-chain":
      return <DivisionChain id={id} steps={context.steps} stepIndex={context.steps.length} showOrder={!!stage?.showOrder} attention={stage?.attention as number | undefined} />;
    case "bits":
      return <BitGroups bits={context.bits} groups={(stage?.groups as string[] | undefined) ?? []} attention={stage?.attention as number | undefined} done={!!stage?.done} />;
    case "addition": {
      const columns = additionColumns({ kind: "column-addition", ...context.operands });
      return <ColumnAddition id={id} a={context.operands.a} b={context.operands.b} columns={columns} stepIndex={columns.length} attention={stage?.attention as number | undefined} />;
    }
    case "bit-row":
      return <BitRow id={id} bits={context.bits} sourceOnly />;
    default: {
      const unhandled: never = context;
      throw new Error(`No renderer for context ${JSON.stringify(unhandled)}`);
    }
  }
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
  if (isRegistered(spec)) {
    return createElement(views[spec.kind].Practice, { variant, prompt, state, last, stepIndex, locked, onSubmit });
  }

  // Kinds not migrated to `src/kinds/` yet.
  switch (spec.kind) {
    case "repeated-division": {
      const finished = state === "correct";
      return (
        <>
          <p className={styles.prompt}>
            <Notation text={prompt} />
          </p>
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
      // A bit-row question is answered in the aligned cells themselves: the whole row is one answer.
      if (spec.context?.type === "bit-row")
        return (
          <>
            <p className={styles.prompt}>
            <Notation text={prompt} />
          </p>
            <BitRow
              id={variant.id}
              bits={spec.context.bits}
              state={state}
              wrongBit={last?.result.wrongBit}
              disabled={locked}
              onAnswer={(text) => onSubmit({ kind: "numeric", text })}
            />
          </>
        );
      return (
        <>
          <ContextView id={`${variant.id}-ctx`} context={spec.context} />
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
        <>
          <ContextView id={`${variant.id}-ctx`} context={spec.context} />
        <MultipleChoice
          id={variant.id}
          prompt={prompt}
          options={spec.options.map((o) => ({ id: o.id, text: fill(o.text, variant.vars) }))}
          disabled={locked}
          state={state}
          submittedOptionId={last?.answer.kind === "multiple-choice" ? last.answer.optionId : undefined}
          onAnswer={(optionId) => onSubmit({ kind: "multiple-choice", optionId })}
        />
        </>
      );
    case "bit-grouping": {
      // Groups and digits come from the step contract: step k ≥ 1 is the digit of group k.
      const count = stepCount(spec);
      const digitSteps = Array.from({ length: count - 1 }, (_, i) => stepVars(spec, i + 1));
      const finished = state === "correct";
      return (
        <>
          <p className={styles.prompt}>
            <Notation text={prompt} />
          </p>
          <BitGrouping
            key={stepIndex}
            id={variant.id}
            bits={spec.bits}
            groupSize={spec.groupSize}
            stepIndex={finished ? count : stepIndex}
            groups={digitSteps.map((v) => String(v.groupBits))}
            digits={digitSteps.map((v) => String(v.digit))}
            state={state === "incorrect" ? "incorrect" : "idle"}
            disabled={locked}
            onGroups={(groups) => onSubmit({ kind: "bit-grouping", step: 0, groups })}
            onDigit={(digit) => onSubmit({ kind: "bit-grouping", step: stepIndex, digit })}
          />
        </>
      );
    }
    case "column-addition": {
      const columns = additionColumns(spec);
      return (
        <>
          <p className={styles.prompt}>
            <Notation text={prompt} />
          </p>
          <ColumnAddition
            key={stepIndex}
            id={variant.id}
            a={spec.a}
            b={spec.b}
            columns={columns}
            stepIndex={state === "correct" ? columns.length : stepIndex}
            state={state === "incorrect" ? "incorrect" : "idle"}
            disabled={locked}
            onStep={(sum, carry) => onSubmit({ kind: "column-addition", step: stepIndex, sum, carry })}
          />
        </>
      );
    }
    default: {
      // A new spec kind must get a renderer here: an unhandled kind is a compile error.
      const unhandled: never = spec;
      throw new Error(`No renderer for ${JSON.stringify(unhandled)}`);
    }
  }
}

function ExplainVisual({ variant, stage, isLast, answered, hasAsk }: { variant: Variant; stage: Record<string, unknown>; isLast: boolean; answered: boolean; hasAsk: boolean }) {
  const spec = variant.spec;
  if (isRegistered(spec)) {
    return createElement(views[spec.kind].Explain, { variant, stage, isLast, answered, hasAsk });
  }
  switch (spec.kind) {
    case "repeated-division":
      return <DivisionChain id={variant.id} steps={spec.steps} stepIndex={(stage.revealed as number | undefined) ?? 0} attention={stage.attention as number | undefined} />;
    case "numeric":
      // stage.revealed = answer cells filled in so far (from the left); stage.attention = column outlined.
      if (spec.context?.type === "bit-row")
        return <BitRow id={variant.id} bits={spec.context.bits} answer={spec.answer.padStart(spec.context.bits.length, "0")} revealed={(stage.revealed as number | undefined) ?? 0} attention={stage.attention as number | undefined} />;
      return <ContextView id={variant.id} context={spec.context} stage={stage} />;
    case "bit-grouping": {
      // Content stages: `groups: []` = the bits before grouping; groups shown = `attention` is the
      // group whose digit is being asked (its digit appears once predicted); `done` = everything.
      const count = stepCount(spec);
      const digitSteps = Array.from({ length: count - 1 }, (_, i) => stepVars(spec, i + 1));
      const grouped = ((stage.groups as string[] | undefined) ?? []).length > 0;
      const asked = stage.attention as number | undefined;
      const step = stage.done ? count : !grouped ? 0 : asked === undefined ? 1 : asked + 1 + (answered && hasAsk ? 1 : 0);
      return (
        <BitGrouping
          id={variant.id}
          bits={spec.bits}
          groupSize={spec.groupSize}
          stepIndex={Math.min(step, count)}
          groups={digitSteps.map((v) => String(v.groupBits))}
          digits={digitSteps.map((v) => String(v.digit))}
          attention={grouped ? asked : undefined}
        />
      );
    }
    case "column-addition": {
      // stage.revealed = completed steps shown; stage.attention = step to outline.
      const columns = additionColumns(spec);
      return <ColumnAddition id={variant.id} a={spec.a} b={spec.b} columns={columns} stepIndex={(stage.revealed as number | undefined) ?? 0} attention={stage.attention as number | undefined} />;
    }
    case "multiple-choice":
      return <ContextView id={variant.id} context={spec.context} stage={stage} />;
    default: {
      const unhandled: never = spec;
      throw new Error(`No explanation visual for ${JSON.stringify(unhandled)}`);
    }
  }
}
