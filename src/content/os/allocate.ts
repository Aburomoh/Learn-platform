/** Contiguous memory allocation truth (CPET181 Ch2, #539): pure, dependency-free. Sizes are in K (1 KB = 1024 B). */

export type Fit = "first" | "best";
export type Scheme = "fixed" | "dynamic";

/** A block of memory in address order. `job` is null when free; `jobSize` is the requested size of its job. */
export interface Region {
  start: number;
  size: number;
  job: string | null;
  jobSize: number;
}

export interface MemJob {
  id: string;
  size: number;
}

export interface AllocOptions {
  /** Best-fit with two equal smallest blocks: "first" = the one first from the top (Ch2 conventions). */
  bestFitTie?: "first" | "last";
  /** Bytes per size unit for relocation values. Default 1024 (1 KB). */
  unitBytes?: number;
}
// bestFitTie: never occurs in the deck or quizzes; the pack takes the higher block. LOCAL SOURCE VERIFICATION NEEDED.

export interface Placement {
  job: string;
  blockStart: number;
  blockSize: number;
  jobSize: number;
  /** Fixed: block − job (leftover is not reused). Dynamic: 0. */
  internalFragmentation: number;
}

export interface Waiting {
  job: string;
  size: number;
  /** True when enough total free space exists but not in one hole (compaction would help). */
  fitsAfterCompaction: boolean;
}

export interface Summary {
  freeList: { start: number; size: number }[];
  busyList: { start: number; size: number; job: string }[];
  /** Sum of requested sizes of placed jobs (the "used" total of Ch2 s.19–20). */
  used: number;
  /** Sum of the sizes of all blocks ("available"). */
  available: number;
  internalFragmentation: number;
  /** Free space not inside a busy block (dynamic: the holes; fixed: empty partitions). */
  freeTotal: number;
  largestFree: number;
}

export interface Allocation {
  placements: Placement[]; // allocation order (Ch2 s.20 lists rows this way)
  waiting: Waiting[];
  regions: Region[];
  summary: Summary;
}

function checkJob(j: MemJob): void {
  if (!Number.isFinite(j.size) || j.size <= 0) throw new RangeError(`bad size for ${j.id}`);
}

/** Free blocks (fixed partitions or dynamic holes) as a region list, address order. */
export function memoryFrom(blocks: { start?: number; size: number }[]): Region[] {
  let at = 0;
  return blocks.map((b) => {
    if (!(b.size > 0)) throw new RangeError("block size must be positive");
    const start = b.start ?? at;
    at = start + b.size;
    return { start, size: b.size, job: null, jobSize: 0 };
  });
}

/** Choose the free region index for a job, or −1. */
export function pickRegion(regions: Region[], size: number, fit: Fit, opts: AllocOptions = {}): number {
  let best = -1;
  for (let i = 0; i < regions.length; i++) {
    const r = regions[i];
    if (r.job !== null || r.size < size) continue;
    if (fit === "first") return i;
    if (best < 0 || r.size < regions[best].size || (r.size === regions[best].size && opts.bestFitTie === "last")) best = i;
  }
  return best;
}

/** Place one job; returns the new region list and the placement (null = the job waits). Never mutates. */
export function place(regions: Region[], job: MemJob, fit: Fit, scheme: Scheme, opts: AllocOptions = {}): { regions: Region[]; placement: Placement | null } {
  checkJob(job);
  const i = pickRegion(regions, job.size, fit, opts);
  if (i < 0) return { regions, placement: null };
  const r = regions[i];
  const next = regions.map((x) => ({ ...x }));
  if (scheme === "fixed" || r.size === job.size) {
    next[i] = { ...r, job: job.id, jobSize: job.size };
  } else {
    next.splice(i, 1, { start: r.start, size: job.size, job: job.id, jobSize: job.size }, { start: r.start + job.size, size: r.size - job.size, job: null, jobSize: 0 });
  }
  const b = next[i];
  return { regions: next, placement: { job: job.id, blockStart: b.start, blockSize: b.size, jobSize: job.size, internalFragmentation: b.size - job.size } };
}

