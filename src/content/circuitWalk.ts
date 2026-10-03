/**
 * Gate-by-gate walk of a circuit-predict question. Order and per-gate truth come from the spec
 * (gateOrder + evaluateCircuit); the rule and analogy text per gate type is course content.
 */
import type { CircuitSpec } from "./schema";
import { evaluateCircuit, gateOrder } from "./grade";

type GateType = CircuitSpec["gates"][number]["type"];

export const GATE_RULES: Record<GateType, { rule: string; analogy: string }> = {
  NOT: { rule: "NOT flips its input: 0 becomes 1 and 1 becomes 0.", analogy: "NOT is like a switch wired backwards: on gives off, off gives on." },
  AND: { rule: "AND gives 1 only when both inputs are 1.", analogy: "AND is like a door with two locks: it opens only when both keys turn." },
  OR: { rule: "OR gives 1 when at least one input is 1.", analogy: "OR is like two doors into a room: if either is open, you can get in." },
  XOR: { rule: "XOR gives 1 when its two inputs are different.", analogy: "XOR is like a stairway light with two switches: flipping either one changes it." },
  NAND: { rule: "NAND is AND followed by NOT: it gives 0 only when both inputs are 1.", analogy: "Work out AND first, then flip the result." },
  NOR: { rule: "NOR is OR followed by NOT: it gives 1 only when both inputs are 0.", analogy: "Work out OR first, then flip the result." },
};

/** Template variables for the gate at `step` of the walk (clamped to the last gate). */
export function circuitStepVars(spec: CircuitSpec, step: number): Record<string, string | number> {
  const order = gateOrder(spec);
  const index = Math.min(Math.max(step, 0), order.length - 1);
  const gate = spec.gates.find((g) => g.id === order[index])!;
  const values = evaluateCircuit(spec);
  const name = (id: string) => spec.inputs.find((i) => i.id === id)?.label ?? `the ${spec.gates.find((g) => g.id === id)!.type} output`;
  return {
    stepNumber: index + 1,
    gateCount: order.length,
    gateId: gate.id,
    gateName: gate.type,
    gateInputs: gate.from.map((f) => `${name(f)} = ${values[f]}`).join(" and "),
    gateOut: values[gate.id],
    gateRule: GATE_RULES[gate.type].rule,
    gateAnalogy: GATE_RULES[gate.type].analogy,
  };
}
