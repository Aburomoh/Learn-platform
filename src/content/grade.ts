/**
 * Deterministic grading against content. Components never grade themselves; the ActivityRunner
 * calls `grade` and passes the result to the tutor engine. Course truth lives in the spec.
 */
import { isRegisteredKind, kinds, type KindAnswer } from "@/kinds";
import type { GradeResult } from "@/kinds/types";
import type { Variant } from "./schema";

export type { GradeResult };
// Helpers of migrated kinds keep their old import path.
export { evaluateCircuit, gateOrder, gateOutput } from "@/kinds/circuit-predict/logic";
export { bitsToValue, valueToBits } from "@/kinds/place-value/logic";

/** Answers of the registered kinds (`src/kinds/`) plus the kinds not migrated yet (ADR-0008). */
export type Answer =
  | KindAnswer
  | { kind: "numeric"; text: string }
  | { kind: "multiple-choice"; optionId: string }
  | { kind: "repeated-division"; step: number; quotient: number; remainder: number }
  /** One column (sum bit + carry out), or the final carry step where only `sum` is read. */
  | { kind: "column-addition"; step: number; sum: number; carry?: number }
  /** Step 0: `groups` as marked, padding included, left to right. Steps 1…G: `digit` of group G. */
  | { kind: "bit-grouping"; step: number; groups?: string[]; digit?: string };

export function grade(variant: Variant, answer: Answer): GradeResult {
  const spec = variant.spec;
  if (spec.kind !== answer.kind) {
    throw new Error(`Answer kind ${answer.kind} does not match spec kind ${spec.kind}`);
  }
  if (isRegisteredKind(spec.kind)) {
    // one cast at the dispatch: the kinds match (checked above), TypeScript cannot correlate them
    const logic = kinds[spec.kind] as { grade(variant: Variant, answer: Answer): GradeResult };
    return logic.grade(variant, answer);
  }
  switch (spec.kind) {
    case "numeric": {
      const a = answer as Extract<Answer, { kind: "numeric" }>;
      const text = normaliseNumeric(a.text, spec.base);
      const correct = text === normaliseNumeric(spec.answer, spec.base);
      // Compare normalised forms on both sides so "01011" still matches an authored "01011".
      const hit = variant.misconceptions.find((m) => m.detect.type === "equals" && normaliseNumeric(String(m.detect.value), spec.base) === text);
      if (correct || hit) return { correct, normalized: text, misconceptionId: correct ? undefined : hit?.id };
      const firstWrong = variant.misconceptions.find((m) => m.detect.type === "first-wrong-bit");
      const wrongBit = firstWrong && spec.base === 2 ? firstWrongBit(spec.answer, a.text.trim().replace(/^0[bB]/, "")) : undefined;
      return wrongBit === undefined ? { correct, normalized: text } : { correct, normalized: text, misconceptionId: firstWrong!.id, wrongBit };
    }
    case "multiple-choice": {
      const a = answer as Extract<Answer, { kind: "multiple-choice" }>;
      const correct = a.optionId === spec.correctOptionId;
      const option = spec.options.find((o) => o.id === a.optionId);
      const fromDetector = variant.misconceptions.find((m) => m.detect.type === "option" && m.detect.optionId === a.optionId)?.id;
      return { correct, normalized: a.optionId, misconceptionId: correct ? undefined : (option?.misconceptionId ?? fromDetector) };
    }
    case "repeated-division": {
      const a = answer as Extract<Answer, { kind: "repeated-division" }>;
      const step = spec.steps[a.step];
      if (!step) throw new Error(`No division step ${a.step}`);
      const correct = a.quotient === step.quotient && a.remainder === step.remainder;
      const normalized = `${step.dividend}/2=${a.quotient}r${a.remainder}`;
      if (correct) return { correct, normalized, partial: a.step < spec.steps.length - 1 };
      const kind =
        a.quotient === step.remainder && a.remainder === step.quotient && step.quotient !== step.remainder
          ? "division-swapped"
          : a.quotient === step.quotient
            ? "division-remainder"
            : a.remainder === step.remainder
              ? "division-quotient"
              : undefined;
      return { correct, normalized, misconceptionId: kind ? variant.misconceptions.find((m) => m.detect.type === kind)?.id : undefined };
    }
    case "bit-grouping": {
      const a = answer as Extract<Answer, { kind: "bit-grouping" }>;
      const groups = groupBits(spec.bits, spec.groupSize);
      if (a.step < 0 || a.step > groups.length) throw new Error(`No grouping step ${a.step}`);
      const find = (type: string) => variant.misconceptions.find((m) => m.detect.type === type)?.id;
      if (a.step === 0) {
        if (!a.groups) throw new Error("Grouping step 0 needs groups");
        const normalized = a.groups.join("|");
        const correct = normalized === groups.join("|");
        if (correct) return { correct, normalized, partial: true };
        const kind = groupingMistake(a.groups, spec.groupSize);
        return { correct, normalized, misconceptionId: kind ? find(kind) : undefined };
      }
      if (a.digit === undefined) throw new Error(`Grouping step ${a.step} needs a digit`);
      const group = groups[a.step - 1];
      const value = parseInt(group, 2);
      const digit = a.digit.trim().toUpperCase();
      const normalized = `${group}=${digit}`;
      const correct = digit === value.toString(16).toUpperCase();
      if (correct) return { correct, normalized, partial: a.step < groups.length };
      const decimal = value >= 10 && digit === String(value);
      return { correct, normalized, misconceptionId: decimal ? find("digit-as-decimal") : undefined };
    }
    case "column-addition": {
      const a = answer as Extract<Answer, { kind: "column-addition" }>;
      const steps = additionSteps(spec.a, spec.b, spec.endCarry !== "drop");
      const step = steps[a.step];
      if (!step) throw new Error(`No addition step ${a.step}`);
      if (step.final) {
        const correct = a.sum === step.sum;
        const normalized = `final=${a.sum}`;
        if (correct) return { correct, normalized, partial: false };
        const kind = a.sum > 1 ? "addition-wrote-two" : "addition-carry-ignored";
        return { correct, normalized, misconceptionId: variant.misconceptions.find((m) => m.detect.type === kind)?.id };
      }
      if (a.carry === undefined) throw new Error(`Addition column ${a.step} needs a carry`);
      const correct = a.sum === step.sum && a.carry === step.carryOut;
      const normalized = `${step.a}+${step.b}+${step.carryIn}=${a.sum}c${a.carry}`;
      if (correct) return { correct, normalized, partial: a.step < steps.length - 1 };
      const total = step.a + step.b + step.carryIn;
      // With a carry in, "ignored the carry" and "swapped" can give the same pair; the carry reading wins.
      const kind =
        a.sum > 1 && a.sum === total
          ? "addition-wrote-two"
          : step.carryIn === 1 && a.sum !== step.sum && a.sum <= 1
            ? "addition-carry-ignored"
            : a.sum === step.carryOut && a.carry === step.sum && step.sum !== step.carryOut
              ? "addition-swapped"
              : undefined;
      return { correct, normalized, misconceptionId: kind ? variant.misconceptions.find((m) => m.detect.type === kind)?.id : undefined };
    }
  }
}

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

