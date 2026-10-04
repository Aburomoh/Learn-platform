import type { KindLogic } from "../types";
import type { NumericSpec } from "./spec";

export type NumericAnswer = { kind: "numeric"; text: string };

export const numeric: KindLogic<NumericSpec, NumericAnswer> = {
  grade(variant, answer) {
    const spec = variant.spec;
    const text = normaliseNumeric(answer.text, spec.base);
    const correct = text === normaliseNumeric(spec.answer, spec.base);
    // Compare normalised forms on both sides so "01011" still matches an authored "01011".
    const hit = variant.misconceptions.find((m) => m.detect.type === "equals" && normaliseNumeric(String(m.detect.value), spec.base) === text);
    if (correct || hit) return { correct, normalized: text, misconceptionId: correct ? undefined : hit?.id };
    const firstWrong = variant.misconceptions.find((m) => m.detect.type === "first-wrong-bit");
    const wrongBit = firstWrong && spec.base === 2 ? firstWrongBit(spec.answer, answer.text.trim().replace(/^0[bB]/, "")) : undefined;
    return wrongBit === undefined ? { correct, normalized: text } : { correct, normalized: text, misconceptionId: firstWrong!.id, wrongBit };
  },
};

/**
 * Trims, uppercases, strips a base prefix, then leading zeros. Only the prefix that matches the
 * base is stripped: in hex, "0B" is the digit B, not a binary prefix.
 */
function normaliseNumeric(text: string, base: number): string {
  const prefix = base === 16 ? /^0X/ : base === 2 ? /^0B/ : null;
  const upper = text.trim().toUpperCase();
  return (prefix ? upper.replace(prefix, "") : upper).replace(/^0+(?=.)/, "");
}

/** Leftmost differing bit after left-padding to the answer's width; undefined if not comparable. */
function firstWrongBit(answer: string, text: string): number | undefined {
  if (!/^[01]+$/.test(text) || text.length > answer.length) return undefined;
  const padded = text.padStart(answer.length, "0");
  const i = [...padded].findIndex((d, k) => d !== answer[k]);
  return i >= 0 ? i : undefined;
}
