import { z } from "zod";

const jobId = z.string().min(1).max(8);

/** One thing that happens to memory, in order. Each becomes one or more goals (ADR-0007). */
export const MemoryEvent = z.union([
  /** The next job asks for memory: which free block takes it (or it waits). */
  z.object({ place: jobId }),
  /** A job finishes: the free block that results (dynamic: merged with free neighbours, Ch2 s.23–30). */
  z.object({ release: jobId }),
  /** Fixed: the internal waste of every busy partition. Dynamic: the total free space in fragments. */
  z.object({ fragmentation: z.literal(true) }),
  /** Relocatable: every job slides up; its new start, then its relocation register (Ch2 s.31–37). */
  z.object({ compact: z.literal(true) }),
]);

/**
 * Contiguous memory allocation (CPET181 Ch2, spec docs/design/cpet181/kinds-spec.md §2). The
 * memory column is the slide's picture: the OS at address 0, then the blocks in address order.
 * Truth comes from `src/content/os/allocate.ts`; this spec only says what happens, in order.
 * Sizes and addresses are in `unit` (KB); registers in `registerUnit` (bytes, 1 KB = 1024 B).
 */
export const MemoryMapSpec = z
  .object({
    kind: z.literal("memory-map"),
    scheme: z.enum(["fixed", "dynamic", "relocatable"]),
    fit: z.enum(["first", "best"]),
    /** OS block at the bottom address (0). */
    os: z.number().int().min(0),
    /** Fixed: partition sizes in address order. Dynamic: the free block(s) above the OS, usually one. */
    partitions: z.array(z.number().int().positive()).min(1).max(8).optional(),
    /**
     * Memory as the question begins, when some jobs are already in it (a release or compaction
     * example, Ch2 s.25–37): blocks in address order, each free or holding one of `jobs`. Replaces
     * `partitions`; a job listed here counts as placed.
     */
    layout: z.array(z.object({ size: z.number().int().positive(), job: jobId.optional() })).min(1).max(8).optional(),
    /** Arrival order. */
    jobs: z.array(z.object({ id: jobId, size: z.number().int().positive() })).min(1).max(8),
    events: z.array(MemoryEvent).min(1).max(24),
    registerUnit: z.enum(["KB", "bytes"]).default("bytes"),
    unit: z.string().min(1).default("KB"),
  })
  .superRefine((s, ctx) => {
    const ids = s.jobs.map((j) => j.id);
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", message: "job ids must be distinct" });
    if ((s.partitions === undefined) === (s.layout === undefined)) ctx.addIssue({ code: "custom", message: "give either partitions or layout" });
    const placed = new Set<string>();
    for (const b of s.layout ?? []) {
      if (b.job === undefined) continue;
      const job = s.jobs.find((j) => j.id === b.job);
      if (!job) ctx.addIssue({ code: "custom", path: ["layout"], message: `unknown job ${b.job}` });
      else if (placed.has(b.job)) ctx.addIssue({ code: "custom", path: ["layout"], message: `${b.job} appears twice` });
      else if (s.scheme !== "fixed" && job.size !== b.size) ctx.addIssue({ code: "custom", path: ["layout"], message: `${b.job} is ${job.size}, its block ${b.size}` });
      else if (job.size > b.size) ctx.addIssue({ code: "custom", path: ["layout"], message: `${b.job} does not fit its block` });
      placed.add(b.job);
    }
    s.events.forEach((e, i) => {
      const at = ["events", i];
      if ("place" in e) {
        if (!ids.includes(e.place)) ctx.addIssue({ code: "custom", path: at, message: `unknown job ${e.place}` });
        else if (placed.has(e.place)) ctx.addIssue({ code: "custom", path: at, message: `${e.place} is placed twice` });
        placed.add(e.place);
      } else if ("release" in e) {
        if (!placed.has(e.release)) ctx.addIssue({ code: "custom", path: at, message: `${e.release} is released before it is placed` });
      } else if ("compact" in e && s.scheme !== "relocatable") ctx.addIssue({ code: "custom", path: at, message: "compaction needs the relocatable scheme" });
    });
  });

export type MemoryMapSpec = z.infer<typeof MemoryMapSpec>;
export type MemoryEvent = z.infer<typeof MemoryEvent>;

export const memoryMapDetectors = [
  /** Placing: picked a free block smaller than the job. */
  z.object({ type: z.literal("block-too-small") }),
  /** First-fit: took the tightest block that fits instead of the first one. */
  z.object({ type: z.literal("first-fit-as-best") }),
  /** Best-fit: took the first block that fits instead of the smallest. */
  z.object({ type: z.literal("best-fit-as-first") }),
  /** Said the job waits although a free block fits it. */
  z.object({ type: z.literal("waits-though-fits") }),
  /** Fixed fragmentation: wrote the job's size (or the partition's) instead of the difference. */
  z.object({ type: z.literal("waste-as-size") }),
  /** Dynamic fragmentation: counted only the largest hole. */
  z.object({ type: z.literal("largest-hole-only") }),
  /** Release: gave the released block as it is, though a free neighbour touches it. */
  z.object({ type: z.literal("no-merge") }),
  /** Release: merged on one side only (case 2: a free neighbour on each side). */
  z.object({ type: z.literal("partial-merge") }),
  /** Release: used the released block's start, not the lowest address of the merged block. */
  z.object({ type: z.literal("merge-wrong-start") }),
  /** Release: merged into a busy neighbour. */
  z.object({ type: z.literal("merged-busy") }),
  /** Compaction: left the job where it was (a gap kept below it). */
  z.object({ type: z.literal("gap-left") }),
  /** Register: the right amount with the wrong sign (a move toward the OS is negative). */
  z.object({ type: z.literal("register-sign") }),
  /** Register: the move in KB where bytes were asked (or the other way round). */
  z.object({ type: z.literal("register-unit") }),
] as const;
