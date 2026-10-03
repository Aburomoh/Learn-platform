/**
 * Truth for Boolean expressions: evaluate, truth table, minterms (Σ notation), equivalence,
 * literal count and SOP/POS form. Variable order sets minterm numbering: the first variable is
 * the most significant bit, as in F(A, B, C) with m0 = A'B'C'.
 */
import type { BoolExpr } from "./parse";

export type Env = Record<string, 0 | 1>;

export function evaluate(e: BoolExpr, env: Env): 0 | 1 {
  switch (e.type) {
    case "const":
      return e.value;
    case "var": {
      const v = env[e.name];
      if (v === undefined) throw new Error(`No value for variable ${e.name}`);
      return v;
    }
    case "not":
      return evaluate(e.arg, env) ? 0 : 1;
    case "and":
      return e.args.every((a) => evaluate(a, env)) ? 1 : 0;
    case "or":
      return e.args.some((a) => evaluate(a, env)) ? 1 : 0;
    case "xor":
      return (e.args.reduce<number>((acc, a) => acc ^ evaluate(a, env), 0) & 1) as 0 | 1;
  }
}

/** The expression's variables, sorted alphabetically (A before B, x before y). */
export function variablesOf(e: BoolExpr): string[] {
  const out = new Set<string>();
  const walk = (x: BoolExpr) => {
    if (x.type === "var") out.add(x.name);
    else if (x.type === "not") walk(x.arg);
    else if (x.type !== "const") x.args.forEach(walk);
  };
  walk(e);
  return [...out].sort();
}

/** Environment for minterm index `m` over `vars` (first variable = most significant bit). */
export function envFor(vars: string[], m: number): Env {
  const env: Env = {};
  vars.forEach((v, i) => (env[v] = ((m >> (vars.length - 1 - i)) & 1) as 0 | 1));
  return env;
}

export interface TruthRow {
  index: number;
  inputs: Env;
  out: 0 | 1;
}

export function truthTable(e: BoolExpr, vars = variablesOf(e)): TruthRow[] {
  return Array.from({ length: 2 ** vars.length }, (_, index) => {
    const inputs = envFor(vars, index);
    return { index, inputs, out: evaluate(e, inputs) };
  });
}

/** Indices of the rows where the expression is 1. */
export function mintermsOf(e: BoolExpr, vars = variablesOf(e)): number[] {
  return truthTable(e, vars)
    .filter((r) => r.out)
    .map((r) => r.index);
}

/** "Σ(0, 1, 2)"; with don't-cares "Σ(1, 5, 7) + d(0, 3, 6)". */
export function sigma(minterms: number[], dontCares: number[] = []): string {
  const list = (xs: number[]) => [...xs].sort((a, b) => a - b).join(", ");
  return `Σ(${list(minterms)})${dontCares.length ? ` + d(${list(dontCares)})` : ""}`;
}

/** Reads "Σ(1,5,7)" or "Σ(1, 5, 7) + d(0, 3, 6)" (Σ may be written m or Sigma). */
export function parseSigma(text: string): { minterms: number[]; dontCares: number[] } {
  const m = text.match(/^\s*(?:Σ|m|Sigma)\s*\(([^)]*)\)\s*(?:\+\s*d\s*\(([^)]*)\))?\s*$/);
  if (!m) throw new Error(`Not Σ notation: ${text}`);
  const nums = (s: string | undefined) => (s && s.trim() ? s.split(",").map((x) => Number(x.trim())) : []);
  const minterms = nums(m[1]);
  const dontCares = nums(m[2]);
  if ([...minterms, ...dontCares].some((n) => !Number.isInteger(n) || n < 0)) throw new Error(`Bad minterm in ${text}`);
  return { minterms, dontCares };
}

/** Same output on every input row (over the union of both variable sets unless `vars` is given). */
export function equivalent(a: BoolExpr, b: BoolExpr, vars?: string[]): boolean {
  const vs = vars ?? [...new Set([...variablesOf(a), ...variablesOf(b)])].sort();
  for (let m = 0; m < 2 ** vs.length; m++) {
    const env = envFor(vs, m);
    if (evaluate(a, env) !== evaluate(b, env)) return false;
  }
  return true;
}

/** Number of variable occurrences (A'B + C has 3 literals). */
export function literalCount(e: BoolExpr): number {
  if (e.type === "var") return 1;
  if (e.type === "const") return 0;
  if (e.type === "not") return literalCount(e.arg);
  return e.args.reduce((n, a) => n + literalCount(a), 0);
}

const isLiteral = (e: BoolExpr) => e.type === "var" || (e.type === "not" && e.arg.type === "var");
const isProductOfLiterals = (e: BoolExpr) => isLiteral(e) || (e.type === "and" && e.args.every(isLiteral));
const isSumOfLiterals = (e: BoolExpr) => isLiteral(e) || (e.type === "or" && e.args.every(isLiteral));

/** Sum of products of literals: AB' + C, A, AB. Constants count only on their own. */
export function isSOP(e: BoolExpr): boolean {
  if (e.type === "const") return true;
  return isProductOfLiterals(e) || (e.type === "or" && e.args.every(isProductOfLiterals));
}

/** Product of sums of literals: (A + B')(C + D), A + B, A. */
export function isPOS(e: BoolExpr): boolean {
  if (e.type === "const") return true;
  return isSumOfLiterals(e) || (e.type === "and" && e.args.every(isSumOfLiterals));
}

/** Writes an expression back in course notation with only the parentheses it needs. */
export function formatBool(e: BoolExpr): string {
  const prec = (x: BoolExpr) => (x.type === "or" ? 1 : x.type === "xor" ? 2 : x.type === "and" ? 3 : 4);
  const wrap = (x: BoolExpr, min: number) => (prec(x) < min ? `(${formatBool(x)})` : formatBool(x));
  switch (e.type) {
    case "const":
      return String(e.value);
    case "var":
      return e.name;
    case "not":
      return `${wrap(e.arg, 4)}'`;
    case "and":
      return e.args.map((a) => wrap(a, 4)).join("");
    case "xor":
      return e.args.map((a) => wrap(a, 3)).join(" ⊕ ");
    case "or":
      return e.args.map((a) => wrap(a, 2)).join(" + ");
  }
}
