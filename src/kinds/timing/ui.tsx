"use client";

import { Prompt } from "../shared/Prompt";
import shared from "../shared/shared.module.css";
import type { ExplainProps, PracticeProps } from "../types";
import { activeEdges, clockLevels, initialState, outputLevels, outputNames, type TimingAnswer } from "./logic";
import type { TimingSpec } from "./spec";
import { TimingDiagram } from "./TimingDiagram";

/** What the diagram draws, computed from the spec (the outputs' levels come from the kind's logic). */
function drawing(spec: TimingSpec) {
  const names = outputNames(spec);
  const levels = outputLevels(spec);
  return {
    edge: spec.edge,
    inputs: spec.inputs,
    clock: clockLevels(spec),
    outputs: names.map((name, i) => ({ name, levels: levels[i] })),
    initial: initialState(spec),
    edges: activeEdges(spec).map((e) => e.column),
  };
}

export function Practice({ variant, prompt, state, last, stepIndex, locked, onSubmit }: PracticeProps<TimingSpec, TimingAnswer>) {
  const { spec } = variant;
  const d = drawing(spec);
  const finished = state === "correct" && locked;
  const done = finished ? d.edges.length : stepIndex;
  return (
    <>
      <Prompt text={prompt} />
      {!finished && (
        <p className={shared.stepLabel} aria-live="polite">
          Edge {done + 1} of {d.edges.length} ({spec.edge})
        </p>
      )}
      <TimingDiagram
        key={stepIndex}
        id={variant.id}
        {...d}
        done={done}
        state={state}
        wrongOutput={state === "incorrect" ? last?.result.wrongCells?.first : undefined}
        disabled={locked}
        onCheck={(q) => onSubmit({ kind: "timing", step: stepIndex, q })}
      />
    </>
  );
}

/** Explain Slowly reuses the diagram read-only. Content stage: `revealed` = edges whose outputs are drawn (the next one has the halo). */
export function Explain({ variant, stage }: ExplainProps<TimingSpec>) {
  return <TimingDiagram id={variant.id} {...drawing(variant.spec)} done={(stage.revealed as number | undefined) ?? 0} />;
}

/** Draws nothing: mounting it downloads this kind's chunk ahead of use (see `KindPrefetch`). */
export function Preload() {
  return null;
}

// stable marker: the size report attributes this chunk to the kind (ADR-0008)
Practice.displayName = "kind:timing";
