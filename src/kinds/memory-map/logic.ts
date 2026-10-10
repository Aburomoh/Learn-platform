import { compact, pickRegion, place, release, summarise, type MemJob, type Placement, type Region, type Relocation, type Scheme } from "@/content/os";
import type { KindLogic } from "../types";
import type { MemoryMapSpec } from "./spec";

/**
 * One answer per goal (ADR-0007). `block` is an index into the goal's `before` regions (address
 * order, OS excluded): the free block picked for a job, or the partition marked free. `values` is
 * one entry per region for the waste column (free rows are ignored). `value` is a single number:
 * the free total, or a relocation register in the spec's `registerUnit`. `start`/`size` describe
 * the free block a release leaves; `start` alone is a job's address after compaction.
 */
export type MemoryMapAnswer = {
  kind: "memory-map";
  step: number;
  block?: number | "waits";
  values?: (number | null)[];
  value?: number;
  start?: number;
  size?: number;
};

export type GoalTag = "place" | "waste" | "holes" | "release" | "move" | "register";

interface GoalBase {
  tag: GoalTag;
  /** Index of the event this goal belongs to. */
  event: number;
  /** Memory before the goal, address order, OS excluded. */
  before: Region[];
  /** Memory after it (what "see inside" draws once the goal is right). */
  after: Region[];
}
export interface PlaceGoal extends GoalBase {
  tag: "place";
  job: MemJob;
  /** Index in `before` of the block the policy takes, or null when the job waits. */
  blockIndex: number | null;
  placement: Placement | null;
}
export interface WasteGoal extends GoalBase {
  tag: "waste";
  /** Internal waste per region of `before`; null for a free partition (not asked). */
  values: (number | null)[];
}
export interface HolesGoal extends GoalBase {
  tag: "holes";
  value: number;
}
export interface ReleaseGoal extends GoalBase {
  tag: "release";
  job: MemJob;
  /** The job's block in `before`. */
  blockIndex: number;
  released: Region;
  /** The free block that results (dynamic: merged; fixed: the partition itself). */
  result: { start: number; size: number };
  /** Free neighbours that merge (dynamic only). */
  below: Region | null;
  above: Region | null;
}
export interface MoveGoal extends GoalBase {
  tag: "move";
  job: MemJob;
  relocation: Relocation;
  /** Jobs moved so far in this compaction, address order. */
  moved: Relocation[];
  /** Every relocation of this compaction, address order. */
  all: Relocation[];
}
export interface RegisterGoal extends GoalBase {
  tag: "register";
  job: MemJob;
  relocation: Relocation;
  all: Relocation[];
}
export type Goal = PlaceGoal | WasteGoal | HolesGoal | ReleaseGoal | MoveGoal | RegisterGoal;

const UNIT_BYTES = 1024;

/** The allocation scheme the truth module uses: relocatable memory is dynamic between compactions. */
export const truthScheme = (spec: MemoryMapSpec): Scheme => (spec.scheme === "fixed" ? "fixed" : "dynamic");

const jobOf = (spec: MemoryMapSpec, id: string): MemJob => spec.jobs.find((j) => j.id === id)!;

/** Memory as the question begins: the blocks above the OS, address order. */
export function initialRegions(spec: MemoryMapSpec): Region[] {
  let at = spec.os;
  const blocks = spec.layout ?? (spec.partitions ?? []).map((size) => ({ size, job: undefined }));
  return blocks.map((b) => {
    const r: Region = { start: at, size: b.size, job: b.job ?? null, jobSize: b.job ? jobOf(spec, b.job).size : 0 };
    at += b.size;
    return r;
  });
}

/** The top address of memory (end of the last block). */
export const memoryEnd = (regions: Region[]) => (regions.length ? regions[regions.length - 1].start + regions[regions.length - 1].size : 0);

/** The register value in the spec's unit (the truth module keeps bytes). */
export const registerIn = (spec: MemoryMapSpec, r: Relocation) => (spec.registerUnit === "bytes" ? r.register : r.delta);

