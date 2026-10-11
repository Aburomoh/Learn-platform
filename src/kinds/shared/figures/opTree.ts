/**
 * The operations of an arithmetic expression as a tree (CPET181 Ch6 s.21–24, #615): precedence
 * `**` before `*` `/` before `+` `−`, parentheses first. Earliest-step scheduling: an operation runs
 * in the step after both its operands are ready (a leaf is ready at step 0). Steps = the longest
 * chain; processors = the widest step. Computed here, never authored (ADR-0009).
 */

export type Op = "+" | "-" | "*" | "/" | "**";
export type Expr = { kind: "leaf"; text: string } | { kind: "op"; op: Op; left: Expr; right: Expr };

export class ExpressionParseError extends Error {}

type Token = { t: "op"; v: Op } | { t: "("; v: "(" } | { t: ")"; v: ")" } | { t: "=" ; v: "=" } | { t: "leaf"; v: string };

function tokens(text: string): Token[] {
  const out: Token[] = [];
  const s = text.replace(/−/g, "-").replace(/×/g, "*").replace(/÷/g, "/").replace(/\^/g, "**");
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === " " || c === "\t") {
      i++;
    } else if (s.startsWith("**", i)) {
      out.push({ t: "op", v: "**" });
      i += 2;
    } else if (c === "+" || c === "-" || c === "*" || c === "/") {
      out.push({ t: "op", v: c });
      i++;
    } else if (c === "(" || c === ")" || c === "=") {
      out.push({ t: c, v: c } as Token);
      i++;
    } else {
      const m = /^([A-Za-z_][A-Za-z0-9_]*|[0-9]+(?:\.[0-9]+)?)/.exec(s.slice(i));
      if (!m) throw new ExpressionParseError(`Unexpected "${c}" in "${text}"`);
      out.push({ t: "leaf", v: m[1] });
      i += m[1].length;
    }
  }
  return out;
}

/** Parses "A = 3 * B * C + 4 / (D + E) ** (F − G)" (the "name =" part is optional). */
export function parseExpression(text: string): { name?: string; root: Expr } {
  const ts = tokens(text);
  let name: string | undefined;
  if (ts.length > 2 && ts[0].t === "leaf" && ts[1].t === "=") {
    name = ts[0].v;
    ts.splice(0, 2);
  }
  let k = 0;
  const peek = () => ts[k];
  const take = () => ts[k++];
  const atom = (): Expr => {
    const tk = take();
    if (!tk) throw new ExpressionParseError(`"${text}" ends too early`);
    if (tk.t === "leaf") return { kind: "leaf", text: tk.v };
    if (tk.t === "(") {
      const e = expr();
      const close = take();
      if (!close || close.t !== ")") throw new ExpressionParseError(`Missing ")" in "${text}"`);
      return e;
    }
    throw new ExpressionParseError(`Unexpected "${tk.v}" in "${text}"`);
  };
  // ** binds tightest and to the right: a ** b ** c = a ** (b ** c)
  const power = (): Expr => {
    const base = atom();
    const tk = peek();
    if (tk && tk.t === "op" && tk.v === "**") {
      take();
      return { kind: "op", op: "**", left: base, right: power() };
    }
    return base;
  };
  const level = (ops: Op[], next: () => Expr) => (): Expr => {
    let left = next();
    for (;;) {
      const tk = peek();
      if (!tk || tk.t !== "op" || !ops.includes(tk.v)) return left;
      take();
      left = { kind: "op", op: tk.v, left, right: next() };
    }
  };
  const term = level(["*", "/"], power);
  const expr = level(["+", "-"], term);
  const root = expr();
  if (k < ts.length) throw new ExpressionParseError(`Unexpected "${ts[k].v}" in "${text}"`);
  if (root.kind === "leaf") throw new ExpressionParseError(`"${text}" has no operation`);
  return { name, root };
}

export const isOp = (e: Expr): e is Extract<Expr, { kind: "op" }> => e.kind === "op";

/** The step an operation runs in under earliest-step scheduling (a leaf: 0). */
export function stepOf(e: Expr): number {
  return isOp(e) ? 1 + Math.max(stepOf(e.left), stepOf(e.right)) : 0;
}

/** The operations in tree order (left subtree, node, right subtree). */
export function operations(e: Expr): Extract<Expr, { kind: "op" }>[] {
  return isOp(e) ? [...operations(e.left), e, ...operations(e.right)] : [];
}

export function leaves(e: Expr): string[] {
  return isOp(e) ? [...leaves(e.left), ...leaves(e.right)] : [e.text];
}

export function depth(e: Expr): number {
  return isOp(e) ? 1 + Math.max(depth(e.left), depth(e.right)) : 0;
}

const PREC: Record<Op, number> = { "+": 1, "-": 1, "*": 2, "/": 2, "**": 3 };

/** The expression written back with the parentheses it needs, "−" for minus. */
export function print(e: Expr): string {
  if (!isOp(e)) return e.text;
  const wrap = (child: Expr, right: boolean) => {
    const s = print(child);
    if (!isOp(child)) return s;
    const p = PREC[child.op];
    const q = PREC[e.op];
    // a weaker child needs brackets; so does an equal one on the right of − or /, or the left of **
    const needs = p < q || (p === q && (right ? e.op === "-" || e.op === "/" : e.op === "**"));
    return needs ? `(${s})` : s;
  };
  return `${wrap(e.left, false)} ${e.op === "-" ? "−" : e.op} ${wrap(e.right, true)}`;
}

/** The earliest-step schedule: the operations of each step, 1 … steps; `widest` is the processor count under that rule. */
export function schedule(root: Expr): { steps: Extract<Expr, { kind: "op" }>[][]; widest: number } {
  const ops = operations(root);
  const n = stepOf(root);
  const steps = Array.from({ length: n }, (_, i) => ops.filter((o) => stepOf(o) === i + 1));
  return { steps, widest: Math.max(0, ...steps.map((s) => s.length)) };
}
