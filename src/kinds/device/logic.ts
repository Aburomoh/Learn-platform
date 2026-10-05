import type { KindLogic } from "../types";
import { codeBits, codeNames, pickName, rightPick } from "../shared/figures/device";
import type { DeviceSpec } from "./spec";

// the device itself (names, the right line) is shared with the figures (ADR-0009)
export { codeBits, codeNames, pickName, rightPick };

/** The line picked: decoder output k, encoder code value, or mux input k. */
export type DeviceAnswer = { kind: "device"; step: number; pick?: number };

const reverse = (value: number, bits: number) => parseInt([...codeBits(value, bits)].reverse().join(""), 2);

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
