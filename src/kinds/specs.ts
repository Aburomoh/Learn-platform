/**
 * Build-time side of the kind registry (ADR-0008): the Zod specs and misconception detectors that
 * `src/content/schema.ts` assembles. Kept apart from `index.ts` so Zod stays out of the client.
 */
import { BaseToDecimalSpec, baseToDecimalDetectors } from "./base-to-decimal/spec";
import { BitGroupingSpec, bitGroupingDetectors } from "./bit-grouping/spec";
import { CircuitSpec, circuitDetectors } from "./circuit-predict/spec";
import { ColumnAdditionSpec, columnAdditionDetectors } from "./column-addition/spec";
import { MultipleChoiceSpec, multipleChoiceDetectors } from "./multiple-choice/spec";
import { NumericSpec, numericDetectors } from "./numeric/spec";
import { PlaceValueSpec, placeValueDetectors } from "./place-value/spec";
import { RepeatedDivisionSpec, repeatedDivisionDetectors } from "./repeated-division/spec";

export const kindSpecs = [BaseToDecimalSpec, BitGroupingSpec, CircuitSpec, ColumnAdditionSpec, MultipleChoiceSpec, NumericSpec, PlaceValueSpec, RepeatedDivisionSpec] as const;

/** Each kind's own misconception detectors; `equals` is shared by every kind (schema.ts). */
export const detectorsByKind = {
  "base-to-decimal": baseToDecimalDetectors,
  "bit-grouping": bitGroupingDetectors,
  "circuit-predict": circuitDetectors,
  "column-addition": columnAdditionDetectors,
  "multiple-choice": multipleChoiceDetectors,
  numeric: numericDetectors,
  "place-value": placeValueDetectors,
  "repeated-division": repeatedDivisionDetectors,
} as const;

export const kindDetectors = [
  ...baseToDecimalDetectors,
  ...bitGroupingDetectors,
  ...circuitDetectors,
  ...columnAdditionDetectors,
  ...multipleChoiceDetectors,
  ...numericDetectors,
  ...placeValueDetectors,
  ...repeatedDivisionDetectors,
] as const;
