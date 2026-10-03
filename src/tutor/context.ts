import type { Variant } from "@/content/schema";
import type { ActivityContext } from "./engine/state";
import { gateVars } from "./gateVars";

/**
 * Builds the engine context for one content variant. `extraVars` are the current step's vars
 * (multi-step questions). For a circuit walk, `extraVars.gateId` names the gate being asked and
 * its rule, analogy and inputs are added in the active locale.
 */
export function contextFromVariant(variant: Variant, locale = "en", extraVars: Record<string, string | number> = {}): ActivityContext {
  const misconceptionKeys: Record<string, string> = {};
  for (const m of variant.misconceptions) misconceptionKeys[m.id] = m.nudgeKey;
  const gate = variant.spec.kind === "circuit-predict" && typeof extraVars.gateId === "string" ? gateVars(variant.spec, extraVars.gateId, locale) : {};
  return {
    hints: variant.hints,
    explanation: variant.explanation,
    vars: { ...variant.vars, ...extraVars, ...gate },
    reactions: variant.reactions,
    misconceptionKeys,
    locale,
  };
}
