"use client";

/**
 * The activity page's kind logic (#683): `KindLogicGate` renders its children once the logic of
 * every listed kind is loaded and registered (`provideKind`), so the runner can grade and count
 * steps synchronously. Only those kinds' chunks are downloaded, and the build preloads them with
 * the page: `next/dynamic` server-renders through the gate (the HTML is unchanged) and lists the
 * chunks it used, as it does for the kind views in `./ui.ts`. No fallback, so nothing flashes.
 * Each `import()` is written out in place: the build needs to see it to know which chunk to preload.
 */
import dynamic from "next/dynamic";
import { createElement, type ReactNode } from "react";
import { isRegisteredKind, provideKind, type LogicOf, type RegisteredKind } from "./index";

function Pass({ children }: { children?: ReactNode }) {
  return children;
}

/** Registers a kind's logic; the gate then lets its children through. */
function provide<K extends RegisteredKind>(kind: K, logic: LogicOf<K>) {
  provideKind(kind, logic);
  return Pass;
}

export const kindLogicGate = {
  "base-to-decimal": dynamic(() => import("./base-to-decimal/logic").then((m) => provide("base-to-decimal", m.baseToDecimal))),
  "bit-grouping": dynamic(() => import("./bit-grouping/logic").then((m) => provide("bit-grouping", m.bitGrouping))),
  "circuit-predict": dynamic(() => import("./circuit-predict/logic").then((m) => provide("circuit-predict", m.circuitPredict))),
  derivation: dynamic(() => import("./derivation/logic").then((m) => provide("derivation", m.derivation))),
  expression: dynamic(() => import("./expression/logic").then((m) => provide("expression", m.expression))),
  "column-addition": dynamic(() => import("./column-addition/logic").then((m) => provide("column-addition", m.columnAddition))),
  "cpu-schedule": dynamic(() => import("./cpu-schedule/logic").then((m) => provide("cpu-schedule", m.cpuSchedule))),
  kmap: dynamic(() => import("./kmap/logic").then((m) => provide("kmap", m.kmap))),
  "memory-map": dynamic(() => import("./memory-map/logic").then((m) => provide("memory-map", m.memoryMap))),
  "multiple-choice": dynamic(() => import("./multiple-choice/logic").then((m) => provide("multiple-choice", m.multipleChoice))),
  numeric: dynamic(() => import("./numeric/logic").then((m) => provide("numeric", m.numeric))),
  "place-value": dynamic(() => import("./place-value/logic").then((m) => provide("place-value", m.placeValue))),
  "repeated-division": dynamic(() => import("./repeated-division/logic").then((m) => provide("repeated-division", m.repeatedDivision))),
  device: dynamic(() => import("./device/logic").then((m) => provide("device", m.device))),
  timing: dynamic(() => import("./timing/logic").then((m) => provide("timing", m.timing))),
  "state-diagram": dynamic(() => import("./state-diagram/logic").then((m) => provide("state-diagram", m.stateDiagram))),
  "truth-table": dynamic(() => import("./truth-table/logic").then((m) => provide("truth-table", m.truthTable))),
} as const satisfies Record<RegisteredKind, unknown>;

/** Renders `children` once the logic of these kinds is registered; adds nothing to the page. */
export function KindLogicGate({ kinds, children }: { kinds: readonly string[]; children: ReactNode }) {
  const wanted = [...new Set(kinds)].filter(isRegisteredKind).sort();
  return wanted.reduceRight<ReactNode>((inner, kind) => createElement(kindLogicGate[kind], null, inner), children);
}
