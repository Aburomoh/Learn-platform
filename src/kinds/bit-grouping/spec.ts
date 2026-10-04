import { z } from "zod";

/**
 * Octal/hex by grouping (ECET 111 Ch.1), one goal at a time (ADR-0007).
 *
 * `to-digits` (default): step 0 marks the groups, then one step per group for its digit. Groups
 * run outward from the binary point: the whole part from the point leftward (zeros padded on the
 * far left), the fraction from the point rightward (zeros padded on the far right, s.22).
 * `to-bits` (#210, s.21 and s.27–28): the digits are given; one step per digit for its 3 or 4 bits.
 *
 * `bits` and `answer` are the same number in base 2 and in base 8/16; groups and digits are
 * computed (`groupsAroundPoint`), and a content test checks `answer` against them.
 */
export const BitGroupingSpec = z
  .object({
    kind: z.literal("bit-grouping"),
    /** Unpadded bits, MSB first, with an optional binary point. */
    bits: z.string().regex(/^[01]+(\.[01]+)?$/, "bits, with an optional point"),
    groupSize: z.union([z.literal(3), z.literal(4)]),
    /** Octal or hex digits, uppercase, with a point where `bits` has one. */
    answer: z.string().regex(/^[0-9A-F]+(\.[0-9A-F]+)?$/),
    direction: z.enum(["to-digits", "to-bits"]).default("to-digits"),
  })
  .superRefine((s, ctx) => {
    const [whole, frac = ""] = s.bits.split(".");
    if (whole.length + frac.length < 2 || whole.length + frac.length > 16) ctx.addIssue({ code: "custom", message: "2–16 bits" });
    if (frac.length > 8) ctx.addIssue({ code: "custom", message: "at most 8 bits after the point" });
    if (s.bits.includes(".") !== s.answer.includes(".")) ctx.addIssue({ code: "custom", message: "bits and answer both have a point, or neither" });
  });

export type BitGroupingSpec = z.infer<typeof BitGroupingSpec>;

export const bitGroupingDetectors = [
  /** Step 0: grouped from the left (the last group is the short one). */
  z.object({ type: z.literal("group-from-left") }),
  /** Step 0: grouped from the right but the short first group was not padded. */
  z.object({ type: z.literal("group-no-padding") }),
  /** Step 0: groups of another size (e.g. 3 bits for hex). */
  z.object({ type: z.literal("group-wrong-size") }),
  /** Step 0: the fraction grouped from its right end (padded on the left) instead of from the point. */
  z.object({ type: z.literal("fraction-from-right-end") }),
  /** Digit step: wrote the group's decimal value (13) instead of its digit (D). */
  z.object({ type: z.literal("digit-as-decimal") }),
  /** to-bits: the right value without its leading zeros (2 → 10 instead of 010). */
  z.object({ type: z.literal("bits-unpadded") }),
  /** to-bits: the digit's bits in reverse order (6 → 011 instead of 110). */
  z.object({ type: z.literal("bits-reversed") }),
] as const;
