import { describe, expect, it } from "vitest";
import { kinds, isRegisteredKind } from "./index";
import { courses } from "@/content";
import { detectorsByKind, kindSpecs } from "./specs";
import { kindUI } from "./ui";

const names = Object.keys(kinds).sort();

describe("kind registry (ADR-0008)", () => {
  it("every registered kind has a spec, logic and lazy views under the same name", () => {
    expect(kindSpecs.map((spec) => spec.shape.kind.value).sort()).toEqual(names);
    expect(Object.keys(kindUI).sort()).toEqual(names);
    for (const name of names) expect(isRegisteredKind(name)).toBe(true);
    expect(isRegisteredKind("toString")).toBe(false);
  });

  it("each kind's UI module exports Practice, Explain and Preload, and carries its size-report marker", async () => {
    const modules: Record<string, () => Promise<{ Practice: { displayName?: string }; Explain: unknown; Preload: () => null }>> = {
      "base-to-decimal": () => import("./base-to-decimal/ui"),
      "bit-grouping": () => import("./bit-grouping/ui"),
      "circuit-predict": () => import("./circuit-predict/ui"),
      derivation: () => import("./derivation/ui"),
      expression: () => import("./expression/ui"),
      kmap: () => import("./kmap/ui"),
      "column-addition": () => import("./column-addition/ui"),
      "multiple-choice": () => import("./multiple-choice/ui"),
      numeric: () => import("./numeric/ui"),
      "place-value": () => import("./place-value/ui"),
      "repeated-division": () => import("./repeated-division/ui"),
      device: () => import("./device/ui"),
      timing: () => import("./timing/ui"),
      "state-diagram": () => import("./state-diagram/ui"),
      "truth-table": () => import("./truth-table/ui"),
    };
    expect(Object.keys(modules).sort()).toEqual(names);
    for (const name of names) {
      const ui = await modules[name]();
      expect(ui.Practice.displayName).toBe(`kind:${name}`);
      expect(typeof ui.Explain).toBe("function");
      expect(ui.Preload()).toBeNull();
    }
  });

  it("a variant's misconceptions use `equals` or a detector of its own kind (a foreign one would never fire)", () => {
    expect(Object.keys(detectorsByKind).sort()).toEqual(names);
    const own = Object.fromEntries(Object.entries(detectorsByKind).map(([kind, list]) => [kind, new Set(list.map((d) => d.shape.type.value as string))]));
    for (const course of courses)
      for (const variant of course.modules.flatMap((m) => m.topics).flatMap((t) => t.activities).flatMap((a) => a.questions).flatMap((q) => q.variants))
        for (const m of variant.misconceptions) {
          if (m.detect.type === "equals") continue;
          expect(own[variant.spec.kind].has(m.detect.type), `${variant.id}: ${m.id} uses ${m.detect.type}, not a ${variant.spec.kind} detector`).toBe(true);
        }
  });
});
