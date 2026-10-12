import { describe, expect, it } from "vitest";
import { getActivity } from "../../index";
import { EXPRESSIONS, facts } from "./concurrent";

const COURSE = "cpet181";
const ACTIVITIES: [string, string][] = [
  ["multiprocessing", "parallel"],
  ["multiprocessing", "configurations"],
  ["multiprocessing", "configuration-traits"],
  ["synchronization", "sync"],
  ["synchronization", "classic-problems"],
  ["synchronization", "readers-writers"],
  ["concurrent-programming", "kinds"],
  ["concurrent-programming", "sequential-steps"],
  ["concurrent-programming", "concurrent-steps"],
];
const questions = (topic: string, activity: string) => getActivity(COURSE, topic, activity)!.activity.questions;
const find = (topic: string, activity: string, id: string) => questions(topic, activity).find((q) => q.id === id)!;
const numeric = (q: ReturnType<typeof find>) =>
  q.variants.map((v) => {
    if (v.spec.kind !== "numeric") throw new Error(`${q.id}/${v.id}: numeric expected`);
    return v.spec.answer;
  });

describe("CPET 181 Chapter 6 concurrent processes content (#621)", () => {
  it("the slides' expressions give the pack's counts: s.22–23 is 7 steps, 4 concurrently, 3 processors; s.24 is 7, 4 and 4", () => {
    expect(facts(EXPRESSIONS[0])).toEqual({ operations: 7, steps: 4, widest: 3, widths: [3, 2, 1, 1] });
    expect(facts(EXPRESSIONS[1])).toEqual({ operations: 7, steps: 4, widest: 4, widths: [4, 1, 1, 1] });
  });

  it("the new expressions are worked by hand: (B+C)*(D−E)/F is 4 operations in 3 steps on 2 processors; B*C+D*E+F*G is 5 in 3 on 3", () => {
    expect(facts(EXPRESSIONS[2])).toEqual({ operations: 4, steps: 3, widest: 2, widths: [2, 1, 1] });
    expect(facts(EXPRESSIONS[3])).toEqual({ operations: 5, steps: 3, widest: 3, widths: [3, 1, 1] });
  });

  it("the numeric answers are the computed facts, and concurrent steps are fewer than sequential ones", () => {
    expect(numeric(find("concurrent-programming", "sequential-steps", "cc.q.sequential"))).toEqual(EXPRESSIONS.map((e) => String(facts(e).operations)));
    expect(numeric(find("concurrent-programming", "concurrent-steps", "cc.q.concurrent"))).toEqual(EXPRESSIONS.map((e) => String(facts(e).steps)));
    expect(numeric(find("concurrent-programming", "concurrent-steps", "cc.q.processors"))).toEqual(EXPRESSIONS.map((e) => String(facts(e).widest)));
    for (const e of EXPRESSIONS) expect(facts(e).steps, e).toBeLessThan(facts(e).operations);
  });

  it("the processors are built up one level at a time: operations in step 1, then step 2, then the busiest step", () => {
    const act = "concurrent-steps";
    expect(numeric(find("concurrent-programming", act, "cc.q.step-1"))).toEqual(EXPRESSIONS.map((e) => String(facts(e).widths[0])));
    expect(numeric(find("concurrent-programming", act, "cc.q.step-2"))).toEqual(EXPRESSIONS.map((e) => String(facts(e).widths[1])));
    // the answer of the last question is the largest of the levels
    for (const e of EXPRESSIONS) expect(facts(e).widest, e).toBe(Math.max(...facts(e).widths));
    const ids = questions("concurrent-programming", act).map((q) => q.id);
    expect(ids.indexOf("cc.q.step-1")).toBeLessThan(ids.indexOf("cc.q.processors"));
    expect(ids.indexOf("cc.q.step-2")).toBeLessThan(ids.indexOf("cc.q.processors"));
  });

  it("the processor count is only asked with the earliest-step rule stated", () => {
    for (const v of find("concurrent-programming", "concurrent-steps", "cc.q.processors").variants) expect(v.prompt).toMatch(/earliest step/);
  });

  it("the expressions are standalone: each prompt carries the expression and the op-tree figure draws the same one", () => {
    for (const id of ["cc.q.sequential", "cc.q.concurrent", "cc.q.processors"]) {
      const q = questions("concurrent-programming", id === "cc.q.sequential" ? "sequential-steps" : "concurrent-steps").find((x) => x.id === id)!;
      q.variants.forEach((v, i) => {
        expect(v.prompt, `${id}/${v.id}`).toContain(EXPRESSIONS[i]);
        expect(v.figure?.type).toBe("op-tree");
        if (v.figure?.type === "op-tree") expect(v.figure.expression).toBe(EXPRESSIONS[i]);
      });
    }
  });

  it("the buffer states match the figure: full when every position holds data, empty when none, else partly empty", () => {
    const q = find("synchronization", "classic-problems", "sy.q.buffer");
    const name = (v: (typeof q.variants)[number]) => {
      if (v.spec.kind !== "multiple-choice") throw new Error("multiple-choice expected");
      const { options, correctOptionId } = v.spec;
      return options.find((o) => o.id === correctOptionId)!.text;
    };
    for (const v of q.variants) {
      if (v.figure?.type !== "buffer") throw new Error("buffer figure expected");
      const expected = v.figure.filled === v.figure.slots ? "Full" : v.figure.filled === 0 ? "Empty" : "Partly empty";
      expect(name(v)).toBe(expected);
    }
    expect(q.variants.map(name).sort()).toEqual(["Empty", "Full", "Partly empty"]);
  });

  it("only reading with reading is allowed", () => {
    const q = find("synchronization", "readers-writers", "sy.q.rw");
    const answers = q.variants.map((v) => {
      if (v.spec.kind !== "multiple-choice") throw new Error("multiple-choice expected");
      const { options, correctOptionId } = v.spec;
      return options.find((o) => o.id === correctOptionId)!.text;
    });
    expect(answers).toEqual(["Yes", "No", "No", "No"]);
  });

  it("every question has three or four variants, distinct options, and no answer before the last rung", () => {
    for (const [topic, activity] of ACTIVITIES) {
      for (const q of questions(topic, activity)) {
        expect(q.variants.length, q.id).toBeGreaterThanOrEqual(3);
        expect(q.variants.length, q.id).toBeLessThanOrEqual(4);
        for (const v of q.variants) {
          const early = v.hints.slice(0, -1).map((h) => h.text).join(" ");
          if (v.spec.kind === "multiple-choice") {
            const { options, correctOptionId } = v.spec;
            const texts = options.map((o) => o.text);
            expect(new Set(texts).size, `${q.id}/${v.id}`).toBe(texts.length);
            const correct = options.find((o) => o.id === correctOptionId)!.text;
            const word = new RegExp("\\b" + correct.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&") + "\\b");
            expect(early, `${q.id}/${v.id}`).not.toMatch(word);
          }
        }
      }
    }
  });
});
