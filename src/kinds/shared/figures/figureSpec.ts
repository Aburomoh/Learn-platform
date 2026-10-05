/** The figure of a question (ADR-0009): build time, Zod. Content names the figure and what is given; results are computed. */
import { z } from "zod";
import { BooleanParseError, parseBool } from "@/content/boolean";
import { adderPins, flipFlopInputs } from "./blocks";
import { circuitFromExpression } from "./circuit/circuit";
import { codeNames } from "./device";

const bit = z.union([z.literal(0), z.literal(1)]);

/**
 * A decoder, encoder or multiplexer block. `given` is the input code (decoder), the active input
 * (encoder) or the select value (mux). The active output, the code or the routed input is computed
 * (`rightPick`) and drawn only in the result state.
 */
const DeviceFigure = z
  .object({
    type: z.literal("device"),
    device: z.enum(["decoder", "encoder", "mux"]),
    bits: z.number().int().min(1).max(3),
    given: z.number().int().min(0),
    /** Code-bit names, MSB first: S1 S0 (mux, default), x y z (decoder / encoder, default). */
    names: z.array(z.string().min(1)).optional(),
    /** mux: a level on each data input, printed beside it. */
    data: z.array(bit).optional(),
    /** The pin with the halo, by name: D5, I2, S1, x, Y (checked against `figurePins`). An Explain step may move it (`stage.figureFocus`). */
    focus: z.string().min(1).optional(),
  })
  .superRefine((f, ctx) => {
    const size = 2 ** f.bits;
    if (f.given >= size) ctx.addIssue({ code: "custom", message: `given ${f.given} is out of range for ${f.bits} bits` });
    if (f.names && f.names.length !== f.bits) ctx.addIssue({ code: "custom", message: `one name per code bit (${f.bits})` });
    if (f.data && (f.device !== "mux" || f.data.length !== size)) ctx.addIssue({ code: "custom", message: `data: a mux needs ${size} levels` });
    if (f.device === "decoder" && f.bits === 1) ctx.addIssue({ code: "custom", message: "a decoder needs 2 or 3 input bits" });
    if (f.focus && (!f.names || f.names.length === f.bits) && !devicePins(f).includes(f.focus)) ctx.addIssue({ code: "custom", message: `focus "${f.focus}" is not a pin of this ${f.device} (${devicePins(f).join(", ")})` });
  });

function devicePins(f: { device: "decoder" | "encoder" | "mux"; bits: number; names?: string[] }): string[] {
  const size = 2 ** f.bits;
  const lines = (letter: string) => Array.from({ length: size }, (_, k) => `${letter}${k}`);
  const code = codeNames(f);
  return f.device === "decoder" ? [...code, ...lines("D")] : f.device === "encoder" ? [...lines("I"), ...code] : [...lines("I"), ...code, "Y"];
}

/** The NAND SR latch or the gated SR latch; the new Q and Q′ are computed (`latchAfter`). */
const LatchFigure = z
  .object({
    type: z.literal("latch"),
    latch: z.enum(["nand-sr", "gated-sr"]),
    values: z.object({ s: bit, r: bit, q: bit, en: bit.optional() }),
  })
  .refine((c) => (c.latch === "gated-sr") === (c.values.en !== undefined), "en is given for gated-sr only");

/**
 * The half adder (HA) or full adder (Σ) block. `given` puts bits on the inputs; S and the carry
 * read "?" until the result state, where they are computed (`adderOutputs`). No `given`: the symbol alone.
 */
const AdderFigure = z
  .object({
    type: z.literal("adder"),
    adder: z.enum(["half", "full"]),
    given: z.object({ a: bit, b: bit, ci: bit.optional() }).optional(),
    /** The pin with the halo: A, B, Ci, S, C (half) or Co (full). */
    focus: z.string().min(1).optional(),
  })
  .superRefine((f, ctx) => {
    if (f.given && (f.adder === "full") !== (f.given.ci !== undefined)) ctx.addIssue({ code: "custom", message: "ci is given for the full adder only" });
    const pins = [...adderPins(f.adder).inputs, ...adderPins(f.adder).outputs];
    if (f.focus && !pins.includes(f.focus)) ctx.addIssue({ code: "custom", message: `focus "${f.focus}" is not a pin of the ${f.adder} adder (${pins.join(", ")})` });
  });

/**
 * A D, T, SR or JK flip-flop symbol. `given` is the present Q and one bit per input in pin order
 * (D; T; S R; J K); Q after the clock edge is computed (`flipFlopNext`) and drawn in the result state.
 */