/** Every goal of the question, in order, with memory before and after each (computed by the truth module). */
export function goals(spec: MemoryMapSpec): Goal[] {
  const scheme = truthScheme(spec);
  let regions = initialRegions(spec);
  const out: Goal[] = [];
  spec.events.forEach((e, event) => {
    if ("place" in e) {
      const job = jobOf(spec, e.place);
      const blockIndex = pickRegion(regions, job.size, spec.fit);
      const res = place(regions, job, spec.fit, scheme);
      out.push({ tag: "place", event, before: regions, after: res.regions, job, blockIndex: blockIndex < 0 ? null : blockIndex, placement: res.placement });
      regions = res.regions;
    } else if ("fragmentation" in e) {
      if (scheme === "fixed") out.push({ tag: "waste", event, before: regions, after: regions, values: regions.map((r) => (r.job === null ? null : r.size - r.jobSize)) });
      else out.push({ tag: "holes", event, before: regions, after: regions, value: summarise(regions).freeTotal });
    } else if ("release" in e) {
      const i = regions.findIndex((r) => r.job === e.release);
      if (i < 0) throw new Error(`${e.release} is not in memory at event ${event}`);
      const released = regions[i];
      const after = release(regions, e.release, scheme);
      const touches = (r: Region | undefined) => (r && r.job === null ? r : null);
      const below = scheme === "fixed" ? null : touches(regions[i - 1]);
      const above = scheme === "fixed" ? null : touches(regions[i + 1]);
      // the free block that now covers the released address, as the truth module merged it
      const merged = after.find((r) => r.job === null && r.start <= released.start && released.start < r.start + r.size)!;
      out.push({ tag: "release", event, before: regions, after, job: jobOf(spec, e.release), blockIndex: i, released, result: { start: merged.start, size: merged.size }, below, above });
      regions = after;
    } else {
      const res = compact(regions, { unitBytes: UNIT_BYTES });
      const all = res.relocations;
      all.forEach((relocation, k) => out.push({ tag: "move", event, before: regions, after: res.regions, job: jobOf(spec, relocation.job), relocation, moved: all.slice(0, k), all }));
      for (const relocation of all) if (relocation.delta !== 0) out.push({ tag: "register", event, before: regions, after: res.regions, job: jobOf(spec, relocation.job), relocation, all });
      regions = res.regions;
    }
  });
  return out;
}

const fitName = (spec: MemoryMapSpec) => (spec.fit === "first" ? "first-fit" : "best-fit");
const schemeName = (spec: MemoryMapSpec) => (spec.scheme === "fixed" ? "fixed partitions" : spec.scheme === "dynamic" ? "dynamic partitions" : "relocatable dynamic partitions");

