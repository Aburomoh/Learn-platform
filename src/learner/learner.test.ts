import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptyProgress, recordAttempt, startActivity, completeActivity, completeQuestion, firstUnfinishedQuestion, masteryEstimate, recentMisconceptions, EVIDENCE_CAP } from "./progress";
import { readJSON, writeJSON, _resetMemory } from "./storage";
import { getProgressStore, clearLocalData, progressKey, serverProgressSnapshot, _resetStores } from "./store";

describe("progress reducers", () => {
  it("tracks attempts, hints and evidence per concept without ability labels", () => {
    let p = startActivity(emptyProgress("off"), "a1", 1);
    p = recordAttempt(p, { activityId: "a1", questionId: "q1", conceptId: "c1", correct: false, hintsUsed: 0, misconceptionId: "m1" }, 2);
    p = recordAttempt(p, { activityId: "a1", questionId: "q1", conceptId: "c1", correct: true, hintsUsed: 2 }, 3);
    p = completeActivity(p, "a1", false, 4);
    expect(p.activities.a1).toMatchObject({ status: "completed", attempts: 2, hintsUsed: 2, independent: false });
    expect(p.concepts.c1.evidence).toHaveLength(2);
    expect(JSON.stringify(p)).not.toMatch(/weak|slow|ability/i);
  });

  it("caps evidence and weights recent evidence more", () => {
    let p = emptyProgress("off");
    for (let i = 0; i < EVIDENCE_CAP + 5; i++) p = recordAttempt(p, { activityId: "a", questionId: "q", conceptId: "c", correct: false, hintsUsed: 0 }, i);
    expect(p.concepts.c.evidence).toHaveLength(EVIDENCE_CAP);
    const old = masteryEstimate(p.concepts.c.evidence)!;
    p = recordAttempt(p, { activityId: "a", questionId: "q", conceptId: "c", correct: true, hintsUsed: 0 }, 99);
    p = recordAttempt(p, { activityId: "a", questionId: "q", conceptId: "c", correct: true, hintsUsed: 0 }, 100);
    const recent = masteryEstimate(p.concepts.c.evidence)!;
    expect(recent).toBeGreaterThan(old);
    expect(recent).toBeGreaterThan(0.3);
  });

  it("returns null (unknown) with no evidence and lists recent misconceptions", () => {
    expect(masteryEstimate([])).toBeNull();
    const ev = [
      { questionId: "q", correct: false, hintsUsed: 0, misconceptionId: "m1", at: 1 },
      { questionId: "q", correct: false, hintsUsed: 0, misconceptionId: "m2", at: 2 },
      { questionId: "q", correct: false, hintsUsed: 0, misconceptionId: "m1", at: 3 },
    ];
    expect(recentMisconceptions(ev)).toEqual(["m1", "m2"]);
  });
});

describe("completed challenges (#117)", () => {
  const activity = { questions: [{ id: "q1" }, { id: "q2" }, { id: "q3" }] };

  it("records finished questions once and resumes at the first unfinished one", () => {
    let p = startActivity(emptyProgress("off"), "a1", 1);
    expect(firstUnfinishedQuestion(activity, p.activities.a1)).toBe(0);
    p = completeQuestion(p, "a1", "q1", 2);
    p = completeQuestion(p, "a1", "q3", 3);
    const same = completeQuestion(p, "a1", "q1", 4);
    expect(same).toBe(p);
    expect(p.activities.a1).toMatchObject({ status: "started", completedQuestions: ["q1", "q3"] });
    expect(firstUnfinishedQuestion(activity, p.activities.a1)).toBe(1);
    p = completeQuestion(p, "a1", "q2", 5);
    expect(firstUnfinishedQuestion(activity, p.activities.a1)).toBeNull();
  });

  it("keeps the list through completion and Review, and keeps completed status", () => {
    let p = completeQuestion(emptyProgress("off"), "a1", "q1", 1);
    p = completeActivity(p, "a1", true, 2);
    p = recordAttempt(p, { activityId: "a1", questionId: "q1", conceptId: "c", correct: true, hintsUsed: 0 }, 3);
    p = completeQuestion(p, "a1", "q2", 4);
    expect(p.activities.a1).toMatchObject({ status: "completed", completedQuestions: ["q1", "q2"] });
  });

  it("treats a missing record or old data without the field as nothing finished", () => {
    expect(firstUnfinishedQuestion(activity, undefined)).toBe(0);
    expect(firstUnfinishedQuestion(activity, { status: "completed", attempts: 3, hintsUsed: 0, independent: true, lastAt: 1 })).toBe(0);
  });
});

