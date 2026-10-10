/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * CPET 181 Chapter 2, the memory-map practices (#582, content pack ch2 §3, §4, §6–§8): fixed and
 * dynamic partitions with first-fit and best-fit, the release cases 1–3, and compaction with the
 * relocation register. Every answer comes from `src/content/os` (allocate, release, compact) through
 * the memory-map kind; nothing is authored. Sizes are in K (1 K = 1024 bytes); registers are asked in K
 * until the calculator lets the student turn K into bytes (#579).
 * The memory column and the job list are drawn by the kind on every practice (question-context rule, #568).
 */
import type { z } from "zod";
import type { TopicSchema, VariantSchema } from "../../schema";

type TopicInput = z.input<typeof TopicSchema>;
type VariantInput = z.input<typeof VariantSchema>;
type HintInput = NonNullable<VariantInput["hints"]>[number];
type Misconception = NonNullable<VariantInput["misconceptions"]>[number];
type Fit = "first" | "best";
type Scheme = "fixed" | "dynamic" | "relocatable";
type JobInput = { id: string; size: number };
type Event = { place: string } | { release: string } | { fragmentation: true } | { compact: true };
type Layout = { size: number; job?: string }[];

const FIT_RULE: Record<Fit, string> = {
  first: "First-fit takes the first free block from the top that is large enough.",
  best: "Best-fit takes the smallest free block that is large enough.",
};

/* ---------- hints, per goal tag (ADR-0007 §3); every slot is a step var of its tag ---------- */

const placeHints = (fit: Fit): HintInput[] => [
  { rung: 2, text: "Not yet. Look at {jobId}: it needs {jobSize} K. Which free blocks are at least that big?" },
  { rung: 3, text: `${FIT_RULE[fit]} Blocks that are too small are out.` },
  { rung: 5, text: "The free blocks, from the top, are {blockList} K." },
  { rung: 9, text: "Compare each free block from the top with {jobSize} K. The one the rule picks starts at {blockStart} K and is {blockSize} K; when none is big enough, {jobId} waits." },
];
const wasteHints: HintInput[] = [
  { rung: 2, text: "Not yet. Each busy partition wastes its size minus its job's size." },
  { rung: 3, text: "A leftover inside a partition is not given to another job: that waste is internal fragmentation." },
  { rung: 9, text: "The wasted amounts are {wasteList} K, {wasteTotal} K in all." },
];
const holesHints: HintInput[] = [
  { rung: 2, text: "Not yet. Add up every free piece, not only the biggest." },
  { rung: 3, text: "Free pieces between busy blocks are external fragmentation: together they are the free space, but no single piece may be big enough." },
  { rung: 9, text: "The free space is {holesTotal} K in all; the largest piece is {largestHole} K." },
];
const releaseHints: HintInput[] = [
  { rung: 2, text: "Not yet. Look at the blocks just above and just below the one that is released: are they free?" },
  { rung: 3, text: "A released block joins every free neighbour. The new block starts at the lowest address of the joined blocks, and its size is the sum." },
  { rung: 4, text: "This is case {neighbourCase}: 1 joins two blocks, 2 joins three, 3 has no free neighbour." },
  { rung: 9, text: "The free block starts at {resultStart} K and is {resultSize} K." },
];
const moveHints: HintInput[] = [
  { rung: 2, text: "Not yet. Compaction slides every job up against the one above it, with no gap left." },
  { rung: 3, text: "The new start is the end of the block above: its start plus its size." },
  { rung: 9, text: "{jobId} moves from {oldStart} K to {newStart} K." },
];
const registerHints: HintInput[] = [
  { rung: 2, text: "Not yet. The relocation register is the new start minus the old start." },
  { rung: 3, text: "A job that moves toward the OS has a negative register." },
  { rung: 9, text: "{jobId}: {newStart} − {oldStart} = {register} {registerUnit}." },
];

const NUDGES = {
  tooSmall: { id: "mm.too-small", title: "A block too small for the job", nudgeKey: "mm.block-too-small", detect: { type: "block-too-small" } },
  firstAsBest: { id: "mm.first-as-best", title: "The tightest block taken under first-fit", nudgeKey: "mm.first-fit-as-best", detect: { type: "first-fit-as-best" } },
  bestAsFirst: { id: "mm.best-as-first", title: "The first block taken under best-fit", nudgeKey: "mm.best-fit-as-first", detect: { type: "best-fit-as-first" } },
  waitsFits: { id: "mm.waits-though-fits", title: "Waits although a block fits", nudgeKey: "mm.waits-though-fits", detect: { type: "waits-though-fits" } },
  wasteSize: { id: "mm.waste-as-size", title: "Job size written as the waste", nudgeKey: "mm.waste-as-size", detect: { type: "waste-as-size" } },
  largestOnly: { id: "mm.largest-hole-only", title: "Only the largest hole counted", nudgeKey: "mm.largest-hole-only", detect: { type: "largest-hole-only" } },
  noMerge: { id: "mm.no-merge", title: "Released block not merged", nudgeKey: "mm.no-merge", detect: { type: "no-merge" } },
  partial: { id: "mm.partial-merge", title: "Merged on one side only", nudgeKey: "mm.partial-merge", detect: { type: "partial-merge" } },
  wrongStart: { id: "mm.merge-wrong-start", title: "The released block's start used", nudgeKey: "mm.merge-wrong-start", detect: { type: "merge-wrong-start" } },
  mergedBusy: { id: "mm.merged-busy", title: "Merged into a busy neighbour", nudgeKey: "mm.merged-busy", detect: { type: "merged-busy" } },
  gap: { id: "mm.gap-left", title: "A gap left below the job", nudgeKey: "mm.gap-left", detect: { type: "gap-left" } },
  sign: { id: "mm.register-sign", title: "Register sign", nudgeKey: "mm.register-sign", detect: { type: "register-sign" } },
  unit: { id: "mm.register-unit", title: "Register unit", nudgeKey: "mm.register-unit", detect: { type: "register-unit" } },
} satisfies Record<string, Misconception>;

interface MapCase {
  id: string;
  prompt: string;
  scheme: Scheme;
  fit: Fit;
  os: number;
  partitions?: number[];
  layout?: Layout;
  jobs: JobInput[];
  events: Event[];
  /** The two or three explanation lines (rule, then how to read this map). */
  rule: string;
  apply: string;
  hints: HintInput[];
  byStep?: Record<string, HintInput[]>;
  misconceptions: Misconception[];
}

function mapVariant(c: MapCase): VariantInput {
  return {
    id: c.id,
    prompt: c.prompt,
    spec: {
      kind: "memory-map",
      scheme: c.scheme,
      fit: c.fit,
      os: c.os,
      ...(c.partitions ? { partitions: c.partitions } : {}),
      ...(c.layout ? { layout: c.layout } : {}),
      jobs: c.jobs,
      events: c.events,
      registerUnit: "KB",
      unit: "KB",
    },
    hints: c.hints,
    ...(c.byStep ? { hintsByStep: c.byStep } : {}),
    misconceptions: c.misconceptions,
    explanation: [
      { id: "s1", say: c.rule, stage: { revealed: 0 } },
      { id: "s2", say: c.apply, stage: { revealed: 0 } },
    ],
  };
}

const J = (...sizes: number[]): JobInput[] => sizes.map((size, i) => ({ id: `J${i + 1}`, size }));
const placeAll = (jobs: JobInput[]): Event[] => jobs.map((j) => ({ place: j.id }));

/* ---------- fixed partitions ---------- */

interface FixedSet {
  id: string;
  partitions: number[];
  jobs: JobInput[];
  /** Slide source or "fresh" in the pack's terms. */
  note: string;
}
/** s.21 and s.22 sets are from the deck; the third is computed so that first-fit does as well as best-fit. */
const FIXED_FIRST: FixedSet[] = [
  { id: "f12", partitions: [100, 25, 25, 50], jobs: J(30, 50, 30, 25), note: "s.12" },
  { id: "f21", partitions: [35, 20, 55, 30], jobs: J(15, 25, 35, 20), note: "s.21" },
  { id: "f-all", partitions: [20, 30, 40, 50], jobs: J(15, 25, 35, 45), note: "fresh: every job fits the first block that is large enough" },
];
const FIXED_BEST: FixedSet[] = [
  { id: "b21", partitions: [35, 20, 55, 30], jobs: J(15, 25, 35, 20), note: "s.21" },
  { id: "b22", partitions: [30, 40, 15, 20], jobs: J(12, 24, 15, 32), note: "s.22" },
  { id: "b-new", partitions: [60, 25, 40, 30], jobs: J(20, 35, 28, 55), note: "fresh: first-fit would leave the 55 K job waiting" },
];

const fixedVariant = (s: FixedSet, fit: Fit): VariantInput =>
  mapVariant({
    id: s.id,
    prompt: `Fixed partitions, ${fit}-fit: the partitions are set at start-up and each holds one job. Place each job in the order given, then find the memory wasted inside the partitions.`,
    scheme: "fixed",
    fit,
    os: 10,
    partitions: s.partitions,
    jobs: s.jobs,
    events: [...placeAll(s.jobs), { fragmentation: true }],
    rule: `${FIT_RULE[fit]} In fixed partitions a job takes a whole partition, and a leftover is not reused: it is internal fragmentation.`,
    apply: "A job that fits no free partition waits, and the next job is tried.",
    hints: placeHints(fit),
    byStep: { place: placeHints(fit), waste: wasteHints },
    misconceptions: [NUDGES.tooSmall, fit === "first" ? NUDGES.firstAsBest : NUDGES.bestAsFirst, NUDGES.waitsFits, NUDGES.wasteSize],
  });

/* ---------- dynamic partitions ---------- */

interface DynamicSet {
  id: string;
  os: number;
  layout: Layout;
  jobs: JobInput[];
  arrive: string[];
}
const DYNAMIC_FIRST: DynamicSet[] = [
  // s.15 (c): J1 and J4 have ended; J5 and J6 arrive
  { id: "d15c", os: 10, layout: [{ size: 10 }, { size: 15, job: "J2" }, { size: 20, job: "J3" }, { size: 50 }], jobs: [{ id: "J2", size: 15 }, { id: "J3", size: 20 }, { id: "J5", size: 5 }, { id: "J6", size: 30 }], arrive: ["J5", "J6"] },
  // s.15 (e): J3 has ended; J7 fits a hole, J8 waits
  { id: "d15e", os: 10, layout: [{ size: 5, job: "J5" }, { size: 5 }, { size: 15, job: "J2" }, { size: 20 }, { size: 30, job: "J6" }, { size: 20 }], jobs: [{ id: "J5", size: 5 }, { id: "J2", size: 15 }, { id: "J6", size: 30 }, { id: "J7", size: 10 }, { id: "J8", size: 30 }], arrive: ["J7", "J8"] },
  // fresh: the first hole is too small for the first job
  { id: "d-new", os: 8, layout: [{ size: 6 }, { size: 20, job: "J1" }, { size: 14 }, { size: 12, job: "J2" }, { size: 40 }], jobs: [{ id: "J1", size: 20 }, { id: "J2", size: 12 }, { id: "J3", size: 10 }, { id: "J4", size: 25 }], arrive: ["J3", "J4"] },
];
const DYNAMIC_BEST: DynamicSet[] = [
  { id: "db1", os: 10, layout: [{ size: 40 }, { size: 10, job: "J1" }, { size: 15 }, { size: 20, job: "J2" }, { size: 25 }], jobs: [{ id: "J1", size: 10 }, { id: "J2", size: 20 }, { id: "J3", size: 12 }, { id: "J4", size: 22 }], arrive: ["J3", "J4"] },
  { id: "db2", os: 12, layout: [{ size: 30 }, { size: 16, job: "J1" }, { size: 18 }, { size: 24, job: "J2" }, { size: 14 }], jobs: [{ id: "J1", size: 16 }, { id: "J2", size: 24 }, { id: "J3", size: 14 }, { id: "J4", size: 17 }], arrive: ["J3", "J4"] },
  { id: "db3", os: 8, layout: [{ size: 22 }, { size: 12, job: "J1" }, { size: 9 }, { size: 18, job: "J2" }, { size: 35 }], jobs: [{ id: "J1", size: 12 }, { id: "J2", size: 18 }, { id: "J3", size: 20 }, { id: "J4", size: 30 }], arrive: ["J3", "J4"] },
];

const dynamicVariant = (s: DynamicSet, fit: Fit): VariantInput =>
  mapVariant({
    id: s.id,
    prompt: `Dynamic partitions, ${fit}-fit: each job gets exactly the size it asks for. Place the arriving jobs in order, then find the total free space left in separate pieces.`,
    scheme: "dynamic",
    fit,
    os: s.os,
    layout: s.layout,
    jobs: s.jobs,
    events: [...s.arrive.map((id) => ({ place: id })), { fragmentation: true }],
    rule: `${FIT_RULE[fit]} The job takes exactly its size, and the rest of the block stays free as a smaller hole.`,
    apply: "A job that fits no single hole waits, even when the holes together would be big enough.",
    hints: placeHints(fit),
    byStep: { place: placeHints(fit), holes: holesHints },
    misconceptions: [NUDGES.tooSmall, fit === "first" ? NUDGES.firstAsBest : NUDGES.bestAsFirst, NUDGES.waitsFits, NUDGES.largestOnly],
  });

/* ---------- release (deallocation), cases 1–3 (s.23–30) ---------- */

interface ReleaseSet {
  id: string;
  layout: Layout;
  jobs: JobInput[];
  release: string;
}
const RELEASE_1: ReleaseSet[] = [
  { id: "r1-after", layout: [{ size: 20, job: "J1" }, { size: 10, job: "J2" }, { size: 5 }, { size: 30, job: "J3" }], jobs: J(20, 10, 30), release: "J2" },
  { id: "r1-before", layout: [{ size: 15 }, { size: 25, job: "J1" }, { size: 20, job: "J2" }], jobs: [{ id: "J1", size: 25 }, { id: "J2", size: 20 }], release: "J1" },
  { id: "r1-mid", layout: [{ size: 30, job: "J1" }, { size: 12, job: "J2" }, { size: 8 }, { size: 16, job: "J3" }], jobs: [{ id: "J1", size: 30 }, { id: "J2", size: 12 }, { id: "J3", size: 16 }], release: "J2" },
];
const RELEASE_2: ReleaseSet[] = [
  { id: "r2-a", layout: [{ size: 20, job: "J1" }, { size: 10 }, { size: 15, job: "J2" }, { size: 25 }, { size: 30, job: "J3" }], jobs: [{ id: "J1", size: 20 }, { id: "J2", size: 15 }, { id: "J3", size: 30 }], release: "J2" },
  { id: "r2-b", layout: [{ size: 12 }, { size: 8, job: "J1" }, { size: 18 }, { size: 22, job: "J2" }], jobs: [{ id: "J1", size: 8 }, { id: "J2", size: 22 }], release: "J1" },
  { id: "r2-c", layout: [{ size: 16, job: "J1" }, { size: 6 }, { size: 14, job: "J2" }, { size: 9 }, { size: 20, job: "J3" }], jobs: [{ id: "J1", size: 16 }, { id: "J2", size: 14 }, { id: "J3", size: 20 }], release: "J2" },
];
const RELEASE_3: ReleaseSet[] = [
  { id: "r3-a", layout: [{ size: 20, job: "J1" }, { size: 15, job: "J2" }, { size: 30, job: "J3" }], jobs: [{ id: "J1", size: 20 }, { id: "J2", size: 15 }, { id: "J3", size: 30 }], release: "J2" },
  { id: "r3-b", layout: [{ size: 12, job: "J1" }, { size: 18, job: "J2" }, { size: 9, job: "J3" }, { size: 14, job: "J4" }], jobs: [{ id: "J1", size: 12 }, { id: "J2", size: 18 }, { id: "J3", size: 9 }, { id: "J4", size: 14 }], release: "J2" },
  { id: "r3-c", layout: [{ size: 25, job: "J1" }, { size: 10, job: "J2" }, { size: 20, job: "J3" }], jobs: [{ id: "J1", size: 25 }, { id: "J2", size: 10 }, { id: "J3", size: 20 }], release: "J2" },
];

const releaseVariant = (s: ReleaseSet, kase: 1 | 2 | 3): VariantInput =>
  mapVariant({
    id: s.id,
    prompt: `Dynamic partitions: ${s.release} finishes and its block is released. Write the free block that results: its starting address and its size.`,
    scheme: "dynamic",
    fit: "first",
    os: 10,
    layout: s.layout,
    jobs: s.jobs,
    events: [{ release: s.release }],
    rule:
      kase === 1
        ? "A released block next to one free block joins it: two blocks become one, starting at the lower address."
        : kase === 2
          ? "A released block between two free blocks joins both: three blocks become one, starting at the lowest address."
          : "A released block with busy blocks on both sides has no one to join: it becomes a free block of its own.",
    apply: "The new free block starts at the lowest address of the blocks that join, and its size is their total.",
    hints: releaseHints,
    byStep: { release: releaseHints },
    misconceptions: kase === 3 ? [NUDGES.mergedBusy] : [NUDGES.noMerge, ...(kase === 2 ? [NUDGES.partial] : []), NUDGES.wrongStart, NUDGES.mergedBusy],
  });

/* ---------- relocatable dynamic partitions: compaction and the relocation register (s.31–37) ---------- */

interface CompactSet {
  id: string;
  os: number;
  layout: Layout;
  jobs: JobInput[];
}
const COMPACT: CompactSet[] = [
  // s.36: OS 8; J1 8/22; hole 15; J3 45/25; hole 15; J2 85/15; top 100
  { id: "c36", os: 8, layout: [{ size: 22, job: "J1" }, { size: 15 }, { size: 25, job: "J3" }, { size: 15 }, { size: 15, job: "J2" }], jobs: [{ id: "J1", size: 22 }, { id: "J3", size: 25 }, { id: "J2", size: 15 }] },
  // s.37: OS 10; J1 10/30; hole 12; J2 52/28; hole 35; J3 115/15; top 130
  { id: "c37", os: 10, layout: [{ size: 30, job: "J1" }, { size: 12 }, { size: 28, job: "J2" }, { size: 35 }, { size: 15, job: "J3" }], jobs: [{ id: "J1", size: 30 }, { id: "J2", size: 28 }, { id: "J3", size: 15 }] },
  // fresh
  { id: "c-new", os: 12, layout: [{ size: 20, job: "J1" }, { size: 8 }, { size: 16, job: "J2" }, { size: 14 }, { size: 24, job: "J3" }], jobs: [{ id: "J1", size: 20 }, { id: "J2", size: 16 }, { id: "J3", size: 24 }] },
];

const compactVariant = (s: CompactSet): VariantInput =>
  mapVariant({
    id: s.id,
    prompt: "Relocatable dynamic partitions: compaction slides every job up against the OS, so all the free space becomes one block at the bottom. Give each job's new starting address, then its relocation register (new start − old start, in K).",
    scheme: "relocatable",
    fit: "first",
    os: s.os,
    layout: s.layout,
    jobs: s.jobs,
    events: [{ compact: true }],
    rule: "Compaction moves every job toward the OS until no gap is left. The relocation register is the amount added to each of the job's addresses: new start − old start, negative when the job moves toward the OS.",
    apply: "A job that is already against the block above does not move, and its register is 0.",
    hints: moveHints,
    byStep: { move: moveHints, register: registerHints },
    misconceptions: [NUDGES.gap, NUDGES.sign, NUDGES.unit],
  });

/* ---------- topics ---------- */

const q = (id: string, label: string, conceptId: string, objectiveId: string, variants: VariantInput[]) => ({ id, label, conceptId, objectiveId, variants });

export const fixedPartitionsTopic: TopicInput = {
  id: "fixed-partitions",
  title: "Fixed partitions",
  summary: "Partitions set at start-up hold one job each: place the jobs with first-fit and best-fit, and find the waste inside the partitions.",
  concepts: [{ id: "fx.place", title: "Placing jobs in fixed partitions", summary: "First-fit takes the first partition that is large enough, best-fit the smallest; a leftover inside a partition is internal fragmentation." }],
  objectives: [
    { id: "fx.obj.first", conceptId: "fx.place", text: "Place jobs into fixed partitions by first-fit, and find the internal fragmentation." },
    { id: "fx.obj.best", conceptId: "fx.place", text: "Place jobs into fixed partitions by best-fit, and find the internal fragmentation." },
  ],
  activities: [
    {
      id: "fixed-partitions",
      title: "Fixed partitions",
      summary: "Place each job, then find the waste inside the partitions.",
      authority: "DEMO",
      minutes: 16,
      questions: [
        q("fx.q.first", "First-fit", "fx.place", "fx.obj.first", FIXED_FIRST.map((s) => fixedVariant(s, "first"))),
        q("fx.q.best", "Best-fit", "fx.place", "fx.obj.best", FIXED_BEST.map((s) => fixedVariant(s, "best"))),
      ],
    },
  ],
};

export const dynamicPartitionsTopic: TopicInput = {
  id: "dynamic-partitions",
  title: "Dynamic partitions",
  summary: "Each job gets exactly the size it asks for: place jobs into the holes, find the free space left in pieces, and join a released block with its free neighbours.",
  concepts: [
    { id: "dy.place", title: "Placing jobs in dynamic partitions", summary: "A job takes exactly its size from a hole; free pieces between busy blocks are external fragmentation." },
    { id: "dy.release", title: "Releasing a block", summary: "A released block joins its free neighbours: case 1 joins two blocks, case 2 three, case 3 none." },
  ],
  objectives: [
    { id: "dy.obj.first", conceptId: "dy.place", text: "Place jobs into holes by first-fit and find the free space left in pieces." },
    { id: "dy.obj.best", conceptId: "dy.place", text: "Place jobs into holes by best-fit and find the free space left in pieces." },
    { id: "dy.obj.release", conceptId: "dy.release", text: "Give the free block that results when a job's block is released, in cases 1, 2 and 3." },
  ],
  activities: [
    {
      id: "dynamic-placement",
      title: "Dynamic partitions: placing jobs",
      summary: "Place each arriving job into a hole, then find the free space left in pieces.",
      authority: "DEMO",
      minutes: 14,
      questions: [
        q("dy.q.first", "First-fit", "dy.place", "dy.obj.first", DYNAMIC_FIRST.map((s) => dynamicVariant(s, "first"))),
        q("dy.q.best", "Best-fit", "dy.place", "dy.obj.best", DYNAMIC_BEST.map((s) => dynamicVariant(s, "best"))),
      ],
    },
    {
      id: "release",
      title: "Releasing a block",
      summary: "A job ends: join its block with the free neighbours, in cases 1, 2 and 3.",
      authority: "DEMO",
      minutes: 12,
      questions: [
        q("dy.q.case1", "Case 1: join two", "dy.release", "dy.obj.release", RELEASE_1.map((s) => releaseVariant(s, 1))),
        q("dy.q.case2", "Case 2: join three", "dy.release", "dy.obj.release", RELEASE_2.map((s) => releaseVariant(s, 2))),
        q("dy.q.case3", "Case 3: no neighbour", "dy.release", "dy.obj.release", RELEASE_3.map((s) => releaseVariant(s, 3))),
      ],
    },
  ],
};

export const relocatablePartitionsTopic: TopicInput = {
  id: "relocatable-partitions",
  title: "Compaction and the relocation register",
  summary: "Slide every job up against the OS so the free space becomes one block, and work out each job's relocation register.",
  concepts: [{ id: "rl.compact", title: "Compaction", summary: "Every job moves up; the relocation register is new start − old start, negative toward the OS." }],
  objectives: [
    { id: "rl.obj.compact", conceptId: "rl.compact", text: "Give each job's new address after compaction." },
    { id: "rl.obj.register", conceptId: "rl.compact", text: "Give each moved job's relocation register." },
  ],
  activities: [
    {
      id: "compaction",
      title: "Compaction",
      summary: "Move each job up, then give its relocation register.",
      authority: "DEMO",
      minutes: 12,
      questions: [q("rl.q.compact", "Compact memory", "rl.compact", "rl.obj.compact", COMPACT.map(compactVariant))],
    },
  ],
};
