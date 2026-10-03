/**
 * Boolean expressions in the course notation (ECET 111 Chapters 2–5), parsed into a small tree.
 *
 *   A'        complement (postfix, may repeat; also after a parenthesis: (A + B)')
 *   AB, A·B   AND (implicit by juxtaposition, or · or *)
 *   A ⊕ B     XOR
 *   A + B     OR
 *   0, 1      constants
 *
 * Precedence, tightest first: ' → AND → ⊕ → +. Variables are single letters, or longer names
 * passed in `names` (e.g. "Ci" for a full adder's carry in), matched longest first.
 */

export type BoolExpr =
  | { type: "const"; value: 0 | 1 }
  | { type: "var"; name: string }
  | { type: "not"; arg: BoolExpr }
  | { type: "and"; args: BoolExpr[] }
  | { type: "xor"; args: BoolExpr[] }
  | { type: "or"; args: BoolExpr[] };

export class BooleanParseError extends Error {
  constructor(
    message: string,
    /** 0-based character offset in the source text. */
    readonly at: number,
  ) {
    super(`${message} (at ${at})`);
  }
}

type Token = { kind: "var"; name: string; at: number } | { kind: "const"; value: 0 | 1; at: number } | { kind: "op"; op: "'" | "+" | "⊕" | "·" | "(" | ")"; at: number };

function tokenize(text: string, names: string[]): Token[] {
  const longest = [...names].sort((a, b) => b.length - a.length);
  const out: Token[] = [];
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === "'" || c === "’" || c === "+" || c === "⊕" || c === "(" || c === ")") {
      out.push({ kind: "op", op: c === "’" ? "'" : c, at: i });
      i++;
      continue;
    }
    if (c === "·" || c === "*" || c === "⋅") {
      out.push({ kind: "op", op: "·", at: i });
      i++;
      continue;
    }
    if (c === "0" || c === "1") {
      out.push({ kind: "const", value: c === "1" ? 1 : 0, at: i });
      i++;
      continue;
    }
    const named = longest.find((n) => text.startsWith(n, i));
    if (named) {
      out.push({ kind: "var", name: named, at: i });
      i += named.length;
      continue;
    }
    if (/[A-Za-z]/.test(c)) {
      out.push({ kind: "var", name: c, at: i });
      i++;
      continue;
    }
    throw new BooleanParseError(`Unexpected character "${c}"`, i);
  }
  return out;
}

/** Parses an expression; throws BooleanParseError with the offending position. */
export function parseBool(text: string, names: string[] = []): BoolExpr {
  const tokens = tokenize(text, names);
  let p = 0;
  const peek = () => tokens[p];
  const isOp = (op: string) => peek()?.kind === "op" && (peek() as { op: string }).op === op;
  const startsFactor = () => {
    const t = peek();
    return !!t && (t.kind === "var" || t.kind === "const" || (t.kind === "op" && t.op === "("));
  };

  function sum(): BoolExpr {
    const args = [xor()];
    while (isOp("+")) {
      p++;
      args.push(xor());
    }
    return args.length === 1 ? args[0] : { type: "or", args };
  }
  function xor(): BoolExpr {
    const args = [product()];
    while (isOp("⊕")) {
      p++;
      args.push(product());
    }
    return args.length === 1 ? args[0] : { type: "xor", args };
  }
  function product(): BoolExpr {
    const args = [factor()];
    for (;;) {
      if (isOp("·")) {
        p++;
        args.push(factor());
      } else if (startsFactor()) args.push(factor());
      else break;
    }
    return args.length === 1 ? args[0] : { type: "and", args };
  }
  function factor(): BoolExpr {
    let e = primary();
    while (isOp("'")) {
      p++;
      e = { type: "not", arg: e };
    }
    return e;
  }
  function primary(): BoolExpr {
    const t = peek();
    if (!t) throw new BooleanParseError("Expression ends too early", text.length);
    if (t.kind === "var") {
      p++;
      return { type: "var", name: t.name };
    }
    if (t.kind === "const") {
      p++;
      return { type: "const", value: t.value };
    }
    if (t.op === "(") {
      p++;
      const e = sum();
      if (!isOp(")")) throw new BooleanParseError("Missing )", peek()?.at ?? text.length);
      p++;
      return e;
    }
    throw new BooleanParseError(`Unexpected "${t.op}"`, t.at);
  }

  if (!tokens.length) throw new BooleanParseError("Empty expression", 0);
  const e = sum();
  if (p < tokens.length) {
    const t = tokens[p];
    throw new BooleanParseError(`Unexpected "${t.kind === "op" ? t.op : t.kind === "var" ? t.name : t.value}"`, t.at);
  }
  return e;
}
