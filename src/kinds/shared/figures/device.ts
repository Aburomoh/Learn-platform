import { envFor, evaluate, parseBool, type BoolExpr } from "@/content/boolean";

/** A decoder, encoder or multiplexer of a given code width (1 to 3 bits). */
export interface DeviceShape {
  device: "decoder" | "encoder" | "mux";
  bits: number;
  /** Code-bit names, MSB first; defaults in `codeNames`. */
  names?: string[];
}

/** Code-bit names, MSB first. */
export function codeNames(spec: DeviceShape): string[] {
  if (spec.names) return spec.names;
  return spec.device === "mux" ? Array.from({ length: spec.bits }, (_, i) => `S${spec.bits - 1 - i}`) : ["x", "y", "z"].slice(3 - spec.bits);
}

export const codeBits = (value: number, bits: number) => value.toString(2).padStart(bits, "0");

/** Minterm k over `vars` (the decoder's output Dk): x′y′z for 001. */
function mintermExpr(k: number, vars: string[]): BoolExpr {
  const text = vars.map((v, i) => (codeBits(k, vars.length)[i] === "1" ? v : `${v}'`)).join("");
  return parseBool(text, { vars });
}

/**
 * The right pick for one ask, computed with the Boolean module:
 * - decoder: the output whose minterm is 1 on the input code;
 * - encoder: the code whose bits are each 1 exactly when the active input is in that bit's OR;
 * - mux: the input that Y follows (Y = Σ select-term · Ik, evaluated with only that input at 1).
 */
export function rightPick(spec: DeviceShape, ask: number): number {
  const size = 2 ** spec.bits;
  const vars = ["c0", "c1", "c2"].slice(0, spec.bits);
  if (spec.device === "decoder") return Array.from({ length: size }, (_, k) => k).find((k) => evaluate(mintermExpr(k, vars), envFor(vars, ask)) === 1)!;
  if (spec.device === "encoder") {
    // bit b of the code = OR of the inputs whose number has bit b set, evaluated with only input `ask` at 1
    const inputs = Array.from({ length: size }, (_, k) => `I${k}`);
    const env = envFor(inputs, 1 << (size - 1 - ask));
    return Array.from({ length: spec.bits }, (_, b) => {
      const or = parseBool(inputs.filter((_, k) => codeBits(k, spec.bits)[b] === "1").join(" + "), { vars: inputs });
      return evaluate(or, env);
    }).reduce<number>((acc, bit) => acc * 2 + bit, 0);
  }
  const data = Array.from({ length: size }, (_, k) => `I${k}`);
  const y = parseBool(data.map((d, k) => `${codeBits(k, spec.bits).split("").map((b, i) => (b === "1" ? vars[i] : `${vars[i]}'`)).join("")}${d}`).join(" + "), { vars: [...vars, ...data] });
  // Y with only input k at 1 and the selects at `ask`: the k that makes Y = 1 is routed
  return Array.from({ length: size }, (_, k) => k).find((k) => evaluate(y, envFor([...vars, ...data], (ask << size) | (1 << (size - 1 - k)))) === 1)!;
}

/** How the picked line is named on screen: D5, 101 or I2. */
export function pickName(spec: DeviceShape, pick: number): string {
  return spec.device === "decoder" ? `D${pick}` : spec.device === "encoder" ? codeBits(pick, spec.bits) : `I${pick}`;
}
