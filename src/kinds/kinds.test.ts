import { describe, expect, it } from "vitest";
import { kinds, isRegisteredKind } from "./index";
import { kindSpecs } from "./specs";
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
      "circuit-predict": () => import("./circuit-predict/ui"),
      "place-value": () => import("./place-value/ui"),
    };
    expect(Object.keys(modules).sort()).toEqual(names);
    for (const name of names) {
      const ui = await modules[name]();
      expect(ui.Practice.displayName).toBe(`kind:${name}`);
      expect(typeof ui.Explain).toBe("function");
      expect(ui.Preload()).toBeNull();
    }
  });
});
