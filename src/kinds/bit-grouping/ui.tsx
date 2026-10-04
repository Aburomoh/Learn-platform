"use client";

import { BitGrouping } from "@/interactions/BitGrouping/BitGrouping";
import { Prompt } from "../shared/Prompt";
import type { ExplainProps, PracticeProps } from "../types";
import { bitGrouping, type BitGroupingAnswer } from "./logic";
import type { BitGroupingSpec } from "./spec";

/** Groups and digits as the component draws them, from the step contract: step k ≥ 1 is the digit of group k. */
function digitSteps(spec: BitGroupingSpec) {
  const steps = bitGrouping.steps!;
  const count = steps.count(spec);
  const vars = Array.from({ length: count - 1 }, (_, i) => steps.vars(spec, i + 1));
  return { count, groups: vars.map((v) => String(v.groupBits)), digits: vars.map((v) => String(v.digit)) };
}

export function Practice({ variant, prompt, state, stepIndex, locked, onSubmit }: PracticeProps<BitGroupingSpec, BitGroupingAnswer>) {
  const { spec } = variant;
  const { count, groups, digits } = digitSteps(spec);
  const finished = state === "correct";
  return (
    <>
      <Prompt text={prompt} />
      <BitGrouping
        key={stepIndex}
        id={variant.id}
        bits={spec.bits}
        groupSize={spec.groupSize}
        stepIndex={finished ? count : stepIndex}
        groups={groups}
        digits={digits}
        state={state === "incorrect" ? "incorrect" : "idle"}
        disabled={locked}
        onGroups={(marked) => onSubmit({ kind: "bit-grouping", step: 0, groups: marked })}
        onDigit={(digit) => onSubmit({ kind: "bit-grouping", step: stepIndex, digit })}
      />
    </>
  );
}

/**
 * Content stages: `groups: []` = the bits before grouping; groups shown = `attention` is the group
 * whose digit is being asked (its digit appears once predicted); `done` = everything.
 */
export function Explain({ variant, stage, answered, hasAsk }: ExplainProps<BitGroupingSpec>) {
  const { spec } = variant;
  const { count, groups, digits } = digitSteps(spec);
  const grouped = ((stage.groups as string[] | undefined) ?? []).length > 0;
  const asked = stage.attention as number | undefined;
  const step = stage.done ? count : !grouped ? 0 : asked === undefined ? 1 : asked + 1 + (answered && hasAsk ? 1 : 0);
  return <BitGrouping id={variant.id} bits={spec.bits} groupSize={spec.groupSize} stepIndex={Math.min(step, count)} groups={groups} digits={digits} attention={grouped ? asked : undefined} />;
}

/** Draws nothing: mounting it downloads this kind's chunk ahead of use (see `KindPrefetch`). */
export function Preload() {
  return null;
}

// stable marker: the size report attributes this chunk to the kind (ADR-0008)
Practice.displayName = "kind:bit-grouping";
