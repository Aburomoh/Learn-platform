"use client";

import { useMemo } from "react";
import { formatBool, parseBool } from "@/content/boolean";
import { CircuitDiagram } from "./CircuitDiagram";
import { circuitFromExpression, describeWiring, gateExpressions } from "./circuit";

export interface GatesFigureProps {
  id: string;
  /** The pin the gates drive: DA, JA, y. */
  output: string;
  /** The equation's right side in course notation, over `vars`. Never shown before `revealed`. */
  expr: string;
  vars: string[];
  /** Result state: each gate's expression is printed at its output. */
  revealed?: boolean;
}

/**
 * The gates that drive one pin, read-only (#489). The drawing is built from the equation, so it
 * cannot disagree with it; the student reads the equation off the gates. Until the result state
 * the diagram carries no expression at all, only the input names and the gate symbols.
 */
export function GatesFigure({ id, output, expr, vars, revealed = false }: GatesFigureProps) {
  const circuit = useMemo(() => circuitFromExpression(parseBool(expr, { vars }), output), [expr, vars, output]);
  const expressions = useMemo(() => {
    const all = gateExpressions(circuit);
    return Object.fromEntries(circuit.gates.map((g) => [g.id, formatBool(all[g.id])]));
  }, [circuit]);
  // the wiring in words is the text alternative: a screen-reader user reads the same circuit, not the answer
  const title = `Gates that drive ${output}: ${describeWiring(circuit)}.${revealed ? ` So ${output} = ${expressions[circuit.outputGateId]}.` : ""}`;
  return <CircuitDiagram id={id} spec={circuit} expressions={expressions} lit={revealed ? circuit.gates.map((g) => g.id) : []} title={title} />;
}
