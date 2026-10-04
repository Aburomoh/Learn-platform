/**
 * Build-time side of the kind registry (ADR-0008): the Zod specs and misconception detectors that
 * `src/content/schema.ts` assembles. Kept apart from `index.ts` so Zod stays out of the client.
 */
import { CircuitSpec, circuitDetectors } from "./circuit-predict/spec";
import { PlaceValueSpec, placeValueDetectors } from "./place-value/spec";
import { TruthTableSpec, truthTableDetectors } from "./truth-table/spec";

export const kindSpecs = [PlaceValueSpec, CircuitSpec, TruthTableSpec] as const;

export const kindDetectors = [...placeValueDetectors, ...circuitDetectors, ...truthTableDetectors] as const;
