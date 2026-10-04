"use client";

import { DivisionChain } from "@/interactions/DivisionChain/DivisionChain";
import { Prompt } from "../shared/Prompt";
import type { ExplainProps, PracticeProps } from "../types";
import type { RepeatedDivisionAnswer } from "./logic";
import type { RepeatedDivisionSpec } from "./spec";

export function Practice({ variant, prompt, state, stepIndex, locked, onSubmit }: PracticeProps<RepeatedDivisionSpec, RepeatedDivisionAnswer>) {
  const { spec } = variant;
  const finished = state === "correct";
  return (
    <>
      <Prompt text={prompt} />
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

export function Explain({ variant, stage }: ExplainProps<RepeatedDivisionSpec>) {
  return <DivisionChain id={variant.id} steps={variant.spec.steps} stepIndex={(stage.revealed as number | undefined) ?? 0} attention={stage.attention as number | undefined} />;
}

/** Draws nothing: mounting it downloads this kind's chunk ahead of use (see `KindPrefetch`). */
export function Preload() {
  return null;
}

// stable marker: the size report attributes this chunk to the kind (ADR-0008)
Practice.displayName = "kind:repeated-division";
