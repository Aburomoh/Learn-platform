/**
 * The kind registry (ADR-0008): runtime logic per interaction kind. Adding a kind adds a folder
 * and one line here, one in `specs.ts` (build time) and one in `ui.ts` (lazy views).
 * No Zod here: this file is part of the client bundle.
 */
import { baseToDecimal, type BaseToDecimalAnswer } from "./base-to-decimal/logic";
import { bitGrouping, type BitGroupingAnswer } from "./bit-grouping/logic";
import { circuitPredict, type CircuitAnswer } from "./circuit-predict/logic";
import { derivation, type DerivationAnswer } from "./derivation/logic";
import { expression, type ExpressionAnswer } from "./expression/logic";
import { columnAddition, type ColumnAdditionAnswer } from "./column-addition/logic";
import { multipleChoice, type MultipleChoiceAnswer } from "./multiple-choice/logic";
import { numeric, type NumericAnswer } from "./numeric/logic";
import { placeValue, type PlaceValueAnswer } from "./place-value/logic";
import { repeatedDivision, type RepeatedDivisionAnswer } from "./repeated-division/logic";
import { truthTable, type TruthTableAnswer } from "./truth-table/logic";

export const kinds = {
  "base-to-decimal": baseToDecimal,
  "bit-grouping": bitGrouping,
  "circuit-predict": circuitPredict,
  derivation: derivation,
  expression: expression,
  "column-addition": columnAddition,
  "multiple-choice": multipleChoice,
  numeric,
  "place-value": placeValue,
  "repeated-division": repeatedDivision,
  "truth-table": truthTable,
} as const;

export type RegisteredKind = keyof typeof kinds;

/** The student's answer, one shape per kind. */
export type KindAnswer = DerivationAnswer | ExpressionAnswer | BaseToDecimalAnswer | BitGroupingAnswer | CircuitAnswer | ColumnAdditionAnswer | MultipleChoiceAnswer | NumericAnswer | PlaceValueAnswer | RepeatedDivisionAnswer | TruthTableAnswer;

export function isRegisteredKind(kind: string): kind is RegisteredKind {
  return Object.hasOwn(kinds, kind);
}
