/** The adders and flip-flops as devices: pin names and the outputs computed from what is given (never authored). */
type Bit = 0 | 1;

export type AdderType = "half" | "full";
export interface AdderGiven {
  a: Bit;
  b: Bit;
  /** Carry in: full adder only. */
  ci?: Bit;
}

/** Sum and carry out of the bits given: S is 1 for an odd number of 1s, the carry for two or more. */
export function adderOutputs(given: AdderGiven): { s: Bit; c: Bit } {
  const ones = given.a + given.b + (given.ci ?? 0);
  return { s: (ones % 2) as Bit, c: ones >= 2 ? 1 : 0 };
}

/** Pin names as the lessons write them: A B (Ci) in, S and C (half) or Co (full) out. */
export function adderPins(adder: AdderType): { inputs: string[]; outputs: [string, string] } {
  return adder === "full" ? { inputs: ["A", "B", "Ci"], outputs: ["S", "Co"] } : { inputs: ["A", "B"], outputs: ["S", "C"] };
}

export type FlipFlopType = "d" | "t" | "sr" | "jk";
export interface FlipFlopGiven {
  /** Present state Q. */
  q: Bit;
  /** One value per input, in pin order: D; T; S R; J K. */
  inputs: Bit[];
}

/** Input pin names, top to bottom. */
export function flipFlopInputs(ff: FlipFlopType): string[] {
  return ff === "d" ? ["D"] : ff === "t" ? ["T"] : ff === "sr" ? ["S", "R"] : ["J", "K"];
}

/**
 * Next state on the active clock edge, from the characteristic equations (pack ch5):
 * D: Q⁺ = D · T: Q⁺ = T ⊕ Q · SR: Q⁺ = S + R′Q (S = R = 1 is not allowed) · JK: Q⁺ = JQ′ + K′Q.
 */
export function flipFlopNext(ff: FlipFlopType, given: FlipFlopGiven): Bit {
  const [x, y] = given.inputs;
  const q = given.q;
  if (ff === "d") return x;
  if (ff === "t") return x !== q ? 1 : 0;
  if (ff === "sr") return x || (!y && q) ? 1 : 0;
  return (x && !q) || (!y && q) ? 1 : 0;
}
