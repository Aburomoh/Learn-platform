import { z } from "zod";
import { bitString } from "../shared/contextSpec";

/**
 * Binary addition one column at a time, LSB first (ECET 111 Ch.1: 0+0=0, 0+1=1, 1+1=0 carry 1).
 * Each column is one checked step answered as (sum bit, carry out); the final carry out is a
 * last step of its own and becomes the extra leftmost result bit. Column truth is computed by
 * `additionSteps`; `answer` is optional and only checked by a content test.
 */
export const ColumnAdditionSpec = z
  .object({
    kind: z.literal("column-addition"),
    a: bitString.min(2).max(8),
    b: bitString.min(2).max(8),
    /** Optional authored result (width + 1 bits, final carry first; width bits with `endCarry: "drop"`). */
    answer: bitString.optional(),
    /**
     * "write" (default): the end carry is a last step of its own. "drop": no end-carry step and the
     * result keeps the operand width, as for a complement (Pedagogy on #150, gap 15).
     */
    endCarry: z.enum(["write", "drop"]).optional(),
  })
  .refine((o) => o.a.length === o.b.length, "operands must have equal width");

export type ColumnAdditionSpec = z.infer<typeof ColumnAdditionSpec>;

export const columnAdditionDetectors = [
  /** Wrote the decimal column total (2 or 3) instead of a bit. */
  z.object({ type: z.literal("addition-wrote-two") }),
  /** The carry from the previous column was not added in. */
  z.object({ type: z.literal("addition-carry-ignored") }),
  /** Sum bit and carry out entered in each other's place. */
  z.object({ type: z.literal("addition-swapped") }),
] as const;
