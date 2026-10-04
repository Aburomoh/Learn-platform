import { z } from "zod";
import { bitString } from "../shared/contextSpec";

/**
 * Octal/hex by grouping (ECET 111 Ch.1), one goal at a time (ADR-0007): step 0 marks the groups
 * from the right, padding with zeros on the left; then one step per group, left to right, for its
 * digit. Groups and digits are computed (`groupBits`); `answer` is checked by a content test.
 */
export const BitGroupingSpec = z.object({
  kind: z.literal("bit-grouping"),
  /** Unpadded bits, MSB first. */
  bits: bitString.min(2).max(16),
  groupSize: z.union([z.literal(3), z.literal(4)]),
  /** Octal or hex digits, uppercase. */
  answer: z.string().regex(/^[0-9A-F]+$/),
});

export type BitGroupingSpec = z.infer<typeof BitGroupingSpec>;

export const bitGroupingDetectors = [
  /** Step 0: grouped from the left (the last group is the short one). */
  z.object({ type: z.literal("group-from-left") }),
  /** Step 0: grouped from the right but the short first group was not padded. */
  z.object({ type: z.literal("group-no-padding") }),
  /** Step 0: groups of another size (e.g. 3 bits for hex). */
  z.object({ type: z.literal("group-wrong-size") }),
  /** Digit step: wrote the group's decimal value (13) instead of its digit (D). */
  z.object({ type: z.literal("digit-as-decimal") }),
] as const;
