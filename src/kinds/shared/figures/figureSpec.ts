/** The figure of a question (ADR-0009): build time, Zod. Content names the figure and what is given; results are computed. */
import { z } from "zod";
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

/** One figure per question, drawn by the stage above (or beside) any kind's answer area. */
export const FigureSpec = z.discriminatedUnion("type", [DeviceFigure, LatchFigure]);
export type FigureSpec = z.infer<typeof FigureSpec>;

/** The pins a focus may name (`figure.focus`, `stage.figureFocus`). A latch figure has no focus state yet. */
export function figurePins(figure: FigureSpec): string[] {
  return figure.type === "device" ? devicePins(figure) : [];
}
