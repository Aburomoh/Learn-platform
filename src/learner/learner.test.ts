import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptyProgress, recordAttempt, startActivity, completeActivity, masteryEstimate, recentMisconceptions, EVIDENCE_CAP } from "./progress";
import { readJSON, writeJSON, _resetMemory } from "./storage";
import { getProgressStore, clearLocalData, progressKey, _resetStores } from "./store";

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

  it("clearLocalData removes every product key", () => {
    const store = getProgressStore("off-4");
    store.set((p) => startActivity(p, "a1", 1));
    vi.advanceTimersByTime(1100);
    expect(clearLocalData()).toBeGreaterThanOrEqual(1);
    expect(window.localStorage.getItem(progressKey("off-4"))).toBeNull();
    expect(store.get().activities).toEqual({});
  });
});