describe("storage", () => {
  beforeEach(() => _resetMemory());
  afterEach(() => vi.restoreAllMocks());

  it("round-trips JSON through localStorage", () => {
    writeJSON("k", { a: 1 });
    expect(readJSON<{ a: number }>("k")).toEqual({ a: 1 });
    expect(window.localStorage.getItem("k")).toBe('{"a":1}');
  });

  it("falls back to memory when localStorage throws", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(writeJSON("k2", { b: 2 })).toBe(false);
    spy.mockRestore();
    expect(readJSON("k2")).toEqual({ b: 2 });
  });
});

describe("progress store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    _resetMemory();
    _resetStores();
  });
  afterEach(() => vi.useRealTimers());

  it("debounces writes and persists the latest value", () => {
    const store = getProgressStore("off-1");
    store.set((p) => startActivity(p, "a1", 1));
    store.set((p) => recordAttempt(p, { activityId: "a1", questionId: "q", conceptId: "c", correct: true, hintsUsed: 0 }, 2));
    expect(window.localStorage.getItem(progressKey("off-1"))).toBeNull();
    vi.advanceTimersByTime(1100);
    const saved = JSON.parse(window.localStorage.getItem(progressKey("off-1"))!);
    expect(saved.activities.a1.attempts).toBe(1);
  });

  it("loads existing progress and ignores foreign or corrupt data", () => {
    window.localStorage.setItem(progressKey("off-2"), JSON.stringify({ version: 1, offeringId: "other", activities: {}, concepts: {} }));
    expect(getProgressStore("off-2").get().offeringId).toBe("off-2");
    window.localStorage.setItem(progressKey("off-3"), "{not json");
    expect(getProgressStore("off-3").get().activities).toEqual({});
  });

  it("loads progress saved before completedQuestions existed, unchanged (no version bump)", () => {
    const old = { version: 1, offeringId: "off-5", activities: { a1: { status: "started", attempts: 2, hintsUsed: 1, independent: false, lastAt: 7 } }, concepts: {} };
    window.localStorage.setItem(progressKey("off-5"), JSON.stringify(old));
    const store = getProgressStore("off-5");
    expect(store.get()).toEqual(old);
    store.set((p) => completeQuestion(p, "a1", "q1", 8));
    vi.advanceTimersByTime(1100);
    expect(JSON.parse(window.localStorage.getItem(progressKey("off-5"))!).activities.a1).toMatchObject({ attempts: 2, completedQuestions: ["q1"] });
  });

  it("clearLocalData removes every product key", () => {
    const store = getProgressStore("off-4");
    store.set((p) => startActivity(p, "a1", 1));
    vi.advanceTimersByTime(1100);
    expect(clearLocalData()).toBeGreaterThanOrEqual(1);
    expect(window.localStorage.getItem(progressKey("off-4"))).toBeNull();
    expect(store.get().activities).toEqual({});
  });
});

describe("server snapshot (#57)", () => {
  it("returns the same empty progress object on every call, per offering", () => {
    const a = serverProgressSnapshot("ecet111.2026-fall");
    expect(serverProgressSnapshot("ecet111.2026-fall")).toBe(a);
    expect(a).toEqual(emptyProgress("ecet111.2026-fall"));
    expect(serverProgressSnapshot("other.offering")).not.toBe(a);
  });
});
