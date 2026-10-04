import type { Variant } from "@/content/schema";
import type { ActivityContext } from "./engine/state";
import { gateWording } from "./gateVars";

/**
 * Builds the engine context for one content variant. `extraVars` are the current step's
 * structural vars (ADR-0007, `stepVars`); step wording such as a gate's rule is added here from
 * the catalog in the active locale, never authored in content.
 */
export function contextFromVariant(variant: Variant, locale = "en", extraVars: Record<string, string | number> = {}, stepTag?: string): ActivityContext {
  const misconceptionKeys: Record<string, string> = {};
  for (const m of variant.misconceptions) misconceptionKeys[m.id] = m.nudgeKey;
  const vars = { ...variant.vars, ...extraVars };
  return {
    hints: variant.hints,
    explanation: variant.explanation,
    vars: { ...vars, ...gateWording(vars, locale) },
    reactions: variant.reactions,
    misconceptionKeys,
    locale,
    stepTag,
    kind: variant.spec.kind,
  };
}
