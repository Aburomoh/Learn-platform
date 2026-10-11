/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * CPET 181 Chapter 2, memory terms and schemes (#582, content pack ch2 §1, §2, §5, §6): contiguous
 * vs non-contiguous allocation, the single-user scheme, internal vs external fragmentation, and the
 * first-fit and best-fit rules. Concept questions only; every fact is from docs/content-packs/cpet181/ch2.md.
 */
import type { z } from "zod";
import type { TopicSchema } from "../../schema";
import { mcq, type Row } from "../chapter1/mcq";

type TopicInput = z.input<typeof TopicSchema>;

const CONTIGUOUS = "Contiguous allocation gives a job one run of consecutive memory: faster, with easier OS control and minimal overhead. Non-contiguous allocation uses separate pieces: slower, harder to control, more overhead.";

const contiguous = (prompt: string, correct: string, wrong: string[], apply: string): Row => ({
  prompt,
  correct,
  wrong,
  rule: CONTIGUOUS,
  apply,
  hint: "Think of an array (one run of consecutive cells) against a linked list (separate pieces joined together).",
});

const contiguousQuestion = mcq("mt.q.contiguous", "Contiguous or not", "mt.schemes", "mt.obj.contiguous", [
  contiguous("Which allocation gives a job one run of consecutive memory?", "Contiguous", ["Non-contiguous"], "Contiguous: the job is one run of consecutive memory."),
  contiguous("Which allocation uses separate pieces of memory for one job, like a linked list?", "Non-contiguous", ["Contiguous"], "Non-contiguous: the job is in separate pieces, like a linked list."),
  contiguous("Which allocation is faster and easier for the OS to control, like an array?", "Contiguous", ["Non-contiguous"], "Contiguous allocation is faster, with easier control and minimal overhead."),
  contiguous("Which of these is a contiguous method?", "Fixed partitioning", ["Paging", "Segmentation", "Inverted paging"], "Fixed (and dynamic) partitioning are the contiguous methods; paging and segmentation are non-contiguous."),
]);

const SINGLE = "In the single-user scheme the whole program is loaded at once and jobs run one after another. A job larger than memory is rejected, and the whole memory is freed when a job ends. There is no multiprogramming or networking, and it is not cost-effective.";

const single = (prompt: string, correct: string, wrong: string[], apply: string): Row => ({
  prompt,
  correct,
  wrong,
  rule: SINGLE,
  apply,
  hint: "Only one job is in memory at a time.",
});

const singleQuestion = mcq("mt.q.single", "Single-user scheme", "mt.schemes", "mt.obj.single", [
  single("In the single-user contiguous scheme, what happens to a job larger than memory?", "It is rejected", ["It waits for a partition", "It is split into pieces", "It runs in secondary storage"], "A job larger than memory is rejected: the whole program must fit."),
  single("Which is a drawback of the single-user scheme?", "No multiprogramming", ["Too many partitions", "External fragmentation between jobs", "A relocation register is needed"], "With one job in memory there is no multiprogramming."),
  single("When a job ends in the single-user scheme, what is freed?", "The whole memory", ["Only the job's own partition", "Only the unused part", "Nothing until shutdown"], "The job had all of memory, so all of memory is freed."),
]);

const FRAG = "Internal fragmentation is unused space inside an allocated partition (allocated more than requested). External fragmentation is free pieces between busy blocks that are individually too small to use, created by dynamic allocation.";

const frag = (prompt: string, correct: string, wrong: string[], apply: string): Row => ({
  prompt,
  correct,
  wrong,
  rule: FRAG,
  apply,
  hint: "Is the wasted space inside a block the job owns, or between blocks?",
});

const fragQuestion = mcq("mt.q.fragmentation", "Which fragmentation", "mt.fragmentation", "mt.obj.fragmentation", [
  frag("A 50 K partition holds a 30 K job and the other 20 K cannot be given to anyone else. What is that 20 K?", "Internal fragmentation", ["External fragmentation"], "The waste is inside an allocated partition: internal fragmentation."),
  frag("Free pieces of 5 K, 10 K and 20 K sit between busy blocks and none can hold a 30 K job. What is this?", "External fragmentation", ["Internal fragmentation"], "Free pieces between busy blocks are external fragmentation."),
  frag("Which kind of fragmentation do dynamic partitions create, as jobs come and go?", "External fragmentation", ["Internal fragmentation", "Neither"], "Dynamic partitions give each job exactly its size, so the waste appears between blocks: external."),
]);

const FITS = "First-fit takes the first free block from the top that is large enough: it is faster but can waste memory. Best-fit takes the smallest free block that is large enough: it wastes least but is slower.";

const fit = (prompt: string, correct: string, wrong: string[], apply: string): Row => ({
  prompt,
  correct,
  wrong,
  rule: FITS,
  apply,
  hint: "One rule stops at the first block that works; the other looks at all the blocks that work.",
});

const fitQuestion = mcq("mt.q.fit", "First-fit or best-fit", "mt.fit", "mt.obj.fit", [
  fit("Which method chooses the first free block, from the top, that is large enough?", "First-fit", ["Best-fit"], "That is first-fit."),
  fit("Which method chooses the smallest free block that is large enough?", "Best-fit", ["First-fit"], "That is best-fit."),
  fit("Which method allocates faster but can waste memory?", "First-fit", ["Best-fit"], "First-fit stops at the first block that works, so it is fast, but it can waste memory."),
  fit("Which method wastes the least space but is slower?", "Best-fit", ["First-fit"], "Best-fit has to compare the blocks, so it is slower, but it wastes least."),
]);

const PARTITIONS = "Fixed partitions: the sizes are set at start-up and stay static, so a job takes a whole partition and the waste is inside it (internal fragmentation). Dynamic partitions: each job gets exactly the size it asks for, at load time, and the waste is the holes left between jobs (external fragmentation).";
const SCHEMES = ["Fixed partitions", "Dynamic partitions"];
const other = (name: string) => SCHEMES.filter((s) => s !== name);
const partitions = (prompt: string, correct: string, apply: string, hint: string): Row => ({ prompt, correct, wrong: other(correct), rule: PARTITIONS, apply, hint });
const partitionsQuestion = mcq("mt.q.partitions", "Fixed or dynamic", "mt.partitions", "mt.obj.partitions", [
  partitions("The sizes of the partitions are set when the system starts and do not change. Which scheme is this?", "Fixed partitions", "Sizes set at start-up and static: fixed partitions.", "Are the sizes decided before or after the jobs arrive?"),
  partitions("Each job is given exactly the size it asks for, when it is loaded. Which scheme is this?", "Dynamic partitions", "A size fitted to each job at load time: dynamic partitions.", "Are the sizes decided before or after the jobs arrive?"),
  partitions("The unused memory is inside partitions that each hold one job. Which scheme is this?", "Fixed partitions", "Waste inside the partitions is internal fragmentation, which fixed partitions have.", "Is the waste inside a block or between blocks?"),
  partitions("The unused memory is in holes between jobs. Which scheme is this?", "Dynamic partitions", "Holes between jobs are external fragmentation, which dynamic partitions have.", "Is the waste inside a block or between blocks?"),
]);

const DEALLOCATION = "Fixed partitions: deallocation just marks the block free (for example 0 = free, 1 = busy). Dynamic partitions: the released block is merged with any free neighbours in the free list, which is kept in address order with beginning address, block size and status.";
const dealloc = (prompt: string, correct: string, apply: string, hint: string): Row => ({ prompt, correct, wrong: other(correct), rule: DEALLOCATION, apply, hint });
const deallocationQuestion = mcq("mt.q.deallocation", "How a block is freed", "mt.partitions", "mt.obj.deallocation", [
  dealloc("When a job ends, its partition is simply marked free (0 = free, 1 = busy). Which scheme is this?", "Fixed partitions", "Marking the block free is all that fixed partitions need.", "Is there anything to merge?"),
  dealloc("When a job ends, its block is merged with the free blocks next to it in the free list. Which scheme is this?", "Dynamic partitions", "Merging with free neighbours is the dynamic deallocation.", "Is there anything to merge?"),
  dealloc("Which scheme needs only a busy or free flag for each block?", "Fixed partitions", "The partitions never change, so a flag per block is enough.", "Which scheme has blocks that never change size?"),
  dealloc("Which scheme keeps a free list in address order with beginning address, block size and status?", "Dynamic partitions", "Free blocks of different sizes have to be listed and merged.", "Which scheme has holes of different sizes?"),
]);

export const memorySchemesTopic: TopicInput = {
  id: "memory-schemes",
  title: "Memory schemes and fragmentation",
  summary: "Contiguous and non-contiguous allocation, the single-user scheme, the two kinds of fragmentation, and the first-fit and best-fit rules.",
  concepts: [
    { id: "mt.schemes", title: "Allocation schemes", summary: "Contiguous (single-user, fixed, dynamic, relocatable) against non-contiguous (paging, segmentation)." },
    { id: "mt.fragmentation", title: "Fragmentation", summary: "Internal: waste inside a partition. External: free pieces between busy blocks." },
    { id: "mt.fit", title: "Placement rules", summary: "First-fit takes the first block that is large enough; best-fit the smallest that is large enough." },
    { id: "mt.partitions", title: "Fixed and dynamic partitions", summary: "Sizes set at start-up against sizes fitted to each job; marking a block free against merging it with free neighbours." },
  ],
  objectives: [
    { id: "mt.obj.contiguous", conceptId: "mt.schemes", text: "Tell contiguous from non-contiguous allocation." },
    { id: "mt.obj.single", conceptId: "mt.schemes", text: "State how the single-user scheme works and its drawbacks." },
    { id: "mt.obj.fragmentation", conceptId: "mt.fragmentation", text: "Tell internal from external fragmentation." },
    { id: "mt.obj.fit", conceptId: "mt.fit", text: "Tell first-fit from best-fit." },
    { id: "mt.obj.partitions", conceptId: "mt.partitions", text: "Tell fixed partitions from dynamic partitions." },
    { id: "mt.obj.deallocation", conceptId: "mt.partitions", text: "Tell how a block is freed under fixed and under dynamic partitions." },
  ],
  activities: [
    {
      id: "memory-schemes",
      title: "Memory schemes and fragmentation",
      summary: "Contiguous or not, the single-user scheme, which fragmentation, first-fit or best-fit.",
      authority: "DEMO",
      minutes: 10,
      questions: [contiguousQuestion, singleQuestion, fragQuestion, fitQuestion],
    },
    {
      id: "partition-kinds",
      title: "Fixed or dynamic partitions",
      summary: "Tell the two schemes apart, and how a block is freed in each, before placing jobs.",
      authority: "DEMO",
      minutes: 6,
      questions: [partitionsQuestion, deallocationQuestion],
    },
  ],
};
