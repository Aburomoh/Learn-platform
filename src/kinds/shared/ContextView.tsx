"use client";

import { additionSteps } from "@/content/binary";
import { BitRow } from "@/interactions/BitRow/BitRow";
import { ColumnAddition, type AdditionColumn } from "@/interactions/ColumnAddition/ColumnAddition";
import { DivisionChain } from "@/interactions/DivisionChain/DivisionChain";
import { BitGroups } from "./BitGroups";
import type { NumericContext } from "./contextSpec";

/** Every step of a column addition as `ColumnAddition` draws it. */
export function additionColumns(a: string, b: string, endCarry: "write" | "drop" | undefined): AdditionColumn[] {
  return additionSteps(a, b, endCarry !== "drop").map((s) => ({ a: s.a, b: s.b, carryIn: s.carryIn, sum: s.sum, carryOut: s.carryOut, final: s.final }));
}

/** A worked result shown above a numeric or multiple-choice question; `stage` drives it in Explain Slowly. */
export function ContextView({ id, context, stage }: { id: string; context: NumericContext | undefined; stage?: Record<string, unknown> }) {
  if (!context) return null;
  switch (context.type) {
    case "division-chain":
      return <DivisionChain id={id} steps={context.steps} stepIndex={context.steps.length} showOrder={!!stage?.showOrder} attention={stage?.attention as number | undefined} />;
    case "bits":
      return <BitGroups bits={context.bits} groups={(stage?.groups as string[] | undefined) ?? []} attention={stage?.attention as number | undefined} done={!!stage?.done} />;
    case "addition": {
      const { a, b, endCarry } = context.operands;
      const columns = additionColumns(a, b, endCarry);
      return <ColumnAddition id={id} a={a} b={b} columns={columns} stepIndex={columns.length} attention={stage?.attention as number | undefined} />;
    }
    case "bit-row":
      return <BitRow id={id} bits={context.bits} sourceOnly />;
    default: {
      const unhandled: never = context;
      throw new Error(`No renderer for context ${JSON.stringify(unhandled)}`);
    }
  }
}
