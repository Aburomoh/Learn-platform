import { z } from "zod";

const Bit = z.union([z.literal(0), z.literal(1)]);

/** The inputs each flip-flop takes, in the order the slides list them. */
export const FLIP_FLOP_INPUTS = { SR: ["S", "R"], JK: ["J", "K"], D: ["D"], T: ["T"] } as const;

/**
 * Timing diagram (#237, ECET 111 Chapter 5 Part I; representations §6; pack ch5-parti §4). One goal
 * per active clock edge: Q just after it. Columns are half clock periods, as on the exercise grids:
 * Clk is low in column 1, high in column 2, and so on (0-based: `column % 2`). A rising edge starts
 * each high column and a falling edge each later low column. The inputs are read in the column just
 * before the edge. Initial Q is always stated (course map).
 */
export const TimingSpec = z
  .object({
    kind: z.literal("timing"),
    flipFlop: z.enum(["SR", "JK", "D", "T"]),
    edge: z.enum(["rising", "falling"]),
    initialQ: Bit,
    /** One level per column for each input of the flip-flop. */
    inputs: z.array(z.object({ name: z.string(), levels: z.array(Bit).min(3).max(40) })).min(1).max(2),
    /** Ask only the first n active edges (the slides circle 1–16 of 17); default all. */
    edgeCount: z.number().int().min(1).optional(),
  })
  .superRefine((s, ctx) => {
    const names = s.inputs.map((i) => i.name);
    const want = FLIP_FLOP_INPUTS[s.flipFlop];
    if (names.join() !== want.join()) ctx.addIssue({ code: "custom", message: `a ${s.flipFlop} flip-flop takes inputs ${want.join(", ")}` });
    const length = s.inputs[0]?.levels.length ?? 0;
    if (s.inputs.some((i) => i.levels.length !== length)) ctx.addIssue({ code: "custom", message: "every input needs one level per column" });
    const edges = Array.from({ length }, (_, c) => c).filter((c) => c > 0 && (s.edge === "rising" ? c % 2 === 1 : c % 2 === 0));
    if (!edges.length) ctx.addIssue({ code: "custom", message: "no active edge" });
    if (s.edgeCount !== undefined && s.edgeCount > edges.length) ctx.addIssue({ code: "custom", message: `only ${edges.length} active edges` });
    // S = R = 1 at an active edge has no defined next state (s.16): never ask it
    if (s.flipFlop === "SR" && edges.slice(0, s.edgeCount ?? edges.length).some((c) => s.inputs[0].levels[c - 1] === 1 && s.inputs[1].levels[c - 1] === 1))
      ctx.addIssue({ code: "custom", message: "S = R = 1 at an active edge" });
  });

export type TimingSpec = z.infer<typeof TimingSpec>;

export const timingDetectors = [
  /** Read the inputs just after the edge instead of just before it. */
  z.object({ type: z.literal("input-after-edge") }),
  /** JK with J = K = 1: held instead of toggling. */
  z.object({ type: z.literal("jk-toggle-missed") }),
  /** T: copied T into Q (as a D flip-flop would) instead of toggling on T = 1. */
  z.object({ type: z.literal("t-as-d") }),
  /** SR or JK: the two inputs' roles swapped (set read as reset). */
  z.object({ type: z.literal("inputs-swapped") }),
  /** Q held although the inputs change it at this edge. */
  z.object({ type: z.literal("held-not-applied") }),
  /** Q changed although the inputs hold it at this edge. */
  z.object({ type: z.literal("changed-on-hold") }),
] as const;