export const memoryMap: KindLogic<MemoryMapSpec, MemoryMapAnswer> = {
  grade(variant, answer) {
    const spec = variant.spec;
    const all = goals(spec);
    const g = all[answer.step];
    if (!g) throw new Error(`No memory-map step ${answer.step}`);
    const find = (type: string) => variant.misconceptions.find((m) => m.detect.type === type)?.id;
    const partial = answer.step < all.length - 1;
    const done = (correct: boolean, normalized: string, slip?: string) => (correct ? { correct, normalized, partial } : { correct, normalized, misconceptionId: slip ? find(slip) : undefined });

    if (g.tag === "place") {
      const picked = answer.block;
      const normalized = `${g.job.id}:${picked === "waits" ? "waits" : picked === undefined ? "" : `block${picked}`}`;
      const want = g.blockIndex === null ? "waits" : g.blockIndex;
      if (picked === want) return done(true, normalized);
      if (picked === "waits") return done(false, normalized, "waits-though-fits");
      if (picked === undefined) return done(false, normalized);
      const r = g.before[picked];
      if (!r || r.job !== null) return done(false, normalized);
      if (r.size < g.job.size) return done(false, normalized, "block-too-small");
      // a block that fits but is not the policy's: was it the other policy's choice?
      const other = pickRegion(g.before, g.job.size, spec.fit === "first" ? "best" : "first");
      return done(false, normalized, other === picked ? (spec.fit === "first" ? "first-fit-as-best" : "best-fit-as-first") : undefined);
    }

    if (g.tag === "waste") {
      const values = answer.values ?? [];
      const asked = g.values.flatMap((v, i) => (v === null ? [] : [i]));
      const normalized = `waste:${asked.map((i) => values[i] ?? "_").join(",")}`;
      const wrong = asked.filter((i) => values[i] !== g.values[i]);
      if (!wrong.length) return done(true, normalized);
      const first = wrong[0];
      const r = g.before[first];
      const slip = values[first] === r.jobSize || values[first] === r.size ? "waste-as-size" : undefined;
      return { ...done(false, normalized, slip), wrongCells: { first, count: wrong.length } };
    }

    if (g.tag === "holes") {
      const normalized = `holes:${answer.value ?? ""}`;
      if (answer.value === g.value) return done(true, normalized);
      return done(false, normalized, answer.value === summarise(g.before).largestFree && g.value !== answer.value ? "largest-hole-only" : undefined);
    }

    if (g.tag === "release") {
      if (truthScheme(spec) === "fixed") {
        const normalized = `${g.job.id}:free${answer.block ?? ""}`;
        return done(answer.block === g.blockIndex, normalized);
      }
      const { start, size } = answer;
      const normalized = `${g.job.id}:${start ?? ""}+${size ?? ""}`;
      if (start === g.result.start && size === g.result.size) return done(true, normalized);
      const rel = g.released;
      const merged = g.below || g.above;
      let slip: string | undefined;
      if (merged && start === rel.start && size === rel.size) slip = "no-merge";
      else if (g.below && g.above && ((start === g.below.start && size === g.below.size + rel.size) || (start === rel.start && size === rel.size + g.above.size))) slip = "partial-merge";
      else if (g.below && start === rel.start && size === g.result.size) slip = "merge-wrong-start";
      else if (start !== undefined && size !== undefined && g.before.some((r) => r.job !== null && r.start >= start && r.start + r.size <= start + size)) slip = "merged-busy";
      // the first wrong field only is marked: start (0) or size (1)
      return { ...done(false, normalized, slip), wrongCells: { first: start === g.result.start ? 1 : 0, count: (start === g.result.start ? 0 : 1) + (size === g.result.size ? 0 : 1) } };
    }

    if (g.tag === "move") {
      const normalized = `${g.job.id}:at${answer.start ?? ""}`;
      if (answer.start === g.relocation.newStart) return done(true, normalized);
      return done(false, normalized, answer.start === g.relocation.oldStart && g.relocation.delta !== 0 ? "gap-left" : undefined);
    }

    // register
    const want = registerIn(spec, g.relocation);
    const normalized = `${g.job.id}:reg${answer.value ?? ""}`;
    if (answer.value === want) return done(true, normalized);
    const v = answer.value;
    const slip = v === -want ? "register-sign" : v === g.relocation.delta || v === g.relocation.register || v === -g.relocation.delta || v === -g.relocation.register ? "register-unit" : undefined;
    return done(false, normalized, slip);
  },

  // ADR-0007: one goal per event, two per moved job in a compaction (its address, then its register).
  steps: {
    count: (spec) => goals(spec).length,
    tag: (spec, i) => goals(spec)[i].tag,
    vars: (spec, i) => {
      const all = goals(spec);
      const g = all[i];
      const free = g.before.filter((r) => r.job === null);
      const base = {
        stepNumber: i + 1,
        stepCount: all.length,
        unit: spec.unit,
        registerUnit: spec.registerUnit,
        fitName: fitName(spec),
        schemeName: schemeName(spec),
        // the free blocks' sizes in address order, for hint rung 5 only
        blockList: free.map((r) => r.size).join(", "),
        freeCount: free.length,
      };
      switch (g.tag) {
        case "place": {
          const r = g.blockIndex === null ? null : g.before[g.blockIndex];
          return { ...base, jobId: g.job.id, jobSize: g.job.size, blockStart: r?.start ?? "", blockSize: r?.size ?? "", partitionNumber: g.blockIndex === null ? "" : g.blockIndex + 1, waits: r ? 0 : 1 };
        }
        case "waste":
          return { ...base, wasteList: g.values.filter((v): v is number => v !== null).join(", "), wasteTotal: g.values.reduce<number>((a, v) => a + (v ?? 0), 0) };
        case "holes":
          return { ...base, holesTotal: g.value, largestHole: summarise(g.before).largestFree };
        case "release":
          return {
            ...base,
            jobId: g.job.id,
            releasedStart: g.released.start,
            releasedSize: g.released.size,
            partitionNumber: g.blockIndex + 1,
            neighbourCase: g.below && g.above ? 2 : g.below || g.above ? 1 : 3,
            resultStart: g.result.start,
            resultSize: g.result.size,
          };
        case "move":
          return { ...base, jobId: g.job.id, jobSize: g.job.size, oldStart: g.relocation.oldStart, newStart: g.relocation.newStart, moveNumber: g.moved.length + 1, moveCount: g.all.length };
        case "register":
          return { ...base, jobId: g.job.id, oldStart: g.relocation.oldStart, newStart: g.relocation.newStart, deltaUnits: g.relocation.delta, register: registerIn(spec, g.relocation) };
      }
    },
  },
};
