import { z } from "zod";

/**
 * K-map (#234, ECET 111 Chapter 3; representations §5). From Σ: fill the map (one goal, unless
 * `fill` is false and the map is given), then for each group of a minimal cover two goals (mark
 * its cells, write its term), then F. Any minimal cover is accepted; the number of groups is the
 * same in all of them, so the step count is fixed. Variables in minterm order, first = MSB.
 */
export const KmapSpec = z
  .object({
    kind: z.literal("kmap"),
    vars: z.array(z.string().min(1)).min(2).max(4),
    minterms: z.array(z.number().int().min(0)),
    dontCares: z.array(z.number().int().min(0)).default([]),
    /** The student fills the map from Σ first (default); false shows it filled. */
    fill: z.boolean().default(true),
  })
  .superRefine((s, ctx) => {
    const cells = 2 ** s.vars.length;
    if (new Set(s.vars).size !== s.vars.length) ctx.addIssue({ code: "custom", message: "vars must be distinct" });
    const all = [...s.minterms, ...s.dontCares];
    for (const m of all) if (m >= cells) ctx.addIssue({ code: "custom", message: `minterm ${m} is out of range for ${s.vars.length} variables` });
    if (new Set(all).size !== all.length) ctx.addIssue({ code: "custom", message: "minterms and don't-cares must be distinct" });
    if (!s.minterms.length) ctx.addIssue({ code: "custom", message: "a map needs at least one 1" });
  });

export type KmapSpec = z.infer<typeof KmapSpec>;

export const kmapDetectors = [
  /** Fill: columns (and rows) placed in binary order 00 01 10 11 instead of Gray 00 01 11 10. */
  z.object({ type: z.literal("fill-binary-order") }),
  /** Fill: every don't-care written as 1. */
  z.object({ type: z.literal("fill-dontcare-as-one") }),
  /** Group: not a wrapping rectangle of 1, 2, 4 or 8 cells (an L-shape, three cells, a diagonal). */
  z.object({ type: z.literal("group-shape") }),
  /** Group: takes in a 0. */
  z.object({ type: z.literal("group-covers-zero") }),
  /** Group: only don't-cares (an x left as a group of its own). */
  z.object({ type: z.literal("group-only-dontcares") }),
  /** Group: a smaller group where a larger one fits (it is not prime). */
  z.object({ type: z.literal("group-too-small") }),
  /** Group: a valid prime group that no minimal cover with the groups so far uses (redundant). */
  z.object({ type: z.literal("group-not-needed") }),
  /** Term: keeps a variable that changes across the group. */
  z.object({ type: z.literal("term-keeps-changing") }),
  /** Term: the right variables, with a complement on the wrong one. */
  z.object({ type: z.literal("term-wrong-complement") }),
  /** F: every term is a valid group, but some 1 is left out. */
  z.object({ type: z.literal("answer-misses-ones") }),
  /** F: the right function, but not a minimal sum (more terms or literals). */
  z.object({ type: z.literal("answer-not-minimal") }),
] as const;
