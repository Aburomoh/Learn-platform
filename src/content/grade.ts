/**
 * Deterministic grading against content. Components never grade themselves; the ActivityRunner
 * calls `grade` and passes the result to the tutor engine. Course truth lives in the spec.
 */
import type { CircuitSpec, InteractionSpec, Misconception, Variant } from "./schema";

export type Answer =
  | { kind: "place-value"; digits: (0 | 1 | null)[] }
  | { kind: "numeric"; text: string }
  | { kind: "multiple-choice"; optionId: string }
  | { kind: "circuit-predict"; output: 0 | 1 };

export interface GradeResult {
  correct: boolean;
  misconceptionId?: string;
  /** Normalised student answer for evidence (never raw UI state). */
  normalized: string;
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
      return { correct, normalized: text, misconceptionId: correct ? undefined : detectEquals(variant.misconceptions, text) };
    }
    case "multiple-choice": {
      const a = answer as Extract<Answer, { kind: "multiple-choice" }>;
      const correct = a.optionId === spec.correctOptionId;
      const option = spec.options.find((o) => o.id === a.optionId);
      const fromDetector = variant.misconceptions.find((m) => m.detect.type === "option" && m.detect.optionId === a.optionId)?.id;
      return { correct, normalized: a.optionId, misconceptionId: correct ? undefined : (option?.misconceptionId ?? fromDetector) };
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
