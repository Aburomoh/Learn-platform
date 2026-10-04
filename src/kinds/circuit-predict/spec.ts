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
});

export type CircuitSpec = z.infer<typeof CircuitSpec>;

export const circuitDetectors = [
  /** Circuit walk: wrong output for a gate of this type. */
  z.object({ type: z.literal("gate-output"), gate: GateType }),
] as const;
