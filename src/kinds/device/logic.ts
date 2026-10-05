import { envFor, evaluate, parseBool, type BoolExpr } from "@/content/boolean";
import type { KindLogic } from "../types";
import type { DeviceSpec } from "./spec";

/** The line picked: decoder output k, encoder code value, or mux input k. */
export type DeviceAnswer = { kind: "device"; step: number; pick?: number };

/** Code-bit names, MSB first. */
export function codeNames(spec: DeviceSpec): string[] {
  if (spec.names) return spec.names;
  return spec.device === "mux" ? Array.from({ length: spec.bits }, (_, i) => `S${spec.bits - 1 - i}`) : ["x", "y", "z"].slice(3 - spec.bits);
}

export const codeBits = (value: number, bits: number) => value.toString(2).padStart(bits, "0");
const reverse = (value: number, bits: number) => parseInt([...codeBits(value, bits)].reverse().join(""), 2);

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
export function rightPick(spec: DeviceSpec, ask: number): number {
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
export function pickName(spec: DeviceSpec, pick: number): string {
  return spec.device === "decoder" ? `D${pick}` : spec.device === "encoder" ? codeBits(pick, spec.bits) : `I${pick}`;
}

export const device: KindLogic<DeviceSpec, DeviceAnswer> = {
  grade(variant, answer) {
    const spec = variant.spec;
    const ask = spec.asks[answer.step];
    if (ask === undefined) throw new Error(`No device step ${answer.step}`);
    const right = rightPick(spec, ask);
    const pick = answer.pick;
    const normalized = `${pickName(spec, ask)}:${pick ?? ""}`;
    if (pick === right) return { correct: true, normalized, partial: answer.step < spec.asks.length - 1 || undefined };
    const find = (type: string) => variant.misconceptions.find((m) => m.detect.type === type)?.id;
    const slip = pick === undefined ? undefined : pick === reverse(right, spec.bits) && pick !== right ? "code-reversed" : pick === right + 1 ? "counted-from-one" : undefined;
    return { correct: false, normalized, misconceptionId: slip ? find(slip) : undefined };
  },

  // ADR-0007: one goal per ask.
  steps: {
    count: (spec) => spec.asks.length,
    tag: (spec) => (spec.device === "decoder" ? "line" : spec.device === "encoder" ? "code" : "input"),
    vars: (spec, i) => {
      const ask = spec.asks[i];
      const names = codeNames(spec);
      const code = spec.device === "encoder" ? codeBits(rightPick(spec, ask), spec.bits) : codeBits(ask, spec.bits);
      return {
        stepNumber: i + 1,
        askCount: spec.asks.length,
        // what the goal names: the code on the inputs or selects, or the active input
        given: spec.device === "encoder" ? `I${ask}` : names.map((n, b) => `${n} = ${code[b]}`).join(", "),
        codeBits: code.split("").join(" "),
        answerName: pickName(spec, rightPick(spec, ask)),
        deviceSize: spec.device === "encoder" ? `${2 ** spec.bits}-to-${spec.bits}` : spec.device === "decoder" ? `${spec.bits}-to-${2 ** spec.bits}` : `${2 ** spec.bits}-to-1`,
      };
    },
  },
};
