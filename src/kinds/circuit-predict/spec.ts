import { z } from "zod";
import { id } from "@/content/primitives";

export const GateType = z.enum(["AND", "OR", "NOT", "XOR", "NAND", "NOR"]);

export const CircuitSpec = z.object({
  kind: z.literal("circuit-predict"),
  inputs: z.array(z.object({ id, label: z.string(), value: z.union([z.literal(0), z.literal(1)]) })).min(1).max(3),
  gates: z
    .array(z.object({ id, type: GateType, from: z.array(z.string()).min(1).max(2), label: z.string().optional() }))
    .min(1)
    .max(4),
  outputGateId: id,
  /** Authored output; a content test asserts it equals the evaluated circuit. */
  answer: z.union([z.literal(0), z.literal(1)]),
  /** Whether the student may toggle inputs on the diagram before answering. */
  inputsToggleable: z.boolean().default(false),
  /**
   * `predict` (default, or omitted): one 0/1 output per gate. `expression` (#226): one goal per gate, the
   * expression at its output in terms of the input labels, graded by equivalence.
   */
  mode: z.enum(["predict", "expression"]).optional(),
});

export type CircuitSpec = z.infer<typeof CircuitSpec>;

export const circuitDetectors = [
  /** Circuit walk: wrong output for a gate of this type. */
  z.object({ type: z.literal("gate-output"), gate: GateType }),
  /** Expression mode: wrote an input's expression, as if the gate were not there. */
  z.object({ type: z.literal("gate-not-applied") }),
  /** Expression mode: AND written for OR (or NAND for NOR), or the other way round. */
  z.object({ type: z.literal("gate-and-or-swapped") }),
  /** Expression mode: a bar (NOT) on the wrong part, e.g. (A + B)′ written as A′ + B (p.23–25). */
  z.object({ type: z.literal("gate-bar-misplaced") }),
  /** Expression mode: text that does not parse, or a variable the circuit does not have. */
  z.object({ type: z.literal("gate-expression-unreadable") }),
] as const;
