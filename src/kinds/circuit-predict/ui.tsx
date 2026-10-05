"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MultipleChoice } from "@/interactions/MultipleChoice/MultipleChoice";
import { Prompt } from "../shared/Prompt";
import shared from "../shared/shared.module.css";
import type { ExplainProps, PracticeProps } from "../types";
import { CircuitDiagram } from "../shared/figures/circuit/CircuitDiagram";
import { outputGates } from "../shared/figures/circuit/layout";
import { formatBool } from "@/content/boolean";
import { ExpressionEntry } from "../shared/ExpressionEntry";
import { circuitPredict, gateExpressions, type CircuitAnswer } from "./logic";
import type { CircuitSpec } from "./spec";

/** Expression mode: every gate's output expression in course notation, for the diagram's labels. */
function expressionsOf(spec: CircuitSpec): Record<string, string> | undefined {
  if (spec.mode !== "expression") return undefined;
  const exprs = gateExpressions(spec);
  return Object.fromEntries(spec.gates.map((g) => [g.id, formatBool(exprs[g.id])]));
}

/**
 * Circuit question answered one gate at a time, in signal-flow order. The gate being asked is
 * outlined; gates already answered stay lit with their value; a gate that drives a circuit output is asked by that output's name (Y, or S and C).
 * In expression mode (#348) the answer is the expression at the gate's output, typed in the shared
 * expression field; finished gates show their expression on the diagram.
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
  // the name of the circuit output this gate drives (Y, or S / C of a half adder), if any
  const outputName = outputGates(spec).find((o) => o.gateId === gate.id)?.label;
  const finished = locked && state === "correct";
  const expressions = expressionsOf(spec);
  const explore = finished && spec.inputsToggleable && !expressions;
  const lastHere = last?.answer.kind === "circuit-predict" && (last.answer.step ?? order.length - 1) === step ? last.answer : undefined;

  // The answer form is replaced on each step; keep keyboard focus with the new question.
  const answerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (step > 0 && !finished) answerRef.current?.querySelector<HTMLInputElement>("input[type='radio'], input[type='text'], input:not([type])")?.focus();
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
        expressions={expressions}
      />
      {explore && <p className={shared.note}>Explore: toggle the inputs and watch the output change.</p>}
      {!finished && (
        <p className={shared.stepLabel} aria-live="polite">
          Gate {step + 1} of {order.length}: {gate.type}
          {expressions ? ". Write the expression at its output." : ""}
        </p>
      )}
      <div ref={answerRef}>
        {expressions ? (
          !finished && (
            <ExpressionEntry
              key={step}
              id={`${variant.id}-${gate.id}`}
              label={outputName ? `Expression at the output of the ${gate.type} gate. That is ${outputName}.` : `Expression at the output of the ${gate.type} gate`}
              vars={spec.inputs.map((i) => i.label)}
              state={state}
              disabled={locked}
              submittedText={lastHere?.expression}
              onAnswer={(expression) => onSubmit({ kind: "circuit-predict", step, expression })}
            />
          )
        ) : (
        <MultipleChoice
          key={step}
          id={`${variant.id}-${gate.id}`}
          prompt={outputName ? `What comes out of the ${gate.type} gate? That is ${outputName}.` : `What comes out of the ${gate.type} gate?`}
          options={[
            { id: "0", text: outputName ? `${outputName} = 0` : "0" },
            { id: "1", text: outputName ? `${outputName} = 1` : "1" },
          ]}
          disabled={locked}
          state={state}
          submittedOptionId={last?.answer.kind === "circuit-predict" ? String(last.answer.output) : undefined}
          onAnswer={(optionId) => onSubmit({ kind: "circuit-predict", step, output: optionId === "1" ? 1 : 0 })}
        />
        )}
      </div>
    </>
  );
}

export function Explain({ variant, stage, isLast, answered }: ExplainProps<CircuitSpec>) {
  const active = stage.active as string | undefined;
  const lit = (stage.lit as string[] | undefined) ?? [];
  return <CircuitDiagram id={variant.id} spec={variant.spec} lit={active && answered ? [...lit, active] : lit} activeGateId={active} revealOutput={isLast} expressions={expressionsOf(variant.spec)} />;
}

/** Draws nothing: mounting it downloads this kind's chunk ahead of use (see `KindPrefetch`). */
export function Preload() {
  return null;
}

// stable marker: the size report attributes this chunk to the kind (ADR-0008)
Practice.displayName = "kind:circuit-predict";
