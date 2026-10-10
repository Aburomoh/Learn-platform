/**
 * Arithmetic for the built-in calculator (#579): + − × ÷ ^, parentheses, decimals, and the
 * notation content writes (× ÷ − · and superscript powers such as 8²). A tiny recursive-descent
 * parser, no `eval`. Throws `CalcError` on anything else.
 */
export class CalcError extends Error {}

const SUPERSCRIPT = "⁰¹²³⁴⁵⁶⁷⁸⁹";

/** Content notation → plain operators: "3 × 8² + 2 × 8¹" → "3 * 8^2 + 2 * 8^1". */
export function normaliseExpression(text: string): string {
  return text
    .replace(/[×·]/g, "*")
    .replace(/÷/g, "/")
    .replace(/[−–]/g, "-")
    .replace(/⁻?[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => "^" + [...m].map((c) => (c === "⁻" ? "-" : SUPERSCRIPT.indexOf(c))).join(""))
    .replace(/\s+/g, " ")
    .trim();
}

type Token = { type: "num"; value: number } | { type: "op"; value: string };

function tokenise(text: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === " ") {
      i++;
    } else if (/[0-9.]/.test(c)) {
      const m = /^[0-9]*\.?[0-9]+|^[0-9]+\.?/.exec(text.slice(i))!;
      if (!m || m[0] === ".") throw new CalcError(`Bad number at ${i + 1}`);
      if (m[0].endsWith(".")) throw new CalcError("Finish the number after the point");
      out.push({ type: "num", value: Number(m[0]) });
      i += m[0].length;
    } else if ("+-*/^()".includes(c)) {
      out.push({ type: "op", value: c });
      i++;
    } else throw new CalcError(`Unexpected "${c}"`);
  }
  return out;
}

/** Evaluates the expression; throws `CalcError` on a syntax error or division by zero. */
export function evaluateExpression(text: string): number {
  const tokens = tokenise(normaliseExpression(text));
  let pos = 0;
  const peek = () => tokens[pos];
  const take = () => tokens[pos++];
  const expectOp = (v: string) => {
    const t = take();
    if (!t || t.type !== "op" || t.value !== v) throw new CalcError(`Expected "${v}"`);
  };

  function primary(): number {
    const t = take();
    if (!t) throw new CalcError("Unfinished expression");
    if (t.type === "num") return t.value;
    if (t.value === "(") {
      const v = sum();
      expectOp(")");
      return v;
    }
    if (t.value === "-") return -unary();
    if (t.value === "+") return unary();
    throw new CalcError(`Unexpected "${t.value}"`);
  }
  // right-associative power binds tighter than a leading minus: -2^2 = -4
  function power(): number {
    const base = primary();
    const t = peek();
    if (t && t.type === "op" && t.value === "^") {
      take();
      return base ** unary();
    }
    return base;
  }
  function unary(): number {
    const t = peek();
    if (t && t.type === "op" && (t.value === "-" || t.value === "+")) {
      take();
      return t.value === "-" ? -unary() : unary();
    }
    return power();
  }
  function product(): number {
    let v = unary();
    for (;;) {
      const t = peek();
      if (!t || t.type !== "op" || (t.value !== "*" && t.value !== "/")) return v;
      take();
      const r = unary();
      if (t.value === "/" && r === 0) throw new CalcError("Division by zero");
      v = t.value === "*" ? v * r : v / r;
    }
  }
  function sum(): number {
    let v = product();
    for (;;) {
      const t = peek();
      if (!t || t.type !== "op" || (t.value !== "+" && t.value !== "-")) return v;
      take();
      const r = product();
      v = t.value === "+" ? v + r : v - r;
    }
  }
  const v = sum();
  if (pos < tokens.length) throw new CalcError(`Unexpected "${tokens[pos].type === "op" ? (tokens[pos] as { value: string }).value : "number"}"`);
  if (!Number.isFinite(v)) throw new CalcError("Out of range");
  return v;
}

/** The result as the student would write it: up to 10 significant digits, no trailing zeros. */
export function formatResult(v: number): string {
  const s = Number(v.toPrecision(10)).toString();
  return s.includes("e") ? v.toString() : s;
}
