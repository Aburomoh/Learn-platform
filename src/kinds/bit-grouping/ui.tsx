"use client";

import { BitGrouping } from "@/interactions/BitGrouping/BitGrouping";
import { Prompt } from "../shared/Prompt";
import type { ExplainProps, PracticeProps } from "../types";
import { allGroups, bitGrouping, groupsAroundPoint, type BitGroupingAnswer } from "./logic";
import type { BitGroupingSpec } from "./spec";

/** Groups and digits as the component draws them, left to right, and where the binary point goes. */
function parts(spec: BitGroupingSpec) {
  const groups = allGroups(spec);
  const { whole, frac } = groupsAroundPoint(spec.bits, spec.groupSize);
  return { count: bitGrouping.steps!.count(spec), groups, digits: groups.map((g) => parseInt(g, 2).toString(16).toUpperCase()), pointAfter: frac.length ? whole.length : undefined };
}

export function Practice({ variant, prompt, state, stepIndex, locked, onSubmit }: PracticeProps<BitGroupingSpec, BitGroupingAnswer>) {
  const { spec } = variant;
  const { count, groups, digits, pointAfter } = parts(spec);
  const finished = state === "correct";
  return (
    <>
      <Prompt text={prompt} />
      <BitGrouping
        key={stepIndex}
        id={variant.id}
        bits={spec.bits}
        groupSize={spec.groupSize}
        direction={spec.direction}
        stepIndex={finished ? count : stepIndex}
        groups={groups}
        digits={digits}
        pointAfter={pointAfter}
        state={state === "incorrect" ? "incorrect" : "idle"}
        disabled={locked}
        onGroups={(marked) => onSubmit({ kind: "bit-grouping", step: 0, groups: marked })}
        onDigit={(digit) => onSubmit({ kind: "bit-grouping", step: stepIndex, digit })}
        onBits={(group) => onSubmit({ kind: "bit-grouping", step: stepIndex, group })}
      />
    </>
  );
}

/**
 * Content stages, to-digits: `groups: []` = the bits before grouping; groups shown = `attention`
 * is the group whose digit is being asked (its digit appears once predicted); `done` = everything.
 * to-bits: `attention` = the digit whose bits are being asked (earlier ones show their bits);
 * `done` = everything.
 */
export function Explain({ variant, stage, answered, hasAsk }: ExplainProps<BitGroupingSpec>) {
  const { spec } = variant;
  const { count, groups, digits, pointAfter } = parts(spec);
  const asked = stage.attention as number | undefined;
  const after = answered && hasAsk ? 1 : 0;
  if (spec.direction === "to-bits") {
    const step = stage.done ? count : (asked ?? 0) + (asked === undefined ? 0 : after);
    return <BitGrouping id={variant.id} bits={spec.bits} groupSize={spec.groupSize} direction="to-bits" stepIndex={Math.min(step, count)} groups={groups} digits={digits} pointAfter={pointAfter} attention={asked} />;
  }
  const grouped = ((stage.groups as string[] | undefined) ?? []).length > 0;
  const step = stage.done ? count : !grouped ? 0 : asked === undefined ? 1 : asked + 1 + after;
  return <BitGrouping id={variant.id} bits={spec.bits} groupSize={spec.groupSize} stepIndex={Math.min(step, count)} groups={groups} digits={digits} pointAfter={pointAfter} attention={grouped ? asked : undefined} />;
}

/** Draws nothing: mounting it downloads this kind's chunk ahead of use (see `KindPrefetch`). */
export function Preload() {
  return null;
}

// stable marker: the size report attributes this chunk to the kind (ADR-0008)
Practice.displayName = "kind:bit-grouping";
