import type { TemplateVars } from "@/content/template";
import { resolveMessage } from "./messages";

/**
 * Wording for the gate being asked in a gate-by-gate circuit walk (ADR-0007: content step vars are
 * structural; words live in the catalog so a locale can override them). Reads the structural vars
 * of a "gate" step: `gateName` (gate type), and per input n = 1, 2: `in{n}` (0/1) plus either
 * `in{n}Label` (a circuit input, e.g. "A") or `in{n}Gate` (the type of the gate feeding it).
 * Returns {} for any other step.
 */
export function gateWording(vars: TemplateVars, locale = "en"): Record<string, string> {
  const type = vars.gateName;
  if (typeof type !== "string") return {};
  const inputs: string[] = [];
  for (const n of [1, 2]) {
    const value = vars[`in${n}`];
    if (value === undefined) continue;
    const label = vars[`in${n}Label`];
    const name = label !== undefined && label !== "" ? String(label) : resolveMessage("gate.output-of", { gateType: vars[`in${n}Gate`] ?? "" }, locale);
    inputs.push(resolveMessage("gate.input", { name, value }, locale));
  }
  return {
    gateRule: resolveMessage(`gate.rule.${type}`, {}, locale),
    gateAnalogy: resolveMessage(`gate.analogy.${type}`, {}, locale),
    ...(inputs.length ? { gateInputs: inputs.length === 1 ? inputs[0] : resolveMessage("gate.inputs-two", { first: inputs[0], second: inputs[1] }, locale) } : {}),
  };
}
