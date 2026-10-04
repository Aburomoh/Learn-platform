/**
 * The kind registry (ADR-0008): runtime logic per interaction kind. Adding a kind adds a folder
 * and one line here, one in `specs.ts` (build time) and one in `ui.ts` (lazy views).
 * No Zod here: this file is part of the client bundle.
 */
import { baseToDecimal, type BaseToDecimalAnswer } from "./base-to-decimal/logic";
import { circuitPredict, type CircuitAnswer } from "./circuit-predict/logic";
import { placeValue, type PlaceValueAnswer } from "./place-value/logic";

export const kinds = {
  "base-to-decimal": baseToDecimal,
  "circuit-predict": circuitPredict,
  "place-value": placeValue,
} as const;

export type RegisteredKind = keyof typeof kinds;

/** Answers of the registered kinds. */
export type KindAnswer = BaseToDecimalAnswer | CircuitAnswer | PlaceValueAnswer;

export function isRegisteredKind(kind: string): kind is RegisteredKind {
  return Object.hasOwn(kinds, kind);
}
