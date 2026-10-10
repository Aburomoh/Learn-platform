import type { KindLogic } from "../types";
import type { BaseToDecimalSpec } from "./spec";

/**
 * Step 0: `powers`, the exponent under each digit, left to right (2, 1, 0, −1 …).
 * Step 1: `digits`, each digit's value as a number in the given term `[N] × base^k` (A = 10 … F = 15), left to right (#597).
 * Step 2: `sum`, the decimal value (the calculator is pre-loaded with the term values, #581).
 */
export type BaseToDecimalAnswer = { kind: "base-to-decimal"; step: number; powers?: number[]; digits?: string[]; sum?: string };

const DIGITS = "0123456789ABCDEF";

/** The digits left to right, each with its value and power. */
export function placeDigits(spec: BaseToDecimalSpec): { digit: string; value: number; power: number }[] {
  const [whole, frac = ""] = spec.number.split(".");
  return [...whole, ...frac].map((digit, i) => ({ digit, value: DIGITS.indexOf(digit), power: whole.length - 1 - i }));
}

/**
 * Exact decimal text of value × base^power (bases 2, 8, 10, 16 always terminate), without floating
 * point: "0.125", "419", "0.09375". Uses BigInt, so long fractions stay exact.
 */
export function exactTerm(value: number, base: number, power: number): string {
  if (power >= 0) return (BigInt(value) * BigInt(base) ** BigInt(power)).toString();
  return decimalOf(BigInt(value), BigInt(base) ** BigInt(-power));
}

/** num / den as a terminating decimal string (den's prime factors are 2 and 5 only). */
const ZERO = BigInt(0);
const TEN = BigInt(10);

function decimalOf(num: bigint, den: bigint): string {
  const whole = num / den;
  let rem = num % den;
  let frac = "";
  for (let guard = 0; rem !== ZERO && guard < 64; guard++) {
    rem *= TEN;
    frac += (rem / den).toString();
    rem %= den;
  }
  return frac ? `${whole}.${frac}` : whole.toString();
}

/** The exact sum as a decimal string. */
export function exactValue(spec: BaseToDecimalSpec): string {
  const ds = placeDigits(spec);
  const fracDigits = Math.max(0, -Math.min(0, ...ds.map((d) => d.power)));
  const den = BigInt(spec.base) ** BigInt(fracDigits);
  const num = ds.reduce((acc, d) => acc + BigInt(d.value) * BigInt(spec.base) ** BigInt(d.power + fracDigits), ZERO);
  return decimalOf(num, den);
}

/** "0050.500" → "50.5", ".5" → "0.5"; anything that is not a plain decimal is returned trimmed (so it never matches). */
export function normaliseDecimal(text: string): string {
  const t = text.trim().replace(/,/g, ".");
  if (!/^\d*(\.\d*)?$/.test(t) || t === "" || t === ".") return t;
  const [w, f = ""] = t.split(".");
  const whole = w.replace(/^0+(?=\d)/, "") || "0";
  const frac = f.replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}

export const baseToDecimal: KindLogic<BaseToDecimalSpec, BaseToDecimalAnswer> = {
  grade(variant, answer) {
    const spec = variant.spec;
    const ds = placeDigits(spec);
    const find = (type: string) => variant.misconceptions.find((m) => m.detect.type === type)?.id;
    const firstWrong = <T>(got: T[], want: T[]) => {
      const wrong = want.flatMap((w, i) => (got[i] !== w ? [i] : []));
      return wrong.length ? { first: wrong[0], count: wrong.length } : undefined;
    };

    if (answer.step === 0) {
      const want = ds.map((d) => d.power);
      const got = answer.powers ?? [];
      const normalized = `powers:${got.join(",")}`;
      const wrong = firstWrong(got, want);
      if (!wrong && got.length === want.length) return { correct: true, normalized, partial: true };
      const whole = ds.filter((d) => d.power >= 0).length;
      const kind =
        got.length === want.length && got.every((p, i) => p === want[want.length - 1 - i]) && want.length > 1
          ? "weights-reversed"
          : whole < want.length && got.slice(0, whole).every((p, i) => p === want[i])
            ? "negative-powers-wrong"
            : undefined;
      return { correct: false, normalized, misconceptionId: kind ? find(kind) : undefined, wrongCells: wrong };
    }

    if (answer.step === 1) {
      const want = ds.map((d) => String(d.value));
      const got = (answer.digits ?? []).map(normaliseDecimal);
      const normalized = `digits:${got.join(",")}`;
      const wrong = firstWrong(got, want);
      if (!wrong && got.length === want.length) return { correct: true, normalized, partial: true };
      // a letter digit written as A=1…F=6, or as 0, where every other digit is right
      const letterSlip = spec.base === 16 && ds.some((d) => d.value >= 10) && ds.every((d, i) => (d.value >= 10 ? [String(d.value - 9), "0"].includes(got[i]) : got[i] === want[i]));
      return { correct: false, normalized, misconceptionId: letterSlip ? find("hex-letter-as-digit") : undefined, wrongCells: wrong };
    }

    if (answer.step === 2) {
      const sum = normaliseDecimal(answer.sum ?? "");
      const correct = sum === exactValue(spec);
      return { correct, normalized: `sum:${sum}` };
    }
    throw new Error(`No base-to-decimal step ${answer.step}`);
  },

  // Three goals (ADR-0007): the weights, the terms, the sum.
  steps: {
    count: () => 3,
    tag: (_, i) => (["weights", "terms", "sum"] as const)[i],
    vars: (spec, i) => {
      const ds = placeDigits(spec);
      return {
        number: spec.number,
        base: spec.base,
        digitCount: ds.length,
        terms: ds.map((d) => `(${d.value} × ${spec.base}^${d.power})`).join(" + "),
        // the digit values alone, left to right (the terms step's answer, #597)
        digitValues: ds.map((d) => d.value).join(", "),
        values: ds.map((d) => exactTerm(d.value, spec.base, d.power)).join(" + "),
        value: exactValue(spec),
        stepNumber: i + 1,
      };
    },
  },
};
