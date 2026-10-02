import type { Variant } from "@/content/schema";
import type { ActivityContext } from "./engine/state";

/** Builds the engine context for one content variant. */
export function contextFromVariant(variant: Variant, locale = "en"): ActivityContext {
  const misconceptionKeys: Record<string, string> = {};
  for (const m of variant.misconceptions) misconceptionKeys[m.id] = m.nudgeKey;
  return {
    hints: variant.hints,
    explanation: variant.explanation,
    vars: variant.vars,
    reactions: variant.reactions,
    misconceptionKeys,
    locale,
  };
}
