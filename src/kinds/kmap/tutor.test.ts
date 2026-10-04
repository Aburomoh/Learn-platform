import { describe, expect, it } from "vitest";
import type { Variant } from "@/content/schema";
import { contextFromVariant, hasMessage, initialTutorState, reduce, type TutorAction, type TutorState } from "@/tutor";
import type { VariantOf } from "../types";
import { KmapSpec } from "./spec";
import { kmap, type KmapAnswer } from "./logic";

/**
 * #236: the tutor's lines for the K-map kind. The kind is not registered with the stage yet, so
 * each answer is graded with the kind's own logic and fed to the engine the way the runner does
 * (a correct partial step → STEP_COMPLETED for the next step, anything else → ANSWER_SUBMITTED).
 * Fixtures, not course content: the nudge keys are the ones content should use per detector.
 */
const KEYS: Record<string, string> = {
  "fill-binary-order": "km.fill-binary-order",
  "fill-dontcare-as-one": "km.fill-dontcare-as-one",
  "group-shape": "km.group-shape",
  "group-covers-zero": "km.group-covers-zero",
  "group-only-dontcares": "km.group-only-dontcares",
  "group-too-small": "km.group-too-small",
  "group-not-needed": "km.group-not-needed",
  "term-keeps-changing": "km.term-keeps-changing",
  "term-wrong-complement": "km.term-wrong-complement",
  "answer-misses-ones": "km.answer-misses-ones",
  "answer-not-minimal": "km.answer-not-minimal",
};

function variant(spec: unknown): VariantOf<KmapSpec> {
  return {
    id: "v1",
    prompt: "Simplify with the map.",
    spec: KmapSpec.parse(spec),
    vars: {},
    hints: [{ rung: 2, text: "Not yet." }],
    explanation: [
      { id: "s1", say: "One." },
      { id: "s2", say: "Two." },
    ],
    misconceptions: Object.entries(KEYS).map(([type, nudgeKey]) => ({ id: type, title: type, nudgeKey, detect: { type } as never })),
  };
}

type Step = Omit<KmapAnswer, "kind" | "step">;

/** Plays the answers in order from step 0, as the runner would, and returns the last tutor line. */
function play(v: VariantOf<KmapSpec>, answers: Step[]): { message: string; step: number; state: TutorState } {
  let state: TutorState = initialTutorState;
  let step = 0;
  let message = "";
  const ctxAt = (i: number) => contextFromVariant(v as unknown as Variant, "en", kmap.steps!.vars(v.spec, i), kmap.steps!.tag(v.spec, i));
  for (const a of answers) {
    const result = kmap.grade(v, { kind: "kmap", step, ...a });
    const advance = result.correct && result.partial;
    if (advance) step += 1;
    const r = advance
      ? reduce(state, { type: "STEP_COMPLETED" }, ctxAt(step))
      : reduce(
          state,
          { type: "ANSWER_SUBMITTED", correct: result.correct, misconceptionId: result.misconceptionId, vars: result.wrongCells ? { wrongCount: result.wrongCells.count } : undefined },
          ctxAt(step),
        );
    state = r.state;
    const said = r.actions.filter((x): x is Extract<TutorAction, { type: "SAY" }> => x.type === "SAY").at(-1);
    if (said) message = said.text;
  }
  return { message, step, state };
}

const sentences = (m: string) => m.split(/(?<=[.?!])\s/).length;

// ch3 pack Ex.1: F(A,B,C) = Σ(3,4,6,7) = BC + AC′ (minterm order A B C)
const ex1 = variant({ kind: "kmap", vars: ["A", "B", "C"], minterms: [3, 4, 6, 7] });
// a map with don't-cares: F = Σ(1) + d(5, 7)
const withX = variant({ kind: "kmap", vars: ["A", "B", "C"], minterms: [1], dontCares: [5, 7] });
const fillOk: Step = { cells: [0, 0, 0, 1, 1, 0, 1, 1] };
const groupBC: Step = { group: [3, 7], previous: [] };
const termBC: Step = { group: [3, 7], term: "BC" };
const groupAC: Step = { group: [4, 6], previous: [[3, 7]] };
const termAC: Step = { group: [4, 6], term: "AC'" };
const allGroupsDone: Step[] = [fillOk, groupBC, termBC, groupAC, termAC];