const FlipFlopFigure = z
  .object({
    type: z.literal("flip-flop"),
    ff: z.enum(["d", "t", "sr", "jk"]),
    /** The trigger: `falling` draws the bubble in front of the clock triangle. */
    edge: z.enum(["rising", "falling"]).default("rising"),
    given: z.object({ q: bit, inputs: z.array(bit).min(1).max(2) }).optional(),
    /** The pin with the halo: an input (D, T, S, R, J, K), Clk, Q or Q′. */
    focus: z.string().min(1).optional(),
  })
  .superRefine((f, ctx) => {
    const inputs = flipFlopInputs(f.ff);
    if (f.given && f.given.inputs.length !== inputs.length) ctx.addIssue({ code: "custom", message: `one bit per input (${inputs.join(", ")})` });
    if (f.ff === "sr" && f.given && f.given.inputs[0] === 1 && f.given.inputs[1] === 1) ctx.addIssue({ code: "custom", message: "S = R = 1 is not allowed on an SR flip-flop: the figure has no result to draw" });
    const pins = [...inputs, "Clk", "Q", "Q′"];
    if (f.focus && !pins.includes(f.focus)) ctx.addIssue({ code: "custom", message: `focus "${f.focus}" is not a pin of this flip-flop (${pins.join(", ")})` });
  });

/**
 * A sequential circuit at block level (analysis): a gate block carrying the input equations, the
 * flip-flops as symbols, each Q fed back to the gates, one clock. Structure only: no values, no
 * result state. `equations` are the circuit as the lesson writes it, one per flip-flop input:
 * "DA = Ax + Bx", checked at build (the left side names the input, the right side parses over the
 * state names and the input). A question that asks for an equation writes it as "DA = ?".
 */
const SequentialFigure = z
  .object({
    type: z.literal("sequential"),
    flipFlops: z
      .array(z.object({ name: z.string().min(1).max(2), ff: z.enum(["d", "t", "sr", "jk"]), equations: z.array(z.string().min(1).max(16)).min(1).max(2) }))
      .min(1)
      .max(3),
    /** The circuit's input, if any: x. */
    input: z.string().min(1).max(2).optional(),
    /** The circuit's output; set it only on questions about the output. */
    output: z.string().min(1).max(2).optional(),
    /** The flip-flop with the halo, by its state name (A, B), or "gates". */
    focus: z.string().min(1).optional(),
  })
  .superRefine((f, ctx) => {
    const names = f.flipFlops.map((x) => x.name);
    if (new Set(names).size !== names.length) ctx.addIssue({ code: "custom", message: "flip-flop names must be distinct" });
    const vars = [...names, ...(f.input ? [f.input] : [])];
    for (const x of f.flipFlops) {
      const pins = flipFlopInputs(x.ff);
      if (x.equations.length !== pins.length) ctx.addIssue({ code: "custom", message: `${x.name}: one equation per input (${pins.join(", ")})` });
      x.equations.forEach((eq, k) => {
        const [left, right, ...rest] = eq.split("=").map((part) => part.trim());
        const expected = `${pins[k] ?? ""}${x.name}`;
        if (rest.length || right === undefined || left !== expected) return void ctx.addIssue({ code: "custom", message: `"${eq}": write it as "${expected} = …"` });
        if (right === "?") return;
        try {
          parseBool(right, { vars });
        } catch (err) {
          if (!(err instanceof BooleanParseError)) throw err;
          ctx.addIssue({ code: "custom", message: `"${eq}" does not parse over ${vars.join(", ")}` });
        }
      });
    }
    if (f.focus && ![...names, "gates"].includes(f.focus)) ctx.addIssue({ code: "custom", message: `focus "${f.focus}" is not a flip-flop of this circuit (${names.join(", ")}) or "gates"` });
  });

/**
 * The gates that drive one pin (#489): the student reads an equation off drawn gates, as on the
 * analysis slides. Content gives the equation's right side over `vars`; the gates are built from
 * it (`circuitFromExpression`), so the drawing always matches the equation. `output` names the pin:
 * DA, JA, y. The expressions at the gate outputs are printed only in the result state.
 */
const GatesFigure = z
  .object({
    type: z.literal("gates"),
    output: z.string().min(1).max(3),
    expr: z.string().min(1).max(40),
    vars: z.array(z.string().min(1).max(2)).min(1).max(4),
  })
  .superRefine((f, ctx) => {
    try {
      circuitFromExpression(parseBool(f.expr, { vars: f.vars }), f.output);
    } catch (err) {
      if (!(err instanceof Error)) throw err;
      ctx.addIssue({ code: "custom", message: `gates for "${f.output} = ${f.expr}": ${err.message}` });
    }
  });

/** One figure per question, drawn by the stage above (or beside) any kind's answer area. */
export const FigureSpec = z.discriminatedUnion("type", [DeviceFigure, LatchFigure, AdderFigure, FlipFlopFigure, SequentialFigure, GatesFigure]);
export type FigureSpec = z.infer<typeof FigureSpec>;

/** The pins a focus may name (`figure.focus`, `stage.figureFocus`). A latch figure has no focus state yet. */
export function figurePins(figure: FigureSpec): string[] {
  switch (figure.type) {
    case "device":
      return devicePins(figure);
    case "adder":
      return [...adderPins(figure.adder).inputs, ...adderPins(figure.adder).outputs];
    case "flip-flop":
      return [...flipFlopInputs(figure.ff), "Clk", "Q", "Q′"];
    case "sequential":
      return [...figure.flipFlops.map((f) => f.name), "gates"];
    default:
      return [];
  }
}
