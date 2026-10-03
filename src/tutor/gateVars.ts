import type { CircuitSpec } from "@/content/schema";
import { evaluateCircuit } from "@/content/grade";
import { resolveMessage } from "./messages";

/**
 * Localised wording for the gate being asked in a gate-by-gate circuit walk. Structure (which
 * gate, its inputs, their values) comes from the spec; words come from the message catalog, so a
 * locale can override them. Returns {} when `gateId` is not a gate of this circuit.
 */
export function gateVars(spec: CircuitSpec, gateId: string, locale = "en"): Record<string, string> {
  const gate = spec.gates.find((g) => g.id === gateId);
  if (!gate) return {};
  const values = evaluateCircuit(spec);
  const name = (id: string) => {
    const input = spec.inputs.find((i) => i.id === id);
    if (input) return input.label;
    const source = spec.gates.find((g) => g.id === id);
    return resolveMessage("gate.output-of", { gateType: source?.type ?? id }, locale);
  };
  const inputs = gate.from.map((f) => resolveMessage("gate.input", { name: name(f), value: values[f] }, locale));
  return {
    gateRule: resolveMessage(`gate.rule.${gate.type}`, {}, locale),
    gateAnalogy: resolveMessage(`gate.analogy.${gate.type}`, {}, locale),
    gateInputs: inputs.length === 1 ? inputs[0] : resolveMessage("gate.inputs-two", { first: inputs[0], second: inputs[1] }, locale),
  };
}
