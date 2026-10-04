/**
 * Binary arithmetic used by several kinds, their contexts and the content tests: division by 2,
 * grouping bits, column addition, complements. Pure functions, no Zod (runs in the browser).
 */

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
export function additionSteps(a: string, b: string, endCarry = true): AdditionStep[] {
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
  if (endCarry) out.push({ column: a.length, a: 0, b: 0, carryIn: carry, sum: carry, carryOut: 0, final: true });
  return out;
}

/** Template variables for one addition step (hints, nudges and step reactions may use them). */
export function additionStepVars(step: AdditionStep): Record<string, number> {
  return { place: 2 ** step.column, aBit: step.a, bBit: step.b, carryIn: step.carryIn, sum: step.sum, carryOut: step.carryOut, stepNumber: step.column + 1 };
}

/** Result bits of a column addition, final carry first (width + 1 bits). */
export function additionResult(a: string, b: string, endCarry = true): string {
  return additionSteps(a, b, endCarry).map((s) => s.sum).reverse().join("");
}

/** 1's complement: every 1 becomes 0 and every 0 becomes 1 (width kept). */
export function complementBits(bits: string): string {
  return [...bits].map((d) => (d === "1" ? "0" : "1")).join("");
}
