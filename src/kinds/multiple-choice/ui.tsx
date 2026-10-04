"use client";

import { fill } from "@/content/template";
import { MultipleChoice } from "@/interactions/MultipleChoice/MultipleChoice";
import { ContextView } from "../shared/ContextView";
import type { ExplainProps, PracticeProps } from "../types";
import type { MultipleChoiceAnswer } from "./logic";
import type { MultipleChoiceSpec } from "./spec";

export function Practice({ variant, prompt, state, last, locked, onSubmit }: PracticeProps<MultipleChoiceSpec, MultipleChoiceAnswer>) {
  const { spec } = variant;
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
}

export function Explain({ variant, stage }: ExplainProps<MultipleChoiceSpec>) {
  return <ContextView id={variant.id} context={variant.spec.context} stage={stage} />;
}

/** Draws nothing: mounting it downloads this kind's chunk ahead of use (see `KindPrefetch`). */
export function Preload() {
  return null;
}

// stable marker: the size report attributes this chunk to the kind (ADR-0008)
Practice.displayName = "kind:multiple-choice";
