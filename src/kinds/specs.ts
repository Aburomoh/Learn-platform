/**
 * Build-time side of the kind registry (ADR-0008): the Zod specs and misconception detectors that
 * `src/content/schema.ts` assembles. Kept apart from `index.ts` so Zod stays out of the client.
 */
import { CircuitSpec, circuitDetectors } from "./circuit-predict/spec";
import { PlaceValueSpec, placeValueDetectors } from "./place-value/spec";

export const kindSpecs = [PlaceValueSpec, CircuitSpec] as const;

export const kindDetectors = [...placeValueDetectors, ...circuitDetectors] as const;
