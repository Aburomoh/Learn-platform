import { z } from "zod";
import { NumericContext } from "../shared/contextSpec";

/** Numeric entry in a given base. */
export const NumericSpec = z.object({
  kind: z.literal("numeric"),
  base: z.union([z.literal(2), z.literal(8), z.literal(10), z.literal(16)]),
  /** Correct answer as digits in `base`, uppercase for hex. */
  answer: z.string().min(1),
  context: NumericContext.optional(),
});

export type NumericSpec = z.infer<typeof NumericSpec>;

export const numericDetectors = [
  /** Base-2 answer: fires on any other wrong bit string and reports the leftmost wrong bit. */
  z.object({ type: z.literal("first-wrong-bit") }),
] as const;
