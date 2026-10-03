import { describe, expect, it } from "vitest";
import {
  parseBool,
  BooleanParseError,
  evaluate,
  variablesOf,
  truthTable,
  mintermsOf,
  sigma,
  parseSigma,
  equivalent,
  literalCount,
  isSOP,
  isPOS,
  formatBool,
  minimalCovers,
  minimalSOP,
  formatCover,
  covers,
  cubeLiterals,
  type Cube,
} from "./index";

const p = (s: string, names: string[] = []) => parseBool(s, names);
const same = (a: string, b: string, names: string[] = []) => equivalent(p(a, names), p(b, names));

describe("parse and format", () => {
  it("reads complement, implicit AND, ·, ⊕, + and parentheses with ' → AND → ⊕ → + precedence", () => {
    expect(evaluate(p("AB'"), { A: 1, B: 0 })).toBe(1);
    expect(evaluate(p("A·B + C"), { A: 0, B: 1, C: 1 })).toBe(1);
    expect(evaluate(p("A + BC"), { A: 0, B: 1, C: 0 })).toBe(0);
    expect(evaluate(p("A ⊕ B"), { A: 1, B: 1 })).toBe(0);
    expect(evaluate(p("A ⊕ BC"), { A: 1, B: 1, C: 1 })).toBe(0); // AND binds tighter than ⊕
    expect(evaluate(p("A + B ⊕ C"), { A: 1, B: 1, C: 1 })).toBe(1); // ⊕ binds tighter than +
    expect(evaluate(p("(A + B)'"), { A: 0, B: 0 })).toBe(1);
    expect(evaluate(p("A''"), { A: 1 })).toBe(1);
    expect(evaluate(p("1 + 0"), {})).toBe(1);
  });

  it("matches multi-letter names longest first, then single letters", () => {
    const e = p("AB + ACi + BCi", ["Ci"]);
    expect(variablesOf(e)).toEqual(["A", "B", "Ci"]);
    expect(variablesOf(p("ACi"))).toEqual(["A", "C", "i"]); // without the name it is A·C·i
  });

  it("reports where the input goes wrong", () => {
    expect(() => p("")).toThrow(BooleanParseError);
    expect(() => p("A +")).toThrow(/ends too early/);
    expect(() => p("(A + B")).toThrow(/Missing \)/);
    expect(() => p("A + $")).toThrow(/at 4/);
    expect(() => p("A)")).toThrow(/Unexpected/);
  });

  it("formats back with only the parentheses it needs, and the result parses to the same function", () => {
    for (const s of ["AB' + C", "(A + B)(C + D')", "(AB)'", "A ⊕ BC", "(A + B) ⊕ C", "((A'B)' + C)'", "x'y'z + x'yz + xy'"]) {
      const f = formatBool(p(s));
      expect(same(f, s), `${s} → ${f}`).toBe(true);
    }
    expect(formatBool(p("(A+B)(C+D')"))).toBe("(A + B)(C + D')");
    expect(formatBool(p("(AB)'"))).toBe("(AB)'");
  });
});

describe("truth table, minterms, Σ, equivalence, form", () => {
  it("numbers rows with the first variable as the most significant bit", () => {
    const rows = truthTable(p("AB'"), ["A", "B"]);
    expect(rows.map((r) => r.out)).toEqual([0, 0, 1, 0]);
    expect(rows[2].inputs).toEqual({ A: 1, B: 0 });
  });

  it("writes and reads Σ notation, with don't-cares", () => {
    expect(sigma([7, 1, 5], [6, 0, 3])).toBe("Σ(1, 5, 7) + d(0, 3, 6)");
    expect(parseSigma("Σ(1,5,7) + d(0,3,6)")).toEqual({ minterms: [1, 5, 7], dontCares: [0, 3, 6] });
    expect(parseSigma("m(3, 6, 7)")).toEqual({ minterms: [3, 6, 7], dontCares: [] });
    expect(() => parseSigma("Σ(1, x)")).toThrow();
  });

  it("counts literals and recognises SOP and POS", () => {
    expect(literalCount(p("A'B + C"))).toBe(3);
    expect(isSOP(p("AB' + C"))).toBe(true);
    expect(isSOP(p("A(B + C)"))).toBe(false);
    expect(isPOS(p("(A + B')(C + D)"))).toBe(true);
    expect(isPOS(p("AB + C"))).toBe(false);
    expect(isSOP(p("A"))).toBe(true);
    expect(isPOS(p("A"))).toBe(true);
    expect(isSOP(p("(AB)'"))).toBe(false);
  });
});

