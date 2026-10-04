"use client";

import { Prompt } from "../shared/Prompt";
import shared from "../shared/shared.module.css";
import type { ExplainProps, PracticeProps } from "../types";
import { DeviceDiagram } from "./DeviceDiagram";
import { codeNames, device, pickName, rightPick, type DeviceAnswer } from "./logic";
import type { DeviceSpec } from "./spec";

const QUESTION = { decoder: "which output is 1?", encoder: "what is the output code?", mux: "which input reaches Y?" } as const;

export function Practice({ variant, prompt, state, stepIndex, locked, onSubmit }: PracticeProps<DeviceSpec, DeviceAnswer>) {
  const { spec } = variant;
  const finished = state === "correct" && locked;
  // finished: the last ask stays on screen with its answer drawn
  const step = Math.min(stepIndex, spec.asks.length - 1);
  const ask = spec.asks[step];
  const given = String(device.steps!.vars(spec, step).given);
  return (
    <>
      <Prompt text={prompt} />
      {!finished && (
        <p className={shared.stepLabel} aria-live="polite">
          {step + 1} of {spec.asks.length}: {spec.device === "encoder" ? `${given} is active` : given}, {QUESTION[spec.device]}
        </p>
      )}
      <DeviceDiagram
        key={stepIndex}
        id={variant.id}
        device={spec.device}
        bits={spec.bits}
        names={codeNames(spec)}
        ask={ask}
        data={spec.data}
        revealed={finished ? rightPick(spec, ask) : undefined}
        pickName={(k) => pickName(spec, k)}
        state={state}
        disabled={locked}
        onCheck={(pick) => onSubmit({ kind: "device", step: stepIndex, pick })}
      />
    </>
  );
}

/** Explain Slowly reuses the diagram read-only. Content stage: `ask` = index of the ask shown (default 0), `answer` = draw its answer. */
export function Explain({ variant, stage }: ExplainProps<DeviceSpec>) {
  const { spec } = variant;
  const ask = spec.asks[Math.min((stage.ask as number | undefined) ?? 0, spec.asks.length - 1)];
  return <DeviceDiagram id={variant.id} device={spec.device} bits={spec.bits} names={codeNames(spec)} ask={ask} data={spec.data} revealed={stage.answer ? rightPick(spec, ask) : undefined} pickName={(k) => pickName(spec, k)} />;
}

/** Draws nothing: mounting it downloads this kind's chunk ahead of use (see `KindPrefetch`). */
export function Preload() {
  return null;
}

// stable marker: the size report attributes this chunk to the kind (ADR-0008)
Practice.displayName = "kind:device";
