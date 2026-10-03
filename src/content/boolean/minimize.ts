/**
 * Minimal sum of products (Quine–McCluskey prime implicants, then an exact cover search), for the
 * K-map chapters. A function can have several minimal covers; `minimalCovers` returns all of
 * them so a student's equally good grouping is never marked wrong (course map review, #131).
 * Cost: fewest terms, then fewest literals.
 */
import { parseBool, type BoolExpr } from "./parse";

/** A product term: `mask` bits are the eliminated variables; `bits` the fixed values elsewhere. */
export interface Cube {
  bits: number;
  mask: number;
}

const popcount = (x: number) => {
  let n = 0;
  for (; x; x &= x - 1) n++;
  return n;
};

export const cubeLiterals = (c: Cube, n: number) => n - popcount(c.mask);

/** True when minterm `m` lies in the cube. */
export const covers = (c: Cube, m: number) => (m & ~c.mask) === c.bits;

/** All prime implicants of the 1s and don't-cares. */
export function primeImplicants(minterms: number[], dontCares: number[] = []): Cube[] {
  let level = new Map<string, Cube>();
  for (const m of new Set([...minterms, ...dontCares])) level.set(`0:${m}`, { bits: m, mask: 0 });
  const primes = new Map<string, Cube>();
  while (level.size) {
    const next = new Map<string, Cube>();
    const used = new Set<string>();
    const cubes = [...level.entries()];
    for (let i = 0; i < cubes.length; i++)
      for (let j = i + 1; j < cubes.length; j++) {
        const [ka, a] = cubes[i];
        const [kb, b] = cubes[j];
        if (a.mask !== b.mask) continue;
        const diff = a.bits ^ b.bits;
        if (popcount(diff) !== 1) continue;
        const c = { bits: a.bits & ~diff, mask: a.mask | diff };
        next.set(`${c.mask}:${c.bits}`, c);
        used.add(ka);
        used.add(kb);
      }
    for (const [k, c] of level) if (!used.has(k)) primes.set(k, c);
    level = next;
  }
  // A cube that merged with no other at its level cannot grow: it is prime.
  return [...primes.values()];
}

/**
 * Every minimal cover of the 1s (don't-cares may be used, never required).
 * Prime implicants only, as on a K-map: no group can grow without leaving the 1s and Xs.
 */
export function minimalCovers(n: number, minterms: number[], dontCares: number[] = []): Cube[][] {
  const ons = [...new Set(minterms)].filter((m) => !dontCares.includes(m)).sort((a, b) => a - b);
  if (!ons.length) return [[]];
  const primes = primeImplicants(ons, dontCares);
  let best: Cube[][] = [];
  let bestCost: [number, number] = [Infinity, Infinity];
  const cost = (cs: Cube[]): [number, number] => [cs.length, cs.reduce((s, c) => s + cubeLiterals(c, n), 0)];
  const better = (a: [number, number], b: [number, number]) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
  const same = (a: [number, number], b: [number, number]) => a[0] === b[0] && a[1] === b[1];
  const seen = new Set<string>();

  function search(chosen: Cube[], uncovered: number[]) {
    if (chosen.length > bestCost[0]) return;
    if (!uncovered.length) {
      const c = cost(chosen);
      const key = chosen.map((x) => `${x.mask}:${x.bits}`).sort().join("|");
      if (better(c, bestCost)) {
        bestCost = c;
        best = [];
        seen.clear();
      }
      if (same(c, bestCost) && !seen.has(key)) {
        seen.add(key);
        best.push([...chosen]);
      }
      return;
    }
    // Branch on the uncovered minterm with the fewest primes covering it.
    let pick = uncovered[0];
    let options = primes.filter((p) => covers(p, pick));
    for (const m of uncovered) {
      const o = primes.filter((p) => covers(p, m));
      if (o.length < options.length) {
        pick = m;
        options = o;
      }
    }
    for (const p of options) search([...chosen, p], uncovered.filter((m) => !covers(p, m)));
  }
  search([], ons);
  return best.map((cs) => sortCubes(cs, n));
}

/** Terms in a stable reading order: more significant variables first, uncomplemented first. */
function sortCubes(cs: Cube[], n: number): Cube[] {
  const key = (c: Cube) =>
    Array.from({ length: n }, (_, i) => {
      const bit = 1 << (n - 1 - i);
      return c.mask & bit ? "2" : c.bits & bit ? "0" : "1";
    }).join("");
  return [...cs].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
}

/** One product term in course notation over `vars` (first = most significant): AB'C. */
export function formatCube(c: Cube, vars: string[]): string {
  const n = vars.length;
  const lits = vars.flatMap((v, i) => {
    const bit = 1 << (n - 1 - i);
    if (c.mask & bit) return [];
    return [c.bits & bit ? v : `${v}'`];
  });
  return lits.length ? lits.join("") : "1";
}

export function formatCover(cs: Cube[], vars: string[]): string {
  return cs.length ? cs.map((c) => formatCube(c, vars)).join(" + ") : "0";
}

/** A minimal SOP (the first of the minimal covers, in reading order). */
export function minimalSOP(vars: string[], minterms: number[], dontCares: number[] = []): { text: string; expr: BoolExpr; cover: Cube[] } {
  const cover = minimalCovers(vars.length, minterms, dontCares)[0];
  const text = formatCover(cover, vars);
  return { text, expr: parseBool(text, vars), cover };
}
