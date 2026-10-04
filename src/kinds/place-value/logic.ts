import type { KindLogic, VariantOf } from "../types";
import type { PlaceValueSpec } from "./spec";

export type PlaceValueAnswer = { kind: "place-value"; digits: (0 | 1 | null)[] };

export const placeValue: KindLogic<PlaceValueSpec, PlaceValueAnswer> = {
  grade(variant, answer) {
    const spec = variant.spec;
    const digits = answer.digits.map((d) => d ?? 0);
    const correct = digits.length === spec.answer.length && digits.every((d, i) => d === spec.answer[i]);
    return { correct, normalized: digits.join(""), misconceptionId: correct ? undefined : detectBits(variant, digits) };
  },
};

function detectBits(variant: VariantOf<PlaceValueSpec>, digits: number[]): string | undefined {
  const spec = variant.spec;
  const places = spec.answer.map((_, i) => 2 ** (spec.answer.length - 1 - i));
  for (const m of variant.misconceptions) {
    const d = m.detect;
    if (d.type === "reversed-bits" && digits.every((v, i) => v === spec.answer[spec.answer.length - 1 - i])) return m.id;
    if (d.type === "missing-place") {
      const i = places.indexOf(d.place);
      if (i >= 0 && spec.answer[i] === 1 && digits[i] === 0) return m.id;
    }
    if (d.type === "extra-place") {
      const i = places.indexOf(d.place);
      if (i >= 0 && spec.answer[i] === 0 && digits[i] === 1) return m.id;
    }
    if (d.type === "equals" && digits.join("") === String(d.value)) return m.id;
  }
  return undefined;
}

/** Decimal value of a binary digit row, most significant first. */
export function bitsToValue(digits: (0 | 1 | null)[]): number {
  return digits.reduce<number>((acc, d) => acc * 2 + (d ?? 0), 0);
}

export function valueToBits(value: number, slots: number): (0 | 1)[] {
  return Array.from({ length: slots }, (_, i) => ((value >> (slots - 1 - i)) & 1) as 0 | 1);
}
