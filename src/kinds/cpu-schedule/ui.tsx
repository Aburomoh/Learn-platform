"use client";

import { Prompt } from "../shared/Prompt";
import type { ExplainProps, PracticeProps } from "../types";
import { CpuSchedule } from "./CpuSchedule";
import { goals, truth, type CpuScheduleAnswer } from "./logic";
import type { CpuScheduleSpec } from "./spec";

export function Practice({ variant, prompt, state, last, stepIndex, locked, onSubmit }: PracticeProps<CpuScheduleSpec, CpuScheduleAnswer>) {
  const { spec } = variant;
  const all = goals(spec);
  const t = truth(spec);
  const finished = state === "correct" && locked;
  const done = finished ? all.length : stepIndex;
  const submitted = last?.answer.kind === "cpu-schedule" && last.answer.step === stepIndex ? last.answer : undefined;
  return (
    <>
      <Prompt text={prompt} />
      <CpuSchedule
        key={stepIndex}
        id={variant.id}
        spec={spec}
        segments={t.segments}
        results={t.jobs}
        goals={all}
        done={done}
        state={state}
        wrongFirst={state === "incorrect" ? last?.result.wrongCells?.first : undefined}
        submitted={submitted}
        disabled={locked}
        onCheck={(answer) => onSubmit({ kind: "cpu-schedule", step: stepIndex, ...answer })}
      />
    </>
  );
}

/** Explain Slowly reuses the chart read-only. Content stage: `revealed` = goals shown done (the next one is active). */
export function Explain({ variant, stage }: ExplainProps<CpuScheduleSpec>) {
  const { spec } = variant;
  const t = truth(spec);
  return <CpuSchedule id={variant.id} spec={spec} segments={t.segments} results={t.jobs} goals={goals(spec)} done={(stage.revealed as number | undefined) ?? 0} />;
}

/** Draws nothing: mounting it downloads this kind's chunk ahead of use (see `KindPrefetch`). */
export function Preload() {
  return null;
}

// stable marker: the size report attributes this chunk to the kind (ADR-0008)
Practice.displayName = "kind:cpu-schedule";
