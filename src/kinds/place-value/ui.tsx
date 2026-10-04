"use client";

import { useState } from "react";
import { Prompt } from "../shared/Prompt";
import type { ExplainProps, PracticeProps } from "../types";
import type { PlaceValueAnswer } from "./logic";
import type { PlaceValueSpec } from "./spec";
import { PlaceValueDiagram, type Bit } from "./PlaceValueDiagram";

export function Practice({ variant, prompt, state, last, locked, onSubmit }: PracticeProps<PlaceValueSpec, PlaceValueAnswer>) {
  const { spec } = variant;
  const [digits, setDigits] = useState<Bit[]>(() => (last?.answer.kind === "place-value" ? last.answer.digits : Array.from({ length: spec.slots }, () => null)));
  return (
    <>
      <Prompt text={prompt} />
      <PlaceValueDiagram id={variant.id} slots={spec.slots} digits={digits} onChange={setDigits} readOnly={locked} state={state} onSubmit={() => onSubmit({ kind: "place-value", digits })} />
    </>
  );
}

export function Explain({ variant, stage }: ExplainProps<PlaceValueSpec>) {
  const { spec } = variant;
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
}

/** Draws nothing: mounting it downloads this kind's chunk ahead of use (see `KindPrefetch`). */
export function Preload() {
  return null;
}

// stable marker: the size report attributes this chunk to the kind (ADR-0008)
Practice.displayName = "kind:place-value";
