"use client";

import { Prompt } from "../shared/Prompt";
import type { ExplainProps, PracticeProps } from "../types";
import { ExpressionEntry } from "../shared/ExpressionEntry";
import type { ExpressionAnswer } from "./logic";
import type { ExpressionSpec } from "./spec";

export function Practice({ variant, prompt, state, last, locked, onSubmit }: PracticeProps<ExpressionSpec, ExpressionAnswer>) {
  return (
    <>
      <Prompt text={prompt} />
      <ExpressionEntry
        id={variant.id}
        label={prompt}
        vars={variant.spec.vars}
        state={state}
        disabled={locked}
        submittedText={last?.answer.kind === "expression" ? last.answer.text : undefined}
        onAnswer={(text) => onSubmit({ kind: "expression", text })}
      />
    </>
  );
}

/** Explain Slowly stage: `expression` = the line shown so far (read-only, with its overbar reading). */
export function Explain({ variant, stage }: ExplainProps<ExpressionSpec>) {
  return <ExpressionEntry id={variant.id} label="Expression" vars={variant.spec.vars} shown={(stage.expression as string | undefined) ?? ""} />;
}

/** Draws nothing: mounting it downloads this kind's chunk ahead of use (see `KindPrefetch`). */
export function Preload() {
  return null;
}

// stable marker: the size report attributes this chunk to the kind (ADR-0008)
Practice.displayName = "kind:expression";
