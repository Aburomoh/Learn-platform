/**
 * Multiple-choice builder for CPET 181 Chapter 1 (#555). Every fact comes from the Ch1 content pack
 * (docs/content-packs/cpet181/ch1.md); no quiz key is used. One goal per question; the retry is a
 * different item (the next variant), never the same one.
 */
import type { z } from "zod";
import type { QuestionSchema, VariantSchema } from "../../schema";

export type QuestionInput = z.input<typeof QuestionSchema>;
type VariantInput = z.input<typeof VariantSchema>;

export interface Row {
  prompt: string;
  correct: string;
  /** Wrong options (1 to 4); the builder keeps them all. */
  wrong: string[];
  /** The fact being tested, as the pack states it. */
  rule: string;
  /** The fact applied to this item. */
  apply: string;
  /** Rung 3: a pointer that does not give the answer away. */
  hint: string;
}

const LETTERS = ["a", "b", "c", "d", "e"];

function variant(row: Row, k: number, shift: number): VariantInput {
  const all = [row.correct, ...row.wrong];
  // the right answer moves from variant to variant
  const r = (k + shift) % all.length;
  const options = [...all.slice(r), ...all.slice(0, r)];
  const at = options.indexOf(row.correct);
  return {
    id: `v${k + 1}`,
    prompt: row.prompt,
    spec: { kind: "multiple-choice", options: options.map((text, i) => ({ id: LETTERS[i], text })), correctOptionId: LETTERS[at] },
    hints: [
      { rung: 2, text: "Not yet. Read the question again and test the options one at a time." },
      { rung: 3, text: row.hint },
      { rung: 9, text: `${row.correct}. ${row.apply}` },
    ],
    explanation: [
      { id: "s1", say: row.rule },
      { id: "s2", say: row.apply },
    ],
  };
}

/** A question whose variants are the rows (3 or 4), each a different item. */
export function mcq(id: string, label: string, conceptId: string, objectiveId: string, rows: Row[], shift = 0): QuestionInput {
  return { id, label, conceptId, objectiveId, variants: rows.map((row, k) => variant(row, k, shift)) };
}
