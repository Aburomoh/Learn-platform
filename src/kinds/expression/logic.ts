import { BooleanParseError, envFor, evaluate, formatBool, isPOS, isSOP, literalCount, mintermsOf, parseBool, type BoolExpr } from "@/content/boolean";
import type { KindLogic } from "../types";
import type { ExpressionSpec } from "./spec";

export type ExpressionAnswer = { kind: "expression"; text: string };

/** The function's 1-rows and don't-care rows over `spec.vars`. */
export function targetRows(spec: ExpressionSpec): { ones: Set<number>; dontCares: Set<number> } {
  const dontCares = new Set(spec.dontCares);
  const ones = spec.minterms ? new Set(spec.minterms) : new Set(mintermsOf(parseBool(spec.target!, { vars: spec.vars }), spec.vars));
  return { ones, dontCares };
}

/** True when `e` gives the function on every row that is not a don't-care. */
export function matchesFunction(spec: ExpressionSpec, e: BoolExpr, invert = false): boolean {
  const { ones, dontCares } = targetRows(spec);
  for (let m = 0; m < 2 ** spec.vars.length; m++) {
    if (dontCares.has(m)) continue;
    const want = ones.has(m) !== invert ? 1 : 0;
    if (evaluate(e, envFor(spec.vars, m)) !== want) return false;
  }
  return true;
}

/** A sum of products in which every product has each variable exactly once (canonical SOP). */
export function isMintermSum(e: BoolExpr, vars: string[]): boolean {
  if (!isSOP(e) || e.type === "const") return false;
  const products = e.type === "or" ? e.args : [e];
  return products.every((p) => {
    const lits = p.type === "and" ? p.args : [p];
    const names = lits.map((l) => (l.type === "not" ? (l.arg as { name: string }).name : (l as { name: string }).name));
    return names.length === vars.length && vars.every((v) => names.includes(v));
  });
}

const swapAndOr = (e: BoolExpr): BoolExpr =>
  e.type === "and" ? { type: "or", args: e.args.map(swapAndOr) } : e.type === "or" ? { type: "and", args: e.args.map(swapAndOr) } : e.type === "xor" ? { ...e, args: e.args.map(swapAndOr) } : e.type === "not" ? { ...e, arg: swapAndOr(e.arg) } : e;

export const expression: KindLogic<ExpressionSpec, ExpressionAnswer> = {
  grade(variant, answer) {
    const spec = variant.spec;
    const find = (type: string) => variant.misconceptions.find((m) => m.detect.type === type)?.id;
    let e: BoolExpr;
    try {
      e = parseBool(answer.text, { vars: spec.vars });
    } catch (err) {
      if (!(err instanceof BooleanParseError)) throw err;
      return { correct: false, normalized: answer.text.trim(), misconceptionId: find("expression-unreadable") };
    }
    const normalized = formatBool(e);
    if (matchesFunction(spec, e)) {
      // the right function; now the form the question asks for, then the size
      const formOk = spec.form === "any" || (spec.form === "sop" ? isSOP(e) : spec.form === "pos" ? isPOS(e) : isMintermSum(e, spec.vars));
      if (!formOk) return { correct: false, normalized, misconceptionId: find("expression-wrong-form") };
      if (spec.maxLiterals !== undefined && literalCount(e) > spec.maxLiterals) return { correct: false, normalized, misconceptionId: find("expression-not-simplified") };
      return { correct: true, normalized };
    }
    const kind = matchesFunction(spec, e, true) ? "expression-complement" : matchesFunction(spec, swapAndOr(e)) ? "expression-and-or-swapped" : undefined;
    return { correct: false, normalized, misconceptionId: kind ? find(kind) : undefined };
  },
};
