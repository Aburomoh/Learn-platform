"use client";

import { BitRow } from "@/interactions/BitRow/BitRow";
import { NumericInput } from "@/interactions/NumericInput/NumericInput";
import { ContextView } from "../shared/ContextView";
import { Prompt } from "../shared/Prompt";
import type { ExplainProps, PracticeProps } from "../types";
import type { NumericAnswer } from "./logic";
import type { NumericSpec } from "./spec";

export function Practice({ variant, prompt, state, last, locked, onSubmit }: PracticeProps<NumericSpec, NumericAnswer>) {
  const { spec } = variant;
  // A bit-row question is answered in the aligned cells themselves: the whole row is one answer.
  if (spec.context?.type === "bit-row")
    return (
      <>
        <Prompt text={prompt} />
        <BitRow id={variant.id} bits={spec.context.bits} state={state} wrongBit={last?.result.wrongBit} disabled={locked} onAnswer={(text) => onSubmit({ kind: "numeric", text })} />
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
}

/** stage.revealed = answer cells filled in so far (from the left); stage.attention = column outlined. */
export function Explain({ variant, stage }: ExplainProps<NumericSpec>) {
  const { spec } = variant;
  if (spec.context?.type === "bit-row")
    return <BitRow id={variant.id} bits={spec.context.bits} answer={spec.answer.padStart(spec.context.bits.length, "0")} revealed={(stage.revealed as number | undefined) ?? 0} attention={stage.attention as number | undefined} />;
  return <ContextView id={variant.id} context={spec.context} stage={stage} />;
}

/** Draws nothing: mounting it downloads this kind's chunk ahead of use (see `KindPrefetch`). */
export function Preload() {
  return null;
}

// stable marker: the size report attributes this chunk to the kind (ADR-0008)
Practice.displayName = "kind:numeric";
