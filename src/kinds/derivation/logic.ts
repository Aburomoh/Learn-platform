import { BooleanParseError, equivalent, formatBool, parseBool, type BoolExpr } from "@/content/boolean";
import type { KindLogic } from "../types";
import type { DerivationSpec, LawId } from "./spec";

/** Step 2i: name the law of line i (`law`). Step 2i + 1: give line i (`line`: an option id, or typed text). */
export type DerivationAnswer = { kind: "derivation"; step: number; law?: LawId; line?: string };

/** Names shown on the law chips (the rule set of Chapter 2, written with A and B). */
export const LAW_NAMES: Record<LawId, string> = {
  commutative: "Commutative",
  associative: "Associative",
  distributive: "Distributive (multiply out)",
  factor: "Distributive (factor out)",
  "or-0": "A + 0 = A",
  "or-1": "A + 1 = 1",
  "or-not": "A + A′ = 1",
  "or-self": "A + A = A",
  "and-not": "A · A′ = 0",
  "and-1": "A · 1 = A",
  "and-0": "A · 0 = 0",
  "and-self": "A · A = A",
  double: "A″ = A",
  absorb: "A + AB = A",
  "absorb-not": "A + A′B = A + B",
  "de-morgan": "De Morgan",
  consensus: "Consensus",
};

/**
 * A form that ignores the order of terms and factors (and nesting of the same operator), so
 * "xy′ + x′z" and "z x′ + y′x" read as the same line, while a different expression does not.
 */
export function canonical(e: BoolExpr): string {
  switch (e.type) {
    case "const":
      return String(e.value);
    case "var":
      return e.name;
    case "not":
      return `(${canonical(e.arg)})'`;
    default: {
      const flat = e.args.flatMap((a) => (a.type === e.type ? (a as typeof e).args : [a]));
      const parts = flat.map(canonical).sort();
      return `${e.type}(${parts.join(",")})`;
    }
  }
}

const parse = (spec: DerivationSpec, text: string) => parseBool(text, { vars: spec.vars });

export const derivation: KindLogic<DerivationSpec, DerivationAnswer> = {
  grade(variant, answer) {
    const spec = variant.spec;
    const i = Math.floor(answer.step / 2);
    const line = spec.lines[i];
    if (!line) throw new Error(`No derivation step ${answer.step}`);
    const last = answer.step === spec.lines.length * 2 - 1;
    const find = (type: string) => variant.misconceptions.find((m) => m.detect.type === type)?.id;

    if (answer.step % 2 === 0) {
      const correct = answer.law === line.law;
      return { correct, normalized: `line${i + 1}:law=${answer.law ?? ""}`, partial: correct || undefined };
    }

    if (spec.lineMode === "choose") {
      const correct = answer.line === "right";
      const wrong = line.wrongLines.find((w) => w.id === answer.line);
      return { correct, normalized: `line${i + 1}:${answer.line ?? ""}`, partial: correct && !last ? true : undefined, misconceptionId: correct ? undefined : wrong?.misconceptionId };
    }

    let typed: BoolExpr;
    try {
      typed = parse(spec, answer.line ?? "");
    } catch (err) {
      if (!(err instanceof BooleanParseError)) throw err;
      return { correct: false, normalized: (answer.line ?? "").trim() };
    }
    const normalized = formatBool(typed);
    const correct = canonical(typed) === canonical(parse(spec, line.expr));
    if (correct) return { correct, normalized, partial: !last || undefined };
    const previous = parse(spec, i === 0 ? spec.start : spec.lines[i - 1].expr);
    if (!equivalent(typed, previous, spec.vars)) return { correct, normalized, misconceptionId: find("line-not-equivalent") };
    const later = spec.lines.slice(i + 1).some((l) => canonical(parse(spec, l.expr)) === canonical(typed));
    return { correct, normalized, misconceptionId: later ? find("line-skipped") : undefined };
  },

  // Two goals per line (ADR-0007): the law, then the line.
  steps: {
    count: (spec) => spec.lines.length * 2,
    tag: (_, i) => (i % 2 === 0 ? "law" : "line"),
    vars: (spec, i) => {
      const n = Math.floor(i / 2);
      const line = spec.lines[n];
      return {
        lineNumber: n + 1,
        lineCount: spec.lines.length,
        previous: n === 0 ? spec.start : spec.lines[n - 1].expr,
        lawName: LAW_NAMES[line.law],
        stepNumber: i + 1,
      };
    },
  },
};

/** The options of a choose-mode line goal: the right line (id "right") and the wrong ones, in a fixed rotation. */
export function lineOptions(spec: DerivationSpec, i: number): { id: string; expr: string }[] {
  const line = spec.lines[i];
  const all = [{ id: "right", expr: line.expr }, ...line.wrongLines.map((w) => ({ id: w.id, expr: w.expr }))];
  const k = i % all.length;
  return [...all.slice(k), ...all.slice(0, k)];
}
