import { z } from "zod";

const DIGITS = "0123456789ABCDEF";

/**
 * Base → decimal by place value (#208, ECET 111 Ch.1 s.8–13, 16–19, 26), in three goals as the
 * slides write it: the weight under each digit, each term's value (digit × weight), then the sum.
 * `number` is written in its base with an optional point, e.g. "101.101", "124.16", "1A3".
 */
export const BaseToDecimalSpec = z
  .object({
    kind: z.literal("base-to-decimal"),
    base: z.union([z.literal(2), z.literal(8), z.literal(10), z.literal(16)]),
    number: z.string().regex(/^[0-9A-F]+(\.[0-9A-F]+)?$/, "digits, an optional point, uppercase hex"),
  })
  .superRefine((s, ctx) => {
    const [whole, frac = ""] = s.number.split(".");
    if (whole.length > 6) ctx.addIssue({ code: "custom", message: "at most 6 digits before the point" });
    if (frac.length > 3) ctx.addIssue({ code: "custom", message: "at most 3 digits after the point" });
    for (const d of whole + frac) if (DIGITS.indexOf(d) >= s.base) ctx.addIssue({ code: "custom", message: `"${d}" is not a base-${s.base} digit` });
  });

export type BaseToDecimalSpec = z.infer<typeof BaseToDecimalSpec>;

export const baseToDecimalDetectors = [
  /** Weights: counted from the wrong end (the powers in reverse). */
  z.object({ type: z.literal("weights-reversed") }),
  /** Weights: right before the point, wrong after it (negative powers). */
  z.object({ type: z.literal("negative-powers-wrong") }),
  /** Terms: a hex letter used as a small digit (A as 1 … F as 6) or as 0 instead of its value 10–15. */
  z.object({ type: z.literal("hex-letter-as-digit") }),
] as const;
