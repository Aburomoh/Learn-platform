/**
 * The kind registry (ADR-0008): runtime logic per interaction kind. Adding a kind adds a folder
 * and one line here, one in `specs.ts` (build time) and one in `ui.ts` (lazy views).
 * No Zod here: this file is part of the client bundle.
 *
 * Logic is loaded on demand (#683): an activity page downloads only the logic of the kinds it
 * uses: the page wraps the runner in `KindLogicGate` (`./logicGate.ts`), which registers them
 * (`provideKind`) before the runner renders. `kindLogic` then hands logic out synchronously to
 * `grade` and the step contract. `kindLoaders` / `loadKinds` load logic outside a page (tests,
 * build-time checks).
 */
import type { baseToDecimal, BaseToDecimalAnswer } from "./base-to-decimal/logic";
import type { bitGrouping, BitGroupingAnswer } from "./bit-grouping/logic";
import type { circuitPredict, CircuitAnswer } from "./circuit-predict/logic";
import type { derivation, DerivationAnswer } from "./derivation/logic";
import type { expression, ExpressionAnswer } from "./expression/logic";
import type { columnAddition, ColumnAdditionAnswer } from "./column-addition/logic";
import type { cpuSchedule, CpuScheduleAnswer } from "./cpu-schedule/logic";
import type { kmap, KmapAnswer } from "./kmap/logic";
import type { memoryMap, MemoryMapAnswer } from "./memory-map/logic";
import type { multipleChoice, MultipleChoiceAnswer } from "./multiple-choice/logic";
import type { numeric, NumericAnswer } from "./numeric/logic";
import type { placeValue, PlaceValueAnswer } from "./place-value/logic";
import type { repeatedDivision, RepeatedDivisionAnswer } from "./repeated-division/logic";
import type { device, DeviceAnswer } from "./device/logic";
import type { timing, TimingAnswer } from "./timing/logic";
import type { stateDiagram, StateDiagramAnswer } from "./state-diagram/logic";
import type { truthTable, TruthTableAnswer } from "./truth-table/logic";

/** Each kind's logic module, loaded on first use. */
export const kindLoaders = {
  "base-to-decimal": () => import("./base-to-decimal/logic").then((m): typeof baseToDecimal => m.baseToDecimal),
  "bit-grouping": () => import("./bit-grouping/logic").then((m): typeof bitGrouping => m.bitGrouping),
  "circuit-predict": () => import("./circuit-predict/logic").then((m): typeof circuitPredict => m.circuitPredict),
  derivation: () => import("./derivation/logic").then((m): typeof derivation => m.derivation),
  expression: () => import("./expression/logic").then((m): typeof expression => m.expression),
  "column-addition": () => import("./column-addition/logic").then((m): typeof columnAddition => m.columnAddition),
  "cpu-schedule": () => import("./cpu-schedule/logic").then((m): typeof cpuSchedule => m.cpuSchedule),
  kmap: () => import("./kmap/logic").then((m): typeof kmap => m.kmap),
  "memory-map": () => import("./memory-map/logic").then((m): typeof memoryMap => m.memoryMap),
  "multiple-choice": () => import("./multiple-choice/logic").then((m): typeof multipleChoice => m.multipleChoice),
  numeric: () => import("./numeric/logic").then((m): typeof numeric => m.numeric),
  "place-value": () => import("./place-value/logic").then((m): typeof placeValue => m.placeValue),
  "repeated-division": () => import("./repeated-division/logic").then((m): typeof repeatedDivision => m.repeatedDivision),
  device: () => import("./device/logic").then((m): typeof device => m.device),
  timing: () => import("./timing/logic").then((m): typeof timing => m.timing),
  "state-diagram": () => import("./state-diagram/logic").then((m): typeof stateDiagram => m.stateDiagram),
  "truth-table": () => import("./truth-table/logic").then((m): typeof truthTable => m.truthTable),
} as const;

export type RegisteredKind = keyof typeof kindLoaders;
/** The logic of one kind: `grade` and, for multi-step kinds, `steps`. */
export type LogicOf<K extends RegisteredKind> = Awaited<ReturnType<(typeof kindLoaders)[K]>>;

/** The student's answer, one shape per kind. */
export type KindAnswer = DerivationAnswer | ExpressionAnswer | BaseToDecimalAnswer | BitGroupingAnswer | CircuitAnswer | ColumnAdditionAnswer | CpuScheduleAnswer | KmapAnswer | MemoryMapAnswer | MultipleChoiceAnswer | NumericAnswer | PlaceValueAnswer | RepeatedDivisionAnswer | DeviceAnswer | TimingAnswer | StateDiagramAnswer | TruthTableAnswer;

export function isRegisteredKind(kind: string): kind is RegisteredKind {
  return Object.hasOwn(kindLoaders, kind);
}

/** Logic registered so far, per kind. */
const loaded = new Map<RegisteredKind, unknown>();

/** Registers a kind's logic (the activity page's `KindLogicGate` does this as each loads). */
export function provideKind<K extends RegisteredKind>(kind: K, logic: LogicOf<K>): void {
  loaded.set(kind, logic);
}

/** Loads and registers the logic of every kind listed (tests and checks outside a page). */
export async function loadKinds(kinds: readonly string[]): Promise<void> {
  const wanted = [...new Set(kinds)].filter(isRegisteredKind);
  await Promise.all(wanted.map(async (kind) => provideKind(kind, await kindLoaders[kind]())));
}

/** Loads every kind (tests that grade across the whole catalogue). */
export function loadAllKinds(): Promise<void> {
  return loadKinds(Object.keys(kindLoaders));
}

/** A registered kind's logic. Throws if it is not loaded: that is a bug. */
export function kindLogic<K extends RegisteredKind>(kind: K): LogicOf<K> {
  if (!loaded.has(kind)) throw new Error(`Logic of kind "${kind}" is not loaded (wrap the runner in KindLogicGate, or call loadKinds)`);
  return loaded.get(kind) as LogicOf<K>;
}

/** Whether a loaded kind answers one step at a time (ADR-0007). */
export function isMultiStep(kind: RegisteredKind): boolean {
  return "steps" in kindLogic(kind);
}
