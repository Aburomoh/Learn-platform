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
import { cpuSchedule, type CpuScheduleAnswer } from "./cpu-schedule/logic";
import { kmap, type KmapAnswer } from "./kmap/logic";
import { memoryMap, type MemoryMapAnswer } from "./memory-map/logic";
import { multipleChoice, type MultipleChoiceAnswer } from "./multiple-choice/logic";
import { numeric, type NumericAnswer } from "./numeric/logic";
import { placeValue, type PlaceValueAnswer } from "./place-value/logic";
import { repeatedDivision, type RepeatedDivisionAnswer } from "./repeated-division/logic";
import { device, type DeviceAnswer } from "./device/logic";
import { timing, type TimingAnswer } from "./timing/logic";
import { stateDiagram, type StateDiagramAnswer } from "./state-diagram/logic";
import { truthTable, type TruthTableAnswer } from "./truth-table/logic";

export const kinds = {
  "base-to-decimal": baseToDecimal,
  "bit-grouping": bitGrouping,
  "circuit-predict": circuitPredict,
  derivation: derivation,
  expression: expression,
  "column-addition": columnAddition,
  "cpu-schedule": cpuSchedule,
  kmap,
  "memory-map": memoryMap,
  "multiple-choice": multipleChoice,
  numeric,
  "place-value": placeValue,
  "repeated-division": repeatedDivision,
  device,
  timing,
  "state-diagram": stateDiagram,
  "truth-table": truthTable,
} as const;

export type RegisteredKind = keyof typeof kinds;

/** The student's answer, one shape per kind. */
export type KindAnswer = DerivationAnswer | ExpressionAnswer | BaseToDecimalAnswer | BitGroupingAnswer | CircuitAnswer | ColumnAdditionAnswer | CpuScheduleAnswer | KmapAnswer | MemoryMapAnswer | MultipleChoiceAnswer | NumericAnswer | PlaceValueAnswer | RepeatedDivisionAnswer | DeviceAnswer | TimingAnswer | StateDiagramAnswer | TruthTableAnswer;

export function isRegisteredKind(kind: string): kind is RegisteredKind {
  return Object.hasOwn(kinds, kind);
}
