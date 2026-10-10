/**
 * Build-time side of the kind registry (ADR-0008): the Zod specs and misconception detectors that
 * `src/content/schema.ts` assembles. Kept apart from `index.ts` so Zod stays out of the client.
 */
import { BaseToDecimalSpec, baseToDecimalDetectors } from "./base-to-decimal/spec";
import { BitGroupingSpec, bitGroupingDetectors } from "./bit-grouping/spec";
import { CircuitSpec, circuitDetectors } from "./circuit-predict/spec";
import { DerivationSpec, derivationDetectors } from "./derivation/spec";
import { ExpressionSpec, expressionDetectors } from "./expression/spec";
import { ColumnAdditionSpec, columnAdditionDetectors } from "./column-addition/spec";
import { CpuScheduleSpec, cpuScheduleDetectors } from "./cpu-schedule/spec";
import { KmapSpec, kmapDetectors } from "./kmap/spec";
import { MemoryMapSpec, memoryMapDetectors } from "./memory-map/spec";
import { MultipleChoiceSpec, multipleChoiceDetectors } from "./multiple-choice/spec";
import { NumericSpec, numericDetectors } from "./numeric/spec";
import { PlaceValueSpec, placeValueDetectors } from "./place-value/spec";
import { RepeatedDivisionSpec, repeatedDivisionDetectors } from "./repeated-division/spec";
import { StateDiagramSpec, stateDiagramDetectors } from "./state-diagram/spec";
import { TimingSpec, timingDetectors } from "./timing/spec";
import { DeviceSpec, deviceDetectors } from "./device/spec";
import { TruthTableSpec, truthTableDetectors } from "./truth-table/spec";

export const kindSpecs = [DerivationSpec, ExpressionSpec, BaseToDecimalSpec, BitGroupingSpec, CircuitSpec, ColumnAdditionSpec, CpuScheduleSpec, KmapSpec, MemoryMapSpec, MultipleChoiceSpec, NumericSpec, PlaceValueSpec, RepeatedDivisionSpec, DeviceSpec, TimingSpec, StateDiagramSpec, TruthTableSpec] as const;

/** Each kind's own misconception detectors; `equals` is shared by every kind (schema.ts). */
export const detectorsByKind = {
  "base-to-decimal": baseToDecimalDetectors,
  "bit-grouping": bitGroupingDetectors,
  "circuit-predict": circuitDetectors,
  derivation: derivationDetectors,
  expression: expressionDetectors,
  "column-addition": columnAdditionDetectors,
  "cpu-schedule": cpuScheduleDetectors,
  kmap: kmapDetectors,
  "memory-map": memoryMapDetectors,
  "multiple-choice": multipleChoiceDetectors,
  numeric: numericDetectors,
  "place-value": placeValueDetectors,
  "repeated-division": repeatedDivisionDetectors,
  device: deviceDetectors,
  timing: timingDetectors,
  "state-diagram": stateDiagramDetectors,
  "truth-table": truthTableDetectors,
} as const;

export const kindDetectors = [
  ...baseToDecimalDetectors,
  ...bitGroupingDetectors,
  ...circuitDetectors,
  ...derivationDetectors,
  ...expressionDetectors,
  ...columnAdditionDetectors,
  ...cpuScheduleDetectors,
  ...kmapDetectors,
  ...memoryMapDetectors,
  ...multipleChoiceDetectors,
  ...numericDetectors,
  ...placeValueDetectors,
  ...repeatedDivisionDetectors,
  ...deviceDetectors,
  ...timingDetectors,
  ...stateDiagramDetectors,
  ...truthTableDetectors,
] as const;
