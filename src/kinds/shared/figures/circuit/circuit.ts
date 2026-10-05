import type { BoolExpr } from "@/content/boolean";

export type GateType = "AND" | "OR" | "NOT" | "XOR" | "NAND" | "NOR";

/** A small gate circuit: what the circuit kind asks about and what a gate figure draws. */
export interface CircuitShape {
  inputs: { id: string; label: string; value: 0 | 1 }[];
  gates: { id: string; type: GateType; from: string[]; label?: string }[];
  outputGateId: string;
  inputsToggleable?: boolean;
}

/** Evaluates a circuit spec; used by content tests to confirm authored answers. */
export function evaluateCircuit(spec: CircuitShape, inputOverride?: Record<string, 0 | 1>): Record<string, 0 | 1> {
  const values: Record<string, 0 | 1> = {};
  for (const inp of spec.inputs) values[inp.id] = inputOverride?.[inp.id] ?? inp.value;
  const pending = [...spec.gates];
  let guard = 0;
  while (pending.length && guard++ < 50) {
    const g = pending.shift()!;
    if (!g.from.every((f) => f in values)) {
      pending.push(g);
      continue;
    }
    const [x, y] = g.from.map((f) => values[f]);
    values[g.id] = gateOutput(g.type, x, y);
  }
  if (pending.length) throw new Error("Circuit has unresolved gates (cycle or missing input)");
  return values;
}

/** Gate ids in signal-flow order (every gate after its sources), the output gate last. */
export function gateOrder(spec: CircuitShape): string[] {
  const ready = new Set(spec.inputs.map((i) => i.id));
  const order: string[] = [];
  const pending = spec.gates.filter((g) => g.id !== spec.outputGateId);
  while (pending.length) {
    const i = pending.findIndex((g) => g.from.every((f) => ready.has(f)));
    if (i < 0) throw new Error("Circuit has unresolved gates (cycle or missing input)");
    const [g] = pending.splice(i, 1);
    ready.add(g.id);
    order.push(g.id);
  }
  return [...order, spec.outputGateId];
}

export function gateOutput(type: GateType, x: 0 | 1, y: 0 | 1 = 0): 0 | 1 {
  switch (type) {
    case "AND": return x && y ? 1 : 0;
    case "OR": return x || y ? 1 : 0;
    case "NOT": return x ? 0 : 1;
    case "XOR": return x !== y ? 1 : 0;
    case "NAND": return x && y ? 0 : 1;
    case "NOR": return x || y ? 0 : 1;
  }
}

/** The expression at every input and gate output, in terms of the input labels. */
export function gateExpressions(spec: CircuitShape): Record<string, BoolExpr> {
  const out: Record<string, BoolExpr> = {};
  for (const inp of spec.inputs) out[inp.id] = { type: "var", name: inp.label };
  for (const id of gateOrder(spec)) {
    const g = spec.gates.find((x) => x.id === id)!;
    const args = g.from.map((f) => out[f]);
    const base: BoolExpr =
      g.type === "NOT" ? { type: "not", arg: args[0] } : g.type === "AND" || g.type === "NAND" ? { type: "and", args } : g.type === "XOR" ? { type: "xor", args } : { type: "or", args };
    out[id] = g.type === "NAND" || g.type === "NOR" ? { type: "not", arg: base } : base;
  }
  return out;
}

/** What a gate figure can hold on a phone: the circuit view's limits (3 inputs, 4 two-input gates). */
export const MAX_FIGURE_INPUTS = 3;
export const MAX_FIGURE_GATES = 4;

/**
 * The gates that compute an expression, as the analysis slides draw them: one input per literal
 * (a complemented variable is its own input, A′, since a flip-flop gives both Q and Q′), two-input
 * gates, the last one driving `output`. NOT of a two-input AND or OR is a NAND or NOR. Throws when
 * the expression is a bare literal (there is nothing to draw) or needs more than the figure holds.
 */
export function circuitFromExpression(expr: BoolExpr, output: string): CircuitShape {
  const inputs: CircuitShape["inputs"] = [];
  const gates: CircuitShape["gates"] = [];
  const input = (label: string) => {
    let found = inputs.find((i) => i.label === label);
    if (!found) inputs.push((found = { id: `in${inputs.length + 1}`, label, value: 0 }));
    return found.id;
  };
  const gate = (type: GateType, from: string[]) => {
    gates.push({ id: `g${gates.length + 1}`, type, from });
    return gates[gates.length - 1].id;
  };
  const build = (e: BoolExpr): string => {
    switch (e.type) {
      case "const":
        throw new Error("a constant has no gates to draw");
      case "var":
        return input(e.name);
      case "not":
        if (e.arg.type === "var") return input(`${e.arg.name}′`);
        if ((e.arg.type === "and" || e.arg.type === "or") && e.arg.args.length === 2) return gate(e.arg.type === "and" ? "NAND" : "NOR", e.arg.args.map(build));
        return gate("NOT", [build(e.arg)]);
      default: {
        const type = e.type === "and" ? "AND" : e.type === "or" ? "OR" : "XOR";
        return e.args.slice(1).reduce((acc, arg) => gate(type, [acc, build(arg)]), build(e.args[0]));
      }
    }
  };
  build(expr);
  if (!gates.length) throw new Error("a single literal has no gates to draw");
  if (inputs.length > MAX_FIGURE_INPUTS || gates.length > MAX_FIGURE_GATES) throw new Error(`needs ${inputs.length} inputs and ${gates.length} gates; a gate figure holds ${MAX_FIGURE_INPUTS} and ${MAX_FIGURE_GATES}`);
  const last = gates[gates.length - 1];
  last.label = output;
  return { inputs, gates, outputGateId: last.id };
}

/**
 * The wiring in words, from the output back: "an OR gate fed by AND(A, x) and AND(B, x)". It names
 * gates and connections, as the drawing does, and never the simplified expression.
 */
export function describeWiring(circuit: CircuitShape): string {
  const signal = (id: string): string => {
    const input = circuit.inputs.find((i) => i.id === id);
    if (input) return input.label;
    const g = circuit.gates.find((x) => x.id === id)!;
    return `${g.type}(${g.from.map(signal).join(", ")})`;
  };
  const out = circuit.gates.find((g) => g.id === circuit.outputGateId)!;
  return `${/^[AO]/.test(out.type) ? "an" : "a"} ${out.type} gate fed by ${out.from.map(signal).join(" and ")}`;
}
