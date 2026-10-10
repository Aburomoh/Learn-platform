"use client";

import { Prompt } from "../shared/Prompt";
import type { ExplainProps, PracticeProps } from "../types";
import { goals, type MemoryMapAnswer } from "./logic";
import { MemoryMap } from "./MemoryMap";
import type { MemoryMapSpec } from "./spec";

export function Practice({ variant, prompt, state, last, stepIndex, locked, onSubmit }: PracticeProps<MemoryMapSpec, MemoryMapAnswer>) {
  const { spec } = variant;
  const all = goals(spec);
  const finished = state === "correct" && locked;
  const done = finished ? all.length : stepIndex;
  const submitted = last?.answer.kind === "memory-map" && last.answer.step === stepIndex ? last.answer : undefined;
  return (
    <>
      <Prompt text={prompt} />
      <MemoryMap
        key={stepIndex}
        id={variant.id}
        scheme={spec.scheme}
        fit={spec.fit}
        os={spec.os}
        unit={spec.unit}
        registerUnit={spec.registerUnit}
        jobs={spec.jobs}
        goals={all}
        done={done}
        state={state}
        wrongFirst={state === "incorrect" ? last?.result.wrongCells?.first : undefined}
        submitted={submitted}
        disabled={locked}
        onCheck={(answer) => onSubmit({ kind: "memory-map", step: stepIndex, ...answer })}
      />
    </>
  );
}

/**
 * Explain Slowly reuses the view read-only. Content stage: `revealed` = steps shown done (the next
 * one is the active step), `pick` = block index to halo, `fits` = block indices tagged "fits".
 */
export function Explain({ variant, stage }: ExplainProps<MemoryMapSpec>) {
  const { spec } = variant;
  return (
    <MemoryMap
      id={variant.id}
      scheme={spec.scheme}
      fit={spec.fit}
      os={spec.os}
      unit={spec.unit}
      registerUnit={spec.registerUnit}
      jobs={spec.jobs}
      goals={goals(spec)}
      done={(stage.revealed as number | undefined) ?? 0}
      explainPick={stage.pick as number | undefined}
      explainFits={stage.fits as number[] | undefined}
    />
  );
}

/** Draws nothing: mounting it downloads this kind's chunk ahead of use (see `KindPrefetch`). */
export function Preload() {
  return null;
}

// stable marker: the size report attributes this chunk to the kind (ADR-0008)
Practice.displayName = "kind:memory-map";
