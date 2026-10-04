"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MultipleChoice } from "@/interactions/MultipleChoice/MultipleChoice";
import { Prompt } from "../shared/Prompt";
import shared from "../shared/shared.module.css";
import type { ExplainProps, PracticeProps } from "../types";
import { CircuitDiagram } from "./CircuitDiagram";
import { circuitPredict, type CircuitAnswer } from "./logic";
import type { CircuitSpec } from "./spec";

/**
 * Circuit question answered one gate at a time, in signal-flow order. The gate being asked is
 * outlined; gates already answered stay lit with their value; the last gate gives Y.
 */
export function Practice({ variant, prompt, state, last, stepIndex, locked, onSubmit }: PracticeProps<CircuitSpec, CircuitAnswer>) {
  const { spec } = variant;
  const [inputs, setInputs] = useState<Record<string, 0 | 1>>({});
  // Gate order comes from the step contract (ADR-0007): step i asks about one gate.
  const order = useMemo(() => {
    const steps = circuitPredict.steps!;
    return Array.from({ length: steps.count(spec) }, (_, i) => String(steps.vars(spec, i).gateId));
  }, [spec]);
  const step = Math.min(stepIndex, order.length - 1);
  const gate = spec.gates.find((g) => g.id === order[step])!;
  const isOutput = step === order.length - 1;
  const finished = locked && state === "correct";
  const explore = finished && spec.inputsToggleable;

  // The answer form is replaced on each step; keep keyboard focus with the new question.
  const answerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (step > 0 && !finished) answerRef.current?.querySelector<HTMLInputElement>("input[type='radio']")?.focus();
  }, [step, finished]);

  return (
    <>
      <Prompt text={prompt} />
      <CircuitDiagram
        id={variant.id}
        spec={spec}
        inputs={explore ? inputs : undefined}
        onToggleInput={explore ? (id, v) => setInputs((prev) => ({ ...prev, [id]: v })) : undefined}
        revealOutput={finished}
        lit={finished ? order : order.slice(0, step)}
        activeGateId={finished ? undefined : gate.id}
      />
      {explore && <p className={shared.note}>Explore: toggle A, B or C and watch Y change.</p>}
      {!finished && (
        <p className={shared.stepLabel} aria-live="polite">
          Gate {step + 1} of {order.length}: {gate.type}
        </p>
      )}
      <div ref={answerRef}>
        <MultipleChoice
          key={step}
          id={`${variant.id}-${gate.id}`}
          prompt={isOutput ? `What comes out of the ${gate.type} gate? That is Y.` : `What comes out of the ${gate.type} gate?`}
          options={[
            { id: "0", text: isOutput ? "Y = 0" : "0" },
            { id: "1", text: isOutput ? "Y = 1" : "1" },
          ]}
          disabled={locked}
          state={state}
          submittedOptionId={last?.answer.kind === "circuit-predict" ? String(last.answer.output) : undefined}
          onAnswer={(optionId) => onSubmit({ kind: "circuit-predict", step, output: optionId === "1" ? 1 : 0 })}
        />
      </div>
    </>
  );
}

export function Explain({ variant, stage, isLast, answered }: ExplainProps<CircuitSpec>) {
  const active = stage.active as string | undefined;
  const lit = (stage.lit as string[] | undefined) ?? [];
  return <CircuitDiagram id={variant.id} spec={variant.spec} lit={active && answered ? [...lit, active] : lit} activeGateId={active} revealOutput={isLast} />;
}

/** Draws nothing: mounting it downloads this kind's chunk ahead of use (see `KindPrefetch`). */
export function Preload() {
  return null;
}

// stable marker: the size report attributes this chunk to the kind (ADR-0008)
Practice.displayName = "kind:circuit-predict";
