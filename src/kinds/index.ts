/**
 * The kind registry (ADR-0008): runtime logic per interaction kind. Adding a kind adds a folder
 * and one line here, one in `specs.ts` (build time) and one in `ui.ts` (lazy views).
 * No Zod here: this file is part of the client bundle.
 */
import { bitGrouping, type BitGroupingAnswer } from "./bit-grouping/logic";
import { circuitPredict, type CircuitAnswer } from "./circuit-predict/logic";
import { derivation, type DerivationAnswer } from "./derivation/logic";
import { columnAddition, type ColumnAdditionAnswer } from "./column-addition/logic";
import { multipleChoice, type MultipleChoiceAnswer } from "./multiple-choice/logic";
import { numeric, type NumericAnswer } from "./numeric/logic";
import { placeValue, type PlaceValueAnswer } from "./place-value/logic";
import { repeatedDivision, type RepeatedDivisionAnswer } from "./repeated-division/logic";

export const kinds = {
  "bit-grouping": bitGrouping,
  "circuit-predict": circuitPredict,
  derivation: derivation,
  "column-addition": columnAddition,
  "multiple-choice": multipleChoice,
  numeric,
  "place-value": placeValue,
  "repeated-division": repeatedDivision,
} as const;

export type RegisteredKind = keyof typeof kinds;

/** The student's answer, one shape per kind. */
export type KindAnswer = DerivationAnswer | BitGroupingAnswer | CircuitAnswer | ColumnAdditionAnswer | MultipleChoiceAnswer | NumericAnswer | PlaceValueAnswer | RepeatedDivisionAnswer;

export function isRegisteredKind(kind: string): kind is RegisteredKind {
  return Object.hasOwn(kinds, kind);
}