export function summarise(regions: Region[]): Summary {
  const busy = regions.filter((r) => r.job !== null);
  const free = regions.filter((r) => r.job === null);
  return {
    freeList: free.map((r) => ({ start: r.start, size: r.size })),
    busyList: busy.map((r) => ({ start: r.start, size: r.size, job: r.job as string })),
    used: busy.reduce((a, r) => a + r.jobSize, 0),
    available: regions.reduce((a, r) => a + r.size, 0),
    internalFragmentation: busy.reduce((a, r) => a + (r.size - r.jobSize), 0),
    freeTotal: free.reduce((a, r) => a + r.size, 0),
    largestFree: free.reduce((a, r) => Math.max(a, r.size), 0),
  };
}

/** Place jobs in list order; a job that fits no free block waits and the next is tried (Ch2 s.12). */
export function allocate(blocks: { start?: number; size: number }[] | Region[], jobs: MemJob[], fit: Fit, scheme: Scheme, opts: AllocOptions = {}): Allocation {
  const ids = new Set<string>();
  for (const j of jobs) {
    checkJob(j);
    if (ids.has(j.id)) throw new RangeError(`duplicate job id ${j.id}`);
    ids.add(j.id);
  }
  let regions: Region[] =
    blocks.length && "job" in blocks[0] ? (blocks as Region[]).map((r) => ({ ...r })) : memoryFrom(blocks as { start?: number; size: number }[]);
  const placements: Placement[] = [];
  const waiting: Waiting[] = [];
  for (const j of jobs) {
    const res = place(regions, j, fit, scheme, opts);
    regions = res.regions;
    if (res.placement) placements.push(res.placement);
    else waiting.push({ job: j.id, size: j.size, fitsAfterCompaction: scheme === "dynamic" && summarise(regions).freeTotal >= j.size });
  }
  return { placements, waiting, regions, summary: summarise(regions) };
}

/**
 * Deallocation. Fixed: the partition is marked free. Dynamic: the block also merges with free
 * neighbours that touch it (Ch2 s.23–30), so the free list stays in address order.
 */
export function release(regions: Region[], job: string, scheme: Scheme): Region[] {
  const i = regions.findIndex((r) => r.job === job);
  if (i < 0) throw new RangeError(`job ${job} is not in memory`);
  const next = regions.map((r) => ({ ...r }));
  next[i] = { ...next[i], job: null, jobSize: 0 };
  if (scheme === "fixed") return next;
  const out: Region[] = [];
  for (const r of next) {
    const last = out[out.length - 1];
    if (last && last.job === null && r.job === null && last.start + last.size === r.start) last.size += r.size;
    else out.push(r);
  }
  return out;
}

export interface Relocation {
  job: string;
  oldStart: number;
  newStart: number;
  /** new start − old start, in size units (negative toward the OS). */
  delta: number;
  /** Relocation register in bytes: delta × unitBytes (Ch2 s.34, s.36–37). */
  register: number;
}

/** Compaction (dynamic only): slide every job up to the first region's start; free space becomes one block at the bottom. */
export function compact(regions: Region[], opts: AllocOptions = {}): { regions: Region[]; relocations: Relocation[] } {
  const unit = opts.unitBytes ?? 1024;
  if (!regions.length) return { regions: [], relocations: [] };
  let at = regions[0].start;
  const out: Region[] = [];
  const relocations: Relocation[] = [];
  for (const r of regions) {
    if (r.job === null) continue;
    out.push({ ...r, start: at });
    const delta = at - r.start;
    relocations.push({ job: r.job, oldStart: r.start, newStart: at, delta, register: delta * unit });
    at += r.size;
  }
  const end = regions[regions.length - 1].start + regions[regions.length - 1].size;
  if (end > at) out.push({ start: at, size: end - at, job: null, jobSize: 0 });
  return { regions: out, relocations };
}