describe("#236 K-map: step lines name the next goal", () => {
  it("fill → group → term → group → term → F", () => {
    expect(play(ex1, [fillOk]).message).toBe("Good. Now mark a group of 1s.");
    expect(play(ex1, [fillOk, groupBC]).message).toBe("Good. Now write the term for that group.");
    expect(play(ex1, [fillOk, groupBC, termBC]).message).toBe("Good. Now mark the next group.");
    expect(play(ex1, allGroupsDone).step).toBe(5);
    expect(play(ex1, allGroupsDone).message).toBe("Good. All the groups are done. Now write F, the sum of the terms.");
  });
});

const NUDGES: Record<string, { got: () => ReturnType<typeof play>; text: string }> = {
  "fill-binary-order": {
    got: () => play(ex1, [{ cells: [0, 0, 1, 0, 1, 0, 1, 1] }]),
    text: "Look at the labels on the map. They go 00, 01, 11, 10, so neighbours differ by one bit.",
  },
  "fill-dontcare-as-one": {
    got: () => play(withX, [{ cells: [0, 1, 0, 0, 0, 1, 0, 1] }]),
    text: "An X is a don't-care, not a 1. Write X in those cells and 1 only for the minterms.",
  },
  "group-shape": {
    got: () => play(ex1, [fillOk, { group: [3, 4], previous: [] }]),
    text: "A group is a rectangle of 1, 2, 4 or 8 cells. It may wrap around the edges, but it cannot be an L or a diagonal.",
  },
  "group-covers-zero": {
    got: () => play(ex1, [fillOk, { group: [3, 2], previous: [] }]),
    text: "That group takes in a 0. Every cell in a group must be a 1 or an X.",
  },
  "group-only-dontcares": {
    got: () => play(withX, [{ cells: [0, 1, 0, 0, 0, "X", 0, "X"] }, { group: [5, 7], previous: [] }]),
    text: "A group of only X cells covers nothing. Every group needs at least one 1.",
  },
  "group-too-small": {
    got: () => play(ex1, [fillOk, { group: [3], previous: [] }]),
    text: "A larger group fits here. Make each group as big as it can be.",
  },
  "group-not-needed": {
    got: () => play(ex1, [fillOk, { group: [6, 7], previous: [] }]),
    text: "That group is valid, but you do not need it. Look for a 1 that no group covers yet.",
  },
  "term-keeps-changing": {
    got: () => play(ex1, [fillOk, groupBC, { group: [3, 7], term: "ABC" }]),
    text: "A variable that changes across the group drops out of its term. Keep only the variables that stay the same.",
  },
  "term-wrong-complement": {
    got: () => play(ex1, [fillOk, groupBC, { group: [3, 7], term: "BC'" }]),
    text: "You have the right variables. Check which ones need a bar: a variable that is 0 across the group is complemented.",
  },
  "answer-misses-ones": {
    got: () => play(ex1, [...allGroupsDone, { expr: "BC" }]),
    text: "Every term is a good group, but some 1 is not covered yet. Check each 1 on the map.",
  },
  "answer-not-minimal": {
    got: () => play(ex1, [...allGroupsDone, { expr: "BC + AC' + AB" }]),
    text: "Correct function, but it can be simpler. Check that every group is as large as possible and none is unneeded.",
  },
};

describe("#236 K-map: every detector has its own short nudge, none gives the answer", () => {
  for (const [detector, { got, text }] of Object.entries(NUDGES))
    it(detector, () => {
      const { message } = got();
      expect(message).toBe(text);
      expect(sentences(message)).toBeLessThanOrEqual(2);
      expect(message).not.toMatch(/\{[a-zA-Z0-9_]+\}/);
    });

  it("every nudge key resolves", () => {
    for (const k of Object.values(KEYS)) expect(hasMessage(k), k).toBe(true);
  });
});

describe("#236 K-map: a wrong answer with no recognised slip gets a line for its goal", () => {
  it("fill: states the count and points at the marked cell", () => {
    expect(play(ex1, [{ cells: [0, 0, 0, 0, 0, 0, 0, 0] }]).message).toBe("Cells not right yet: 4. Check the marked one first: is its minterm number in the list?");
  });

  it("group, term and F", () => {
    expect(play(ex1, [fillOk, { group: [], previous: [] }]).message).toBe("Not quite. Tap the cells of one group of 1s: a rectangle of 2, 4 or 8 cells.");
    expect(play(ex1, [fillOk, groupBC, { group: [3, 7], term: "B +" }]).message).toBe("Not quite. Write the product of the variables that stay the same across the group.");
    expect(play(ex1, [...allGroupsDone, { expr: "A" }]).message).toBe("Not quite. F is the sum of the terms of your groups.");
  });
});
