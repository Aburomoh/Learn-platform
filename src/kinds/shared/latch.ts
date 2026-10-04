type Bit = 0 | 1;

export type LatchType = "nand-sr" | "gated-sr";
export interface LatchValues {
  s: Bit;
  r: Bit;
  /** The Q the latch holds before the inputs act. */
  q: Bit;
  /** Enable: gated-sr only. */
  en?: Bit;
}

const nand = (a: Bit, b: Bit): Bit => (a && b ? 0 : 1);

/**
 * The outputs once the inputs act, from the gates themselves. The cross-coupled NANDs see two
 * active-low inputs: S and R as given (nand-sr), or each NANDed with En (gated-sr). Both at 0 force
 * both outputs to 1 (the invalid input); one at 0 sets or resets; both at 1 keep Q.
 */
export function latchAfter(latch: LatchType, v: LatchValues): { q: Bit; qn: Bit } {
  const set = latch === "gated-sr" ? nand(v.s, v.en ?? 0) : v.s;
  const reset = latch === "gated-sr" ? nand(v.r, v.en ?? 0) : v.r;
  if (set === 0 && reset === 0) return { q: 1, qn: 1 };
  if (set === 0) return { q: 1, qn: 0 };
  if (reset === 0) return { q: 0, qn: 1 };
  return { q: v.q, qn: v.q ? 0 : 1 };
}
