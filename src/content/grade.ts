/**
 * Deterministic grading against content. Components never grade themselves; the ActivityRunner
 * calls `grade` and passes the result to the tutor engine. Course truth lives in the spec.
 */
import type { CircuitSpec, InteractionSpec, Misconception, Variant } from "./schema";

export type Answer =
  | { kind: "place-value"; digits: (0 | 1 | null)[] }
  | { kind: "numeric"; text: string }
  | { kind: "multiple-choice"; optionId: string }
  | { kind: "circuit-predict"; output: 0 | 1 }
  | { kind: "repeated-division"; step: number; quotient: number; remainder: number }
  /** One column (sum bit + carry out), or the final carry step where only `sum` is read. */
  | { kind: "column-addition"; step: number; sum: number; carry?: number };

export interface GradeResult {
  correct: boolean;
  misconceptionId?: string;
  /** Normalised student answer for evidence (never raw UI state). */
  normalized: string;
  /** True when a step was right but the question has more steps (repeated-division, column-addition). */
  partial?: boolean;
}

export function grade(variant: Variant, answer: Answer): GradeResult {
  const spec = variant.spec;
  if (spec.kind !== answer.kind) {
    throw new Error(`Answer kind ${answer.kind} does not match spec kind ${spec.kind}`);
  }
  switch (spec.kind) {
    case "place-value": {
      const a = answer as Extract<Answer, { kind: "place-value" }>;
      const digits = a.digits.map((d) => d ?? 0);
      const correct = digits.length === spec.answer.length && digits.every((d, i) => d === spec.answer[i]);
      return { correct, normalized: digits.join(""), misconceptionId: correct ? undefined : detectBits(variant, digits) };
    }
    case "numeric": {
      const a = answer as Extract<Answer, { kind: "numeric" }>;
      const text = normaliseNumeric(a.text);
      const correct = text === normaliseNumeric(spec.answer);
      // Compare normalised forms on both sides so "01011" still matches an authored "01011".
      const hit = variant.misconceptions.find((m) => m.detect.type === "equals" && normaliseNumeric(String(m.detect.value)) === text);
      return { correct, normalized: text, misconceptionId: correct ? undefined : hit?.id };
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
    case "column-addition": {
      const a = answer as Extract<Answer, { kind: "column-addition" }>;
      const steps = additionSteps(spec.a, spec.b);
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
      if (correct) return { correct, normalized, partial: true };
      const total = step.a + step.b + step.carryIn;
      const kind =
        a.sum > 1 && a.sum === total
          ? "addition-wrote-two"
          : a.sum === step.carryOut && a.carry === step.sum && step.sum !== step.carryOut
            ? "addition-swapped"
            : step.carryIn === 1 && a.sum !== step.sum && a.sum <= 1
              ? "addition-carry-ignored"
              : undefined;
      return { correct, normalized, misconceptionId: kind ? variant.misconceptions.find((m) => m.detect.type === kind)?.id : undefined };
    }
    case "circuit-predict": {
      const a = answer as Extract<Answer, { kind: "circuit-predict" }>;
      const correct = a.output === spec.answer;
      return { correct, normalized: String(a.output), misconceptionId: correct ? undefined : detectEquals(variant.misconceptions, a.output) };
    }
  }
}

function normaliseNumeric(text: string): string {
  return text.trim().toUpperCase().replace(/^0+(?=.)/, "").replace(/^0[XB]/, "");
}

function detectEquals(list: Misconception[], value: string | number): string | undefined {
  return list.find((m) => m.detect.type === "equals" && String(m.detect.value).toUpperCase() === String(value).toUpperCase())?.id;
}

function detectBits(variant: Variant, digits: number[]): string | undefined {
  const spec = variant.spec as Extract<InteractionSpec, { kind: "place-value" }>;
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

/** Evaluates a circuit spec; used by content tests to confirm authored answers. */
export function evaluateCircuit(spec: CircuitSpec, inputOverride?: Record<string, 0 | 1>): Record<string, 0 | 1> {
  const values: Record<string, 0 | 1> = {};
  for (const inp of spec.inputs) values[inp.id] = inputOverride?.[inp.id] ?? inp.value;
  const pending = [...spec.gates];
  let guard = 0;
  while (pending.length && guard++ < 50) {
    const g = pending.shift()!;
    if (!g.from.every((f) => f in values)) {
      pending.push(g);
      continue;
    }
    const [x, y] = g.from.map((f) => values[f]);
    values[g.id] = gateOutput(g.type, x, y);
  }
  if (pending.length) throw new Error("Circuit has unresolved gates (cycle or missing input)");
  return values;
}

export function gateOutput(type: CircuitSpec["gates"][number]["type"], x: 0 | 1, y: 0 | 1 = 0): 0 | 1 {
  switch (type) {
    case "AND": return x && y ? 1 : 0;
    case "OR": return x || y ? 1 : 0;
    case "NOT": return x ? 0 : 1;
    case "XOR": return x !== y ? 1 : 0;
    case "NAND": return x && y ? 0 : 1;
    case "NOR": return x || y ? 0 : 1;
  }
}

/** Decimal value of a binary digit row, most significant first. */
export function bitsToValue(digits: (0 | 1 | null)[]): number {
  return digits.reduce<number>((acc, d) => acc * 2 + (d ?? 0), 0);
}

export function valueToBits(value: number, slots: number): (0 | 1)[] {
  return Array.from({ length: slots }, (_, i) => ((value >> (slots - 1 - i)) & 1) as 0 | 1);
}

/** Division-by-2 chain for a value; used by content tests to confirm authored steps. */
export function divisionSteps(value: number): { dividend: number; quotient: number; remainder: 0 | 1 }[] {
  const out: { dividend: number; quotient: number; remainder: 0 | 1 }[] = [];
  for (let n = value; n > 0; n = Math.floor(n / 2)) out.push({ dividend: n, quotient: Math.floor(n / 2), remainder: (n % 2) as 0 | 1 });
  return out;
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
export function additionSteps(a: string, b: string): AdditionStep[] {
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
  out.push({ column: a.length, a: 0, b: 0, carryIn: carry, sum: carry, carryOut: 0, final: true });
  return out;
}

/** Result bits of a column addition, final carry first (width + 1 bits). */
export function additionResult(a: string, b: string): string {
  return additionSteps(a, b).map((s) => s.sum).reverse().join("");
}