/* ---------- Chapters 2–3 examples, restated in our notation (not quoted from the slides) ---------- */

describe("Chapter 2 facts", () => {
  it("derived gates and XOR", () => {
    expect(same("A ⊕ B", "AB' + A'B")).toBe(true);
    expect(same("(AB)'", "A' + B'")).toBe(true); // NAND, De Morgan
    expect(same("(A + B)'", "A'B'")).toBe(true); // NOR, De Morgan
    expect(same("(A ⊕ B)'", "AB + A'B'")).toBe(true); // XNOR
  });

  it("simplification and consensus", () => {
    expect(same("x'y'z + x'yz + xy'", "x'z + xy'")).toBe(true);
    expect(same("xy + x'z + yz", "xy + x'z")).toBe(true);
    expect(same("A + A'B", "A + B")).toBe(true);
    expect(literalCount(p("x'z + xy'"))).toBeLessThan(literalCount(p("x'y'z + x'yz + xy'")));
  });

  it("De Morgan on a sum of products", () => {
    expect(same("(x'yz' + x'y'z)'", "(x + y' + z)(x + y + z')")).toBe(true);
  });

  it("canonical form by truth table", () => {
    expect(mintermsOf(p("A' + AB'"), ["A", "B"])).toEqual([0, 1, 2]);
    expect(mintermsOf(p("xy + x'yz"), ["x", "y", "z"])).toEqual([3, 6, 7]);
  });
});

describe("Chapter 3 K-map results", () => {
  const sop = (vars: string[], s: string) => {
    const { minterms, dontCares } = parseSigma(s);
    return minimalCovers(vars.length, minterms, dontCares).map((c) => formatCover(c, vars));
  };

  it("three variables", () => {
    expect(sop(["A", "B", "C"], "Σ(3, 4, 6, 7)")).toEqual(["AC' + BC"]);
    expect(sop(["x", "y", "z"], "Σ(0, 2, 3, 4, 6)")).toEqual(["x'y + z'"]);
    expect(mintermsOf(p("xy + x'y'z' + x'yz'"), ["x", "y", "z"])).toEqual([0, 2, 6, 7]);
    expect(sop(["x", "y", "z"], "Σ(0, 2, 6, 7)")).toEqual(["xy + x'z'"]);
  });

  it("four variables, corners and wrap-around", () => {
    const covers4 = sop(["A", "B", "C", "D"], "Σ(0, 2, 3, 5, 7, 8, 9, 10, 11, 13, 15)");
    expect(covers4.map((c) => same(c, "AB' + BD + CD + B'D'"))).toContain(true);
    expect(covers4.every((c) => same(c, "AB' + BD + CD + B'D'"))).toBe(true);
    for (const c of covers4) expect(literalCount(p(c))).toBe(literalCount(p("AB' + BD + CD + B'D'")));
    // the map-versus-algebra example has this minimal form
    const f = p("B'C' + B'D' + A'CD'");
    const best = minimalSOP(["A", "B", "C", "D"], mintermsOf(f, ["A", "B", "C", "D"]));
    expect(same(best.text, "B'C' + B'D' + A'CD'")).toBe(true);
    expect(literalCount(best.expr)).toBe(literalCount(f));
  });

  it("don't-cares are used only where they help", () => {
    expect(sop(["A", "B", "C"], "Σ(1, 5, 7) + d(0, 3, 6)")).toEqual(["C"]);
  });

  it("constant functions", () => {
    expect(minimalSOP(["A", "B"], []).text).toBe("0");
    expect(minimalSOP(["A", "B"], [0, 1, 2, 3]).text).toBe("1");
  });
});

describe("Chapter 4–5 facts used later", () => {
  it("full adder and JK characteristic equation", () => {
    const n = ["Ci"];
    expect(same("A ⊕ B ⊕ Ci", "A'B'Ci + A'BCi' + AB'Ci' + ABCi", n)).toBe(true);
    const co = minimalSOP(["A", "B", "Ci"], mintermsOf(p("AB + ACi + BCi", n), ["A", "B", "Ci"]));
    expect(same(co.text, "AB + ACi + BCi", n)).toBe(true);
    expect(mintermsOf(p("JQ' + K'Q"), ["J", "K", "Q"])).toEqual([1, 4, 5, 6]);
  });
});

