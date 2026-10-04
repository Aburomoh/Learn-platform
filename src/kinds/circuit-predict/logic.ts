import type { TemplateVars } from "@/content/template";
import { BooleanParseError, equivalent, formatBool, parseBool, type BoolExpr } from "@/content/boolean";
import type { KindLogic } from "../types";
import type { CircuitSpec } from "./spec";

/**
 * `step` indexes gateOrder(spec): the gate being answered (omitted = the output gate).
 * predict mode answers `output`; expression mode answers `expression` (#226).
 */
export type CircuitAnswer = { kind: "circuit-predict"; output?: 0 | 1; step?: number; expression?: string };

export const circuitPredict: KindLogic<CircuitSpec, CircuitAnswer> = {
  grade(variant, answer) {
    const spec = variant.spec;
    const order = gateOrder(spec);
    const step = answer.step ?? order.length - 1;
    const gate = spec.gates.find((g) => g.id === order[step]);
    if (!gate) throw new Error(`No gate step ${step}`);
    if (spec.mode === "expression") return gradeExpression(variant.misconceptions, spec, gate, step, order.length, answer.expression ?? "");
    const correct = answer.output === evaluateCircuit(spec)[gate.id];
    const normalized = `${gate.id}=${answer.output}`;
    if (correct) return { correct, normalized, partial: step < order.length - 1 };
    const hit = variant.misconceptions.find((m) => m.detect.type === "gate-output" && m.detect.gate === gate.type);
    return { correct, normalized, misconceptionId: hit?.id };
  },
  // Gate-by-gate circuit walk, in signal-flow order; the output gate is the last step.
  steps: {
    count: (spec) => spec.gates.length,
    tag: () => "gate",
    vars: (spec, i) => {
      const order = gateOrder(spec);
      const gate = spec.gates.find((g) => g.id === order[i])!;
      const values = evaluateCircuit(spec);
      const vars: TemplateVars = { stepNumber: i + 1, gateCount: order.length, gateId: gate.id, gateName: gate.type, gateOut: values[gate.id] };
      // expression mode: the expression at this gate's output, for the last hint rung
      if (spec.mode === "expression") vars.gateExpression = formatBool(gateExpressions(spec)[gate.id]);
      // Per input n: its value, plus the circuit input's label or the type of the gate feeding it.
      gate.from.forEach((source, k) => {
        const n = k + 1;
        vars[`in${n}`] = values[source];
        const input = spec.inputs.find((x) => x.id === source);
        if (input) vars[`in${n}Label`] = input.label;
        else vars[`in${n}Gate`] = spec.gates.find((g) => g.id === source)!.type;
      });
      return vars;
    },
  },
};

/** Evaluates a circuit spec; used by content tests to confirm authored answers. */
export function evaluateCircuit(spec: CircuitSpec, inputOverride?: Record<string, 0 | 1>): Record<string, 0 | 1> {
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
export function gateOrder(spec: CircuitSpec): string[] {
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

export function gateOutput(type: CircuitSpec["gates"][number]["type"], x: 0 | 1, y: 0 | 1 = 0): 0 | 1 {
  switch (type) {
    case "AND": return x && y ? 1 : 0;
    case "OR": return x || y ? 1 : 0;
    case "NOT": return x ? 0 : 1;
    case "XOR": return x !== y ? 1 : 0;
    case "NAND": return x && y ? 0 : 1;
    case "NOR": return x || y ? 0 : 1;
  }
}

type Gate = CircuitSpec["gates"][number];
const labels = (spec: CircuitSpec) => spec.inputs.map((i) => i.label);

/** The expression at every input and gate output, in terms of the input labels. */
export function gateExpressions(spec: CircuitSpec): Record<string, BoolExpr> {
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

const SWAP: Partial<Record<Gate["type"], Gate["type"]>> = { AND: "OR", OR: "AND", NAND: "NOR", NOR: "NAND" };

function gradeExpression(misconceptions: { id: string; detect: { type: string } }[], spec: CircuitSpec, gate: Gate, step: number, count: number, text: string) {
  const find = (type: string) => misconceptions.find((m) => m.detect.type === type)?.id;
  const vars = labels(spec);
  let e: BoolExpr;
  try {
    e = parseBool(text, { vars });
  } catch (err) {
    if (!(err instanceof BooleanParseError)) throw err;
    return { correct: false, normalized: text.trim(), misconceptionId: find("gate-expression-unreadable") };
  }
  const exprs = gateExpressions(spec);
  const normalized = `${gate.id}=${formatBool(e)}`;
  if (equivalent(e, exprs[gate.id], vars)) return { correct: true, normalized, partial: step < count - 1 };
  const notApplied = gate.from.some((f) => equivalent(e, exprs[f], vars));
  const swappedType = SWAP[gate.type];
  const swapped = swappedType ? gateExpressions({ ...spec, gates: spec.gates.map((g) => (g.id === gate.id ? { ...g, type: swappedType } : g)) })[gate.id] : undefined;
  const kind = notApplied
    ? "gate-not-applied"
    : swapped && equivalent(e, swapped, vars)
      ? "gate-and-or-swapped"
      : barMoves(exprs[gate.id]).some((m) => equivalent(e, m, vars) && !equivalent(m, exprs[gate.id], vars))
        ? "gate-bar-misplaced"
        : undefined;
  return { correct: false, normalized, misconceptionId: kind ? find(kind) : undefined };
}

/** Every node of an expression, with a function that rebuilds the tree with that node replaced. */
function nodes(e: BoolExpr, rebuild: (x: BoolExpr) => BoolExpr = (x) => x): { node: BoolExpr; put: (x: BoolExpr) => BoolExpr }[] {
  const here = [{ node: e, put: rebuild }];
  if (e.type === "not") return [...here, ...nodes(e.arg, (x) => rebuild({ type: "not", arg: x }))];
  if (e.type === "and" || e.type === "or" || e.type === "xor")
    return [...here, ...e.args.flatMap((a, i) => nodes(a, (x) => rebuild({ ...e, args: e.args.map((b, j) => (j === i ? x : b)) })))];
  return here;
}

/** The expression with one bar taken off and one bar put somewhere else: the moved-bar slips. */
function barMoves(e: BoolExpr): BoolExpr[] {
  const out: BoolExpr[] = [];
  for (const { node, put } of nodes(e)) {
    if (node.type !== "not") continue;
    const without = put(node.arg);
    for (const { node: n, put: put2 } of nodes(without)) if (n !== node.arg) out.push(put2({ type: "not", arg: n }));
  }
  return out;
}
