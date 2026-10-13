import { describe, expect, it } from "vitest";
import { effectiveDone, effectiveStatus, firstUnfinishedQuestion, hasProgress, inProgress, skippedAhead, type ActivityProgress } from "./progress";
import { resumeRunnerState } from "@/stage/runnerReducer";
import type { Activity } from "@/content/schema";

const rec = (over: Partial<ActivityProgress>): ActivityProgress => ({ status: "started", attempts: 0, hintsUsed: 0, independent: false, lastAt: 1, ...over });
const qs = (...ids: (string | [string, string[]])[]) => ({ questions: ids.map((i) => (typeof i === "string" ? { id: i } : { id: i[0], creditedBy: i[1] })) });

describe("effectiveDone: the one reader of stored question ids (#692, §6.1)", () => {
  it("counts only live questions: a retired id never shows 4 of 3", () => {
    const d = effectiveDone(qs("a", "b", "c"), rec({ completedQuestions: ["a", "b", "c", "old"] }));
    expect([...d.completed].sort()).toEqual(["a", "b", "c"]);
  });

  it("a split: three new questions declare the old id and a stored completion credits all three", () => {
    const a = qs(["t1", ["table"]], ["t2", ["table"]], ["t3", ["table"]], "next");
    const d = effectiveDone(a, rec({ completedQuestions: ["table"] }));
    expect([...d.completed].sort()).toEqual(["t1", "t2", "t3"]);
  });

  it("a credited scaffold: finishing the combined question credits its easier parts, not the other way round", () => {
    const a = qs(["l1", ["l3"]], ["l2", ["l3"]], "l3");
    expect([...effectiveDone(a, rec({ completedQuestions: ["l3"] })).completed].sort()).toEqual(["l1", "l2", "l3"]);
    expect(effectiveDone(a, rec({ completedQuestions: ["l1"] })).completed.has("l2")).toBe(false);
  });

  it("a retired id in skippedQuestions gives no credit and no skipped-ahead badge", () => {
    const a = qs(["new", ["old"]], "other");
    const r = rec({ skippedQuestions: ["old"] });
    const d = effectiveDone(a, r);
    expect(d.completed.size).toBe(0);
    expect(d.skipped.size).toBe(0);
    expect(skippedAhead(r, a)).toBe(false);
    expect(skippedAhead(r)).toBe(true); // without the practice, the stored list is all there is
  });

  it("a live skipped question is skipped until it is done", () => {
    const a = qs("a", "b");
    expect([...effectiveDone(a, rec({ skippedQuestions: ["b"] })).skipped]).toEqual(["b"]);
    expect(effectiveDone(a, rec({ skippedQuestions: ["b"], completedQuestions: ["b"] })).skipped.size).toBe(0);
  });

  it("a completed practice that gains questions stays completed; the new ones read open (rule 4)", () => {
    const a = qs("a", "b", "new");
    const r = rec({ status: "completed", completedQuestions: ["a", "b"] });
    expect(effectiveStatus(a, r)).toBe("completed");
    expect(effectiveDone(a, r).completed.has("new")).toBe(false);
    expect(firstUnfinishedQuestion(a, r)).toBe(2);
  });

  it("a started practice resumes at the first question in the new order that is not done (rule 5)", () => {
    const a = qs("l1", "a", "b");
    const r = rec({ completedQuestions: ["a"] });
    expect(firstUnfinishedQuestion(a, r)).toBe(0);
    const activity = { ...a, id: "x", questions: a.questions.map((q) => ({ ...q, variants: [] })) } as unknown as Activity;
    expect(resumeRunnerState(activity, [...effectiveDone(a, r).completed]).qIndex).toBe(0);
  });

  it("a started practice that becomes complete through credit reads completed (rule 6); the record is untouched", () => {
    const a = qs(["x", ["old1"]], ["y", ["old2"]]);
    const r = rec({ completedQuestions: ["old1", "old2"] });
    expect(effectiveStatus(a, r)).toBe("completed");
    expect(r.status).toBe("started");
  });

  it("no record reads new; a record with nothing done keeps its status", () => {
    expect(effectiveStatus(qs("a"), undefined)).toBe("new");
    expect(effectiveStatus(qs("a"), rec({}))).toBe("started");
  });
});

describe("in progress counts done questions through effectiveDone (ADR-0013 rule 7, #692)", () => {
  it("a retired id alone is not progress; a credited one is", () => {
    const a = qs(["new", ["old"]], "other");
    const retired = rec({ completedQuestions: ["gone"] });
    expect(inProgress(retired, a)).toBe(false);
    expect(inProgress(retired)).toBe(true); // stored length only, without the practice
    expect(inProgress(rec({ completedQuestions: ["old"] }), a)).toBe(true);
    expect(hasProgress(rec({ status: "completed" }), a)).toBe(true);
  });
});
