import type { TemplateVars } from "@/content/template";
import { BooleanParseError, equivalent, formatBool, parseBool, type BoolExpr } from "@/content/boolean";
import type { KindLogic } from "../types";
import { evaluateCircuit, gateExpressions, gateOrder, gateOutput } from "../shared/figures/circuit/circuit";
import type { CircuitSpec } from "./spec";

// the circuit itself (values, order, expressions) is shared with the figures (ADR-0009)
export { evaluateCircuit, gateExpressions, gateOrder, gateOutput };

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

type Gate = CircuitSpec["gates"][number];
const labels = (spec: CircuitSpec) => spec.inputs.map((i) => i.label);

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
