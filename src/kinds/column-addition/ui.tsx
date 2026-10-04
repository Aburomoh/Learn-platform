"use client";

import { ColumnAddition } from "@/interactions/ColumnAddition/ColumnAddition";
import { additionColumns } from "../shared/ContextView";
import { Prompt } from "../shared/Prompt";
import type { ExplainProps, PracticeProps } from "../types";
import type { ColumnAdditionAnswer } from "./logic";
import type { ColumnAdditionSpec } from "./spec";

export function Practice({ variant, prompt, state, stepIndex, locked, onSubmit }: PracticeProps<ColumnAdditionSpec, ColumnAdditionAnswer>) {
  const { spec } = variant;
  const columns = additionColumns(spec.a, spec.b, spec.endCarry);
  return (
    <>
      <Prompt text={prompt} />
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

/** stage.revealed = completed steps shown; stage.attention = step to outline. */
export function Explain({ variant, stage }: ExplainProps<ColumnAdditionSpec>) {
  const { spec } = variant;
  const columns = additionColumns(spec.a, spec.b, spec.endCarry);
  return <ColumnAddition id={variant.id} a={spec.a} b={spec.b} columns={columns} stepIndex={(stage.revealed as number | undefined) ?? 0} attention={stage.attention as number | undefined} />;
}

/** Draws nothing: mounting it downloads this kind's chunk ahead of use (see `KindPrefetch`). */
export function Preload() {
  return null;
}

// stable marker: the size report attributes this chunk to the kind (ADR-0008)
Practice.displayName = "kind:column-addition";
