import { z } from "zod";
import { BooleanParseError, parseBool } from "@/content/boolean";

const Bit = z.union([z.literal(0), z.literal(1)]);

/** The inputs each flip-flop takes, in the order the slides list them. */
export const FLIP_FLOP_INPUTS = { SR: ["S", "R"], JK: ["J", "K"], D: ["D"], T: ["T"] } as const;

/**
 * Timing diagram (#237, ECET 111 Chapter 5; representations §6 and §13.2; pack ch5-parti §4,
 * ch5-partii §5). One goal per active clock edge: every output just after it.
 * - One flip-flop (`flipFlop`, `initialQ`): its inputs drive it; the output is Q.
 * - A circuit (`machine`): state equations over its flip-flops and inputs (A(t+1) = …); the outputs
 *   are its flip-flops, asked together at each edge (#316).
 * Columns are half clock periods, as on the exercise grids: Clk is low in column 1, high in column
 * 2, and so on (0-based: `column % 2`). The inputs are read in the column before the edge, and never
 * change on an asked edge (§13.2), so the value to read is never ambiguous. Initial values are
 * always stated (course map).
 */
export const TimingSpec = z
  .object({
    kind: z.literal("timing"),
    edge: z.enum(["rising", "falling"]),
    /** One level per column for each input. */
    inputs: z.array(z.object({ name: z.string().min(1), levels: z.array(Bit).min(3).max(40) })).min(1).max(2),
    flipFlop: z.enum(["SR", "JK", "D", "T"]).optional(),
    initialQ: Bit.optional(),
    machine: z
      .object({
        stateVars: z.array(z.string().min(1)).min(1).max(3),
        next: z.array(z.string().min(1)).min(1).max(3),
        initial: z.array(Bit).min(1).max(3),
      })
      .optional(),
    /** Ask only the first n active edges (the slides circle 1–16 of 17); default all. */
    edgeCount: z.number().int().min(1).optional(),
  })
  .superRefine((s, ctx) => {
    const names = s.inputs.map((i) => i.name);
    if ((s.flipFlop === undefined) === (s.machine === undefined)) ctx.addIssue({ code: "custom", message: "give either flipFlop (with initialQ) or machine" });
    if (s.flipFlop) {
      const want = FLIP_FLOP_INPUTS[s.flipFlop];
      if (names.join() !== want.join()) ctx.addIssue({ code: "custom", message: `a ${s.flipFlop} flip-flop takes inputs ${want.join(", ")}` });
      if (s.initialQ === undefined) ctx.addIssue({ code: "custom", message: "state the initial Q" });
    }
    if (s.machine) {
      const m = s.machine;
      const vars = [...m.stateVars, ...names];
      if (new Set(vars).size !== vars.length) ctx.addIssue({ code: "custom", message: "flip-flops and inputs must be distinct" });
      if (m.next.length !== m.stateVars.length || m.initial.length !== m.stateVars.length) ctx.addIssue({ code: "custom", message: "one next-state equation and one initial value per flip-flop" });
      m.next.forEach((text, i) => {
        try {
          parseBool(text, { vars });
        } catch (e) {
          ctx.addIssue({ code: "custom", message: `${m.stateVars[i] ?? "?"}(t+1): ${e instanceof BooleanParseError ? e.message : String(e)}` });
        }
      });
    }
    const length = s.inputs[0]?.levels.length ?? 0;
    if (s.inputs.some((i) => i.levels.length !== length)) ctx.addIssue({ code: "custom", message: "every input needs one level per column" });
    const all = Array.from({ length }, (_, c) => c).filter((c) => c > 0 && (s.edge === "rising" ? c % 2 === 1 : c % 2 === 0));
    if (!all.length) ctx.addIssue({ code: "custom", message: "no active edge" });
    if (s.edgeCount !== undefined && s.edgeCount > all.length) ctx.addIssue({ code: "custom", message: `only ${all.length} active edges` });
    const asked = all.slice(0, s.edgeCount ?? all.length);
    for (const c of asked) {
      const moving = s.inputs.filter((i) => i.levels[c] !== i.levels[c - 1]).map((i) => i.name);
      if (moving.length) ctx.addIssue({ code: "custom", message: `${moving.join(", ")} changes on the active edge at column ${c + 1}` });
    }
    // S = R = 1 at an active edge has no defined next state (s.16): never ask it
    if (s.flipFlop === "SR" && asked.some((c) => s.inputs[0].levels[c - 1] === 1 && s.inputs[1].levels[c - 1] === 1)) ctx.addIssue({ code: "custom", message: "S = R = 1 at an active edge" });
  });

export type TimingSpec = z.infer<typeof TimingSpec>;

export const timingDetectors = [
  /** The inputs read at the other kind of edge (the one just before), not the active one. */
  z.object({ type: z.literal("wrong-edge") }),
  /** The inputs read just after the edge (the column after it, where they may already have changed). */
  z.object({ type: z.literal("input-after-edge") }),
  /** JK with J = K = 1: held instead of toggling. */
  z.object({ type: z.literal("jk-toggle-missed") }),
  /** T: copied T into Q (as a D flip-flop would) instead of toggling on T = 1. */
  z.object({ type: z.literal("t-as-d") }),
  /** SR or JK: the two inputs' roles swapped (set read as reset). */
  z.object({ type: z.literal("inputs-swapped") }),
  /** An output held although the inputs change it at this edge. */
  z.object({ type: z.literal("held-not-applied") }),
  /** An output changed although the inputs hold it at this edge. */
  z.object({ type: z.literal("changed-on-hold") }),
] as const;
