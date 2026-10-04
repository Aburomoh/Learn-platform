import { z } from "zod";

/** Place value bits: the student fills a row of place-value slots to represent `value` in `base`. */
export const PlaceValueSpec = z.object({
  kind: z.literal("place-value"),
  value: z.number().int().min(0),
  base: z.literal(2),
  /** Number of slots shown, most significant first. */
  slots: z.number().int().min(2).max(8),
  /** Correct answer: digits most-significant first, length === slots. */
  answer: z.array(z.union([z.literal(0), z.literal(1)])),
});

export type PlaceValueSpec = z.infer<typeof PlaceValueSpec>;

/** How a wrong row is recognised as a known misconception (besides the shared `equals`). */
export const placeValueDetectors = [
  z.object({ type: z.literal("reversed-bits") }),
  z.object({ type: z.literal("missing-place"), place: z.number().int().positive() }),
  z.object({ type: z.literal("extra-place"), place: z.number().int().positive() }),
] as const;