/** Division-by-2 chain for a value; used by content tests to confirm authored steps. */
export function divisionSteps(value: number): { dividend: number; quotient: number; remainder: 0 | 1 }[] {
  const out: { dividend: number; quotient: number; remainder: 0 | 1 }[] = [];
  for (let n = value; n > 0; n = Math.floor(n / 2)) out.push({ dividend: n, quotient: Math.floor(n / 2), remainder: (n % 2) as 0 | 1 });
  return out;
}

/**
 * Names the grouping mistake in a wrong step-0 answer, judged by group lengths (the student only
 * places separators and adds zeros on the left, so the bits themselves are given).
 */
function groupingMistake(marked: string[], size: number): string | undefined {
  const lengths = marked.map((g) => g.length);
  const [first, ...rest] = lengths;
  const init = lengths.slice(0, -1);
  if (init.length && init.every((l) => l === size) && lengths[lengths.length - 1] < size) return "group-from-left";
  if (rest.every((l) => l === size) && first < size) return "group-no-padding";
  if (rest.length && rest.every((l) => l === rest[0]) && rest[0] !== size) return "group-wrong-size";
  return undefined;
}

/** Splits a binary string into groups of `size` from the right, left-padding with zeros. */
export function groupBits(bits: string, size: number): string[] {
  const padded = bits.padStart(Math.ceil(bits.length / size) * size, "0");
  return padded.match(new RegExp(`.{${size}}`, "g")) ?? [];
}

export interface AdditionStep {
  /** Place value of the column (1, 2, 4, …); 0-based column index from the right. */
  column: number;
  a: 0 | 1;
  b: 0 | 1;
  carryIn: 0 | 1;
  /** Bit written under the column (for the final step: the end carry). */
  sum: 0 | 1;
  carryOut: 0 | 1;
  /** True for the last step: bring the final carry out down as the leftmost result bit. */
  final: boolean;
}

/**
 * Column-by-column binary addition, LSB first, plus one final step for the end carry.
 * Used by the grader and by content tests; never authored by hand.
 */
export function additionSteps(a: string, b: string, endCarry = true): AdditionStep[] {
  if (a.length !== b.length) throw new Error("operands must have equal width");
  const out: AdditionStep[] = [];
  let carry: 0 | 1 = 0;
  for (let column = 0; column < a.length; column++) {
    const x = Number(a[a.length - 1 - column]) as 0 | 1;
    const y = Number(b[b.length - 1 - column]) as 0 | 1;
    const total = x + y + carry;
    const step: AdditionStep = { column, a: x, b: y, carryIn: carry, sum: (total % 2) as 0 | 1, carryOut: (total >> 1) as 0 | 1, final: false };
    out.push(step);
    carry = step.carryOut;
  }
  if (endCarry) out.push({ column: a.length, a: 0, b: 0, carryIn: carry, sum: carry, carryOut: 0, final: true });
  return out;
}

/** Template variables for one addition step (hints, nudges and step reactions may use them). */
export function additionStepVars(step: AdditionStep): Record<string, number> {
  return { place: 2 ** step.column, aBit: step.a, bBit: step.b, carryIn: step.carryIn, sum: step.sum, carryOut: step.carryOut, stepNumber: step.column + 1 };
}

/** Result bits of a column addition, final carry first (width + 1 bits). */
export function additionResult(a: string, b: string, endCarry = true): string {
  return additionSteps(a, b, endCarry).map((s) => s.sum).reverse().join("");
}

/** 1's complement: every 1 becomes 0 and every 0 becomes 1 (width kept). */
export function complementBits(bits: string): string {
  return [...bits].map((d) => (d === "1" ? "0" : "1")).join("");
}
