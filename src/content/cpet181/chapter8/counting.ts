/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * CPET 181 Chapter 8: numeric counting questions (#571). `count` builds one numeric question whose
 * variants are computed by the caller from data, never typed in. Hints are the same ladder as the
 * multiple-choice builder: not yet, a pointer, then the worked answer.
 */
import type { z } from "zod";
import type { QuestionSchema, VariantSchema } from "../../schema";

export type QuestionInput = z.input<typeof QuestionSchema>;
type VariantInput = z.input<typeof VariantSchema>;

export interface Count {
  prompt: string;
  answer: number;
  /** The fact being tested, as the pack states it. */
  rule: string;
  /** The fact applied to this item, ending in the number. */
  apply: string;
  /** Rung 3: a pointer that does not give the answer away. */
  hint: string;
  figure?: VariantInput["figure"];
  /** Calculator expression (a template over `vars`), pre-loaded from the givens only (#577). */
  calculator?: string;
  vars?: Record<string, string | number>;
  /** Common wrong numbers, each with the tutor nudge for it. */
  wrong?: { id: string; nudgeKey: string; value: number }[];
}

function variant(c: Count, k: number): VariantInput {
  return {
    id: `v${k + 1}`,
    prompt: c.prompt,
    ...(c.figure ? { figure: c.figure } : {}),
    ...(c.vars ? { vars: c.vars } : {}),
    ...(c.calculator ? { calculator: { "*": c.calculator } } : {}),
    spec: { kind: "numeric", base: 10, answer: String(c.answer) },
    hints: [
      { rung: 2, text: "Not yet. Count again, one at a time." },
      { rung: 3, text: c.hint },
      { rung: 9, text: `${c.answer}. ${c.apply}` },
    ],
    misconceptions: (c.wrong ?? [])
      .filter((w) => w.value !== c.answer && w.value >= 0)
      .map((w) => ({ id: `${w.id}-${k + 1}`, title: w.id, nudgeKey: w.nudgeKey, detect: { type: "equals" as const, value: String(w.value) } })),
    explanation: [
      { id: "s1", say: c.rule },
      { id: "s2", say: c.apply },
    ],
  };
}

export function count(id: string, label: string, conceptId: string, objectiveId: string, items: Count[]): QuestionInput {
  return { id, label, conceptId, objectiveId, variants: items.map(variant) };
}

/* ---------- finding a record ---------- */

export const sequentialAnswer = (records: string[], key: string) => records.indexOf(key) + 1;
/** The block (numbered from 0, as drawn) of an indexed sequential file that holds `key`. */
export const blockAnswer = (records: string[], key: string, blockSize: number) => Math.floor(records.indexOf(key) / blockSize);

export const SEQUENTIAL_SETS: { records: string[]; key: string }[] = [
  { records: ["12", "25", "31", "47", "58", "63"], key: "47" },
  { records: ["8", "15", "22", "39", "41", "70", "85"], key: "70" },
  { records: ["5", "19", "26", "33"], key: "26" },
  { records: ["31", "44", "52", "60", "77", "81", "90", "95"], key: "81" },
];

const SEQUENTIAL = "In a sequential file the records are searched from the start, one after another, so finding a record means reading every record before it and then the record itself.";
export const sequentialRead = count(
  "ro.q.read",
  "Records read",
  "ro.search",
  "ro.obj.read",
  SEQUENTIAL_SETS.map(({ records, key }) => {
    const n = sequentialAnswer(records, key);
    return {
      prompt: `This sequential file is searched from the start. How many records are read to reach record ${key}, counting ${key} itself?`,
      answer: n,
      rule: SEQUENTIAL,
      apply: `Record ${key} is number ${n} from the start, so ${n} records are read.`,
      hint: `Count the records from the first one up to and including ${key}.`,
      figure: { type: "file-layout" as const, layout: "sequential" as const, records, caption: "A sequential file: its records in order." },
      wrong: [{ id: "fm.read-before", nudgeKey: "fm.read-itself", value: n - 1 }],
    };
  }),
);

export const INDEXED_SETS: { records: string[]; key: string }[] = [
  { records: ["12", "18", "25", "31", "44", "47", "52", "60", "71"], key: "44" },
  { records: ["10", "20", "30", "40", "50", "60"], key: "50" },
  { records: ["5", "9", "14", "22", "27", "33", "41", "48", "56"], key: "14" },
  { records: ["15", "21", "34", "39", "42", "58"], key: "34" },
];

const INDEXED = "An indexed sequential file is an ordered file split into equal blocks with an index. The index gives the highest key in each block, so a record is in the first block whose highest key is not below it.";
export const blockOf = count(
  "ro.q.block",
  "Which block",
  "ro.search",
  "ro.obj.block",
  INDEXED_SETS.map(({ records, key }) => {
    const b = blockAnswer(records, key, 3);
    const top = records[Math.min(records.length - 1, b * 3 + 2)];
    return {
      prompt: `This indexed sequential file has blocks of 3 records, numbered as drawn. In which block is record ${key}?`,
      answer: b,
      rule: INDEXED,
      apply: `The index entry of block ${b} is ${top}, the first entry that is ${key} or higher${b > 0 ? ` (block ${b - 1} ends at ${records[b * 3 - 1]})` : ""}, so record ${key} is in block ${b}.`,
      hint: `Find the first index entry that is ${key} or higher.`,
      figure: { type: "file-layout" as const, layout: "indexed" as const, records, blockSize: 3, caption: "An indexed sequential file: blocks and the index above them." },
      wrong: [{ id: "fm.block-one-based", nudgeKey: "fm.block-from-zero", value: b + 1 }],
    };
  }),
);
