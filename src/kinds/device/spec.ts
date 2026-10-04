import { z } from "zod";

/**
 * Decoder, encoder and multiplexer views (#381, #382; representations §8; pack ch4 §3, §5). The
 * device is drawn, one goal per entry of `asks`, and the student picks a line:
 * - decoder: `asks` are input codes; pick the active output Dk;
 * - encoder: `asks` are active inputs Ik; pick the output code;
 * - mux: `asks` are select values; pick the input that reaches Y (`data`, optional, prints levels).
 * `bits` is the code width: 1 (2-to-1 mux), 2 (2-to-4, 4-to-1) or 3 (3-to-8, 8-to-3). The first
 * code bit is the MSB (S1 before S0, x before z).
 */
export const DeviceSpec = z
  .object({
    kind: z.literal("device"),
    device: z.enum(["decoder", "encoder", "mux"]),
    bits: z.number().int().min(1).max(3),
    asks: z.array(z.number().int().min(0)).min(1).max(8),
    /** Code-bit names, MSB first: S1 S0 (mux, default), x y z (decoder / encoder, default). */
    names: z.array(z.string().min(1)).optional(),
    /** mux: a level on each data input, printed beside it. */
    data: z.array(z.union([z.literal(0), z.literal(1)])).optional(),
  })
  .superRefine((s, ctx) => {
    const size = 2 ** s.bits;
    for (const a of s.asks) if (a >= size) ctx.addIssue({ code: "custom", message: `ask ${a} is out of range for ${s.bits} bits` });
    if (new Set(s.asks).size !== s.asks.length) ctx.addIssue({ code: "custom", message: "asks must be distinct" });
    if (s.names && s.names.length !== s.bits) ctx.addIssue({ code: "custom", message: `one name per code bit (${s.bits})` });
    if (s.data && (s.device !== "mux" || s.data.length !== size)) ctx.addIssue({ code: "custom", message: `data: a mux needs ${size} levels` });
    if (s.device === "decoder" && s.bits === 1) ctx.addIssue({ code: "custom", message: "a decoder needs 2 or 3 input bits" });
  });

export type DeviceSpec = z.infer<typeof DeviceSpec>;

export const deviceDetectors = [
  /** The code read (or written) with its bits in reverse order: LSB first. */
  z.object({ type: z.literal("code-reversed") }),
  /** Lines counted from 1 instead of 0 (D1 for code 000). */
  z.object({ type: z.literal("counted-from-one") }),
] as const;