/* ---------- the minimiser against an independent brute force ---------- */

/** Every product term over n variables (3^n of them). */
function allCubes(n: number): Cube[] {
  const out: Cube[] = [];
  for (let t = 0; t < 3 ** n; t++) {
    let bits = 0;
    let mask = 0;
    let x = t;
    for (let i = 0; i < n; i++) {
      const d = x % 3;
      x = Math.floor(x / 3);
      if (d === 2) mask |= 1 << i;
      else if (d === 1) bits |= 1 << i;
    }
    out.push({ bits, mask });
  }
  return out;
}

/** Fewest terms, then fewest literals, over all covers built from implicants (no primality assumed). */
function bruteCost(n: number, ons: number[], dcs: number[]): [number, number] {
  if (!ons.length) return [0, 0];
  const allowed = new Set([...ons, ...dcs]);
  const implicants = allCubes(n).filter((c) => Array.from({ length: 2 ** n }, (_, m) => m).every((m) => !covers(c, m) || allowed.has(m)));
  for (let k = 1; k <= ons.length; k++) {
    let bestLits = Infinity;
    const pick = (start: number, chosen: Cube[]) => {
      if (chosen.length === k) {
        if (ons.every((m) => chosen.some((c) => covers(c, m)))) bestLits = Math.min(bestLits, chosen.reduce((s, c) => s + cubeLiterals(c, n), 0));
        return;
      }
      for (let i = start; i < implicants.length; i++) pick(i + 1, [...chosen, implicants[i]]);
    };
    pick(0, []);
    if (bestLits < Infinity) return [k, bestLits];
  }
  throw new Error("no cover");
}

function check(n: number, ons: number[], dcs: number[]) {
  const vars = ["A", "B", "C", "D"].slice(0, n);
  const result = minimalCovers(n, ons, dcs);
  const [k, lits] = bruteCost(n, ons, dcs);
  expect(result.length).toBeGreaterThan(0);
  for (const cover of result) {
    expect(cover.length).toBe(k);
    expect(cover.reduce((s, c) => s + cubeLiterals(c, n), 0)).toBe(lits);
    const text = formatCover(cover, vars);
    const f = parseBool(text, vars);
    for (let m = 0; m < 2 ** n; m++) {
      if (dcs.includes(m)) continue;
      const env = Object.fromEntries(vars.map((v, i) => [v, ((m >> (n - 1 - i)) & 1) as 0 | 1]));
      expect(evaluate(f, env), `${text} at m${m}`).toBe(ons.includes(m) ? 1 : 0);
    }
  }
}

describe("minimal SOP is exact (brute force)", () => {
  it("every function of 2 variables, with every don't-care pattern", () => {
    for (let code = 0; code < 3 ** 4; code++) {
      const ons: number[] = [];
      const dcs: number[] = [];
      for (let m = 0, x = code; m < 4; m++, x = Math.floor(x / 3)) {
        if (x % 3 === 1) ons.push(m);
        if (x % 3 === 2) dcs.push(m);
      }
      check(2, ons, dcs);
    }
  });

  it("every function of 3 variables", () => {
    for (let f = 0; f < 256; f++) check(3, Array.from({ length: 8 }, (_, m) => m).filter((m) => (f >> m) & 1), []);
  });

  it("sampled 3-variable functions with don't-cares and sampled 4-variable functions", () => {
    let seed = 197;
    const rand = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
    for (let t = 0; t < 60; t++) {
      const ons: number[] = [];
      const dcs: number[] = [];
      for (let m = 0; m < 8; m++) {
        const r = rand();
        if (r < 0.4) ons.push(m);
        else if (r < 0.6) dcs.push(m);
      }
      check(3, ons, dcs);
    }
    for (let t = 0; t < 12; t++) {
      const ons = Array.from({ length: 16 }, (_, m) => m).filter(() => rand() < 0.35);
      check(4, ons.slice(0, 7), []); // brute force stays fast with up to 7 ones
    }
  });
});
