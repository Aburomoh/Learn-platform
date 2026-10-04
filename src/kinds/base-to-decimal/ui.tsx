"use client";

import { Prompt } from "../shared/Prompt";
import type { ExplainProps, PracticeProps } from "../types";
import { exactTerm, exactValue, placeDigits, type BaseToDecimalAnswer } from "./logic";
import type { BaseToDecimalSpec } from "./spec";
import { WeightDiagram, type WeightDigit } from "./WeightDiagram";

const digitsOf = (spec: BaseToDecimalSpec): WeightDigit[] => placeDigits(spec).map((d) => ({ ...d, term: exactTerm(d.value, spec.base, d.power) }));

export function Practice({ variant, prompt, state, last, stepIndex, locked, onSubmit }: PracticeProps<BaseToDecimalSpec, BaseToDecimalAnswer>) {
  const { spec } = variant;
  const finished = state === "correct" && locked;
  return (
    <>
      <Prompt text={prompt} />
      <WeightDiagram
        key={stepIndex}
        id={variant.id}
        base={spec.base}
        number={spec.number}
        digits={digitsOf(spec)}
        value={exactValue(spec)}
        stepIndex={finished ? 3 : stepIndex}
        state={state}
        wrongIndex={state === "incorrect" ? last?.result.wrongCells?.first : undefined}
        disabled={locked}
        onCheck={(entries) =>
          onSubmit(
            stepIndex === 0
              ? { kind: "base-to-decimal", step: 0, powers: entries.map((e) => (/^-?\d+$/.test(e) ? Number(e) : Number.NaN)) }
              : stepIndex === 1
                ? { kind: "base-to-decimal", step: 1, terms: entries }
                : { kind: "base-to-decimal", step: 2, sum: entries[0] },
          )
        }
      />
    </>
  );
}

/** Explain Slowly reuses the diagram read-only. Content stage: `revealed` = goals shown done (0–3). */
export function Explain({ variant, stage }: ExplainProps<BaseToDecimalSpec>) {
  const { spec } = variant;
  return <WeightDiagram id={variant.id} base={spec.base} number={spec.number} digits={digitsOf(spec)} value={exactValue(spec)} stepIndex={(stage.revealed as number | undefined) ?? 0} />;
}

/** Draws nothing: mounting it downloads this kind's chunk ahead of use (see `KindPrefetch`). */
export function Preload() {
  return null;
}

// stable marker: the size report attributes this chunk to the kind (ADR-0008)
Practice.displayName = "kind:base-to-decimal";
