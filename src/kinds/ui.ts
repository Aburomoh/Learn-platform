"use client";

/**
 * Lazy views per kind (ADR-0008). An activity downloads only the kinds it uses: `next/dynamic`
 * pre-renders the view into the exported HTML and preloads its chunk, so challenge 1 is still
 * there at first paint (#158). Each `import()` is written out in place: the build needs to see it
 * to know which chunk to preload.
 */
import dynamic from "next/dynamic";
import { Suspense, createElement, type ComponentType } from "react";
import { isRegisteredKind, type RegisteredKind } from "./index";

export const kindUI = {
  "base-to-decimal": {
    Practice: dynamic(() => import("./base-to-decimal/ui").then((m) => m.Practice)),
    Explain: dynamic(() => import("./base-to-decimal/ui").then((m) => m.Explain)),
    Preload: dynamic(() => import("./base-to-decimal/ui").then((m) => m.Preload)),
  },
  "bit-grouping": {
    Practice: dynamic(() => import("./bit-grouping/ui").then((m) => m.Practice)),
    Explain: dynamic(() => import("./bit-grouping/ui").then((m) => m.Explain)),
    Preload: dynamic(() => import("./bit-grouping/ui").then((m) => m.Preload)),
  },
  expression: {
    Practice: dynamic(() => import("./expression/ui").then((m) => m.Practice)),
    Explain: dynamic(() => import("./expression/ui").then((m) => m.Explain)),
    Preload: dynamic(() => import("./expression/ui").then((m) => m.Preload)),
  },
  kmap: {
    Practice: dynamic(() => import("./kmap/ui").then((m) => m.Practice)),
    Explain: dynamic(() => import("./kmap/ui").then((m) => m.Explain)),
    Preload: dynamic(() => import("./kmap/ui").then((m) => m.Preload)),
  },
  derivation: {
    Practice: dynamic(() => import("./derivation/ui").then((m) => m.Practice)),
    Explain: dynamic(() => import("./derivation/ui").then((m) => m.Explain)),
    Preload: dynamic(() => import("./derivation/ui").then((m) => m.Preload)),
  },
  "circuit-predict": {
    Practice: dynamic(() => import("./circuit-predict/ui").then((m) => m.Practice)),
    Explain: dynamic(() => import("./circuit-predict/ui").then((m) => m.Explain)),
    Preload: dynamic(() => import("./circuit-predict/ui").then((m) => m.Preload)),
  },
  "column-addition": {
    Practice: dynamic(() => import("./column-addition/ui").then((m) => m.Practice)),
    Explain: dynamic(() => import("./column-addition/ui").then((m) => m.Explain)),
    Preload: dynamic(() => import("./column-addition/ui").then((m) => m.Preload)),
  },
  "multiple-choice": {
    Practice: dynamic(() => import("./multiple-choice/ui").then((m) => m.Practice)),
    Explain: dynamic(() => import("./multiple-choice/ui").then((m) => m.Explain)),
    Preload: dynamic(() => import("./multiple-choice/ui").then((m) => m.Preload)),
  },
  numeric: {
    Practice: dynamic(() => import("./numeric/ui").then((m) => m.Practice)),
    Explain: dynamic(() => import("./numeric/ui").then((m) => m.Explain)),
    Preload: dynamic(() => import("./numeric/ui").then((m) => m.Preload)),
  },
  "place-value": {
    Practice: dynamic(() => import("./place-value/ui").then((m) => m.Practice)),
    Explain: dynamic(() => import("./place-value/ui").then((m) => m.Explain)),
    Preload: dynamic(() => import("./place-value/ui").then((m) => m.Preload)),
  },
  "repeated-division": {
    Practice: dynamic(() => import("./repeated-division/ui").then((m) => m.Practice)),
    Explain: dynamic(() => import("./repeated-division/ui").then((m) => m.Explain)),
    Preload: dynamic(() => import("./repeated-division/ui").then((m) => m.Preload)),
  },
  "truth-table": {
    Practice: dynamic(() => import("./truth-table/ui").then((m) => m.Practice)),
    Explain: dynamic(() => import("./truth-table/ui").then((m) => m.Explain)),
    Preload: dynamic(() => import("./truth-table/ui").then((m) => m.Preload)),
  },
} as const satisfies Record<RegisteredKind, { Practice: unknown; Explain: unknown; Preload: ComponentType }>;

/**
 * Downloads the views of these kinds ahead of use: render it once the browser is idle. Each
 * kind's `Preload` draws nothing; mounting it fetches the same chunk its views come from.
 */
export function KindPrefetch({ kinds }: { kinds: string[] }) {
  const wanted = [...new Set(kinds)].filter(isRegisteredKind);
  return createElement(Suspense, { fallback: null }, ...wanted.map((kind) => createElement(Suspense, { key: kind, fallback: null }, createElement(kindUI[kind].Preload))));
}
