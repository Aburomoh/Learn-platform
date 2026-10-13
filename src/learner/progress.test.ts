import { describe, expect, it } from "vitest";
import { completeActivity, completeQuestion, emptyProgress, hasProgress, inProgress, markExplained, recordAttempt, skipActivities, skipQuestion, startActivity } from "./progress";

// ADR-0013 (meaningful progress, amends 0005): what `started` and `lastAt` mean.

const attempt = (activityId = "a1", questionId = "q1") => ({ activityId, questionId, conceptId: "c", correct: false, hintsUsed: 0 });

describe("meaningful progress (ADR-0013)", () => {
  it("no record is written by opening a practice: only an attempt or a done question creates one", () => {
    // the runner no longer calls startActivity on mount (ActivityRunner); the first meaningful writer creates the record
    const p = emptyProgress("off");
    expect(p.activities.a1).toBeUndefined();
    expect(recordAttempt(p, attempt(), 5).activities.a1).toMatchObject({ status: "started", attempts: 1, lastAt: 5 });
    expect(completeQuestion(p, "a1", "q1", 6).activities.a1).toMatchObject({ status: "started", completedQuestions: ["q1"], lastAt: 6 });
  });

  it("skipQuestion and markExplained leave lastAt as it was", () => {
    let p = recordAttempt(emptyProgress("off"), attempt(), 10);
    p = skipQuestion(p, "a1", "q2");
    expect(p.activities.a1).toMatchObject({ lastAt: 10, skippedQuestions: ["q2"] });
    p = markExplained(p, "a1");
    expect(p.activities.a1).toMatchObject({ lastAt: 10, explained: true });
  });

  it("a record created by a skip or an explanation alone is not in progress", () => {
    const skipped = skipQuestion(emptyProgress("off"), "a1", "q1");
    expect(skipped.activities.a1).toMatchObject({ status: "started", attempts: 0 });
    expect(inProgress(skipped.activities.a1)).toBe(false);
    const explained = markExplained(emptyProgress("off"), "a1");
    expect(explained.activities.a1).toMatchObject({ status: "started", attempts: 0, explained: true });
    expect(inProgress(explained.activities.a1)).toBe(false);
    expect(hasProgress(explained.activities.a1)).toBe(false);
  });

  it("inProgress: started with an attempt or a done question; visited-only and explained-only read as new", () => {
    expect(inProgress(undefined)).toBe(false);
    // the shape older builds wrote on mount (rule 6): visited only
    expect(inProgress(startActivity(emptyProgress("off"), "a1", 1).activities.a1)).toBe(false);
    expect(inProgress({ status: "started", attempts: 0, hintsUsed: 0, independent: false, lastAt: 1, explained: true })).toBe(false);
    expect(inProgress({ status: "started", attempts: 1, hintsUsed: 0, independent: false, lastAt: 1 })).toBe(true);
    // a done question without an attempt (a credited split, rule 7) counts
    expect(inProgress({ status: "started", attempts: 0, hintsUsed: 0, independent: false, lastAt: 1, completedQuestions: ["q1"] })).toBe(true);
    // completed and skipped are not "in progress"
    expect(inProgress({ status: "completed", attempts: 3, hintsUsed: 0, independent: true, lastAt: 1 })).toBe(false);
    expect(inProgress({ status: "skipped", attempts: 3, hintsUsed: 0, independent: false, lastAt: 1 })).toBe(false);
  });

  it("hasProgress: in progress or completed", () => {
    expect(hasProgress(undefined)).toBe(false);
    expect(hasProgress({ status: "started", attempts: 0, hintsUsed: 0, independent: false, lastAt: 1 })).toBe(false);
    expect(hasProgress({ status: "started", attempts: 1, hintsUsed: 0, independent: false, lastAt: 1 })).toBe(true);
    expect(hasProgress({ status: "completed", attempts: 0, hintsUsed: 0, independent: true, lastAt: 1 })).toBe(true);
  });

  it("a skipped practice (#579 stored data) is revived by the first attempt, not by a visit", () => {
    const old = skipActivities(emptyProgress("off"), ["a1"], 1);
    expect(old.activities.a1.status).toBe("skipped");
    const revived = recordAttempt(old, attempt(), 2);
    expect(revived.activities.a1).toMatchObject({ status: "started", attempts: 1, lastAt: 2 });
    expect(inProgress(revived.activities.a1)).toBe(true);
  });

  it("completeActivity still writes lastAt; a completed record stays completed through later writers", () => {
    let p = completeActivity(recordAttempt(emptyProgress("off"), attempt(), 1), "a1", true, 2);
    expect(p.activities.a1).toMatchObject({ status: "completed", lastAt: 2 });
    p = markExplained(p, "a1");
    p = skipQuestion(p, "a1", "q9");
    expect(p.activities.a1).toMatchObject({ status: "completed", lastAt: 2 });
  });
});
