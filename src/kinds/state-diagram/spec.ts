import { z } from "zod";
import { BooleanParseError, parseBool } from "@/content/boolean";

/**
 * State diagram (#239, ECET 111 Chapter 5 Part II; representations §7; pack ch5-partii). Pre-drawn,
 * never free-drawn: one circle per state (its bits), one arrow per state-table row (present state,
 * then input as LSB), a self-loop when the state stays. One goal per arrow, in table order:
 * `label` mode picks the arrow's label (input/output, or input only when there is no output);
 * `next` mode picks the state the arrow goes to. Transitions are computed from the state equations.
 */
export const StateDiagramSpec = z
  .object({
    kind: z.literal("state-diagram"),
    /** Flip-flop names, first = most significant bit of the state code (A B [C]). */
    stateVars: z.array(z.string().min(1)).min(1).max(3),
    /** The input (x); one input, as in every deck example. */
    input: z.string().min(1),
    /** Next-state (state) equation of each flip-flop, in `stateVars` order: A(t+1) = … */
    next: z.array(z.string().min(1)).min(1).max(3),
    /** The output equation (y = …), when the circuit has one. */
    output: z.object({ name: z.string().min(1), expr: z.string().min(1) }).optional(),
    mode: z.enum(["label", "next"]).default("label"),
  })
  .superRefine((s, ctx) => {
    const vars = [...s.stateVars, s.input];
    if (new Set(vars).size !== vars.length) ctx.addIssue({ code: "custom", message: "state variables and the input must be distinct" });
    if (s.next.length !== s.stateVars.length) ctx.addIssue({ code: "custom", message: "one next-state equation per state variable" });
    for (const [label, text] of [...s.next.map((t, i) => [`${s.stateVars[i]}(t+1)`, t]), ...(s.output ? [[s.output.name, s.output.expr]] : [])]) {
      try {
        parseBool(text, { vars });
      } catch (e) {
        ctx.addIssue({ code: "custom", message: `${label}: ${e instanceof BooleanParseError ? e.message : String(e)}` });
      }
    }
  });

export type StateDiagramSpec = z.infer<typeof StateDiagramSpec>;

export const stateDiagramDetectors = [
  /** Next state taken from the other input's row of the same present state. */
  z.object({ type: z.literal("next-wrong-row") }),
  /** The arrow drawn back to its own state (the present state kept). */
  z.object({ type: z.literal("next-is-present") }),
  /** Label: the output of the other input's row (the output read on the wrong row). */
  z.object({ type: z.literal("output-wrong-row") }),
  /** Label: the input value of the arrow wrong. */
  z.object({ type: z.literal("label-input-wrong") }),
  /** Label: written output/input instead of input/output. */
  z.object({ type: z.literal("label-reversed") }),
] as const;
