/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * CPET 181 Chapter 3, paged and segmented address translation (#611; content pack ch3 §3, §5, §6,
 * §8). Numeric steps over the memory-table figure (#606): pages needed, page number and
 * displacement (quotient and remainder, no calculator), a frame's start address and the physical
 * address (calculator, from the givens), a whole translation at page size 100 (the s.7 mapping),
 * and segment base + displacement (the s.17 table). Every answer is computed from the data below.
 */
import type { z } from "zod";
import type { TopicSchema } from "../../schema";
import { count, type Count } from "../chapter8/counting";

type TopicInput = z.input<typeof TopicSchema>;

/* ---------- pages needed and the waste in the last page (s.7, s.10) ---------- */

interface Job {
  lines: number;
  page: number;
}
/** The first set is the slide's: 350 lines, 100 per page, 4 pages, 50 lines unused in page 3. */
export const JOBS: Job[] = [
  { lines: 350, page: 100 },
  { lines: 1000, page: 512 },
  { lines: 700, page: 256 },
  { lines: 460, page: 100 },
];
export const pagesNeeded = (j: Job) => Math.ceil(j.lines / j.page);
export const wasted = (j: Job) => pagesNeeded(j) * j.page - j.lines;

const PAGES = "The program is divided into pages of the same size as a frame. A page that is only partly filled still takes a whole page, so the number of pages is the job size divided by the page size, rounded up.";
const pagesQuestion = count(
  "pg.q.pages",
  "Pages needed",
  "pg.paging",
  "pg.obj.pages",
  JOBS.map((j): Count => ({
    prompt: `A job is ${j.lines} lines long and the page size is ${j.page} lines. How many pages does the job need?`,
    answer: pagesNeeded(j),
    rule: PAGES,
    apply: `${j.lines} ÷ ${j.page} is between ${pagesNeeded(j) - 1} and ${pagesNeeded(j)}, and a part page still takes a whole page, so ${pagesNeeded(j)} pages.`,
    hint: "Divide the job size by the page size, then round up.",
    wrong: [{ id: "pg.round-down", nudgeKey: "vm.pages-round-up", value: Math.floor(j.lines / j.page) }],
  })),
);

const WASTE = "Only the last page can be partly filled. The lines left unused in it are wasted space, and that waste is internal fragmentation.";
const wasteQuestion = count(
  "pg.q.waste",
  "Wasted lines",
  "pg.paging",
  "pg.obj.waste",
  JOBS.map((j): Count => ({
    prompt: `A job is ${j.lines} lines long and the page size is ${j.page} lines, so it takes ${pagesNeeded(j)} pages. How many lines of its last page are unused?`,
    answer: wasted(j),
    rule: WASTE,
    apply: `${pagesNeeded(j)} pages hold ${pagesNeeded(j) * j.page} lines and the job has ${j.lines}, so ${wasted(j)} lines are unused.`,
    hint: "How many lines do all the pages hold together, and how many does the job use?",
  })),
);

/* ---------- page number and displacement (s.11) ---------- */

interface Address {
  address: number;
  size: number;
}
/** The first is the slide's: 12345 with page size 1024 → page 12, displacement 57. */
export const ADDRESSES: Address[] = [
  { address: 12345, size: 1024 },
  { address: 1700, size: 512 },
  { address: 4321, size: 256 },
  { address: 3500, size: 1024 },
];
export const pageOf = (a: Address) => Math.floor(a.address / a.size);
export const displacementOf = (a: Address) => a.address - pageOf(a) * a.size;

const SPLIT = "The page number is the address divided by the page size (the quotient), and the displacement is what is left over (the remainder). Pages and displacements are numbered from 0.";
const pageNumber = count(
  "pg.q.page-number",
  "Page number",
  "pg.address",
  "pg.obj.page-number",
  ADDRESSES.map((a): Count => ({
    prompt: `The page size is ${a.size} bytes. In which page is the byte at address ${a.address}? (Pages are numbered from 0.)`,
    answer: pageOf(a),
    rule: SPLIT,
    apply: `${a.address} ÷ ${a.size} has quotient ${pageOf(a)} and remainder ${displacementOf(a)}, so the page number is ${pageOf(a)}.`,
    hint: "The page number is the whole number of times the page size fits into the address.",
    wrong: [{ id: "pg.swap", nudgeKey: "vm.quotient-remainder-swap", value: displacementOf(a) }],
  })),
);
const displacement = count(
  "pg.q.displacement",
  "Displacement",
  "pg.address",
  "pg.obj.displacement",
  ADDRESSES.map((a): Count => ({
    prompt: `The page size is ${a.size} bytes. The byte at address ${a.address} is in page ${pageOf(a)}. How many bytes from the start of that page is it (its displacement)?`,
    answer: displacementOf(a),
    rule: SPLIT,
    apply: `Page ${pageOf(a)} starts at ${pageOf(a)} × ${a.size} = ${pageOf(a) * a.size}, and ${a.address} − ${pageOf(a) * a.size} = ${displacementOf(a)}.`,
    hint: "Subtract the address where the page starts from the address.",
    wrong: [{ id: "pg.swap", nudgeKey: "vm.quotient-remainder-swap", value: pageOf(a) }],
  })),
);

/* ---------- from a page to physical memory (s.12–13) ---------- */

interface Locate {
  size: number;
  /** Page → frame, in page order. */
  frames: number[];
  address: number;
}
/** The first two are the slide's: page size 512, PMT 0 → 5 and 1 → 3, bytes 518 and 25. */
export const LOCATE: Locate[] = [
  { size: 512, frames: [5, 3], address: 518 },
  { size: 512, frames: [5, 3], address: 25 },
  { size: 512, frames: [5, 3, 7], address: 1100 },
  { size: 1024, frames: [4, 9, 2, 6], address: 3500 },
  { size: 256, frames: [8, 2, 5], address: 600 },
];
export const split = (l: Locate) => ({ page: Math.floor(l.address / l.size), disp: l.address % l.size });
export const frameOf = (l: Locate) => l.frames[split(l).page];
export const frameStart = (l: Locate) => frameOf(l) * l.size;
export const physical = (l: Locate) => frameStart(l) + split(l).disp;
const table = (l: Locate) => l.frames.map((frame, id) => ({ id, at: frame }));

const START = "A frame starts at its frame number times the frame size, because frames are numbered from 0 and are all the same size.";
const frameStartQuestion = count(
  "pg.q.frame-start",
  "Where a frame starts",
  "pg.locate",
  "pg.obj.frame-start",
  LOCATE.map((l): Count => ({
    prompt: `The frame size is ${l.size} bytes and frames are numbered from 0. At what address does frame ${frameOf(l)} start?`,
    answer: frameStart(l),
    rule: START,
    apply: `Frame ${frameOf(l)} starts at ${frameOf(l)} × ${l.size} = ${frameStart(l)}.`,
    hint: "Frame 0 starts at address 0. How many whole frames come before this one?",
    vars: { frame: frameOf(l), size: l.size },
    calculator: "{frame} × {size}",
  })),
);

const PHYSICAL = "The physical address is the start of the frame plus the displacement: the byte sits the same distance into the frame as it did into the page.";
const physicalQuestion = count(
  "pg.q.physical",
  "Physical address",
  "pg.locate",
  "pg.obj.physical",
  LOCATE.map((l): Count => {
    const { disp } = split(l);
    return {
      prompt: `A page is loaded into a frame that starts at address ${frameStart(l)}. A byte is ${disp} bytes into the page. What is its physical address?`,
      answer: physical(l),
      rule: PHYSICAL,
      apply: `${frameStart(l)} + ${disp} = ${physical(l)}.`,
      hint: "The byte is the same distance into the frame as into the page.",
      vars: { start: frameStart(l), disp },
      calculator: "{start} + {disp}",
      wrong: [{ id: "pg.frame-not-scaled", nudgeKey: "vm.frame-not-scaled", value: frameOf(l) + disp }],
    };
  }),
);

/* ---------- the whole translation, page size 100 (s.7 mapping) ---------- */

/** Page size 100, PMT 0 → 8, 1 → 10, 2 → 5, 3 → 11 (the s.7 mapping of Job 1, 350 lines). */
const SLIDE_PMT = [8, 10, 5, 11];
export const WHOLE: Locate[] = [
  { size: 100, frames: SLIDE_PMT, address: 250 },
  { size: 100, frames: SLIDE_PMT, address: 120 },
  { size: 100, frames: SLIDE_PMT, address: 349 },
  { size: 100, frames: SLIDE_PMT, address: 75 },
];
const wholeQuestion = count(
  "pg.q.whole",
  "Find the byte",
  "pg.locate",
  "pg.obj.whole",
  WHOLE.map((l): Count => {
    const { page, disp } = split(l);
    return {
      prompt: `The page size and the frame size are ${l.size} bytes; the page map table is in the figure. What is the physical address of the byte at address ${l.address} of the job?`,
      answer: physical(l),
      rule: "Find the page number and displacement, look up the frame in the page map table, take the frame number times the frame size, and add the displacement.",
      apply: `${l.address} is page ${page}, displacement ${disp}. Page ${page} is in frame ${frameOf(l)}, which starts at ${frameStart(l)}. ${frameStart(l)} + ${disp} = ${physical(l)}.`,
      hint: "First the page number and displacement, then the frame from the table, then the frame's start.",
      figure: { type: "memory-table" as const, table: "page" as const, size: l.size, rows: table(l), address: l.address, unit: "bytes"},
      wrong: [{ id: "pg.frame-not-scaled", nudgeKey: "vm.frame-not-scaled", value: frameOf(l) + disp }],
    };
  }),
);

/* ---------- segments (s.15–17) ---------- */

/** The s.17 segment map table of Job 1. */
export const SEGMENTS = [
  { id: 0, name: "main program", size: 350, at: 4000 },
  { id: 1, name: "subroutine A", size: 200, at: 7000 },
  { id: 2, name: "subroutine B", size: 100, at: 6000 },
];
/** The slide's five references: (segment, displacement). */
export const REFERENCES: { part: number; offset: number }[] = [
  { part: 0, offset: 50 },
  { part: 1, offset: 100 },
  { part: 2, offset: 99 },
  { part: 0, offset: 349 },
];
export const segmentPhysical = (r: { part: number; offset: number }) => SEGMENTS[r.part].at + r.offset;

const SEGMENT = "A segment address is a segment number and a displacement. The segment map table gives where the segment starts in memory, and the physical address is that start plus the displacement.";
const segmentQuestion = count(
  "sg.q.physical",
  "Segment address",
  "sg.segments",
  "sg.obj.physical",
  REFERENCES.map((r): Count => ({
    prompt: `The segment map table of a job is in the figure. What is the physical address of segment ${r.part}, displacement ${r.offset}?`,
    answer: segmentPhysical(r),
    rule: SEGMENT,
    apply: `Segment ${r.part} (${SEGMENTS[r.part].name}) starts at ${SEGMENTS[r.part].at}, and ${SEGMENTS[r.part].at} + ${r.offset} = ${segmentPhysical(r)}.`,
    hint: "Look up the segment's starting address in the table, then add the displacement.",
    figure: { type: "memory-table" as const, table: "segment" as const, rows: SEGMENTS, address: r, unit: "bytes"},
  })),
);

export const pagedTranslationTopic: TopicInput = {
  id: "paged-translation",
  title: "Paging: from a program address to memory",
  summary: "How many pages a job needs, which page and displacement an address is, and where that byte sits in physical memory.",
  concepts: [
    { id: "pg.paging", title: "Pages and wasted space", summary: "A job is cut into equal pages; the last page may be partly empty." },
    { id: "pg.address", title: "Page number and displacement", summary: "The quotient and remainder of the address by the page size." },
    { id: "pg.locate", title: "Locating a byte in memory", summary: "Page map table → frame → frame start (frame × size) → add the displacement." },
  ],
  objectives: [
    { id: "pg.obj.pages", conceptId: "pg.paging", text: "Count the pages a job needs." },
    { id: "pg.obj.waste", conceptId: "pg.paging", text: "Count the unused lines in the last page." },
    { id: "pg.obj.page-number", conceptId: "pg.address", text: "Find the page number of an address." },
    { id: "pg.obj.displacement", conceptId: "pg.address", text: "Find the displacement of an address." },
    { id: "pg.obj.frame-start", conceptId: "pg.locate", text: "Find the address where a frame starts." },
    { id: "pg.obj.physical", conceptId: "pg.locate", text: "Find the physical address from a frame start and a displacement." },
    { id: "pg.obj.whole", conceptId: "pg.locate", text: "Translate a program address to a physical address with a page map table." },
  ],
  activities: [
    { id: "pages", title: "Pages needed", summary: "Count the pages and the waste.", authority: "DEMO", minutes: 8, questions: [pagesQuestion, wasteQuestion] },
    { id: "page-and-displacement", title: "Page number and displacement", summary: "Split an address.", authority: "DEMO", minutes: 8, questions: [pageNumber, displacement] },
    { id: "frame-and-address", title: "Frame and physical address", summary: "From a frame to a physical address.", authority: "DEMO", minutes: 8, questions: [frameStartQuestion, physicalQuestion] },
    { id: "translate", title: "Translate an address", summary: "The whole path with a page map table.", authority: "DEMO", minutes: 8, questions: [wholeQuestion] },
  ],
};

export const segmentationNumbersTopic: TopicInput = {
  id: "segment-translation",
  title: "Segmentation: from a segment address to memory",
  summary: "Find the physical address of a reference from a segment number, a displacement and the segment map table.",
  concepts: [{ id: "sg.segments", title: "Segment number and displacement", summary: "The segment map table gives the start; the physical address is start + displacement." }],
  objectives: [{ id: "sg.obj.physical", conceptId: "sg.segments", text: "Find the physical address of a segment reference." }],
  activities: [{ id: "segment-address", title: "Segment address", summary: "Look up the segment and add the displacement.", authority: "DEMO", minutes: 6, questions: [segmentQuestion] }],
};
