/** Spec parts shared by kinds (build time, Zod): a division step, addition operands, and the worked contexts. */
import { z } from "zod";

export const DivisionStep = z.object({
  dividend: z.number().int().positive(),
  quotient: z.number().int().min(0),
  remainder: z.union([z.literal(0), z.literal(1)]),
});

export const bitString = z.string().regex(/^[01]+$/, "bits are 0s and 1s");

/** Two equal-width binary operands (2–8 bits) added column by column. */
export const AdditionOperands = z
  .object({
    a: bitString.min(2).max(8),
    b: bitString.min(2).max(8),
    /** As on `column-addition`: "drop" shows a fixed-width result with no end-carry column (#161). */
    endCarry: z.enum(["write", "drop"]).optional(),
  })
  .refine((o) => o.a.length === o.b.length, "operands must have equal width");

/** What is shown above a numeric or multiple-choice question so the student works from something visible. */
export const NumericContext = z.discriminatedUnion("type", [
  /** A completed division chain to read the remainders from. */
  z.object({ type: z.literal("division-chain"), value: z.number().int().positive(), steps: z.array(DivisionStep).min(2).max(8) }),
  /** A binary string to be grouped by 3 (octal) or 4 (hex) bits from the right. */
  z.object({ type: z.literal("bits"), bits: z.string().regex(/^[01]+$/), groupSize: z.union([z.literal(3), z.literal(4)]) }),
  /** A completed column addition (operands, carry row and result). */
  z.object({ type: z.literal("addition"), operands: AdditionOperands }),
  /** A source bit string shown in aligned cells, with one answer cell under each bit (e.g. 1's complement). */
  z.object({ type: z.literal("bit-row"), bits: z.string().regex(/^[01]+$/).min(2).max(8) }),
]);

export type DivisionStep = z.infer<typeof DivisionStep>;
export type NumericContext = z.infer<typeof NumericContext>;
